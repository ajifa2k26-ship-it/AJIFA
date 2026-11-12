import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { User } from './models/User.js';
import { Settings } from './models/Settings.js';
import { errorHandler } from './middleware/errors.js';
import { cloudinaryEnabled } from './lib/cloudinary.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import settingsRoutes from './routes/settings.js';
import uploadRoutes from './routes/upload.js';
import orderRoutes from './routes/orders.js';

const app = express();
app.set('trust proxy', 1); // Render est derrière un proxy
app.disable('x-powered-by');

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(
  cors({
    origin(origin, cb) {
      // Autorise les appels serveur-à-serveur (pas d'en-tête Origin) et les origines déclarées
      if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
      // Autorise les prévisualisations Vercel du projet si demandé
      if (process.env.CORS_ALLOW_VERCEL_PREVIEWS === 'true' && /\.vercel\.app$/.test(new URL(origin).hostname)) {
        return cb(null, true);
      }
      return cb(null, false);
    },
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));

// Santé (utilisé par Render pour vérifier que le service tourne)
app.get('/health', (_req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }));
app.get('/', (_req, res) => res.json({ name: 'API AJIFA', status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Route introuvable' }));
app.use(errorHandler);

// Crée le compte administratrice au premier démarrage, à partir des variables ADMIN_EMAIL / ADMIN_PASSWORD
async function ensureAdmin() {
  if ((await User.estimatedDocumentCount()) > 0) return;
  const { email, password, name } = config.admin;
  if (!email || !password) {
    console.warn('Aucun compte admin : définissez ADMIN_EMAIL et ADMIN_PASSWORD puis redémarrez.');
    return;
  }
  await User.create({ email, name, passwordHash: await User.hashPassword(password) });
  console.log(`Compte administratrice créé : ${email}`);
}

async function start() {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 15000 });
  console.log('MongoDB connecté');
  await ensureAdmin();
  await Settings.getSingleton();
  if (!cloudinaryEnabled) console.warn("Cloudinary non configuré : l'envoi d'images est désactivé.");
  app.listen(config.port, () => console.log(`API AJIFA en écoute sur le port ${config.port}`));
}

start().catch((err) => {
  console.error('Démarrage impossible :', err.message);
  process.exit(1);
});
