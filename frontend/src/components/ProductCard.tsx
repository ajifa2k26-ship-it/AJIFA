import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/site';

export function Price({ price, compareAtPrice }: Pick<Product, 'price' | 'compareAtPrice'>) {
  const current = formatPrice(price);
  if (!current) return <span className="price">Prix sur demande</span>;
  const old = compareAtPrice && price != null && compareAtPrice > price ? formatPrice(compareAtPrice) : null;
  return (
    <span className="price">
      {old && <s>{old}</s>}
      <span className="current">{current}</span>
    </span>
  );
}

export default function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const [first, second] = product.images;
  const sizes = '(max-width: 760px) 50vw, (max-width: 1100px) 33vw, 25vw';
  return (
    <Link href={`/produit/${product.slug}`} className="product-card">
      <div className="product-card-media">
        <div className="badges">
          {product.isNewArrival && <span className="badge">Nouveauté</span>}
          {product.compareAtPrice && product.price != null && product.compareAtPrice > product.price && (
            <span className="badge badge-burgundy">Prix doux</span>
          )}
          {!product.available && <span className="badge badge-muted">Épuisé</span>}
        </div>
        {first ? (
          <>
            <Image src={first.url} alt={first.alt || product.name} fill sizes={sizes} priority={priority} />
            {second && <Image className="alt" src={second.url} alt="" fill sizes={sizes} />}
          </>
        ) : (
          <span className="placeholder">AJIFA</span>
        )}
      </div>
      <div className="product-card-info">
        {product.category && <span className="cat">{product.category.name}</span>}
        <h3>{product.name}</h3>
        <Price price={product.price} compareAtPrice={product.compareAtPrice} />
      </div>
    </Link>
  );
}
