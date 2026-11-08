'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/lib/admin-api';
import type { Category, Product } from '@/lib/types';
import { formatPrice } from '@/lib/site';
import { useAdmin } from '@/components/admin/AdminShell';
import { thumb } from '@/components/admin/fields';
import { EditI, EyeI, PlusI, TrashI } from '@/components/admin/AdminIcons';

export default function ProductsPage() {
  const { notify } = useAdmin();
  const [items, setItems] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    Promise.all([adminApi.products(), adminApi.categories()])
      .then(([p, c]) => {
        setItems(p.items);
        setCategories(c.items);
      })
      .catch((e) => notify(e.message, 'error'));
  }, [notify]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const term = q.trim().toLowerCase();
    return items.filter(
      (p) =>
        (!term || p.name.toLowerCase().includes(term)) &&
        (!cat || (cat === 'none' ? !p.category : p.category?._id === cat)) &&
        (!status ||
          (status === 'online' && p.published) ||
          (status === 'hidden' && !p.published) ||
          (status === 'soldout' && !p.available) ||
          (status === 'featured' && p.featured)),
    );
  }, [items, q, cat, status]);

  async function quickUpdate(p: Product, patch: Partial<Product>) {
    setItems((list) => list?.map((x) => (x._id === p._id ? { ...x, ...patch } : x)) ?? null);
    try {
      await adminApi.updateProduct(p._id, patch as never);
    } catch (e) {
      setItems((list) => list?.map((x) => (x._id === p._id ? p : x)) ?? null);
      notify((e as Error).message, 'error');
    }
  }

  async function remove(p: Product) {
    if (!window.confirm(`Supprimer définitivement « ${p.name} » ?`)) return;
    try {
      await adminApi.deleteProduct(p._id);
      setItems((list) => list?.filter((x) => x._id !== p._id) ?? null);
      notify('Article supprimé');
    } catch (e) {
      notify((e as Error).message, 'error');
    }
  }

  return (
    <>
      <div className="adm-top">
        <div>
          <h1>Articles</h1>
          <p className="sub">{items ? `${items.length} article${items.length > 1 ? 's' : ''}` : 'Chargement…'}</p>
        </div>
        <Link href="/admin/produits/nouveau" className="a-btn"><PlusI /> Ajouter</Link>
      </div>

      <div className="toolbar">
        <input className="input" type="search" placeholder="Rechercher un article…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Toutes les catégories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          <option value="none">Sans catégorie</option>
        </select>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="online">En ligne</option>
          <option value="hidden">Masqués</option>
          <option value="soldout">Épuisés</option>
          <option value="featured">Coups de cœur</option>
        </select>
      </div>

      {!items ? (
        <div className="center-load"><span className="spinner" /></div>
      ) : !filtered.length ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: 'var(--muted)' }}>{items.length ? 'Aucun article ne correspond.' : 'Aucun article pour le moment.'}</p>
          {!items.length && <Link href="/admin/produits/nouveau" className="a-btn"><PlusI /> Ajouter mon premier article</Link>}
        </div>
      ) : (
        <div className="list">
          {filtered.map((p) => (
            <div key={p._id} className="row">
              <Link href={`/admin/produits/${p._id}`} className="thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.images[0] ? <img src={thumb(p.images[0].url, 160)} alt="" loading="lazy" /> : 'Photo'}
              </Link>
              <div style={{ minWidth: 0 }}>
                <Link href={`/admin/produits/${p._id}`} className="name">{p.name}</Link>
                <div className="meta">
                  <span>{formatPrice(p.price) || 'Prix sur demande'}</span>
                  {p.category && <span>· {p.category.name}</span>}
                </div>
                <div className="meta">
                  <button type="button" className={`pill ${p.published ? 'ok' : 'off'}`} style={{ border: 0, cursor: 'pointer' }} onClick={() => quickUpdate(p, { published: !p.published })} title="Cliquer pour changer">
                    {p.published ? 'En ligne' : 'Masqué'}
                  </button>
                  <button type="button" className={`pill ${p.available ? '' : 'off'}`} style={{ border: 0, cursor: 'pointer' }} onClick={() => quickUpdate(p, { available: !p.available })} title="Cliquer pour changer">
                    {p.available ? 'Disponible' : 'Épuisé'}
                  </button>
                  {p.featured && <span className="pill star">Coup de cœur</span>}
                </div>
              </div>
              <div className="actions">
                {p.published && (
                  <a className="a-btn ghost sm" href={`/produit/${p.slug}`} target="_blank" rel="noopener" aria-label="Voir sur le site"><EyeI /></a>
                )}
                <Link className="a-btn ghost sm" href={`/admin/produits/${p._id}`}><EditI /> Modifier</Link>
                <button className="a-btn danger sm" onClick={() => remove(p)} aria-label="Supprimer"><TrashI /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
