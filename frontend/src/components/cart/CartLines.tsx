'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/site';
import { MinusIcon, PlusIcon } from '../Icons';
import { MAX_QTY, lineKey, useCart, type CartItem } from './CartProvider';

// Liste des articles du panier, avec modification des quantités
export default function CartLines({ onNavigate, readOnly = false }: { onNavigate?: () => void; readOnly?: boolean }) {
  const { items, setQuantity, remove } = useCart();
  return (
    <ul className="cart-lines">
      {items.map((i) => (
        <CartLine key={lineKey(i)} item={i} readOnly={readOnly} onNavigate={onNavigate} setQuantity={setQuantity} remove={remove} />
      ))}
    </ul>
  );
}

type LineProps = {
  item: CartItem;
  readOnly: boolean;
  onNavigate?: () => void;
  setQuantity: (key: string, q: number) => void;
  remove: (key: string) => void;
};

function CartLine({ item: i, readOnly, onNavigate, setQuantity, remove }: LineProps) {
  const key = lineKey(i);
  const options = [i.size && `Taille ${i.size}`, i.color].filter(Boolean).join(' · ');
  return (
    <li className="cart-line">
      <Link href={`/produit/${i.slug}`} className="cart-line-media" onClick={onNavigate}>
        {i.image ? <Image src={i.image} alt="" fill sizes="96px" /> : <span className="placeholder">AJIFA</span>}
      </Link>
      <div className="cart-line-info">
        <Link href={`/produit/${i.slug}`} className="cart-line-name" onClick={onNavigate}>
          {i.name}
        </Link>
        {options && <span className="cart-line-opts">{options}</span>}
        <span className="cart-line-price">{formatPrice(i.price)}</span>
        {readOnly ? (
          <span className="cart-line-opts">Quantité : {i.quantity}</span>
        ) : (
          <div className="cart-line-actions">
            <div className="qty" role="group" aria-label={`Quantité pour ${i.name}`}>
              <button type="button" aria-label="Retirer un" onClick={() => setQuantity(key, i.quantity - 1)}>
                <MinusIcon />
              </button>
              <span aria-live="polite">{i.quantity}</span>
              <button type="button" aria-label="Ajouter un" disabled={i.quantity >= MAX_QTY} onClick={() => setQuantity(key, i.quantity + 1)}>
                <PlusIcon />
              </button>
            </div>
            <button type="button" className="cart-line-remove" onClick={() => remove(key)}>
              Retirer
            </button>
          </div>
        )}
      </div>
      <span className="cart-line-total">{formatPrice(i.price * i.quantity)}</span>
    </li>
  );
}
