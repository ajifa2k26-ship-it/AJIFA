'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { PublicOrder, Settings } from '@/lib/types';
import { lastOrderStore, shopApi } from '@/lib/shop';
import OrderView from './OrderView';

export default function TrackOrder({ settings }: { settings: Settings }) {
  const [number, setNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ order: PublicOrder; phone: string } | null>(null);

  // Pré-remplit avec la dernière commande passée sur cet appareil
  useEffect(() => {
    const last = lastOrderStore.get();
    if (last) {
      setNumber(last.order.number);
      setPhone(last.phone);
    }
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { order } = await shopApi.track(number.trim(), phone);
      setResult({ order, phone });
    } catch (err) {
      setError((err as Error).message);
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container shop-page narrow">
      <header className="page-head">
        <span className="eyebrow">Commande</span>
        <h1>Suivre ma commande</h1>
        <p>Saisissez votre numéro de commande (ex : AJ-1001) et le téléphone utilisé lors de l&apos;achat.</p>
      </header>

      <form className="track-form" onSubmit={submit}>
        <div className="f-field">
          <label htmlFor="t-number">Numéro de commande</label>
          <input id="t-number" value={number} onChange={(e) => setNumber(e.target.value.toUpperCase())} placeholder="AJ-1001" required />
        </div>
        <div className="f-field">
          <label htmlFor="t-phone">Téléphone</label>
          <input id="t-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="77 123 45 67" required />
        </div>
        <button className="btn" disabled={busy}>{busy ? 'Recherche…' : 'Voir ma commande'}</button>
      </form>
      {error && <p className="form-error" role="alert" style={{ textAlign: 'center' }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 40 }}>
          <h2 className="track-title">Commande {result.order.number}</h2>
          <OrderView key={result.order.number + result.order.status} order={result.order} phone={result.phone} settings={settings} />
        </div>
      )}
    </div>
  );
}
