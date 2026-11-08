import ProductForm from '@/components/admin/ProductForm';

export const metadata = { title: 'Modifier un article' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductForm key={id} id={id} />;
}
