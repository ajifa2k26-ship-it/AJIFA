import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/Reveal';
import { ChatIcon, NeedleIcon, SparkIcon, WhatsAppIcon } from '@/components/Icons';
import { getCategories, getProducts, getSettings } from '@/lib/api';
import { whatsappLink } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { description: s.seoDescription, alternates: { canonical: '/' } };
}

export default async function HomePage() {
  const [settings, categories, featured, latest] = await Promise.all([
    getSettings(),
    getCategories(),
    getProducts({ featured: true, limit: 8 }),
    getProducts({ limit: 8 }),
  ]);
  const showcase = featured.length ? featured : latest;
  const wa = whatsappLink(settings.whatsapp, 'Bonjour AJIFA, je souhaiterais découvrir vos pièces.');

  return (
    <>
      {/* ---------- Héros ---------- */}
      {settings.heroImage ? (
        <section className="hero">
          <div className="hero-media">
            <Image src={settings.heroImage.url} alt={settings.heroImage.alt || settings.heroTitle} fill priority sizes="100vw" />
          </div>
          <div className="hero-content">
            <span className="eyebrow">{settings.tagline}</span>
            <h1 className="display">{settings.heroTitle}</h1>
            <p>{settings.heroSubtitle}</p>
            <div className="hero-actions">
              <Link href="/collections" className="btn btn-light">Découvrir la collection</Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="hero hero-plain">
          <div className="hero-content">
            <span className="eyebrow">{settings.tagline}</span>
            <Image className="hero-logo" src="/logo.png" alt="AJIFA" width={587} height={181} priority unoptimized />
            <h1 className="display">{settings.heroTitle}</h1>
            <p>{settings.heroSubtitle}</p>
            <div className="hero-actions">
              <Link href="/collections" className="btn">Découvrir la collection</Link>
            </div>
          </div>
        </section>
      )}

      {/* ---------- Catégories ---------- */}
      {categories.length > 0 && (
        <section className="section">
          <div className="container">
            <Reveal className="section-head">
              <span className="ornament">✦</span>
              <h2>Nos univers</h2>
            </Reveal>
            <div className="categories-grid">
              {categories.slice(0, 6).map((c, i) => (
                <Reveal key={c._id} delay={i * 90}>
                  <Link href={`/collections/${c.slug}`} className={`category-tile${c.image ? '' : ' no-image'}`}>
                    {c.image && <Image src={c.image.url} alt={c.image.alt || c.name} fill sizes="(max-width: 600px) 100vw, 33vw" />}
                    <div className="label">
                      <h3>{c.name}</h3>
                      <span>Découvrir</span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Sélection ---------- */}
      <section className="section" style={categories.length ? { paddingTop: 0 } : undefined}>
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">{featured.length ? 'Sélection' : 'Nouveautés'}</span>
            <h2>{featured.length ? 'Nos coups de cœur' : 'Les dernières pièces'}</h2>
          </Reveal>
          {showcase.length ? (
            <div className="product-grid">
              {showcase.map((p, i) => (
                <ProductCard key={p._id} product={p} priority={i < 4} />
              ))}
            </div>
          ) : (
            <p className="empty-state">La nouvelle collection arrive très bientôt.</p>
          )}
          {showcase.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 56 }}>
              <Link href="/collections" className="btn btn-outline">Voir toute la collection</Link>
            </div>
          )}
        </div>
      </section>

      {/* ---------- La maison ---------- */}
      <section className="section" style={{ background: 'var(--paper)' }}>
        <div className="container editorial">
          <Reveal>
            {settings.aboutImage ? (
              <div className="editorial-media">
                <Image src={settings.aboutImage.url} alt={settings.aboutImage.alt || settings.aboutTitle} fill sizes="(max-width: 860px) 100vw, 50vw" />
              </div>
            ) : (
              <div className="editorial-media monogram">
                <Image src="/logo-white.png" alt="" width={587} height={181} unoptimized />
              </div>
            )}
          </Reveal>
          <Reveal className="editorial-text" delay={120}>
            <span className="eyebrow">Notre histoire</span>
            <h2>{settings.aboutTitle}</h2>
            <p>{settings.aboutText}</p>
            <div>
              <Link href="/a-propos" className="link-underline">En savoir plus</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Promesses ---------- */}
      <section className="container">
        <div className="promises">
          <div className="promise">
            <SparkIcon />
            <h3>Pièces choisies</h3>
            <p>Des créations sélectionnées pour leur coupe et leurs finitions.</p>
          </div>
          <div className="promise">
            <NeedleIcon />
            <h3>Savoir-faire</h3>
            <p>Le meilleur de l&apos;artisanat, au service de votre élégance.</p>
          </div>
          <div className="promise">
            <ChatIcon />
            <h3>Conseil personnalisé</h3>
            <p>Une question, une taille ? Nous vous répondons directement.</p>
          </div>
        </div>
      </section>

      {/* ---------- Appel à l'action ---------- */}
      {wa && (
        <section className="section cta-band" style={{ marginTop: 'clamp(64px, 10vw, 128px)' }}>
          <div className="container">
            <div className="section-head" style={{ marginBottom: 32 }}>
              <span className="eyebrow">À votre écoute</span>
              <h2>Une pièce vous fait envie ?</h2>
              <p>Écrivez-nous sur WhatsApp pour connaître la disponibilité, les tailles ou réserver un essayage.</p>
            </div>
            <a href={wa} target="_blank" rel="noopener" className="btn btn-light">
              <WhatsAppIcon /> Discuter avec nous
            </a>
          </div>
        </section>
      )}
    </>
  );
}
