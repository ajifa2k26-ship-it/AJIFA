import type { Metadata } from 'next';
import { getSettings } from '@/lib/api';
import { whatsappLink } from '@/lib/site';
import { ClockIcon, InstagramIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from '@/components/Icons';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez AJIFA à Dakar : WhatsApp, téléphone, e-mail et adresse de la boutique.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const s = await getSettings();
  const wa = whatsappLink(s.whatsapp, 'Bonjour AJIFA, ');

  return (
    <div className="container">
      <header className="page-head">
        <span className="eyebrow">Contact</span>
        <h1>Parlons de votre style</h1>
        <p>Une question sur une pièce, une taille ou une disponibilité ? Nous vous répondons avec plaisir.</p>
        {wa && (
          <a href={wa} target="_blank" rel="noopener" className="btn" style={{ marginTop: 12 }}>
            <WhatsAppIcon /> Écrire sur WhatsApp
          </a>
        )}
      </header>

      <div className="contact-grid">
        {s.phone && (
          <div className="contact-card">
            <PhoneIcon />
            <h2>Téléphone</h2>
            <a href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a>
          </div>
        )}
        {s.email && (
          <div className="contact-card">
            <MailIcon />
            <h2>E-mail</h2>
            <a href={`mailto:${s.email}`}>{s.email}</a>
          </div>
        )}
        {s.address && (
          <div className="contact-card">
            <PinIcon />
            <h2>Boutique</h2>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`} target="_blank" rel="noopener">
              {s.address}
            </a>
          </div>
        )}
        {s.openingHours && (
          <div className="contact-card">
            <ClockIcon />
            <h2>Horaires</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{s.openingHours}</p>
          </div>
        )}
        {s.instagram && (
          <div className="contact-card">
            <InstagramIcon />
            <h2>Instagram</h2>
            <a href={s.instagram} target="_blank" rel="noopener">Suivez nos nouveautés</a>
          </div>
        )}
      </div>
    </div>
  );
}
