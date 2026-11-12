'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { adminApi } from '@/lib/admin-api';
import type { Settings } from '@/lib/types';
import { useAdmin } from '@/components/admin/AdminShell';
import { ImageUploader } from '@/components/admin/fields';

type TextKey = { [K in keyof Settings]-?: Settings[K] extends string ? K : never }[keyof Settings];

export default function SettingsPage() {
  const { notify } = useAdmin();
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    adminApi.settings().then((r) => setS(r.settings)).catch((e) => notify(e.message, 'error'));
  }, [notify]);

  if (!s) return <div className="center-load"><span className="spinner" /></div>;

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((x) => (x ? { ...x, [k]: v } : x));
  const text = (k: TextKey, label: string, opts: { area?: boolean; placeholder?: string; hint?: string; type?: string } = {}) => (
    <div className="field">
      <label htmlFor={k}>{label}</label>
      {opts.area ? (
        <textarea id={k} className="textarea" value={s[k] as string} placeholder={opts.placeholder} onChange={(e) => set(k, e.target.value)} />
      ) : (
        <input id={k} className="input" type={opts.type || 'text'} value={s[k] as string} placeholder={opts.placeholder} onChange={(e) => set(k, e.target.value)} />
      )}
      {opts.hint && <small>{opts.hint}</small>}
    </div>
  );

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!s) return;
    setSaving(true);
    try {
      const { settings } = await adminApi.updateSettings(s);
      setS(settings);
      notify('Réglages enregistrés ✓');
    } catch (err) {
      notify((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) return notify('Les deux mots de passe ne correspondent pas', 'error');
    setPwdSaving(true);
    try {
      await adminApi.changePassword(pwd.current, pwd.next);
      setPwd({ current: '', next: '', confirm: '' });
      notify('Mot de passe modifié ✓');
    } catch (err) {
      notify((err as Error).message, 'error');
    } finally {
      setPwdSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={save}>
        <div className="adm-top">
          <div>
            <h1>Réglages du site</h1>
            <p className="sub">Textes, photos et coordonnées affichés sur la vitrine.</p>
          </div>
        </div>

        <div className="card">
          <h2>Contact & commandes</h2>
          <p className="hint">Le numéro WhatsApp est utilisé pour le bouton « Commander sur WhatsApp ».</p>
          <div className="grid-2">
            {text('whatsapp', 'Numéro WhatsApp', { placeholder: '221 77 123 45 67', hint: 'Avec l’indicatif 221, sans le +', type: 'tel' })}
            {text('phone', 'Téléphone affiché', { placeholder: '+221 77 123 45 67', type: 'tel' })}
            {text('email', 'E-mail', { type: 'email', placeholder: 'contact@ajifa.sn' })}
            {text('address', 'Adresse', { placeholder: 'Dakar, Sénégal' })}
          </div>
          {text('openingHours', 'Horaires', { area: true, placeholder: 'Lundi – Samedi : 10h – 20h\nDimanche : sur rendez-vous' })}
        </div>

        <div className="card">
          <h2>Paiement & livraison</h2>
          <p className="hint" style={{ marginBottom: 12 }}>Numéros Orange Money / Wave, paiement à la livraison et frais de livraison se règlent sur une page dédiée, protégée par votre mot de passe.</p>
          <Link href="/admin/paiement" className="a-btn ghost sm">Gérer le paiement et la livraison</Link>
        </div>

        <div className="card">
          <h2>Réseaux sociaux</h2>
          <div className="grid-2">
            {text('instagram', 'Instagram (lien)', { placeholder: 'https://instagram.com/ajifa', type: 'url' })}
            {text('facebook', 'Facebook (lien)', { placeholder: 'https://facebook.com/ajifa', type: 'url' })}
            {text('tiktok', 'TikTok (lien)', { placeholder: 'https://tiktok.com/@ajifa', type: 'url' })}
          </div>
        </div>

        <div className="card">
          <h2>Page d&apos;accueil</h2>
          {text('announcement', 'Bandeau d’annonce (optionnel)', { placeholder: 'Nouvelle collection Tabaski disponible', hint: 'Affiché tout en haut du site. Laissez vide pour le masquer.' })}
          {text('tagline', 'Signature', { placeholder: 'Élégance & savoir-faire' })}
          {text('heroTitle', 'Grand titre')}
          {text('heroSubtitle', 'Sous-titre', { area: true })}
          <div className="field">
            <span className="label">Grande photo d&apos;accueil</span>
            <small style={{ marginTop: -2 }}>Format paysage, haute qualité. Sans photo, le logo est affiché sur fond ivoire.</small>
            <ImageUploader wide max={1} folder="site" value={s.heroImage ? [s.heroImage] : []} onChange={(v) => set('heroImage', v[0] || null)} />
          </div>
        </div>

        <div className="card">
          <h2>La maison (à propos)</h2>
          {text('aboutTitle', 'Titre')}
          {text('aboutText', 'Texte', { area: true })}
          <div className="field" style={{ maxWidth: 220 }}>
            <span className="label">Photo</span>
            <ImageUploader max={1} folder="site" value={s.aboutImage ? [s.aboutImage] : []} onChange={(v) => set('aboutImage', v[0] || null)} />
          </div>
        </div>

        <div className="card">
          <h2>Référencement Google</h2>
          {text('seoDescription', 'Description du site', { area: true, hint: 'Environ 150 caractères. Apparaît sous le nom du site dans les résultats Google.' })}
        </div>

        <div className="save-bar">
          <button className="a-btn" disabled={saving}>{saving ? <span className="spinner" /> : 'Enregistrer les réglages'}</button>
        </div>
      </form>

      <form className="card" onSubmit={changePassword} style={{ marginTop: 8 }}>
        <h2>Mot de passe</h2>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="pc">Mot de passe actuel</label>
            <input id="pc" className="input" type="password" autoComplete="current-password" required value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} />
          </div>
          <div />
          <div className="field">
            <label htmlFor="pn">Nouveau mot de passe</label>
            <input id="pn" className="input" type="password" autoComplete="new-password" minLength={8} required value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} />
            <small>8 caractères minimum.</small>
          </div>
          <div className="field">
            <label htmlFor="pk">Confirmer</label>
            <input id="pk" className="input" type="password" autoComplete="new-password" minLength={8} required value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
          </div>
        </div>
        <button className="a-btn ghost" disabled={pwdSaving}>{pwdSaving ? <span className="spinner" /> : 'Changer le mot de passe'}</button>
      </form>
    </>
  );
}
