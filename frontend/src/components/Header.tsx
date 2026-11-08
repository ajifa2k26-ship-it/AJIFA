'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Category } from '@/lib/types';
import { CloseIcon, MenuIcon, WhatsAppIcon } from './Icons';

type Props = { categories: Pick<Category, 'name' | 'slug'>[]; whatsappHref: string | null };

const LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/collections', label: 'Collections' },
  { href: '/a-propos', label: 'La maison' },
  { href: '/contact', label: 'Contact' },
];

export default function Header({ categories, whatsappHref }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const left = LINKS.slice(0, 2);
  const right = LINKS.slice(2);

  return (
    <>
      <header className={`header${scrolled ? ' scrolled' : ''}`}>
        <div className="container header-inner">
          <div>
            <button className="icon-btn menu-toggle" aria-label="Ouvrir le menu" aria-expanded={open} onClick={() => setOpen(true)}>
              <MenuIcon />
            </button>
            <nav className="nav" aria-label="Navigation principale">
              {left.map((l) => (
                <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? 'page' : undefined}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          <Link href="/" className="header-logo" aria-label="AJIFA — accueil">
            <Image src="/logo.png" alt="AJIFA" width={587} height={181} priority unoptimized />
          </Link>

          <div className="header-actions">
            <nav className="nav" aria-label="Navigation secondaire">
              {right.map((l) => (
                <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? 'page' : undefined}>
                  {l.label}
                </Link>
              ))}
            </nav>
            {whatsappHref && (
              <a className="icon-btn" href={whatsappHref} target="_blank" rel="noopener" aria-label="Nous écrire sur WhatsApp">
                <WhatsAppIcon />
              </a>
            )}
          </div>
        </div>
      </header>

      <div className={`mobile-menu${open ? ' open' : ''}`} aria-hidden={!open} role="dialog" aria-label="Menu">
        <div className="mobile-menu-top">
          <button className="icon-btn" aria-label="Fermer le menu" onClick={() => setOpen(false)} style={{ marginLeft: -10 }}>
            <CloseIcon />
          </button>
          <Image src="/logo.png" alt="AJIFA" width={587} height={181} unoptimized />
          <span style={{ width: 40 }} />
        </div>
        <nav aria-label="Menu mobile">
          <Link href="/">Accueil</Link>
          <Link href="/collections">Collections</Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`/collections/${c.slug}`} className="sub">
              {c.name}
            </Link>
          ))}
          <Link href="/a-propos">La maison</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        {whatsappHref && (
          <div className="mobile-menu-foot">
            <a className="btn" href={whatsappHref} target="_blank" rel="noopener">
              <WhatsAppIcon /> Nous écrire
            </a>
          </div>
        )}
      </div>
    </>
  );
}
