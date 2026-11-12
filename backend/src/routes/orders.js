import { Router } from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { Order, nextOrderNumber, ORDER_STATUSES, PAYMENT_STATUSES } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Settings } from '../models/Settings.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { deliveryFee, deliveryZone, enabledPaymentMethods, normalizePhone } from '../lib/shop.js';

const router = Router();
const str = (v, max) => (v == null ? '' : String(v).trim().slice(0, max));
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Limite les commandes par adresse IP pour éviter les abus
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Trop de commandes en peu de temps. Réessayez dans quelques minutes ou contactez-nous sur WhatsApp.' },
});

// Vue publique d'une commande (renvoyée à la cliente)
const publicView = (o) => ({
  number: o.number,
  createdAt: o.createdAt,
  customer: { name: o.customer.name, city: o.customer.city },
  items: o.items.map(({ name, slug, image, price, size, color, quantity }) => ({ name, slug, image, price, size, color, quantity })),
  subtotal: o.subtotal,
  deliveryFee: o.deliveryFee,
  total: o.total,
  paymentMethod: o.paymentMethod,
  paymentStatus: o.paymentStatus,
  paymentReference: o.paymentReference,
  status: o.status,
});

// ----- Public : passer une commande -----
// POST /api/orders  { customer: { name, phone, city, address, note }, items: [{ productId, size, color, quantity }], paymentMethod }
router.post(
  '/',
  orderLimiter,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const c = body.customer || {};
    const customer = {
      name: str(c.name, 120),
      phone: normalizePhone(c.phone),
      city: str(c.city, 80),
      address: str(c.address, 400),
      note: str(c.note, 600),
    };
    if (customer.name.length < 2) throw new HttpError(400, 'Veuillez indiquer votre nom complet');
    if (!customer.phone) throw new HttpError(400, 'Numéro de téléphone invalide (ex : 77 123 45 67)');
    if (!customer.city) throw new HttpError(400, 'Veuillez indiquer votre ville');
    if (customer.address.length < 4) throw new HttpError(400, 'Veuillez indiquer une adresse de livraison précise');

    const settings = await Settings.getSingleton();
    const methods = enabledPaymentMethods(settings);
    const paymentMethod = String(body.paymentMethod || '');
    if (!methods.includes(paymentMethod)) throw new HttpError(400, 'Moyen de paiement non disponible');

    // Regroupe les lignes identiques et vérifie les quantités
    const raw = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
    const lines = new Map();
    for (const it of raw) {
      const productId = String(it?.productId || '');
      if (!mongoose.isValidObjectId(productId)) continue;
      const size = str(it.size, 40);
      const color = str(it.color, 40);
      const qty = Math.floor(Number(it.quantity));
      if (!Number.isFinite(qty) || qty < 1) continue;
      const key = `${productId}|${size}|${color}`;
      const prev = lines.get(key);
      lines.set(key, { productId, size, color, quantity: Math.min((prev?.quantity || 0) + qty, 20) });
    }
    if (!lines.size) throw new HttpError(400, 'Votre panier est vide');

    // Les prix viennent toujours de la base, jamais du navigateur
    const ids = [...new Set([...lines.values()].map((l) => l.productId))];
    const products = await Product.find({ _id: { $in: ids }, published: true });
    const byId = new Map(products.map((p) => [String(p._id), p]));

    const items = [];
    for (const l of lines.values()) {
      const p = byId.get(l.productId);
      if (!p) throw new HttpError(409, 'Un article de votre panier n’est plus disponible. Veuillez le retirer.');
      if (!p.available) throw new HttpError(409, `« ${p.name} » est épuisé. Veuillez le retirer de votre panier.`);
      if (p.price == null) throw new HttpError(409, `« ${p.name} » est sur demande : contactez-nous pour le commander.`);
      if (p.sizes.length && !p.sizes.includes(l.size)) throw new HttpError(400, `Choisissez une taille pour « ${p.name} »`);
      if (p.colors.length && !p.colors.includes(l.color)) throw new HttpError(400, `Choisissez une couleur pour « ${p.name} »`);
      items.push({
        product: p._id,
        name: p.name,
        slug: p.slug,
        image: p.images[0]?.url || '',
        price: p.price,
        size: p.sizes.length ? l.size : '',
        color: p.colors.length ? l.color : '',
        quantity: l.quantity,
      });
    }

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const zone = deliveryZone(customer.city);
    const fee = deliveryFee(settings, zone, subtotal);

    const order = await Order.create({
      number: await nextOrderNumber(),
      customer,
      items,
      subtotal,
      deliveryZone: zone,
      deliveryFee: fee,
      total: subtotal + fee,
      paymentMethod,
    });
    res.status(201).json({ order: publicView(order) });
  }),
);

