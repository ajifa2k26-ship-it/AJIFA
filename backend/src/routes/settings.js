import { Router } from 'express';
import { Settings } from '../models/Settings.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';
import { pickSettings } from '../lib/sanitize.js';
import { destroyImage } from '../lib/cloudinary.js';
import { triggerRevalidate } from '../lib/revalidate.js';

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

export default router;
