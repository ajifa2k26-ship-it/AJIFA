import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductGallery from '@/components/ProductGallery';
import ProductOptions from '@/components/ProductOptions';
import ProductCard, { Price } from '@/components/ProductCard';
import JsonLd from '@/components/JsonLd';
import { getProduct, getProducts, getSettings } from '@/lib/api';
import { SITE_URL, excerpt, formatPrice } from '@/lib/site';

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const products = await getProducts({ limit: 100 }).catch(() => []);
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) return { title: 'Article introuvable' };
  const p = data.item;
  const title = p.seoTitle || p.name;
  const description =
    p.seoDescription || excerpt(p.description) || `${p.name} — pièce AJIFA disponible à Dakar, Sénégal.`;
  return {
    title,
    description,
    alternates: { canonical: `/produit/${p.slug}` },
    openGraph: {
      type: 'website',
      title: `${title} · AJIFA`,
      description,
      url: `/produit/${p.slug}`,
      images: p.images.slice(0, 4).map((i) => ({
        url: i.url.replace('/upload/', '/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/'),
        width: 1200,
        height: 630,
        alt: i.alt || p.name,
      })),
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const [data, settings] = await Promise.all([getProduct(slug), getSettings()]);
  if (!data) notFound();
  const { item: p, related } = data;
  const url = `${SITE_URL}/produit/${p.slug}`;

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: excerpt(p.description, 500) || p.name,
    image: p.images.map((i) => i.url),
    sku: p._id,
    brand: { '@type': 'Brand', name: 'AJIFA' },
    ...(p.category ? { category: p.category.name } : {}),
    ...(p.fabric ? { material: p.fabric } : {}),
    ...(p.colors.length ? { color: p.colors.join(', ') } : {}),
    ...(p.price != null
      ? {
          offers: {
            '@type': 'Offer',
            url,
            priceCurrency: 'XOF',
            price: p.price,
            availability: p.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
            seller: { '@type': 'Organization', name: 'AJIFA' },
          },
        }
      : {}),
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Collections', item: `${SITE_URL}/collections` },
      ...(p.category
        ? [{ '@type': 'ListItem', position: 3, name: p.category.name, item: `${SITE_URL}/collections/${p.category.slug}` }]
        : []),
      { '@type': 'ListItem', position: p.category ? 4 : 3, name: p.name, item: url },
    ],
  };

  return (
    <div className="container">
      <ol className="breadcrumb">
        <li><Link href="/">Accueil</Link></li>
        <li><Link href="/collections">Collections</Link></li>
        {p.category && <li><Link href={`/collections/${p.category.slug}`}>{p.category.name}</Link></li>}
        <li aria-current="page">{p.name}</li>
      </ol>

      <article className="product-page">
        <ProductGallery images={p.images} name={p.name} />

        <div className="product-info">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {p.category && <span className="eyebrow">{p.category.name}</span>}
            <h1>{p.name}</h1>
            <Price price={p.price} compareAtPrice={p.compareAtPrice} />
            {!p.available && <span className="badge badge-muted" style={{ alignSelf: 'flex-start' }}>Épuisé</span>}
          </div>

          {p.description && <p className="description">{p.description}</p>}

          <ProductOptions
            name={p.name}
            url={url}
            priceLabel={formatPrice(p.price) || 'prix sur demande'}
            sizes={p.sizes}
            colors={p.colors}
            available={p.available}
            whatsapp={settings.whatsapp}
            phone={settings.phone}
          />

          <div className="details-list">
            {p.fabric && (
              <details open>
                <summary>Matière & entretien</summary>
                <div className="content">{p.fabric}</div>
              </details>
            )}
            <details>
              <summary>Livraison & retrait</summary>
              <div className="content">
                Retrait possible à {settings.address || 'Dakar'}. Livraison à Dakar et dans les régions du Sénégal :
                contactez-nous pour connaître les délais et tarifs.
              </div>
            </details>
            <details>
              <summary>Conseils de taille</summary>
              <div className="content">
                Vous hésitez entre deux tailles ? Envoyez-nous vos mesures sur WhatsApp, nous vous conseillerons avec plaisir.
              </div>
            </details>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section style={{ paddingBottom: 'clamp(64px, 8vw, 120px)' }}>
          <div className="section-head">
            <span className="ornament">✦</span>
            <h2>Vous aimerez aussi</h2>
          </div>
          <div className="product-grid">
            {related.map((r) => (
              <ProductCard key={r._id} product={r} />
            ))}
          </div>
        </section>
      )}

      <JsonLd data={[productLd, breadcrumbLd]} />
    </div>
  );
}
