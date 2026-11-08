'use client';

import { useState } from 'react';
import { WhatsAppIcon } from './Icons';
import { whatsappLink } from '@/lib/site';

type Props = {
  name: string;
  url: string;
  priceLabel: string;
  sizes: string[];
  colors: string[];
  available: boolean;
  whatsapp: string;
  phone: string;
};

// Choix de la taille / couleur et commande par WhatsApp avec un message pré-rempli
export default function ProductOptions({ name, url, priceLabel, sizes, colors, available, whatsapp, phone }: Props) {
  const [size, setSize] = useState<string | null>(sizes.length === 1 ? sizes[0] : null);
  const [color, setColor] = useState<string | null>(colors.length === 1 ? colors[0] : null);

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
              <button key={s} type="button" className="option" aria-pressed={size === s} onClick={() => setSize(size === s ? null : s)}>
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
              <button key={c} type="button" className="option" aria-pressed={color === c} onClick={() => setColor(color === c ? null : c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="product-actions">
        {wa ? (
          <a className="btn btn-block" href={wa} target="_blank" rel="noopener">
            <WhatsAppIcon /> {available ? 'Commander sur WhatsApp' : 'Être prévenue du retour'}
          </a>
        ) : phone ? (
          <a className="btn btn-block" href={`tel:${phone.replace(/\s/g, '')}`}>Nous appeler</a>
        ) : null}
        <small>{available ? 'Réponse rapide · Livraison à Dakar et dans tout le Sénégal' : 'Cette pièce est actuellement épuisée.'}</small>
      </div>
    </>
  );
}
