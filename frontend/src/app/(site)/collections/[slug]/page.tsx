import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CollectionView from '@/components/CollectionView';
import JsonLd from '@/components/JsonLd';
import { getCategories, getCategory, getProducts } from '@/lib/api';
import { SITE_URL, excerpt } from '@/lib/site';

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const categories = await getCategories().catch(() => []);
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: 'Collection introuvable' };
  const description = excerpt(category.description) || `Découvrez la collection ${category.name} d'AJIFA, mode élégante à Dakar.`;
  return {
    title: category.name,
    description,
    alternates: { canonical: `/collections/${category.slug}` },
    openGraph: {
      title: `${category.name} · AJIFA`,
      description,
      url: `/collections/${category.slug}`,
      ...(category.image ? { images: [{ url: category.image.url }] } : {}),
    },
  };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const [category, categories, products] = await Promise.all([getCategory(slug), getCategories(), getProducts({ category: slug })]);
  if (!category) notFound();

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Collections', item: `${SITE_URL}/collections` },
      { '@type': 'ListItem', position: 3, name: category.name, item: `${SITE_URL}/collections/${category.slug}` },
    ],
  };

  return (
    <>
      <CollectionView title={category.name} intro={category.description} categories={categories} products={products} activeSlug={slug} />
      <JsonLd data={breadcrumb} />
    </>
  );
}
