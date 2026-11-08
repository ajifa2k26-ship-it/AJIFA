import { Router } from 'express';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { pickCategory } from '../lib/sanitize.js';
import { uniqueSlug } from '../lib/slugify.js';
import { destroyImage } from '../lib/cloudinary.js';
import { triggerRevalidate } from '../lib/revalidate.js';

const router = Router();

async function withCounts(categories, publishedOnly) {
  const counts = await Product.aggregate([
    { $match: publishedOnly ? { published: true } : {} },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.count]));
  return categories.map((c) => ({ ...c.toJSON(), productCount: map.get(String(c._id)) || 0 }));
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await Category.find({ visible: true }).sort({ order: 1, name: 1 });
    res.json({ items: await withCounts(items, true) });
  }),
);

router.get(
  '/admin/all',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const items = await Category.find().sort({ order: 1, name: 1 });
    res.json({ items: await withCounts(items, false) });
  }),
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const item = await Category.findOne({ slug: req.params.slug, visible: true });
    if (!item) throw new HttpError(404, 'Catégorie introuvable');
    res.json({ item });
  }),
);

router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = pickCategory(req.body);
    if (!data.name) throw new HttpError(400, 'Le nom est obligatoire');
    data.slug = await uniqueSlug(Category, req.body.slug || data.name);
    const item = await Category.create(data);
    triggerRevalidate();
    res.status(201).json({ item });
  }),
);

router.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const item = await Category.findById(req.params.id);
    if (!item) throw new HttpError(404, 'Catégorie introuvable');
    const data = pickCategory(req.body);
    if (data.name === '') throw new HttpError(400, 'Le nom est obligatoire');
    if (req.body.slug && req.body.slug !== item.slug) data.slug = await uniqueSlug(Category, req.body.slug, item._id);
    if (has(data, 'image') && item.image?.publicId && item.image.publicId !== data.image?.publicId) {
      destroyImage(item.image.publicId);
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
    const item = await Category.findByIdAndDelete(req.params.id);
    if (!item) throw new HttpError(404, 'Catégorie introuvable');
    // Les articles de cette catégorie restent en ligne, simplement sans catégorie
    await Product.updateMany({ category: item._id }, { $set: { category: null } });
    if (item.image?.publicId) destroyImage(item.image.publicId);
    triggerRevalidate();
    res.json({ ok: true });
  }),
);

function has(o, k) {
  return Object.prototype.hasOwnProperty.call(o, k);
}

export default router;