// ----- Administration -----
// Placées avant /:number pour ne pas être capturées par cette route

// GET /api/orders/admin?status=new&q=texte&page=1
router.get(
  '/admin',
  requireAuth,
  asyncHandler(async (req, res) => {
    const filter = {};
    if (ORDER_STATUSES.includes(req.query.status)) filter.status = req.query.status;
    if (req.query.payment === 'pending' || req.query.payment === 'paid') filter.paymentStatus = req.query.payment;
    if (req.query.q) {
      const q = escapeRegex(String(req.query.q).slice(0, 60));
      const digits = String(req.query.q).replace(/\D/g, '');
      filter.$or = [
        { number: { $regex: q, $options: 'i' } },
        { 'customer.name': { $regex: q, $options: 'i' } },
        { 'customer.city': { $regex: q, $options: 'i' } },
        ...(digits.length >= 4 ? [{ 'customer.phone': { $regex: digits } }] : []),
      ];
    }
    const limit = 50;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const [items, total, byStatus] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Order.countDocuments(filter),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);
    const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0]));
    byStatus.forEach((b) => (counts[b._id] = b.count));
    res.json({ items, total, page, pages: Math.ceil(total / limit), counts });
  }),
);

router.get(
  '/admin/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const item = await Order.findById(req.params.id);
    if (!item) throw new HttpError(404, 'Commande introuvable');
    res.json({ item });
  }),
);

router.patch(
  '/admin/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const item = await Order.findById(req.params.id);
    if (!item) throw new HttpError(404, 'Commande introuvable');
    const b = req.body || {};
    if (b.status !== undefined) {
      if (!ORDER_STATUSES.includes(b.status)) throw new HttpError(400, 'Statut invalide');
      item.status = b.status;
    }
    if (b.paymentStatus !== undefined) {
      if (!PAYMENT_STATUSES.includes(b.paymentStatus)) throw new HttpError(400, 'Statut de paiement invalide');
      item.paymentStatus = b.paymentStatus;
    }
    if (b.adminNote !== undefined) item.adminNote = str(b.adminNote, 1000);
    if (b.paymentReference !== undefined) item.paymentReference = str(b.paymentReference, 80);
    await item.save();
    res.json({ item });
  }),
);

router.delete(
  '/admin/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const item = await Order.findByIdAndDelete(req.params.id);
    if (!item) throw new HttpError(404, 'Commande introuvable');
    res.json({ ok: true });
  }),
);

// ----- Public : suivi et référence de paiement -----
// Le numéro de téléphone sert de « mot de passe » pour consulter sa commande.

async function findForCustomer(number, phone) {
  const n = normalizePhone(phone);
  const order = n ? await Order.findOne({ number: str(number, 20).toUpperCase() }) : null;
  if (!order || order.customer.phone !== n) throw new HttpError(404, 'Commande introuvable : vérifiez le numéro de commande et le téléphone');
  return order;
}

// POST /api/orders/track { number, phone }
router.post(
  '/track',
  orderLimiter,
  asyncHandler(async (req, res) => {
    const order = await findForCustomer(req.body?.number, req.body?.phone);
    res.json({ order: publicView(order) });
  }),
);

// POST /api/orders/:number/payment { phone, reference } — la cliente indique l'identifiant de sa transaction
router.post(
  '/:number/payment',
  orderLimiter,
  asyncHandler(async (req, res) => {
    const order = await findForCustomer(req.params.number, req.body?.phone);
    const reference = str(req.body?.reference, 80);
    if (reference.length < 4) throw new HttpError(400, 'Référence de transaction invalide');
    if (order.paymentStatus === 'paid') throw new HttpError(409, 'Cette commande est déjà payée');
    order.paymentReference = reference;
    await order.save();
    res.json({ order: publicView(order) });
  }),
);

export default router;
