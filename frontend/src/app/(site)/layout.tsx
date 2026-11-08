import Header from '@/components/Header';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import { WhatsAppIcon } from '@/components/Icons';
import { getCategories, getSettings } from '@/lib/api';
import { SITE_URL, whatsappLink } from '@/lib/site';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories().catch(() => [])]);
  const wa = whatsappLink(settings.whatsapp, 'Bonjour AJIFA, je souhaiterais avoir des informations.');

  const sameAs = [settings.instagram, settings.facebook, settings.tiktok].filter(Boolean);
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: settings.siteName,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    image: `${SITE_URL}/og-default.jpg`,
    description: settings.seoDescription,
    address: { '@type': 'PostalAddress', streetAddress: settings.address, addressLocality: 'Dakar', addressCountry: 'SN' },
    ...(settings.phone ? { telephone: settings.phone } : {}),
    ...(settings.email ? { email: settings.email } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    currenciesAccepted: 'XOF',
  };

  return (
    <>
      <a href="#contenu" className="skip-link">Aller au contenu</a>
      {settings.announcement && <div className="announcement">{settings.announcement}</div>}
      <Header categories={categories.map(({ name, slug }) => ({ name, slug }))} whatsappHref={wa} />
      <main id="contenu">{children}</main>
      <Footer settings={settings} categories={categories} />
      {wa && (
        <a className="wa-float" href={wa} target="_blank" rel="noopener" aria-label="Discuter sur WhatsApp">
          <WhatsAppIcon />
        </a>
      )}
      <JsonLd data={organization} />
    </>
  );
}
