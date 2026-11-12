import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { config } from '../config.js';
import { cloudinaryEnabled, destroyImage, uploadBuffer } from '../lib/cloudinary.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|avif|heic|heif)$/.test(file.mimetype)) cb(null, true);
    else cb(new HttpError(400, 'Format non supporté (JPG, PNG, WEBP, HEIC uniquement)'));
  },
});

// POST /api/upload  (multipart, champ "images", jusqu'à 10 fichiers)
router.post(
  '/',
  requireAuth,
  upload.array('images', 10),
  asyncHandler(async (req, res) => {
    if (!cloudinaryEnabled) throw new HttpError(503, "Le stockage d'images (Cloudinary) n'est pas configuré");
    if (!req.files?.length) throw new HttpError(400, 'Aucune image reçue');
    const folder = ['site', 'categories', 'paiement'].includes(req.query.folder) ? req.query.folder : 'produits';
    const results = await Promise.all(req.files.map((f) => uploadBuffer(f.buffer, folder)));
    res.status(201).json({
      images: results.map((r) => ({ url: r.secure_url, publicId: r.public_id, alt: '', width: r.width, height: r.height })),
    });
  }),
);

// DELETE /api/upload  { publicId }  — pour une image envoyée puis abandonnée avant enregistrement
router.delete(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const publicId = String(req.body?.publicId || '');
    if (!publicId.startsWith(`${config.cloudinary.folder}/`)) throw new HttpError(400, 'Image invalide');
    await destroyImage(publicId);
    res.json({ ok: true });
  }),
);

export default router;
