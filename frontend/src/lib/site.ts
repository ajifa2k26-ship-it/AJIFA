// URL publique du site (ex : https://ajifa.sn) — utilisée pour le SEO, le sitemap et les partages
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

// URL de l'API (Render)
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export const formatPrice = (value: number | null | undefined) =>
  value == null ? null : `${new Intl.NumberFormat('fr-FR').format(value).replace(/ | /g, ' ')} FCFA`;

export function whatsappLink(number: string, message?: string) {
  const n = (number || '').replace(/\D/g, '');
  if (!n) return null;
  return `https://wa.me/${n}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

export const excerpt = (text: string, max = 160) => {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
};
