import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Jost } from 'next/font/google';
import { SITE_URL } from '@/lib/site';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-jost',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'AJIFA — Mode élégante à Dakar, Sénégal',
    template: '%s · AJIFA',
  },
  description: 'AJIFA, boutique de mode élégante à Dakar, Sénégal. Découvrez nos collections de vêtements raffinés.',
  applicationName: 'AJIFA',
  keywords: ['AJIFA', 'mode', 'vêtements', 'boutique', 'Dakar', 'Sénégal', 'élégance', 'robe', 'tenue', 'mode africaine'],
  openGraph: {
    type: 'website',
    locale: 'fr_SN',
    siteName: 'AJIFA',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'AJIFA' }],
  },
  twitter: { card: 'summary_large_image' },
  alternates: { canonical: '/' },
  formatDetection: { telephone: false },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export const viewport: Viewport = {
  themeColor: '#f8f4ee',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${jost.variable}`}>
      <body>{children}</body>
    </html>
  );
}
