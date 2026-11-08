import type { Metadata } from 'next';
import CollectionView from '@/components/CollectionView';
import { getCategories, getProducts } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Découvrez toutes les pièces AJIFA : robes, tenues et vêtements élégants, disponibles à Dakar.',
  alternates: { canonical: '/collections' },
};

export default async function CollectionsPage() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  return (
    <CollectionView
      title="Toute la collection"
      intro="Des pièces pensées pour sublimer chaque moment, du quotidien aux grandes occasions."
      categories={categories}
      products={products}
    />
  );
}
