'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { adminApi, type ProductInput } from '@/lib/admin-api';
import type { Category } from '@/lib/types';
import { useAdmin } from './AdminShell';
import { ImageUploader, TagInput, Toggle } from './fields';
import { EyeI, TrashI } from './AdminIcons';

const EMPTY: ProductInput = {
  name: '',
  description: '',
  price: null,
  compareAtPrice: null,
  category: null,
  images: [],
  sizes: [],
  colors: [],
  fabric: '',
  featured: false,
  isNewArrival: true,
  available: true,
  published: true,
  order: 0,
  seoTitle: '',
  seoDescription: '',
};

const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Taille unique', 'Sur mesure'];

export default function ProductForm({ id }: { id?: string }) {
  const router = useRouter();
  const { notify } = useAdmin();
  const [data, setData] = useState<ProductInput>(EMPTY);
  const [slug, setSlug] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.categories().then((r) => setCategories(r.items)).catch(() => {});
    if (!id) return;
    adminApi
      .product(id)
      .then(({ item }) => {
        const { _id, createdAt, updatedAt, slug: s, ...rest } = item as typeof item & { _id: string; createdAt: string; updatedAt: string };
        void _id; void createdAt; void updatedAt;
        setSlug(s);
        setData({ ...EMPTY, ...rest, category: (rest.category as string | null) ?? null });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => setData((d) => ({ ...d, [key]: value }));
  const numberValue = (v: number | null) => (v == null ? '' : String(v));
  const parseNumber = (v: string) => {
    const n = Number(v.replace(/\D/g, ''));
    return v.trim() === '' || !Number.isFinite(n) ? null : n;
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!data.name.trim()) return setError('Donnez un nom à cet article.');
    setSaving(true);
    setError('');
    try {
      if (id) {
        const { item } = await adminApi.updateProduct(id, { ...data, slug });
        setSlug(item.slug);
        notify('Article enregistré ✓');
      } else {
        const { item } = await adminApi.createProduct(data);
        notify('Article ajouté ✓');
        router.replace(`/admin/produits/${item._id}`);
      }
    } catch (err) {
      setError((err as Error).message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!id || !window.confirm(`Supprimer définitivement « ${data.name} » ? Les photos seront aussi supprimées.`)) return;
    try {
      await adminApi.deleteProduct(id);
      notify('Article supprimé');
      router.replace('/admin/produits');
    } catch (err) {
      notify((err as Error).message, 'error');
    }
  }

  if (loading) return <div className="center-load"><span className="spinner" /></div>;

  return (
    <form onSubmit={submit}>
      <div className="adm-top">
        <div>
          <Link href="/admin/produits" className="sub">← Tous les articles</Link>
          <h1>{id ? data.name || 'Article' : 'Nouvel article'}</h1>
        </div>
        {id && slug && data.published && (
          <a href={`/produit/${slug}`} target="_blank" rel="noopener" className="a-btn ghost">
            <EyeI /> Voir sur le site
          </a>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="form-layout">
        <div>
          <div className="card">
            <h2>Photos</h2>
            <p className="hint">La première photo sert de couverture. Format portrait conseillé. Jusqu&apos;à 12 photos.</p>
            <ImageUploader value={data.images} onChange={(v) => set('images', v)} />
          </div>

          <div className="card">
            <h2>Informations</h2>
            <div className="field">
              <label htmlFor="name">Nom de l&apos;article *</label>
              <input id="name" className="input" required maxLength={140} value={data.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex : Robe Ndeye en bazin brodé" />
            </div>
            <div className="field">
              <label htmlFor="desc">Description</label>
              <textarea id="desc" className="textarea" maxLength={5000} value={data.description} onChange={(e) => set('description', e.target.value)} placeholder="Coupe, détails, occasion…" />
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="price">Prix</label>
                <div className="input-group">
                  <input id="price" className="input" inputMode="numeric" value={numberValue(data.price)} onChange={(e) => set('price', parseNumber(e.target.value))} placeholder="Vide = prix sur demande" />
                  <span className="suffix">FCFA</span>
                </div>
              </div>
              <div className="field">
                <label htmlFor="cprice">Ancien prix (barré)</label>
                <div className="input-group">
                  <input id="cprice" className="input" inputMode="numeric" value={numberValue(data.compareAtPrice)} onChange={(e) => set('compareAtPrice', parseNumber(e.target.value))} placeholder="Optionnel" />
                  <span className="suffix">FCFA</span>
                </div>
              </div>
            </div>
            <div className="field">
              <label htmlFor="fabric">Matière & entretien</label>
              <input id="fabric" className="input" maxLength={200} value={data.fabric} onChange={(e) => set('fabric', e.target.value)} placeholder="Ex : Bazin riche, lavage à la main" />
            </div>
          </div>

          <div className="card">
            <h2>Tailles & couleurs</h2>
            <div className="field">
              <span className="label">Tailles disponibles</span>
              <TagInput value={data.sizes} onChange={(v) => set('sizes', v)} placeholder="Tapez une taille puis Entrée" presets={SIZE_PRESETS} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <span className="label">Couleurs</span>
              <TagInput value={data.colors} onChange={(v) => set('colors', v)} placeholder="Ex : Bordeaux, Ivoire…" />
            </div>
          </div>

          <div className="card">
            <h2>Référencement Google</h2>
            <p className="hint">Optionnel : par défaut, le nom et la description sont utilisés.</p>
            <div className="field">
              <label htmlFor="seot">Titre pour Google <small>({data.seoTitle.length}/70)</small></label>
              <input id="seot" className="input" maxLength={70} value={data.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} placeholder={data.name} />
            </div>
            <div className="field">
              <label htmlFor="seod">Description pour Google <small>({data.seoDescription.length}/170)</small></label>
              <textarea id="seod" className="textarea" style={{ minHeight: 80 }} maxLength={170} value={data.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} />
            </div>
            {id && (
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="slug">Adresse de la page</label>
                <div className="input-group">
                  <input id="slug" className="input" style={{ paddingLeft: 92 }} value={slug} onChange={(e) => setSlug(e.target.value)} />
                  <span className="suffix" style={{ left: 13, right: 'auto' }}>/produit/</span>
                </div>
                <small>Évitez de la modifier une fois l&apos;article partagé.</small>
              </div>
            )}
          </div>
        </div>

        <aside>
          <div className="card">
            <h2>Visibilité</h2>
            <Toggle label="Publié sur le site" hint="Décochez pour masquer l'article" checked={data.published} onChange={(v) => set('published', v)} />
            <Toggle label="Disponible" hint="Sinon affiché « Épuisé »" checked={data.available} onChange={(v) => set('available', v)} />
            <Toggle label="Coup de cœur" hint="Mis en avant sur l'accueil" checked={data.featured} onChange={(v) => set('featured', v)} />
            <Toggle label="Nouveauté" hint="Badge « Nouveauté »" checked={data.isNewArrival} onChange={(v) => set('isNewArrival', v)} />
          </div>
          <div className="card">
            <h2>Classement</h2>
            <div className="field">
              <label htmlFor="cat">Catégorie</label>
              <select id="cat" className="select" value={data.category || ''} onChange={(e) => set('category', e.target.value || null)}>
                <option value="">— Aucune —</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              {!categories.length && <small><Link href="/admin/categories" style={{ textDecoration: 'underline' }}>Créer une catégorie</Link></small>}
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="order">Ordre d&apos;affichage</label>
              <input id="order" className="input" type="number" value={data.order} onChange={(e) => set('order', Number(e.target.value) || 0)} />
              <small>Les plus petits nombres apparaissent en premier.</small>
            </div>
          </div>
          {id && (
            <button type="button" className="a-btn danger" onClick={remove}>
              <TrashI /> Supprimer l&apos;article
            </button>
          )}
        </aside>
      </div>

      <div className="save-bar">
        <Link href="/admin/produits" className="a-btn ghost">Annuler</Link>
        <button className="a-btn" disabled={saving}>
          {saving ? <span className="spinner" /> : id ? 'Enregistrer' : "Ajouter l'article"}
        </button>
      </div>
    </form>
  );
}
