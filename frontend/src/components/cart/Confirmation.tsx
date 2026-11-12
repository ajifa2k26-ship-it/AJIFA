'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Settings } from '@/lib/types';
import { lastOrderStore, type LastOrder } from '@/lib/shop';
import { CheckIcon } from '../Icons';
import OrderView from './OrderView';

export default function Confirmation({ settings }: { settings: Settings }) {
  const [data, setData] = useState<LastOrder | null | undefined>(undefined);

  useEffect(() => setData(lastOrderStore.get()), []);

  if (data === undefined) {
    return (
      <div className="container shop-page">
        <div className="shop-loading"><span className="spinner-site" /></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container shop-page">
        <div className="empty-state">
          <h2>Aucune commande récente</h2>
          <p>Retrouvez une commande passée avec son numéro et votre téléphone.</p>
          <Link href="/suivi-commande" className="btn">Suivre une commande</Link>
        </div>
      </div>
    );
  }

  const { order, phone } = data;
  return (
    <div className="container shop-page narrow">
      <header className="page-head confirm-head">
        <span className="confirm-check"><CheckIcon /></span>
        <span className="eyebrow">Merci {order.customer.name.split(' ')[0]} !</span>
        <h1>Commande {order.number} enregistrée</h1>
        <p>
          Conservez bien votre numéro de commande. Notre équipe vous contactera au plus vite pour confirmer la livraison
          à {order.customer.city}.
        </p>
      </header>
      <OrderView order={order} phone={phone} settings={settings} />
      <p style={{ textAlign: 'center', marginTop: 32 }}>
        <Link href="/collections" className="link-underline">Continuer mes achats</Link>
      </p>
    </div>
  );
}
