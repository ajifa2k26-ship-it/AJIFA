'use client';

import { useState } from 'react';
import { BagIcon, CheckIcon, MinusIcon, PlusIcon, WhatsAppIcon } from './Icons';
import { whatsappLink } from '@/lib/site';
import { MAX_QTY, useCart } from './cart/CartProvider';

type Props = {
  productId: string;
  slug: string;
  image: string;
  name: string;
  url: string;
  price: number | null;
  priceLabel: string;
  sizes: string[];
  colors: string[];
  available: boolean;
  whatsapp: string;
  phone: string;
};

// Choix de la taille / couleur, ajout au panier et commande par WhatsApp
export default function ProductOptions(props: Props) {
  const { productId, slug, image, name, url, price, priceLabel, sizes, colors, available, whatsapp, phone } = props;
  const { add, openDrawer } = useCart();
  const [size, setSize] = useState<string | null>(sizes.length === 1 ? sizes[0] : null);
  const [color, setColor] = useState<string | null>(colors.length === 1 ? colors[0] : null);
  const [qty, setQty] = useState(1);
  const [missing, setMissing] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const canBuy = available && price != null;

  function addToCart() {
    if (price == null) return;
    if (sizes.length && !size) return setMissing('Veuillez choisir une taille');
    if (colors.length && !color) return setMissing('Veuillez choisir une couleur');
    setMissing(null);
    add({ productId, slug, name, image, price, size: size || '', color: color || '' }, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
    openDrawer();
  }

  const lines = [
    `Bonjour AJIFA, je suis intéressée par cette pièce :`,
    `• ${name} (${priceLabel})`,
    size ? `• Taille : ${size}` : null,
    color ? `• Couleur : ${color}` : null,
    url,
  ].filter(Boolean);
  const wa = whatsappLink(whatsapp, lines.join('\n'));

  return (
    <>
      {sizes.length > 0 && (
        <div className="option-group">
          <span className="option-label">
            Taille{size && <strong>{size}</strong>}
          </span>
          <div className="options" role="group" aria-label="Choisir une taille">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                className="option"
                aria-pressed={size === s}
                onClick={() => {
                  setSize(size === s ? null : s);
                  setMissing(null);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div className="option-group">
          <span className="option-label">
            Couleur{color && <strong>{color}</strong>}
          </span>
          <div className="options" role="group" aria-label="Choisir une couleur">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                className="option"
                aria-pressed={color === c}
                onClick={() => {
                  setColor(color === c ? null : c);
                  setMissing(null);
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {canBuy && (
        <div className="option-group">
          <span className="option-label">Quantité</span>
          <div className="qty qty-lg" role="group" aria-label="Quantité">
            <button type="button" aria-label="Retirer un" disabled={qty <= 1} onClick={() => setQty(qty - 1)}>
              <MinusIcon />
            </button>
            <span>{qty}</span>
            <button type="button" aria-label="Ajouter un" disabled={qty >= MAX_QTY} onClick={() => setQty(qty + 1)}>
              <PlusIcon />
            </button>
          </div>
        </div>
      )}

      <div className="product-actions">
        {missing && <p className="form-error" role="alert">{missing}</p>}
        {canBuy && (
          <button type="button" className="btn btn-block" onClick={addToCart}>
            {added ? <CheckIcon /> : <BagIcon />} {added ? 'Ajouté au panier' : 'Ajouter au panier'}
          </button>
        )}
        {wa ? (
          <a className={`btn btn-block${canBuy ? ' btn-outline' : ''}`} href={wa} target="_blank" rel="noopener">
            <WhatsAppIcon /> {available ? (canBuy ? 'Commander sur WhatsApp' : 'Demander le prix sur WhatsApp') : 'Être prévenue du retour'}
          </a>
        ) : phone ? (
          <a className="btn btn-block btn-outline" href={`tel:${phone.replace(/\s/g, '')}`}>Nous appeler</a>
        ) : null}
        <small>
          {available
            ? 'Paiement à la livraison, Orange Money ou Wave · Livraison dans tout le Sénégal'
            : 'Cette pièce est actuellement épuisée.'}
        </small>
      </div>
    </>
  );
}
