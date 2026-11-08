'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { adminApi, type CategoryInput } from '@/lib/admin-api';
import type { Category } from '@/lib/types';
import { useAdmin } from '@/components/admin/AdminShell';
import { ImageUploader, Toggle, thumb } from '@/components/admin/fields';
import { EditI, PlusI, TrashI } from '@/components/admin/AdminIcons';

const EMPTY: CategoryInput = { name: '', description: '', image: null, order: 0, visible: true };

export default function CategoriesPage() {
  const { notify } = useAdmin();
  const [items, setItems] = useState<Category[] | null>(null);
  const [editing, setEditing] = useState<{ id?: string; data: CategoryInput } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => adminApi.categories().then((r) => setItems(r.items)).catch((e) => notify(e.message, 'error'));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = (c?: Category) =>
    setEditing(c ? { id: c._id, data: { name: c.name, description: c.description, image: c.image, order: c.order, visible: c.visible } } : { data: { ...EMPTY, order: items?.length ?? 0 } });

  const setField = <K extends keyof CategoryInput>(k: K, v: CategoryInput[K]) =>
    setEditing((e) => (e ? { ...e, data: { ...e.data, [k]: v } } : e));

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) await adminApi.updateCategory(editing.id, editing.data);
      else await adminApi.createCategory(editing.data);
      notify('Catégorie enregistrée ✓');
      setEditing(null);
      load();
    } catch (err) {
      notify((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: Category) {
    const msg = c.productCount
      ? `Supprimer « ${c.name} » ? Ses ${c.productCount} article(s) resteront en ligne, sans catégorie.`
      : `Supprimer « ${c.name} » ?`;
    if (!window.confirm(msg)) return;
    try {
      await adminApi.deleteCategory(c._id);
      notify('Catégorie supprimée');
      load();
    } catch (err) {
      notify((err as Error).message, 'error');
    }
  }

  return (
    <>
      <div className="adm-top">
        <div>
          <h1>Catégories</h1>
          <p className="sub">Organisez votre vitrine : robes, ensembles, boubous, accessoires…</p>
        </div>
        <button className="a-btn" onClick={() => open()}><PlusI /> Nouvelle catégorie</button>
      </div>

      {!items ? (
        <div className="center-load"><span className="spinner" /></div>
      ) : !items.length ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: 'var(--muted)' }}>Aucune catégorie pour le moment.</p>
          <button className="a-btn" onClick={() => open()}><PlusI /> Créer ma première catégorie</button>
        </div>
      ) : (
        <div className="list">
          {items.map((c) => (
            <div key={c._id} className="row">
              <button type="button" className="thumb" style={{ border: 0, padding: 0, cursor: 'pointer' }} onClick={() => open(c)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.image ? <img src={thumb(c.image.url, 160)} alt="" /> : 'Photo'}
              </button>
              <div>
                <span className="name">{c.name}</span>
                <div className="meta">
                  <span>{c.productCount ?? 0} article{(c.productCount ?? 0) > 1 ? 's' : ''}</span>
                  <span className={`pill ${c.visible ? 'ok' : 'off'}`}>{c.visible ? 'Visible' : 'Masquée'}</span>
                  <span>· ordre {c.order}</span>
                </div>
              </div>
              <div className="actions">
                <button className="a-btn ghost sm" onClick={() => open(c)}><EditI /> Modifier</button>
                <button className="a-btn danger sm" onClick={() => remove(c)} aria-label="Supprimer"><TrashI /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="modal-back" onClick={() => !saving && setEditing(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <h2>{editing.id ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
            <div className="field">
              <label htmlFor="cname">Nom *</label>
              <input id="cname" className="input" required autoFocus value={editing.data.name} onChange={(e) => setField('name', e.target.value)} placeholder="Ex : Robes de soirée" />
            </div>
            <div className="field">
              <label htmlFor="cdesc">Description</label>
              <textarea id="cdesc" className="textarea" style={{ minHeight: 90 }} value={editing.data.description} onChange={(e) => setField('description', e.target.value)} placeholder="Quelques mots affichés en haut de la page de la catégorie" />
            </div>
            <div className="field">
              <span className="label">Photo de la catégorie</span>
              <div style={{ maxWidth: 180 }}>
                <ImageUploader max={1} folder="categories" value={editing.data.image ? [editing.data.image] : []} onChange={(v) => setField('image', v[0] || null)} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="corder">Ordre d&apos;affichage</label>
              <input id="corder" className="input" type="number" value={editing.data.order} onChange={(e) => setField('order', Number(e.target.value) || 0)} />
            </div>
            <Toggle label="Visible sur le site" checked={editing.data.visible} onChange={(v) => setField('visible', v)} />
            <div className="modal-actions">
              <button type="button" className="a-btn ghost" onClick={() => setEditing(null)} disabled={saving}>Annuler</button>
              <button className="a-btn" disabled={saving}>{saving ? <span className="spinner" /> : 'Enregistrer'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
