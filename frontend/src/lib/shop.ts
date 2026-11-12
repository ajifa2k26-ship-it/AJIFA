import { API_URL } from './site';
import type { OrderStatus, PaymentMethod, PaymentStatus, PublicOrder, Settings } from './types';

// ---------- Livraison (même logique que backend/src/lib/shop.js) ----------

const normalize = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, ' ')
    .trim();

const DAKAR_AREA = [
  'dakar', 'plateau', 'medina', 'almadies', 'ngor', 'ouakam', 'yoff', 'mermoz', 'sacre coeur', 'point e', 'fann',
  'grand yoff', 'parcelles assainies', 'parcelles', 'hlm', 'liberte', 'sicap', 'grand dakar', 'hann', 'camberene',
  'patte d oie', 'pikine', 'guediawaye', 'thiaroye', 'keur massar', 'mbao', 'rufisque', 'bargny', 'diamniadio',
  'sebikotane', 'sangalkam', 'yenne', 'malika', 'yeumbeul', 'tivaouane peulh', 'lac rose', 'niaga',
];
const DAKAR_SET = new Set(DAKAR_AREA.map(normalize));

/** Suggestions proposées dans le champ « Ville » */
export const CITY_SUGGESTIONS = [
  'Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Keur Massar', 'Diamniadio', 'Thiès', 'Mbour', 'Saly', 'Touba',
  'Diourbel', 'Kaolack', 'Fatick', 'Saint-Louis', 'Louga', 'Ziguinchor', 'Kolda', 'Sédhiou', 'Tambacounda',
  'Kédougou', 'Matam', 'Kaffrine', 'Tivaouane', 'Richard-Toll',
];

export type Zone = 'dakar' | 'regions';
export const deliveryZone = (city: string): Zone => (DAKAR_SET.has(normalize(city)) ? 'dakar' : 'regions');

export function deliveryFee(s: Pick<Settings, 'deliveryFeeDakar' | 'deliveryFeeRegions' | 'freeDeliveryFrom'>, zone: Zone, subtotal: number) {
  if (s.freeDeliveryFrom > 0 && subtotal >= s.freeDeliveryFrom) return 0;
  return zone === 'dakar' ? s.deliveryFeeDakar || 0 : s.deliveryFeeRegions || 0;
}

// ---------- Paiement ----------

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Paiement à la livraison',
  orange_money: 'Orange Money',
  wave: 'Wave',
  free_money: 'Free Money / Mixx',
};

export function enabledPaymentMethods(s: Settings): PaymentMethod[] {
  const m: PaymentMethod[] = [];
  if (s.codEnabled !== false) m.push('cash');
  if (s.orangeMoneyNumber || s.orangeMoneyLink || s.orangeMoneyQr?.url) m.push('orange_money');
  if (s.waveNumber || s.waveLink || s.waveQr?.url) m.push('wave');
  if (s.freeMoneyNumber || s.freeMoneyQr?.url) m.push('free_money');
  return m;
}

export function paymentNumber(s: Settings, method: PaymentMethod) {
  if (method === 'orange_money') return s.orangeMoneyNumber;
  if (method === 'wave') return s.waveNumber;
  if (method === 'free_money') return s.freeMoneyNumber;
  return '';
}

/** QR code marchand importé par l'admin pour ce moyen de paiement */
export function paymentQr(s: Settings, method: PaymentMethod) {
  const img = method === 'orange_money' ? s.orangeMoneyQr : method === 'wave' ? s.waveQr : method === 'free_money' ? s.freeMoneyQr : null;
  return img?.url || null;
}

/** Lien de paiement marchand Wave avec le montant pré-rempli */
export function waveLinkFor(s: Settings, amount: number) {
  if (!s.waveLink) return null;
  try {
    const url = new URL(s.waveLink);
    url.searchParams.set('amount', String(amount));
    return url.toString();
  } catch {
    return null;
  }
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Nouvelle',
  confirmed: 'Confirmée',
  shipped: 'En livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'En attente',
  paid: 'Payée',
  refunded: 'Remboursée',
};

/** Affiche 221771234567 sous la forme +221 77 123 45 67 */
export function formatPhone(n: string) {
  const d = (n || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('221')) return `+221 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`;
  if (d.length === 9) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
  return n;
}

export function isValidPhone(raw: string) {
  let d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 9) return /^(7[05678]|3[03])/.test(d);
  if (d.length === 12 && d.startsWith('221')) return /^(7[05678]|3[03])/.test(d.slice(3));
  return !d.startsWith('221') && d.length >= 10 && d.length <= 15;
}

// ---------- Appels publics à l'API (depuis le navigateur) ----------

export type CheckoutPayload = {
  customer: { name: string; phone: string; city: string; address: string; note: string };
  items: { productId: string; size: string; color: string; quantity: number }[];
  paymentMethod: PaymentMethod;
};

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Connexion impossible. Vérifiez votre connexion internet puis réessayez.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data as T;
}

export const shopApi = {
  placeOrder: (payload: CheckoutPayload) => post<{ order: PublicOrder }>('/api/orders', payload),
  track: (number: string, phone: string) => post<{ order: PublicOrder }>('/api/orders/track', { number, phone }),
  sendPaymentReference: (number: string, phone: string, reference: string) =>
    post<{ order: PublicOrder }>(`/api/orders/${encodeURIComponent(number)}/payment`, { phone, reference }),
};

// Dernière commande passée sur cet appareil (affichée sur la page de confirmation)
const LAST_ORDER_KEY = 'ajifa_last_order';
export type LastOrder = { order: PublicOrder; phone: string };
export const lastOrderStore = {
  get(): LastOrder | null {
    try {
      return JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY) || 'null');
    } catch {
      return null;
    }
  },
  set(v: LastOrder) {
    try {
      sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(v));
    } catch {
      /* stockage indisponible */
    }
  },
};
