'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { PaymentMethod, Settings } from '@/lib/types';
import { formatPrice } from '@/lib/site';
import {
  CITY_SUGGESTIONS,
  PAYMENT_LABELS,
  deliveryFee,
  deliveryZone,
  enabledPaymentMethods,
  isValidPhone,
  lastOrderStore,
  shopApi,
} from '@/lib/shop';
import CartLines from './CartLines';
import { useCart } from './CartProvider';

const CUSTOMER_KEY = 'ajifa_customer';
type Customer = { name: string; phone: string; city: string; address: string; note: string };
const EMPTY: Customer = { name: '', phone: '', city: '', address: '', note: '' };

const PAYMENT_HINTS: Record<PaymentMethod, string> = {
  cash: 'Vous payez en espèces à la réception de votre colis.',
  orange_money: 'Vous recevrez le numéro marchand et le montant à envoyer après validation.',
  wave: 'Vous recevrez le numéro (ou le lien) Wave et le montant à envoyer après validation.',
  free_money: 'Vous recevrez le numéro et le montant à envoyer après validation.',
};

export default function Checkout({ settings }: { settings: Settings }) {
  const router = useRouter();
  const { items, ready, subtotal, clear } = useCart();
  const methods = enabledPaymentMethods(settings);
  const [c, setC] = useState<Customer>(EMPTY);
  const [method, setMethod] = useState<PaymentMethod | null>(methods[0] ?? null);
  const [errors, setErrors] = useState<Partial<Record<keyof Customer, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  // Pré-remplit avec les coordonnées utilisées lors d'une précédente commande
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || 'null');
      if (saved) setC({ ...EMPTY, ...saved, note: '' });
    } catch {
      /* rien */
    }
  }, []);

  const zone = c.city.trim() ? deliveryZone(c.city) : null;
  const fee = zone ? deliveryFee(settings, zone, subtotal) : null;
  const total = subtotal + (fee ?? 0);

  const set = (k: keyof Customer, v: string) => {
    setC((x) => ({ ...x, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const payload = useMemo(
    () => items.map((i) => ({ productId: i.productId, size: i.size, color: i.color, quantity: i.quantity })),
    [items],
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (c.name.trim().length < 2) errs.name = 'Indiquez votre nom complet';
    if (!isValidPhone(c.phone)) errs.phone = 'Numéro invalide (ex : 77 123 45 67)';
    if (!c.city.trim()) errs.city = 'Indiquez votre ville';
    if (c.address.trim().length < 4) errs.address = 'Indiquez une adresse précise (quartier, rue, repère…)';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (!method) return setError('Choisissez un moyen de paiement');

    setSending(true);
    setError(null);
    try {
      const { order } = await shopApi.placeOrder({ customer: c, items: payload, paymentMethod: method });
      try {
        const { note: _note, ...keep } = c; // eslint-disable-line @typescript-eslint/no-unused-vars
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify(keep));
      } catch {
        /* rien */
      }
      lastOrderStore.set({ order, phone: c.phone });
      setDone(true);
      clear();
      router.push('/commande/confirmation');
    } catch (err) {
      setError((err as Error).message);
      setSending(false);
    }
  }

  if (!ready || done) {
    return (
      <div className="container shop-page">
        <div className="shop-loading"><span className="spinner-site" /></div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="container shop-page">
        <div className="empty-state">
          <h2>Votre panier est vide</h2>
          <p>Ajoutez des articles à votre panier avant de passer commande.</p>
          <Link href="/collections" className="btn">Découvrir les collections</Link>
        </div>
      </div>
    );
  }

  const field = (k: keyof Customer, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className={`f-field${errors[k] ? ' has-error' : ''}`}>
      <label htmlFor={`c-${k}`}>{label}</label>
      <input id={`c-${k}`} value={c[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={!!errors[k]} {...props} />
      {errors[k] && <span className="f-error">{errors[k]}</span>}
    </div>
  );

  return (
    <div className="container shop-page">
      <header className="page-head">
        <span className="eyebrow">Commande</span>
        <h1>Finaliser ma commande</h1>
      </header>

      <form className="shop-layout" onSubmit={submit} noValidate>
        <section className="checkout-form">
          <fieldset>
            <legend>Vos coordonnées</legend>
            {field('name', 'Prénom et nom', { autoComplete: 'name', required: true, maxLength: 120 })}
            {field('phone', 'Téléphone', {
              type: 'tel',
              inputMode: 'tel',
              autoComplete: 'tel',
              placeholder: '77 123 45 67',
              required: true,
            })}
            <small className="f-hint">Nous vous appellerons sur ce numéro pour confirmer la livraison.</small>
          </fieldset>

          <fieldset>
            <legend>Livraison</legend>
            {field('city', 'Ville / commune', { list: 'cities', autoComplete: 'address-level2', placeholder: 'Dakar, Thiès, Mbour…', required: true, maxLength: 80 })}
            <datalist id="cities">
              {CITY_SUGGESTIONS.map((v) => <option key={v} value={v} />)}
            </datalist>
            <div className={`f-field${errors.address ? ' has-error' : ''}`}>
              <label htmlFor="c-address">Adresse de livraison</label>
              <textarea
                id="c-address"
                rows={3}
                value={c.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="Quartier, rue, numéro, point de repère…"
                autoComplete="street-address"
                maxLength={400}
                aria-invalid={!!errors.address}
              />
              {errors.address && <span className="f-error">{errors.address}</span>}
            </div>
            <div className="f-field">
              <label htmlFor="c-note">Instructions (facultatif)</label>
              <textarea id="c-note" rows={2} value={c.note} onChange={(e) => set('note', e.target.value)} placeholder="Horaires de disponibilité, précisions…" maxLength={600} />
            </div>
            {settings.deliveryInfo && <small className="f-hint">{settings.deliveryInfo}</small>}
          </fieldset>

          <fieldset>
            <legend>Paiement</legend>
            {methods.length === 0 ? (
              <p className="form-error">Aucun moyen de paiement n&apos;est disponible pour le moment. Contactez-nous pour commander.</p>
            ) : (
              <div className="pay-options" role="radiogroup" aria-label="Moyen de paiement">
                {methods.map((m) => (
                  <label key={m} className={`pay-option${method === m ? ' on' : ''}`}>
                    <input type="radio" name="payment" value={m} checked={method === m} onChange={() => setMethod(m)} />
                    <span className={`pay-logo pay-${m}`} aria-hidden>{m === 'cash' ? 'CFA' : m === 'orange_money' ? 'OM' : m === 'wave' ? 'W' : 'FM'}</span>
                    <span className="pay-text">
                      <strong>{PAYMENT_LABELS[m]}</strong>
                      <small>{PAYMENT_HINTS[m]}</small>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        </section>

        <aside className="shop-summary">
          <h2>Votre commande</h2>
          <CartLines readOnly />
          <div className="summary-row">
            <span>Sous-total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Livraison{zone && <small> · {zone === 'dakar' ? 'Dakar et banlieue' : 'Régions'}</small>}</span>
            <span>{fee == null ? 'Selon la ville' : fee === 0 ? 'Offerte' : formatPrice(fee)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-block" disabled={sending || !methods.length}>
            {sending ? 'Envoi en cours…' : `Valider la commande · ${formatPrice(total)}`}
          </button>
          <small className="f-hint" style={{ textAlign: 'center' }}>
            En validant, vous recevrez un numéro de commande. Notre équipe vous contactera pour confirmer la livraison.
          </small>
          <Link href="/panier" className="link-underline" style={{ alignSelf: 'center' }}>Modifier le panier</Link>
        </aside>
      </form>
    </div>
  );
}
