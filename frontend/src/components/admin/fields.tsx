'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import { adminApi } from '@/lib/admin-api';
import type { ImageAsset } from '@/lib/types';
import { useAdmin } from './AdminShell';
import { ImageI, LeftI, RightI, StarI, TrashI } from './AdminIcons';

export const thumb = (url: string, w = 300) =>
  url.includes('res.cloudinary.com') ? url.replace('/upload/', `/upload/w_${w},f_auto,q_auto/`) : url;

/* ---------- Interrupteur ---------- */
export function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="switch-row">
      <span className="t">
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <input type="checkbox" className="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

/* ---------- Saisie d'étiquettes (tailles, couleurs) ---------- */
export function TagInput({ value, onChange, placeholder, presets = [] }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; presets?: string[] }) {
  const [text, setText] = useState('');
  const add = (raw: string) => {
    const items = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (!items.length) return;
    onChange([...new Set([...value, ...items])]);
    setText('');
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(text);
    } else if (e.key === 'Backspace' && !text && value.length) {
      onChange(value.slice(0, -1));
    }
  };
  const missing = presets.filter((p) => !value.includes(p));
  return (
    <>
      <div className="tags">
        {value.map((t) => (
          <span key={t} className="tag">
            {t}
            <button type="button" aria-label={`Retirer ${t}`} onClick={() => onChange(value.filter((v) => v !== t))}>×</button>
          </span>
        ))}
        <input value={text} placeholder={value.length ? '' : placeholder} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} onBlur={() => add(text)} enterKeyHint="done" />
      </div>
      {missing.length > 0 && (
        <div className="presets">
          {missing.map((p) => (
            <button key={p} type="button" onClick={() => onChange([...value, p])}>+ {p}</button>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------- Envoi de photos ---------- */
type UploaderProps = {
  value: ImageAsset[];
  onChange: (v: ImageAsset[]) => void;
  max?: number;
  folder?: 'produits' | 'categories' | 'site';
  wide?: boolean;
};

export function ImageUploader({ value, onChange, max = 12, folder = 'produits', wide = false }: UploaderProps) {
  const { notify } = useAdmin();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [drag, setDrag] = useState(false);

  async function handle(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, Math.max(0, max - value.length));
    if (!list.length) return notify(`${max} photo${max > 1 ? 's' : ''} maximum`, 'error');
    setBusy(list.length);
    try {
      const uploaded = await adminApi.upload(list, folder);
      onChange(max === 1 ? uploaded.slice(0, 1) : [...value, ...uploaded]);
    } catch (e) {
      notify((e as Error).message, 'error');
    } finally {
      setBusy(0);
      if (input.current) input.current.value = '';
    }
  }

  const move = (i: number, d: number) => {
    const next = [...value];
    const [it] = next.splice(i, 1);
    next.splice(i + d, 0, it);
    onChange(next);
  };

  return (
    <div className="uploader" style={wide ? { gridTemplateColumns: '1fr' } : undefined}>
      {value.map((img, i) => (
        <div key={img.publicId || img.url} className={`up-item${wide ? ' wide' : ''}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb(img.url, wide ? 900 : 360)} alt="" />
          {i === 0 && max > 1 && <span className="cover">Couverture</span>}
          <div className="tools">
            {max > 1 ? (
              <span style={{ display: 'flex', gap: 4 }}>
                <button type="button" aria-label="Déplacer à gauche" disabled={i === 0} onClick={() => move(i, -1)}><LeftI /></button>
                {i !== 0 && <button type="button" aria-label="Mettre en couverture" onClick={() => move(i, -i)}><StarI /></button>}
                <button type="button" aria-label="Déplacer à droite" disabled={i === value.length - 1} onClick={() => move(i, 1)}><RightI /></button>
              </span>
            ) : <span />}
            <button type="button" aria-label="Retirer la photo" onClick={() => onChange(value.filter((_, j) => j !== i))}><TrashI /></button>
          </div>
        </div>
      ))}

      {value.length < max && (
        <label
          className={`up-add${drag ? ' drag' : ''}${wide ? ' wide' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}
        >
          {busy ? (
            <>
              <span className="spinner" style={{ color: 'var(--burgundy)' }} />
              Envoi de {busy} photo{busy > 1 ? 's' : ''}…
            </>
          ) : (
            <>
              <ImageI />
              {max === 1 ? (value.length ? 'Remplacer' : 'Ajouter une photo') : 'Ajouter des photos'}
            </>
          )}
          <input ref={input} type="file" accept="image/*" multiple={max > 1} hidden disabled={!!busy} onChange={(e) => handle(e.target.files)} />
        </label>
      )}
    </div>
  );
}
