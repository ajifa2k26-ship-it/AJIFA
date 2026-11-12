'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin-api';
import type { Order, OrderStatus, PaymentStatus } from '@/lib/types';
import { formatPrice, whatsappLink } from '@/lib/site';
import { ORDER_STATUS_LABELS, PAYMENT_LABELS, PAYMENT_STATUS_LABELS, formatPhone } from '@/lib/shop';
import { useAdmin } from '@/components/admin/AdminShell';
import { thumb } from '@/components/admin/fields';
import { LeftI, PhoneI, TrashI } from '@/components/admin/AdminIcons';

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];
const PAY_STATUSES = Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[];

// Message WhatsApp proposé à l'administratrice selon l'étape de la commande
function customerMessage(o: Order) {
  const first = o.customer.name.split(' ')[0];
  switch (o.status) {
    case 'confirmed':
      return `Bonjour ${first}, votre commande AJIFA ${o.number} (${formatPrice(o.total)}) est confirmée. Nous vous recontactons pour la livraison à ${o.customer.city}. Merci !`;
    case 'shipped':
      return `Bonjour ${first}, votre commande AJIFA ${o.number} est en route ! Le livreur vous appellera au moment de la livraison.`;
    case 'delivered':
      return `Bonjour ${first}, merci pour votre commande AJIFA ${o.number}. Nous espérons que vos pièces vous plaisent !`;
    default:
      return `Bonjour ${first}, nous avons bien reçu votre commande AJIFA ${o.number} (${formatPrice(o.total)}). Pouvez-vous nous confirmer l'adresse de livraison : ${o.customer.address}, ${o.customer.city} ?`;
  }
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { notify } = useAdmin();
  const [o, setO] = useState<Order | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi
      .order(id)
      .then(({ item }) => {
        setO(item);
        setNote(item.adminNote);
      })
      .catch((e) => notify(e.message, 'error'));
  }, [id, notify]);

  if (!o) return <div className="center-load"><span className="spinner" /></div>;

  async function update(patch: Parameters<typeof adminApi.updateOrder>[1], msg = 'Commande mise à jour ✓') {
    setBusy(true);
    try {
      const { item } = await adminApi.updateOrder(id, patch);
      setO(item);
      notify(msg);
    } catch (e) {
      notify((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!o || !window.confirm(`Supprimer définitivement la commande ${o.number} ? Cette action est irréversible.`)) return;
    try {
      await adminApi.deleteOrder(id);
      notify('Commande supprimée');
      router.replace('/admin/commandes');
    } catch (e) {
      notify((e as Error).message, 'error');
    }
  }

  const wa = whatsappLink(o.customer.phone, customerMessage(o));
  const itemCount = o.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <>
      <div className="adm-top">
        <div>
          <Link href="/admin/commandes" className="back-link"><LeftI width={16} /> Commandes</Link>
          <h1>Commande {o.number}</h1>
          <p className="sub">
            Passée le {new Date(o.createdAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
          </p>
        </div>
      </div>

      <div className="form-layout">
        <div>
          <div className="card">
            <h2>Cliente</h2>
            <dl className="kv">
              <dt>Nom</dt><dd>{o.customer.name}</dd>
              <dt>Téléphone</dt><dd><a href={`tel:+${o.customer.phone}`}>{formatPhone(o.customer.phone)}</a></dd>
              <dt>Ville</dt><dd>{o.customer.city} <span className="pill">{o.deliveryZone === 'dakar' ? 'Dakar et banlieue' : 'Régions'}</span></dd>
              <dt>Adresse</dt><dd style={{ whiteSpace: 'pre-line' }}>{o.customer.address}</dd>
              {o.customer.note && (<><dt>Instructions</dt><dd style={{ whiteSpace: 'pre-line' }}>{o.customer.note}</dd></>)}
            </dl>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              <a className="a-btn ghost sm" href={`tel:+${o.customer.phone}`}><PhoneI /> Appeler</a>
              {wa && <a className="a-btn sm wa" href={wa} target="_blank" rel="noopener">WhatsApp</a>}
            </div>
          </div>

          <div className="card">
            <h2>Articles ({itemCount})</h2>
            <div className="list" style={{ border: 0 }}>
              {o.items.map((i, idx) => (
                <div key={idx} className="row" style={{ gridTemplateColumns: '52px 1fr auto', padding: '10px 0' }}>
                  <span className="thumb" style={{ width: 52, height: 66 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {i.image ? <img src={thumb(i.image, 120)} alt="" /> : '—'}
                  </span>
                  <span>
                    <span className="name">{i.name}</span>
                    <span className="meta">
                      {[i.size && `Taille ${i.size}`, i.color && `Couleur ${i.color}`].filter(Boolean).join(' · ') || 'Taille unique'}
                    </span>
                    <span className="meta">{i.quantity} × {formatPrice(i.price)}</span>
                  </span>
                  <strong style={{ fontWeight: 500 }}>{formatPrice(i.price * i.quantity)}</strong>
                </div>
              ))}
            </div>
            <dl className="kv totals">
              <dt>Sous-total</dt><dd>{formatPrice(o.subtotal)}</dd>
              <dt>Livraison</dt><dd>{o.deliveryFee === 0 ? 'Offerte' : formatPrice(o.deliveryFee)}</dd>
              <dt><strong>Total</strong></dt><dd><strong>{formatPrice(o.total)}</strong></dd>
            </dl>
          </div>

          <div className="card">
            <h2>Note interne</h2>
            <p className="hint">Visible uniquement dans l’administration (livreur, créneau, échange avec la cliente…).</p>
            <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
            <button type="button" className="a-btn ghost sm" style={{ marginTop: 10 }} disabled={busy || note === o.adminNote} onClick={() => update({ adminNote: note }, 'Note enregistrée ✓')}>
              Enregistrer la note
            </button>
          </div>
        </div>

        <aside>
          <div className="card">
            <h2>Statut</h2>
            <div className="status-picker">
              {STATUSES.map((s) => (
                <button key={s} type="button" disabled={busy} aria-pressed={o.status === s} className={`st-${s}`} onClick={() => o.status !== s && update({ status: s })}>
                  {ORDER_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h2>Paiement</h2>
            <dl className="kv">
              <dt>Moyen</dt><dd>{PAYMENT_LABELS[o.paymentMethod]}</dd>
              <dt>Montant</dt><dd>{formatPrice(o.total)}</dd>
              {o.paymentMethod !== 'cash' && (<><dt>Réf. transaction</dt><dd>{o.paymentReference || <span style={{ color: 'var(--muted)' }}>non communiquée</span>}</dd></>)}
            </dl>
            {o.paymentReference && o.paymentStatus !== 'paid' && (
              <p className="hint" style={{ marginTop: 10 }}>Vérifiez la réception de cette transaction sur votre compte {PAYMENT_LABELS[o.paymentMethod]} avant de la marquer payée.</p>
            )}
            <div className="status-picker" style={{ marginTop: 12 }}>
              {PAY_STATUSES.map((s) => (
                <button key={s} type="button" disabled={busy} aria-pressed={o.paymentStatus === s} onClick={() => o.paymentStatus !== s && update({ paymentStatus: s })}>
                  {PAYMENT_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className="a-btn danger sm" onClick={remove}><TrashI /> Supprimer la commande</button>
        </aside>
      </div>
    </>
  );
}
