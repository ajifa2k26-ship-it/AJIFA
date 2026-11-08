import type { MetadataRoute } from 'next';
import { getCategories, getProducts } from '@/lib/api';
import { SITE_URL } from '@/lib/site';

export const revalidate = 3600;

// Plan du site pour Google (https://ajifa.sn/sitemap.xml)
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    getCategories().catch(() => []),
    getProducts({ limit: 200 }).catch(() => []),
  ]);
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/collections`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    ...categories.map((c) => ({
      url: `${SITE_URL}/collections/${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/produit/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      images: p.images.slice(0, 5).map((i) => i.url),
    })),
    { url: `${SITE_URL}/a-propos`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
