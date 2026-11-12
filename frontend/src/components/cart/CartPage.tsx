'use client';

import Link from 'next/link';
import { formatPrice } from '@/lib/site';
import CartLines from './CartLines';
import { useCart } from './CartProvider';

export default function CartPage() {
  const { items, ready, subtotal, count, clear } = useCart();

  return (
    <div className="container shop-page">
      <header className="page-head">
        <span className="eyebrow">Boutique</span>
        <h1>Mon panier</h1>
        {ready && count > 0 && <p>{count} article{count > 1 ? 's' : ''}</p>}
      </header>

      {!ready ? (
        <div className="shop-loading"><span className="spinner-site" /></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <h2>Votre panier est vide</h2>
          <p>Parcourez nos collections et ajoutez vos pièces préférées.</p>
          <Link href="/collections" className="btn">Découvrir les collections</Link>
        </div>
      ) : (
        <div className="shop-layout">
          <section>
            <CartLines />
            <button type="button" className="link-underline" style={{ marginTop: 20 }} onClick={() => window.confirm('Vider le panier ?') && clear()}>
              Vider le panier
            </button>
          </section>
          <aside className="shop-summary">
            <h2>Récapitulatif</h2>
            <div className="summary-row">
              <span>Sous-total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="summary-row muted">
              <span>Livraison</span>
              <span>Calculée selon votre ville</span>
            </div>
            <Link href="/commande" className="btn btn-block">Passer la commande</Link>
            <Link href="/collections" className="link-underline" style={{ alignSelf: 'center' }}>Continuer mes achats</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
