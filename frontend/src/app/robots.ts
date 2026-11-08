import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  // Sur les adresses de prévisualisation Vercel, on bloque l'indexation pour éviter le contenu dupliqué
  const isProduction = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === 'production' : true;
  if (!isProduction) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
