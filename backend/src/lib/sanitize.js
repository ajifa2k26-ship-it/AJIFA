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
  'deliveryInfo',
];

// Note : les moyens de paiement et les adresses autorisées ne passent PAS par ici,
// mais par PUT /api/settings/payment, protégé par le mot de passe (voir pickPayment).
export function pickSettings(body = {}) {
  const out = {};
  for (const k of SETTINGS_TEXT) if (has(body, k)) out[k] = toStr(body[k], 3000);
  for (const k of ['deliveryFeeDakar', 'deliveryFeeRegions', 'freeDeliveryFrom']) if (has(body, k)) out[k] = toNum(body[k]) ?? 0;
  if (has(body, 'whatsapp')) out.whatsapp = String(body.whatsapp || '').replace(/\D/g, '').slice(0, 15);
  if (has(body, 'heroImage')) out.heroImage = toImage(body.heroImage);
  if (has(body, 'aboutImage')) out.aboutImage = toImage(body.aboutImage);
  return out;
}

/**
 * Réglages sensibles : numéros qui reçoivent l'argent et adresses autorisées.
 * Lève une erreur lisible si une valeur est invalide (au lieu de l'ignorer en silence).
 */
export function pickPayment(body = {}, { normalizePhone, normalizeOrigin }) {
  const out = {};
  const fail = (msg) => {
    const e = new Error(msg);
    e.status = 400;
    throw e;
  };
  if (has(body, 'codEnabled')) out.codEnabled = toBool(body.codEnabled);
  const phones = { orangeMoneyNumber: 'Orange Money', waveNumber: 'Wave', freeMoneyNumber: 'Free Money' };
  for (const [k, label] of Object.entries(phones)) {
    if (!has(body, k)) continue;
    const raw = toStr(body[k], 30);
    if (!raw) {
      out[k] = '';
      continue;
    }
    const n = normalizePhone(raw);
    if (!n || !n.startsWith('221')) fail(`Numéro ${label} invalide : 9 chiffres attendus (ex : 77 123 45 67)`);
    out[k] = n;
  }
  if (has(body, 'waveLink')) {
    const link = toStr(body.waveLink, 300);
    if (!link) out.waveLink = '';
    else {
      let u;
      try {
        u = new URL(link);
      } catch {
        fail('Lien Wave invalide');
      }
      // Seuls les liens officiels Wave sont acceptés (évite de rediriger les clientes ailleurs)
      if (u.protocol !== 'https:' || u.hostname !== 'pay.wave.com') fail('Le lien Wave doit commencer par https://pay.wave.com/');
      out.waveLink = u.toString();
    }
  }
  // QR codes : uniquement des images envoyées par l'admin sur notre Cloudinary
  for (const k of ['orangeMoneyQr', 'waveQr', 'freeMoneyQr']) {
    if (!has(body, k)) continue;
    if (!body[k]) {
      out[k] = null;
      continue;
    }
    const img = toImage(body[k]);
    if (!img || new URL(img.url).hostname !== 'res.cloudinary.com') fail('Image de QR code invalide : importez-la depuis cette page');
    out[k] = img;
  }
  if (has(body, 'allowedOrigins')) {
    const list = Array.isArray(body.allowedOrigins) ? body.allowedOrigins : String(body.allowedOrigins || '').split(/[\s,]+/);
    const clean = [];
    for (const raw of list.slice(0, 10)) {
      if (!String(raw).trim()) continue;
      const o = normalizeOrigin(raw);
      if (!o) fail(`Adresse de site invalide : ${String(raw).slice(0, 60)}`);
      clean.push(o);
    }
    out.allowedOrigins = [...new Set(clean)];
  }
  return out;
}
