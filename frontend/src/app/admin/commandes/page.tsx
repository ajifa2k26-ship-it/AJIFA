'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin-api';
import type { Order, OrderStatus } from '@/lib/types';
import { formatPrice } from '@/lib/site';
import { ORDER_STATUS_LABELS, PAYMENT_LABELS, formatPhone } from '@/lib/shop';
import { useAdmin } from '@/components/admin/AdminShell';

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];
const statusPill = (s: OrderStatus) => (s === 'delivered' ? 'ok' : s === 'cancelled' ? 'off' : s === 'new' ? 'star' : '');

export default function OrdersPage() {
  const { notify } = useAdmin();
  const [items, setItems] = useState<Order[] | null>(null);
  const [counts, setCounts] = useState<Record<OrderStatus, number> | null>(null);
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');

  // Lance la recherche 300 ms après la dernière frappe
  useEffect(() => {
    const t = window.setTimeout(() => setSearch(q.trim()), 300);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setItems(null);
    adminApi
      .orders({ status, payment, q: search })
      .then((r) => {
        setItems(r.items);
        setCounts(r.counts);
      })
      .catch((e) => notify(e.message, 'error'));
  }, [status, payment, search, notify]);

  const totalAll = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;

  return (
    <>
      <div className="adm-top">
        <div>
          <h1>Commandes</h1>
          <p className="sub">{counts ? `${totalAll} commande${totalAll > 1 ? 's' : ''} · ${counts.new} nouvelle${counts.new > 1 ? 's' : ''}` : 'Chargement…'}</p>
        </div>
      </div>

      <div className="status-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={!status} onClick={() => setStatus('')}>
          Toutes {counts && <span>{totalAll}</span>}
        </button>
        {STATUSES.map((s) => (
          <button key={s} type="button" role="tab" aria-selected={status === s} onClick={() => setStatus(s)}>
            {ORDER_STATUS_LABELS[s]} {counts && <span>{counts[s]}</span>}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <input className="input" type="search" placeholder="N° de commande, nom, téléphone, ville…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" value={payment} onChange={(e) => setPayment(e.target.value)}>
          <option value="">Tous les paiements</option>
          <option value="pending">Paiement en attente</option>
          <option value="paid">Payées</option>
        </select>
      </div>

      {!items ? (
        <div className="center-load"><span className="spinner" /></div>
      ) : !items.length ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            {totalAll ? 'Aucune commande ne correspond.' : 'Aucune commande pour le moment. Elles apparaîtront ici dès qu’une cliente commandera sur le site.'}
          </p>
        </div>
      ) : (
        <div className="list">
          {items.map((o) => (
            <Link key={o._id} href={`/admin/commandes/${o._id}`} className="row order-row">
              <div style={{ minWidth: 0 }}>
                <span className="name">
                  <strong>{o.number}</strong> · {o.customer.name}
                </span>
                <div className="meta">
                  <span>{formatPhone(o.customer.phone)}</span>
                  <span>· {o.customer.city}</span>
                  <span>· {new Date(o.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="meta">
                  <span className={`pill ${statusPill(o.status)}`}>{ORDER_STATUS_LABELS[o.status]}</span>
                  <span className={`pill ${o.paymentStatus === 'paid' ? 'ok' : ''}`}>
                    {PAYMENT_LABELS[o.paymentMethod]} · {o.paymentStatus === 'paid' ? 'payée' : o.paymentReference ? 'réf. reçue' : 'en attente'}
                  </span>
                  <span>{o.items.reduce((n, i) => n + i.quantity, 0)} article(s)</span>
                </div>
              </div>
              <span className="order-total">{formatPrice(o.total)}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
