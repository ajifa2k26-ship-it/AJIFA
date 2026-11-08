import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <Image src="/logo.png" alt="AJIFA" width={220} height={68} unoptimized />
        <span className="eyebrow">Erreur 404</span>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)', fontWeight: 300 }}>Cette page n&apos;existe pas</h1>
        <p style={{ color: 'var(--ink-soft)', maxWidth: 420 }}>La pièce que vous cherchez a peut-être trouvé preneuse. Découvrez le reste de la collection.</p>
        <Link href="/collections" className="btn">Voir la collection</Link>
      </div>
    </main>
  );
}
