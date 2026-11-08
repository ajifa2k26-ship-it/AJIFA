import { Router } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { pickProduct } from '../lib/sanitize.js';
import { uniqueSlug } from '../lib/slugify.js';
import { destroyImage } from '../lib/cloudinary.js';
import { triggerRevalidate } from '../lib/revalidate.js';

const router = Router();
const POPULATE = { path: 'category', select: 'name slug' };
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ----- Public -----

// GET /api/products?category=slug&featured=1&new=1&q=texte&limit=24&page=1
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = { published: true };
    if (req.query.category) {
      const cat = await Category.findOne({ slug: String(req.query.category) }).select('_id');
      if (!cat) return res.json({ items: [], total: 0, page: 1, pages: 0 });
      filter.category = cat._id;
    }
    if (req.query.featured === '1') filter.featured = true;
    if (req.query.new === '1') filter.isNewArrival = true;
    if (req.query.q) filter.name = { $regex: escapeRegex(String(req.query.q).slice(0, 60)), $options: 'i' };

    const limit = Math.min(Math.max(Number(req.query.limit) || 24, 1), 200);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const [items, total] = await Promise.all([
      Product.find(filter).sort({ order: 1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate(POPULATE),
      Product.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  }),
);

// ----- Administration -----
// Placées avant /:slug pour ne pas être capturées par cette route

router.get(
  '/admin/all',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const items = await Product.find().sort({ order: 1, createdAt: -1 }).populate(POPULATE);
    res.json({ items });
  }),
);

router.get(
  '/admin/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const item = await Product.findById(req.params.id);
    if (!item) throw new HttpError(404, 'Article introuvable');
    res.json({ item });
  }),
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const item = await Product.findOne({ slug: req.params.slug, published: true }).populate(POPULATE);
    if (!item) throw new HttpError(404, 'Article introuvable');
    // Articles similaires (même catégorie)
    const related = await Product.find({
      published: true,
      _id: { $ne: item._id },
      ...(item.category ? { category: item.category._id } : {}),
    })
      .sort({ order: 1, createdAt: -1 })
      .limit(4)
      .populate(POPULATE);
    res.json({ item, related });
  }),
);

async function validateCategory(data) {
  if (data.category && !mongoose.isValidObjectId(data.category)) throw new HttpError(400, 'Catégorie invalide');
  if (data.category && !(await Category.exists({ _id: data.category }))) throw new HttpError(400, 'Catégorie introuvable');
}

router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = pickProduct(req.body);
    if (!data.name) throw new HttpError(400, 'Le nom est obligatoire');
    await validateCategory(data);
    data.slug = await uniqueSlug(Product, req.body.slug || data.name);
    const item = await Product.create(data);
    triggerRevalidate();
    res.status(201).json({ item });
  }),
);

router.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const item = await Product.findById(req.params.id);
    if (!item) throw new HttpError(404, 'Article introuvable');
    const data = pickProduct(req.body);
    if (data.name === '') throw new HttpError(400, 'Le nom est obligatoire');
    await validateCategory(data);
    if (req.body.slug && req.body.slug !== item.slug) data.slug = await uniqueSlug(Product, req.body.slug, item._id);

    // Supprime de Cloudinary les images retirées
    if (data.images) {
      const kept = new Set(data.images.map((i) => i.publicId));
      item.images.filter((i) => i.publicId && !kept.has(i.publicId)).forEach((i) => destroyImage(i.publicId));
    }
    item.set(data);
    await item.save();
    triggerRevalidate();
    res.json({ item });
  }),
);

router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const item = await Product.findByIdAndDelete(req.params.id);
    if (!item) throw new HttpError(404, 'Article introuvable');
    item.images.forEach((i) => destroyImage(i.publicId));
    triggerRevalidate();
    res.json({ ok: true });
  }),
);

export default router;
