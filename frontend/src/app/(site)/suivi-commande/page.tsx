import type { Metadata } from 'next';
import TrackOrder from '@/components/cart/TrackOrder';
import { getSettings } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Suivre ma commande',
  description: 'Consultez l’état de votre commande AJIFA avec votre numéro de commande et votre téléphone.',
  alternates: { canonical: '/suivi-commande' },
};

export default async function Page() {
  const settings = await getSettings();
  return <TrackOrder settings={settings} />;
}
