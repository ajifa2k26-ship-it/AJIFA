import type { Metadata } from 'next';
import CartPage from '@/components/cart/CartPage';

export const metadata: Metadata = {
  title: 'Mon panier',
  robots: { index: false, follow: true },
  alternates: { canonical: '/panier' },
};

export default function Page() {
  return <CartPage />;
}
