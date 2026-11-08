import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { getSettings } from '@/lib/api';
import { excerpt } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: 'La maison',
    description: excerpt(s.aboutText) || s.seoDescription,
    alternates: { canonical: '/a-propos' },
  };
}

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <>
      <div className="container">
        <header className="page-head">
          <span className="eyebrow">Notre histoire</span>
          <h1>{s.aboutTitle}</h1>
          <p>{s.tagline}</p>
        </header>
      </div>
      <section className="section" style={{ paddingTop: 24 }}>
        <div className="container editorial">
          <Reveal>
            {s.aboutImage ? (
              <div className="editorial-media">
                <Image src={s.aboutImage.url} alt={s.aboutImage.alt || s.aboutTitle} fill priority sizes="(max-width: 860px) 100vw, 50vw" />
              </div>
            ) : (
              <div className="editorial-media monogram">
                <Image src="/logo-white.png" alt="" width={587} height={181} unoptimized />
              </div>
            )}
          </Reveal>
          <Reveal className="editorial-text" delay={120}>
            <span className="ornament">✦</span>
            <p style={{ fontSize: '1.08rem' }}>{s.aboutText}</p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link href="/collections" className="btn">Voir la collection</Link>
              <Link href="/contact" className="btn btn-outline">Nous contacter</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
