'use client';

import { BagIcon } from '../Icons';
import { useCart } from './CartProvider';

export default function CartButton() {
  const { count, ready, openDrawer } = useCart();
  return (
    <button type="button" className="icon-btn cart-btn" onClick={openDrawer} aria-label={`Ouvrir le panier (${count} article${count > 1 ? 's' : ''})`}>
      <BagIcon />
      {ready && count > 0 && <span className="cart-count">{count > 99 ? '99+' : count}</span>}
    </button>
  );
}
