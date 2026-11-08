import Link from 'next/link';
import ProductCard from './ProductCard';
import type { Category, Product } from '@/lib/types';

type Props = {
  title: string;
  intro?: string;
  categories: Category[];
  products: Product[];
  activeSlug?: string;
};

export default function CollectionView({ title, intro, categories, products, activeSlug }: Props) {
  return (
    <div className="container">
      <header className="page-head">
        <span className="eyebrow">Collections</span>
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
      </header>

      {categories.length > 0 && (
        <nav className="filter-bar" aria-label="Catégories">
          <Link href="/collections" className="chip" aria-current={!activeSlug ? 'page' : undefined}>
            Tout
          </Link>
          {categories.map((c) => (
            <Link key={c._id} href={`/collections/${c.slug}`} className="chip" aria-current={activeSlug === c.slug ? 'page' : undefined}>
              {c.name}
            </Link>
          ))}
        </nav>
      )}

      {products.length ? (
        <div className="product-grid" style={{ paddingBottom: 'clamp(64px, 8vw, 120px)' }}>
          {products.map((p, i) => (
            <ProductCard key={p._id} product={p} priority={i < 4} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Bientôt disponible</h2>
          <p>De nouvelles pièces arrivent très prochainement.</p>
        </div>
      )}
    </div>
  );
}
