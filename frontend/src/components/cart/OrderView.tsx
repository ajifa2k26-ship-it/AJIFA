'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import type { PublicOrder, Settings } from '@/lib/types';
import { formatPrice, whatsappLink } from '@/lib/site';
import { ORDER_STATUS_LABELS, PAYMENT_LABELS, PAYMENT_STATUS_LABELS, formatPhone, paymentNumber, paymentQr, shopApi, waveLinkFor } from '@/lib/shop';
import { WhatsAppIcon } from '../Icons';

/** Récapitulatif d'une commande : articles, totaux, paiement et contact */
export default function OrderView({ order: initial, phone, settings }: { order: PublicOrder; phone: string; settings: Settings }) {
  const [order, setOrder] = useState(initial);
  const date = new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const waMessage = [
    `Bonjour AJIFA, je viens de passer la commande ${order.number} :`,
    ...order.items.map((i) => `• ${i.quantity} × ${i.name}${i.size ? ` (${i.size})` : ''}${i.color ? ` – ${i.color}` : ''}`),
    `Total : ${formatPrice(order.total)}`,
    `Paiement : ${PAYMENT_LABELS[order.paymentMethod]}`,
  ].join('\n');
  const wa = whatsappLink(settings.whatsapp, waMessage);

  return (
    <div className="order-view">
      <div className="order-badges">
        <span className={`status status-${order.status}`}>{ORDER_STATUS_LABELS[order.status]}</span>
        <span className={`status ${order.paymentStatus === 'paid' ? 'status-delivered' : ''}`}>
          Paiement : {PAYMENT_STATUS_LABELS[order.paymentStatus]}
        </span>
        <span className="order-date">Passée le {date}</span>
      </div>

      {order.status !== 'cancelled' && order.paymentStatus !== 'paid' && (
        <PaymentInstructions order={order} phone={phone} settings={settings} onUpdate={setOrder} />
      )}

      <div className="shop-summary">
        <h2>Articles</h2>
        <ul className="cart-lines">
          {order.items.map((i, idx) => (
            <li key={idx} className="cart-line">
              <Link href={`/produit/${i.slug}`} className="cart-line-media">
                {i.image ? <Image src={i.image} alt="" fill sizes="96px" /> : <span className="placeholder">AJIFA</span>}
              </Link>
              <div className="cart-line-info">
                <span className="cart-line-name">{i.name}</span>
                <span className="cart-line-opts">{[i.size && `Taille ${i.size}`, i.color, `Qté ${i.quantity}`].filter(Boolean).join(' · ')}</span>
                <span className="cart-line-price">{formatPrice(i.price)}</span>
              </div>
              <span className="cart-line-total">{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="summary-row"><span>Sous-total</span><span>{formatPrice(order.subtotal)}</span></div>
        <div className="summary-row"><span>Livraison ({order.customer.city})</span><span>{order.deliveryFee === 0 ? 'Offerte' : formatPrice(order.deliveryFee)}</span></div>
        <div className="summary-row total"><span>Total</span><strong>{formatPrice(order.total)}</strong></div>
        <div className="summary-row muted"><span>Mode de paiement</span><span>{PAYMENT_LABELS[order.paymentMethod]}</span></div>
      </div>

      {wa && (
        <a className="btn btn-outline btn-block" href={wa} target="_blank" rel="noopener">
          <WhatsAppIcon /> Envoyer ma commande sur WhatsApp
        </a>
      )}
    </div>
  );
}

function PaymentInstructions({ order, phone, settings, onUpdate }: { order: PublicOrder; phone: string; settings: Settings; onUpdate: (o: PublicOrder) => void }) {
  const [ref, setRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const amount = formatPrice(order.total);

  if (order.paymentMethod === 'cash') {
    return (
      <div className="pay-box">
        <h3>Paiement à la livraison</h3>
        <p>
          Préparez <strong>{amount}</strong> en espèces pour la remise de votre colis. Notre équipe vous appellera pour
          convenir du créneau de livraison.
        </p>
      </div>
    );
  }

  const number = paymentNumber(settings, order.paymentMethod);
  const waveLink = order.paymentMethod === 'wave' ? waveLinkFor(settings, order.total) : null;
  const qr = paymentQr(settings, order.paymentMethod);
  const app = order.paymentMethod === 'orange_money' ? 'Orange Money (ou Max it)' : PAYMENT_LABELS[order.paymentMethod];
  // Lien de téléchargement Cloudinary (fl_attachment) pour enregistrer le QR sur le téléphone
  const qrDownload = qr ? qr.replace('/upload/', '/upload/fl_attachment/') : null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const { order: updated } = await shopApi.sendPaymentReference(order.number, phone, ref.trim());
      onUpdate(updated);
      setMsg({ ok: true, text: 'Merci ! Nous vérifions votre paiement et confirmons votre commande très vite.' });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pay-box">
      <h3>Payer avec {PAYMENT_LABELS[order.paymentMethod]}</h3>
      {qr && (
        <div className="pay-qr">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt={`QR code de paiement ${PAYMENT_LABELS[order.paymentMethod]}`} />
          <div>
            <p>
              Ouvrez l&apos;application <strong>{app}</strong>, touchez <strong>Scanner</strong> et visez ce QR code, puis
              payez <strong>{amount}</strong>.
            </p>
            <p className="pay-qr-mobile">
              Vous êtes sur votre téléphone ? Enregistrez l&apos;image, puis importez-la depuis la galerie dans l&apos;écran
              Scanner de l&apos;application.
            </p>
            {qrDownload && (
              <a className="btn btn-outline btn-sm" href={qrDownload} download>
                Enregistrer le QR code
              </a>
            )}
          </div>
        </div>
      )}
      <ol>
        {qr && !number && !waveLink ? (
          <li>Scannez le QR code ci-dessus et payez <strong>{amount}</strong>.</li>
        ) : waveLink ? (
          <li>
            Touchez le bouton ci-dessous pour payer <strong>{amount}</strong> avec Wave
            {number && <> (ou envoyez-les au <strong>{formatPhone(number)}</strong>)</>}.
          </li>
        ) : (
          <li>
            Envoyez <strong>{amount}</strong> au <strong className="pay-number">{formatPhone(number)}</strong>
            {order.paymentMethod === 'orange_money' && <> depuis l&apos;application Orange Money ou le #144#</>}
            {order.paymentMethod === 'wave' && <> depuis l&apos;application Wave</>}.
          </li>
        )}
        <li>Indiquez la référence <strong>{order.number}</strong> si l&apos;application le permet.</li>
        <li>Saisissez ci-dessous l&apos;identifiant de transaction reçu par SMS.</li>
      </ol>
      {order.paymentMethod === 'orange_money' && number && (
        // Sur téléphone : ouvre le clavier avec #144# (menu Orange Money)
        <a className="btn btn-block pay-ussd" href="tel:%23144%23">
          Payer avec #144#
        </a>
      )}
      {waveLink && (
        <a className="btn btn-block pay-wave-btn" href={waveLink} target="_blank" rel="noopener">
          Payer {amount} avec Wave
        </a>
      )}

      {order.paymentReference ? (
        <p className="pay-ok">Référence reçue : <strong>{order.paymentReference}</strong>. Nous vérifions votre paiement.</p>
      ) : (
        <form className="pay-ref" onSubmit={submit}>
          <label htmlFor="pay-ref">Identifiant de transaction</label>
          <div>
            <input id="pay-ref" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Ex : MP241112.1234.A12345" minLength={4} maxLength={80} required />
            <button className="btn" disabled={busy || ref.trim().length < 4}>{busy ? '…' : 'Envoyer'}</button>
          </div>
        </form>
      )}
      {msg && <p className={msg.ok ? 'pay-ok' : 'form-error'} role="status">{msg.text}</p>}
    </div>
  );
}
