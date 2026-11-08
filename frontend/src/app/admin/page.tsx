'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin-api';
import type { Product } from '@/lib/types';
import { useAdmin } from '@/components/admin/AdminShell';
import { FolderI, GearI, PlusI } from '@/components/admin/AdminIcons';

export default function Dashboard() {
  const { user, notify } = useAdmin();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [catCount, setCatCount] = useState<number | null>(null);
  const [whatsappMissing, setWhatsappMissing] = useState(false);

  useEffect(() => {
    Promise.all([adminApi.products(), adminApi.categories(), adminApi.settings()])
      .then(([p, c, s]) => {
        setProducts(p.items);
        setCatCount(c.items.length);
        setWhatsappMissing(!s.settings.whatsapp);
      })
      .catch((e) => notify(e.message, 'error'));
  }, [notify]);

  const published = products?.filter((p) => p.published).length ?? '—';
  const soldOut = products?.filter((p) => !p.available).length ?? '—';
  const featured = products?.filter((p) => p.featured).length ?? '—';

  return (
    <>
      <div className="adm-top">
        <div>
          <h1>Bonjour{user?.name ? `, ${user.name}` : ''}</h1>
          <p className="sub">Gérez votre vitrine en quelques clics.</p>
        </div>
        <Link href="/admin/produits/nouveau" className="a-btn">
          <PlusI /> Ajouter un article
        </Link>
      </div>

      {whatsappMissing && (
        <div className="alert info">
          Ajoutez votre numéro WhatsApp dans <Link href="/admin/parametres" style={{ textDecoration: 'underline' }}>Réglages</Link> pour que vos clientes puissent commander.
        </div>
      )}

      <div className="stats">
        <div className="stat"><div className="v">{published}</div><div className="l">Articles en ligne</div></div>
        <div className="stat"><div className="v">{featured}</div><div className="l">Coups de cœur</div></div>
        <div className="stat"><div className="v">{soldOut}</div><div className="l">Épuisés</div></div>
        <div className="stat"><div className="v">{catCount ?? '—'}</div><div className="l">Catégories</div></div>
      </div>

      <div className="quick">
        <Link href="/admin/produits/nouveau">
          <PlusI />
          <span><strong>Nouvel article</strong><small>Photos, prix, tailles…</small></span>
        </Link>
        <Link href="/admin/categories">
          <FolderI />
          <span><strong>Catégories</strong><small>Robes, ensembles, accessoires…</small></span>
        </Link>
        <Link href="/admin/parametres">
          <GearI />
          <span><strong>Réglages du site</strong><small>Textes, photo d&apos;accueil, contacts</small></span>
        </Link>
      </div>

      {products && products.length > 0 && (
        <div className="card" style={{ marginTop: 22 }}>
          <h2>Derniers articles</h2>
          <div className="list" style={{ border: 0 }}>
            {[...products]
              .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
              .slice(0, 5)
              .map((p) => (
                <Link key={p._id} href={`/admin/produits/${p._id}`} className="row" style={{ gridTemplateColumns: '48px 1fr', padding: '8px 0' }}>
                  <span className="thumb" style={{ width: 48, height: 60 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.images[0] ? <img src={p.images[0].url.replace('/upload/', '/upload/w_120,f_auto,q_auto/')} alt="" /> : '—'}
                  </span>
                  <span>
                    <span className="name">{p.name}</span>
                    <span className="meta">Modifié le {new Date(p.updatedAt).toLocaleDateString('fr-FR')}</span>
                  </span>
                </Link>
              ))}
          </div>
        </div>
      )}
    </>
  );
}
