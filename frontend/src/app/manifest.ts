import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AJIFA — Mode élégante',
    short_name: 'AJIFA',
    description: 'Boutique de mode élégante à Dakar, Sénégal.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8f4ee',
    theme_color: '#7d1128',
    lang: 'fr',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
