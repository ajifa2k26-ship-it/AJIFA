'use client';

import Link from 'next/link';

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container">
      <div className="empty-state" style={{ padding: '120px 0' }}>
        <span className="eyebrow">Un instant</span>
        <h2 style={{ marginTop: 14 }}>La boutique se réveille…</h2>
        <p>Le chargement prend un peu plus de temps que prévu. Merci de réessayer dans quelques secondes.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => reset()}>Réessayer</button>
          <Link href="/" className="btn btn-outline">Accueil</Link>
        </div>
      </div>
    </div>
  );
}
