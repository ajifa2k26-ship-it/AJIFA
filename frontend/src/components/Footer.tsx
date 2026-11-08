import Link from 'next/link';
import Image from 'next/image';
import type { Category, Settings } from '@/lib/types';
import { FacebookIcon, InstagramIcon, TiktokIcon, WhatsAppIcon } from './Icons';
import { whatsappLink } from '@/lib/site';

export default function Footer({ settings, categories }: { settings: Settings; categories: Category[] }) {
  const wa = whatsappLink(settings.whatsapp);
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Image src="/logo-white.png" alt="AJIFA" width={587} height={181} unoptimized />
            <p style={{ maxWidth: 320 }}>{settings.tagline}</p>
            <div className="socials">
              {settings.instagram && (
                <a href={settings.instagram} target="_blank" rel="noopener" aria-label="Instagram">
                  <InstagramIcon />
                </a>
              )}
              {settings.facebook && (
                <a href={settings.facebook} target="_blank" rel="noopener" aria-label="Facebook">
                  <FacebookIcon />
                </a>
              )}
              {settings.tiktok && (
                <a href={settings.tiktok} target="_blank" rel="noopener" aria-label="TikTok">
                  <TiktokIcon />
                </a>
              )}
              {wa && (
                <a href={wa} target="_blank" rel="noopener" aria-label="WhatsApp">
                  <WhatsAppIcon />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4>Collections</h4>
            <ul>
              <li><Link href="/collections">Toutes les pièces</Link></li>
              {categories.slice(0, 6).map((c) => (
                <li key={c._id}><Link href={`/collections/${c.slug}`}>{c.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4>La maison</h4>
            <ul>
              <li><Link href="/a-propos">Notre histoire</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4>Nous trouver</h4>
            <ul>
              {settings.address && <li>{settings.address}</li>}
              {settings.phone && <li><a href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a></li>}
              {settings.email && <li><a href={`mailto:${settings.email}`}>{settings.email}</a></li>}
              {settings.openingHours && <li style={{ whiteSpace: 'pre-line' }}>{settings.openingHours}</li>}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {year} {settings.siteName}. Tous droits réservés.</span>
          <span>Dakar · Sénégal</span>
        </div>
      </div>
    </footer>
  );
}
