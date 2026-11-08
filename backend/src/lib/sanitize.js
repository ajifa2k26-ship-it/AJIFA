// Ne garde que les champs autorisés et normalise les types venant du formulaire d'administration
const toStr = (v, max = 5000) => (v == null ? '' : String(v).trim().slice(0, max));
const toBool = (v) => v === true || v === 'true' || v === 1 || v === '1' || v === 'on';
const toNum = (v) => {
  if (v === '' || v == null) return null;
  const n = Number(String(v).replace(/\s/g, ''));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
};
const toList = (v) => {
  const arr = Array.isArray(v) ? v : String(v || '').split(',');
  return [...new Set(arr.map((s) => String(s).trim()).filter(Boolean))].slice(0, 40);
};
const toImage = (v) => {
  if (!v || typeof v !== 'object' || !v.url) return null;
  const url = String(v.url);
  if (!/^https:\/\//.test(url)) return null;
  return { url, publicId: toStr(v.publicId, 300), alt: toStr(v.alt, 200) };
};

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

export function pickProduct(body = {}) {
  const out = {};
  if (has(body, 'name')) out.name = toStr(body.name, 140);
  if (has(body, 'description')) out.description = toStr(body.description, 5000);
  if (has(body, 'price')) out.price = toNum(body.price);
  if (has(body, 'compareAtPrice')) out.compareAtPrice = toNum(body.compareAtPrice);
  if (has(body, 'category')) out.category = body.category || null;
  if (has(body, 'images')) out.images = (Array.isArray(body.images) ? body.images : []).map(toImage).filter(Boolean).slice(0, 12);
  if (has(body, 'sizes')) out.sizes = toList(body.sizes);
  if (has(body, 'colors')) out.colors = toList(body.colors);
  if (has(body, 'fabric')) out.fabric = toStr(body.fabric, 200);
  for (const k of ['featured', 'isNewArrival', 'available', 'published']) if (has(body, k)) out[k] = toBool(body[k]);
  if (has(body, 'order')) out.order = Number(body.order) || 0;
  if (has(body, 'seoTitle')) out.seoTitle = toStr(body.seoTitle, 70);
  if (has(body, 'seoDescription')) out.seoDescription = toStr(body.seoDescription, 170);
  return out;
}

export function pickCategory(body = {}) {
  const out = {};
  if (has(body, 'name')) out.name = toStr(body.name, 80);
  if (has(body, 'description')) out.description = toStr(body.description, 1000);
  if (has(body, 'image')) out.image = toImage(body.image);
  if (has(body, 'order')) out.order = Number(body.order) || 0;
  if (has(body, 'visible')) out.visible = toBool(body.visible);
  return out;
}

const SETTINGS_TEXT = [
  'siteName', 'tagline', 'heroTitle', 'heroSubtitle', 'aboutTitle', 'aboutText', 'phone', 'email',
  'address', 'openingHours', 'instagram', 'facebook', 'tiktok', 'announcement', 'seoDescription',
];

export function pickSettings(body = {}) {
  const out = {};
  for (const k of SETTINGS_TEXT) if (has(body, k)) out[k] = toStr(body[k], 3000);
  if (has(body, 'whatsapp')) out.whatsapp = String(body.whatsapp || '').replace(/\D/g, '').slice(0, 15);
  if (has(body, 'heroImage')) out.heroImage = toImage(body.heroImage);
  if (has(body, 'aboutImage')) out.aboutImage = toImage(body.aboutImage);
  return out;
}
