// Règles de la boutique partagées par la création de commande.
// (Le site applique la même logique pour l'aperçu des frais : frontend/src/lib/shop.ts)

const normalize = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, ' ')
    .trim();

// Communes de la région de Dakar : tarif « Dakar et banlieue »
const DAKAR_AREA = [
  'dakar', 'plateau', 'medina', 'almadies', 'ngor', 'ouakam', 'yoff', 'mermoz', 'sacre coeur', 'point e', 'fann',
  'grand yoff', 'parcelles assainies', 'parcelles', 'hlm', 'liberte', 'sicap', 'grand dakar', 'hann', 'cambérène',
  'camberene', 'patte d oie', 'pikine', 'guediawaye', 'thiaroye', 'keur massar', 'mbao', 'rufisque', 'bargny',
  'diamniadio', 'sebikotane', 'sangalkam', 'yenne', 'malika', 'yeumbeul', 'tivaouane peulh', 'lac rose', 'niaga',
];
const DAKAR_SET = new Set(DAKAR_AREA.map(normalize));

export function deliveryZone(city) {
  return DAKAR_SET.has(normalize(city)) ? 'dakar' : 'regions';
}

export function deliveryFee(settings, zone, subtotal) {
  if (settings.freeDeliveryFrom > 0 && subtotal >= settings.freeDeliveryFrom) return 0;
  return zone === 'dakar' ? settings.deliveryFeeDakar || 0 : settings.deliveryFeeRegions || 0;
}

export function enabledPaymentMethods(settings) {
  const methods = [];
  if (settings.codEnabled !== false) methods.push('cash');
  if (settings.orangeMoneyNumber || settings.orangeMoneyLink || settings.orangeMoneyQr?.url) methods.push('orange_money');
  if (settings.waveNumber || settings.waveLink || settings.waveQr?.url) methods.push('wave');
  if (settings.freeMoneyNumber || settings.freeMoneyQr?.url) methods.push('free_money');
  return methods;
}

/** Normalise un numéro sénégalais : 77 123 45 67 → 221771234567. Renvoie null si invalide. */
export function normalizePhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 9 && /^(7[05678]|3[03])/.test(d)) return `221${d}`;
  if (d.length === 12 && d.startsWith('221') && /^(7[05678]|3[03])/.test(d.slice(3))) return d;
  // Numéro étranger au format international
  if (!d.startsWith('221') && d.length >= 10 && d.length <= 15) return d;
  return null;
}
