import type { Metadata } from 'next';
import Checkout from '@/components/cart/Checkout';
import { getSettings } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Finaliser ma commande',
  robots: { index: false, follow: false },
};

export default async function Page() {
  const settings = await getSettings();
  return <Checkout settings={settings} />;
}
