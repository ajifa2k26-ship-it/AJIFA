'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { formatPrice } from '@/lib/site';
import { CloseIcon } from '../Icons';
import CartLines from './CartLines';
import { useCart } from './CartProvider';

// Panneau latéral du panier, ouvert après un ajout ou depuis l'icône de l'en-tête
export default function CartDrawer() {
  const { items, count, subtotal, drawerOpen, closeDrawer } = useCart();
  const pathname = usePathname();

  useEffect(() => closeDrawer(), [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeDrawer();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen, closeDrawer]);

  return (
    <>
      <div className={`drawer-back${drawerOpen ? ' open' : ''}`} onClick={closeDrawer} aria-hidden />
      <aside className={`drawer${drawerOpen ? ' open' : ''}`} aria-hidden={!drawerOpen} role="dialog" aria-label="Votre panier">
        <div className="drawer-head">
          <h2>Votre panier{count > 0 && <span> ({count})</span>}</h2>
          <button className="icon-btn" aria-label="Fermer le panier" onClick={closeDrawer}>
            <CloseIcon />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="drawer-empty">
            <p>Votre panier est vide.</p>
            <Link href="/collections" className="btn btn-outline" onClick={closeDrawer}>
              Découvrir les collections
            </Link>
          </div>
        ) : (
          <>
            <div className="drawer-body">
              <CartLines onNavigate={closeDrawer} />
            </div>
            <div className="drawer-foot">
              <div className="summary-row total">
                <span>Sous-total</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <small>Frais de livraison calculés à l&apos;étape suivante.</small>
              <Link href="/commande" className="btn btn-block" onClick={closeDrawer}>
                Commander
              </Link>
              <Link href="/panier" className="link-underline" style={{ alignSelf: 'center' }} onClick={closeDrawer}>
                Voir le panier
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
