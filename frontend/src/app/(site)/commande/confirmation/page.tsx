import type { Metadata } from 'next';
import Confirmation from '@/components/cart/Confirmation';
import { getSettings } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Commande confirmée',
  robots: { index: false, follow: false },
};

export default async function Page() {
  const settings = await getSettings();
  return <Confirmation settings={settings} />;
}
