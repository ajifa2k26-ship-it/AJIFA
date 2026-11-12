import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Settings } from '../models/Settings.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { pickPayment, pickSettings } from '../lib/sanitize.js';
import { destroyImage } from '../lib/cloudinary.js';
import { triggerRevalidate } from '../lib/revalidate.js';
import { normalizePhone } from '../lib/shop.js';
import { normalizeOrigin, setExtraOrigins } from '../lib/origins.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ settings: await Settings.getSingleton() });
  }),
);

router.put(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const settings = await Settings.getSingleton();
    const data = pickSettings(req.body);
    for (const key of ['heroImage', 'aboutImage']) {
      const old = settings[key]?.publicId;
      if (key in data && old && old !== data[key]?.publicId) destroyImage(old);
    }
    settings.set(data);
    await settings.save();
    triggerRevalidate();
    res.json({ settings });
  }),
);

// Peu de tentatives autorisées : chaque essai vérifie le mot de passe
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
});

/**
 * PUT /api/settings/payment  { currentPassword, codEnabled, orangeMoneyNumber, waveNumber, waveLink, freeMoneyNumber, allowedOrigins }
 * Les numéros qui reçoivent l'argent des clientes sont sensibles : même avec une session ouverte,
 * le mot de passe est redemandé pour les modifier.
 */
router.put(
  '/payment',
  requireAuth,
  paymentLimiter,
  asyncHandler(async (req, res) => {
    const password = String(req.body?.currentPassword || '');
    // 400 (et non 401) pour ne pas déconnecter l'administratrice en cas de faute de frappe
    if (!password || !(await req.user.checkPassword(password))) throw new HttpError(400, 'Mot de passe incorrect');

    const data = pickPayment(req.body, { normalizePhone, normalizeOrigin });
    const settings = await Settings.getSingleton();
    settings.set({ ...data, paymentUpdatedAt: new Date() });
    await settings.save();
    setExtraOrigins(settings.allowedOrigins);
    console.log(`Moyens de paiement modifiés par ${req.user.email}`);
    triggerRevalidate();
    res.json({ settings });
  }),
);

export default router;
