import 'server-only';
import { API_URL } from './site';
import type { Category, Product, Settings } from './types';

// Toutes les pages publiques partagent ce tag : l'admin le purge après chaque modification
export const CACHE_TAG = 'ajifa';
const REVALIDATE_SECONDS = 600;

const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

export class NotFoundError extends Error {}

/**
 * Lecture de l'API côté serveur, mise en cache par Next.js (ISR).
 * - Pendant le build : si l'API ne répond pas (serveur Render en veille), on renvoie `fallback`
 *   pour ne pas bloquer le déploiement.
 * - En production : une erreur est relancée, ce qui conserve la dernière version en cache de la page.
 */
async function get<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS, tags: [CACHE_TAG] },
      signal: AbortSignal.timeout(isBuild ? 20000 : 55000),
    });
    if (res.status === 404) throw new NotFoundError(path);
    if (!res.ok) throw new Error(`API ${res.status} sur ${path}`);
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    if (isBuild) {
      console.warn(`[build] API indisponible pour ${path} — contenu par défaut utilisé`);
      return fallback;
    }
    throw err;
  }
}

export const DEFAULT_SETTINGS: Settings = {
  siteName: 'AJIFA',
  tagline: 'Élégance & savoir-faire',
  heroTitle: "L'élégance qui vous ressemble",
  heroSubtitle: 'Des pièces raffinées, pensées à Dakar pour sublimer chaque moment.',
  heroImage: null,
  aboutTitle: 'La maison AJIFA',
  aboutText: '',
  aboutImage: null,
  whatsapp: '',
  phone: '',
  email: '',
  address: 'Dakar, Sénégal',
  openingHours: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  announcement: '',
  seoDescription: 'AJIFA, boutique de mode élégante à Dakar, Sénégal. Découvrez nos collections de vêtements raffinés.',
  codEnabled: true,
  orangeMoneyNumber: '',
  waveNumber: '',
  waveLink: '',
  freeMoneyNumber: '',
  orangeMoneyQr: null,
  waveQr: null,
  freeMoneyQr: null,
  deliveryFeeDakar: 2000,
  deliveryFeeRegions: 3500,
  freeDeliveryFrom: 0,
  deliveryInfo: 'Livraison sous 24 à 48 h à Dakar et banlieue, 2 à 5 jours dans les régions.',
};

export async function getSettings(): Promise<Settings> {
  try {
    const data = await get<{ settings: Settings }>('/api/settings', { settings: DEFAULT_SETTINGS });
    return { ...DEFAULT_SETTINGS, ...data.settings };
  } catch {
    // Les réglages ne doivent jamais faire tomber le site (en-tête, pied de page…)
    return DEFAULT_SETTINGS;
  }
}

export async function getCategories(): Promise<Category[]> {
  return (await get<{ items: Category[] }>('/api/categories', { items: [] })).items;
}

export async function getCategory(slug: string): Promise<Category | null> {
  try {
    return (await get<{ item: Category | null }>(`/api/categories/${encodeURIComponent(slug)}`, { item: null })).item;
  } catch (e) {
    if (e instanceof NotFoundError) return null;
    throw e;
  }
}

type ProductQuery = { category?: string; featured?: boolean; isNew?: boolean; limit?: number };

export async function getProducts(q: ProductQuery = {}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (q.category) params.set('category', q.category);
  if (q.featured) params.set('featured', '1');
  if (q.isNew) params.set('new', '1');
  params.set('limit', String(q.limit ?? 200));
  return (await get<{ items: Product[] }>(`/api/products?${params}`, { items: [] })).items;
}

export async function getProduct(slug: string): Promise<{ item: Product; related: Product[] } | null> {
  try {
    const data = await get<{ item: Product | null; related: Product[] }>(
      `/api/products/${encodeURIComponent(slug)}`,
      { item: null, related: [] },
    );
    return data.item ? (data as { item: Product; related: Product[] }) : null;
  } catch (e) {
    if (e instanceof NotFoundError) return null;
    throw e;
  }
}
