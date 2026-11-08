import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';

const router = Router();

// Limite les tentatives de connexion (protection contre le brute-force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
});

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const password = String(req.body?.password || '');
    const user = email && (await User.findOne({ email }));
    if (!user || !(await user.checkPassword(password))) throw new HttpError(401, 'Email ou mot de passe incorrect');
    res.json({ token: signToken(user), user });
  }),
);

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

router.put(
  '/password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!(await req.user.checkPassword(String(currentPassword || '')))) {
      throw new HttpError(400, 'Mot de passe actuel incorrect');
    }
    if (!newPassword || String(newPassword).length < 8) {
      throw new HttpError(400, 'Le nouveau mot de passe doit contenir au moins 8 caractères');
    }
    req.user.passwordHash = await User.hashPassword(String(newPassword));
    await req.user.save();
    res.json({ ok: true });
  }),
);

export default router;
