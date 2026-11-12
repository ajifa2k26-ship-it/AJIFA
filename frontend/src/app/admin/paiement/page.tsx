'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { adminApi, type PaymentInput } from '@/lib/admin-api';
import type { ImageAsset, Settings } from '@/lib/types';
import { formatPrice } from '@/lib/site';
import { PAYMENT_LABELS, formatPhone, isValidPhone } from '@/lib/shop';
import { useAdmin } from '@/components/admin/AdminShell';
import { ImageUploader, Toggle } from '@/components/admin/fields';
import { LockI } from '@/components/admin/AdminIcons';

type MobileKey = 'orangeMoneyNumber' | 'waveNumber' | 'freeMoneyNumber';
type QrKey = 'orangeMoneyQr' | 'waveQr' | 'freeMoneyQr';
const QR_KEY: Record<MobileKey, QrKey> = { orangeMoneyNumber: 'orangeMoneyQr', waveNumber: 'waveQr', freeMoneyNumber: 'freeMoneyQr' };
const MOBILE: { key: MobileKey; method: 'orange_money' | 'wave' | 'free_money'; logo: string; hint: string }[] = [
  { key: 'orangeMoneyNumber', method: 'orange_money', logo: 'OM', hint: 'Numéro Orange Money qui reçoit les paiements' },
  { key: 'waveNumber', method: 'wave', logo: 'W', hint: 'Numéro Wave qui reçoit les paiements' },
  { key: 'freeMoneyNumber', method: 'free_money', logo: 'FM', hint: 'Numéro Free Money / Mixx qui reçoit les paiements' },
];

type Form = {
  codEnabled: boolean;
  enabled: Record<MobileKey, boolean>;
  numbers: Record<MobileKey, string>;
  qr: Record<MobileKey, ImageAsset | null>;
  waveLink: string;
  origins: string;
};

const toForm = (s: Settings): Form => ({
  codEnabled: s.codEnabled !== false,
  enabled: {
    orangeMoneyNumber: !!s.orangeMoneyNumber || !!s.orangeMoneyQr,
    waveNumber: !!s.waveNumber || !!s.waveLink || !!s.waveQr,
    freeMoneyNumber: !!s.freeMoneyNumber || !!s.freeMoneyQr,
  },
  qr: { orangeMoneyNumber: s.orangeMoneyQr || null, waveNumber: s.waveQr || null, freeMoneyNumber: s.freeMoneyQr || null },
  numbers: {
    orangeMoneyNumber: s.orangeMoneyNumber ? formatPhone(s.orangeMoneyNumber) : '',
    waveNumber: s.waveNumber ? formatPhone(s.waveNumber) : '',
    freeMoneyNumber: s.freeMoneyNumber ? formatPhone(s.freeMoneyNumber) : '',
  },
  waveLink: s.waveLink || '',
  origins: (s.allowedOrigins || []).join('\n'),
});

export default function PaymentPage() {
  const { notify } = useAdmin();
  const [s, setS] = useState<Settings | null>(null);
  const [f, setF] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Partial<Record<MobileKey | 'waveLink' | 'none', string>>>({});
  const [askPwd, setAskPwd] = useState(false);
  const [pwd, setPwd] = useState('');
  const [saving, setSaving] = useState(false);
  const [delivery, setDelivery] = useState<Pick<Settings, 'deliveryFeeDakar' | 'deliveryFeeRegions' | 'freeDeliveryFrom' | 'deliveryInfo'> | null>(null);
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [here, setHere] = useState('');

  useEffect(() => {
    setHere(window.location.origin);
    adminApi
      .settings()
      .then(({ settings }) => {
        setS(settings);
        setF(toForm(settings));
        setDelivery({
          deliveryFeeDakar: settings.deliveryFeeDakar,
          deliveryFeeRegions: settings.deliveryFeeRegions,
          freeDeliveryFrom: settings.freeDeliveryFrom,
          deliveryInfo: settings.deliveryInfo,
        });
      })
      .catch((e) => notify(e.message, 'error'));
  }, [notify]);

  if (!s || !f || !delivery) return <div className="center-load"><span className="spinner" /></div>;

  const upd = (patch: Partial<Form>) => setF((x) => (x ? { ...x, ...patch } : x));
  const active = [
    ...(f.codEnabled ? ['cash' as const] : []),
    ...MOBILE.filter((m) => f.enabled[m.key]).map((m) => m.method),
  ];

  // Vérifie le formulaire avant de demander le mot de passe
  function review(e: FormEvent) {
    e.preventDefault();
    if (!f) return;
    const errs: typeof errors = {};
    for (const m of MOBILE) {
      if (!f.enabled[m.key]) continue;
      const v = f.numbers[m.key];
      if (m.key === 'waveNumber' && !v && f.waveLink) continue; // Wave possible avec le lien seul
      if (!v && f.qr[m.key]) continue; // possible avec le QR code seul
      if (!isValidPhone(v) || v.replace(/\D/g, '').replace(/^221/, '').length !== 9) errs[m.key] = 'Numéro sénégalais à 9 chiffres (ex : 77 123 45 67)';
    }
    if (f.enabled.waveNumber && f.waveLink && !/^https:\/\/pay\.wave\.com\//.test(f.waveLink.trim())) {
      errs.waveLink = 'Le lien doit commencer par https://pay.wave.com/';
    }
    if (!active.length) errs.none = 'Activez au moins un moyen de paiement, sinon personne ne pourra commander.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setPwd('');
    setAskPwd(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!f) return;
    setSaving(true);
    const data: PaymentInput = {
      codEnabled: f.codEnabled,
      orangeMoneyNumber: f.enabled.orangeMoneyNumber ? f.numbers.orangeMoneyNumber : '',
      waveNumber: f.enabled.waveNumber ? f.numbers.waveNumber : '',
      waveLink: f.enabled.waveNumber ? f.waveLink.trim() : '',
      freeMoneyNumber: f.enabled.freeMoneyNumber ? f.numbers.freeMoneyNumber : '',
      orangeMoneyQr: f.enabled.orangeMoneyNumber ? f.qr.orangeMoneyNumber : null,
      waveQr: f.enabled.waveNumber ? f.qr.waveNumber : null,
      freeMoneyQr: f.enabled.freeMoneyNumber ? f.qr.freeMoneyNumber : null,
      allowedOrigins: f.origins.split(/[\s,]+/).filter(Boolean),
    };
    try {
      const { settings } = await adminApi.updatePayment({ ...data, currentPassword: pwd });
      setS(settings);
      setF(toForm(settings));
      setAskPwd(false);
      notify('Moyens de paiement enregistrés ✓');
    } catch (err) {
      notify((err as Error).message, 'error');
    } finally {
      setSaving(false);
      setPwd('');
    }
  }

  async function saveDelivery(e: FormEvent) {
    e.preventDefault();
    if (!delivery) return;
    setSavingDelivery(true);
    try {
      const { settings } = await adminApi.updateSettings(delivery);
      setS(settings);
      notify('Livraison enregistrée ✓');
    } catch (err) {
      notify((err as Error).message, 'error');
    } finally {
      setSavingDelivery(false);
    }
  }

  const fee = (k: 'deliveryFeeDakar' | 'deliveryFeeRegions' | 'freeDeliveryFrom', label: string, hint: string) => (
    <div className="field">
      <label htmlFor={k}>{label}</label>
      <div className="input-group">
        <input id={k} className="input" type="number" inputMode="numeric" min={0} step={100} value={delivery[k]} onChange={(e) => setDelivery({ ...delivery, [k]: Math.max(0, Number(e.target.value) || 0) })} />
        <span className="suffix">FCFA</span>
      </div>
      <small>{hint}</small>
    </div>
  );

  const originsList = f.origins.split(/[\s,]+/).filter(Boolean);

  return (
    <>
      <div className="adm-top">
        <div>
          <h1>Paiement & livraison</h1>
          <p className="sub">Choisissez comment vos clientes paient et combien coûte la livraison.</p>
        </div>
      </div>

      <form className="card" onSubmit={review}>
        <h2><LockI width={18} style={{ verticalAlign: -3, marginRight: 6 }} />Moyens de paiement</h2>
        <p className="hint">
          Pour votre sécurité, votre mot de passe est demandé à chaque modification : personne ne peut changer le numéro
          qui reçoit l&apos;argent sans le connaître.
          {s.paymentUpdatedAt && <> Dernière modification : {new Date(s.paymentUpdatedAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}.</>}
        </p>

        <div className="pay-admin">
          <div className="pay-admin-row">
            <span className="pay-badge pay-cash">CFA</span>
            <div className="pay-admin-body">
              <Toggle label={PAYMENT_LABELS.cash} hint="La cliente paie en espèces à la réception du colis." checked={f.codEnabled} onChange={(v) => upd({ codEnabled: v })} />
            </div>
          </div>

          {MOBILE.map((m) => (
            <div key={m.key} className="pay-admin-row">
              <span className={`pay-badge pay-${m.method}`}>{m.logo}</span>
              <div className="pay-admin-body">
                <Toggle
                  label={PAYMENT_LABELS[m.method]}
                  hint={f.enabled[m.key] ? undefined : 'Désactivé : non proposé aux clientes.'}
                  checked={f.enabled[m.key]}
                  onChange={(v) => upd({ enabled: { ...f.enabled, [m.key]: v } })}
                />
                {f.enabled[m.key] && (
                  <div className="grid-2" style={{ marginTop: 10 }}>
                    <div className="field">
                      <label htmlFor={m.key}>Numéro</label>
                      <input
                        id={m.key}
                        className="input"
                        type="tel"
                        inputMode="tel"
                        placeholder="77 123 45 67"
                        value={f.numbers[m.key]}
                        onChange={(e) => {
                          upd({ numbers: { ...f.numbers, [m.key]: e.target.value } });
                          setErrors((x) => ({ ...x, [m.key]: undefined }));
                        }}
                      />
                      {errors[m.key] ? <small className="err">{errors[m.key]}</small> : <small>{m.hint}</small>}
                    </div>
                    {m.key === 'waveNumber' && (
                      <div className="field">
                        <label htmlFor="waveLink">Lien de paiement Wave (optionnel)</label>
                        <input
                          id="waveLink"
                          className="input"
                          type="url"
                          placeholder="https://pay.wave.com/m/…"
                          value={f.waveLink}
                          onChange={(e) => {
                            upd({ waveLink: e.target.value });
                            setErrors((x) => ({ ...x, waveLink: undefined }));
                          }}
                        />
                        {errors.waveLink ? (
                          <small className="err">{errors.waveLink}</small>
                        ) : (
                          <small>Lien marchand Wave Business : la cliente paie en un clic, montant pré-rempli.</small>
                        )}
                      </div>
                    )}
                    <div className="field">
                      <span className="label">QR code de paiement (optionnel)</span>
                      <div className="pay-qr-up">
                        <ImageUploader
                          max={1}
                          folder="paiement"
                          value={f.qr[m.key] ? [f.qr[m.key] as ImageAsset] : []}
                          onChange={(v) => upd({ qr: { ...f.qr, [m.key]: v[0] || null } })}
                        />
                      </div>
                      <small>Photo ou capture nette de votre QR code marchand {PAYMENT_LABELS[m.method]}. La cliente le scanne pour payer.</small>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pay-preview">
          <strong>Ce que voient vos clientes :</strong>{' '}
          {active.length ? active.map((m) => PAYMENT_LABELS[m]).join(' · ') : <span className="err">aucun moyen de paiement</span>}
        </div>
        {errors.none && <div className="alert error" style={{ marginTop: 12 }}>{errors.none}</div>}

        <details className="adv">
          <summary>Avancé : adresses du site ({originsList.length || 'aucune'} ajoutée{originsList.length > 1 ? 's' : ''})</summary>
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="origins">Adresses supplémentaires autorisées à passer des commandes</label>
            <textarea id="origins" className="textarea" rows={3} placeholder={'https://ajifa.sn\nhttps://www.ajifa.sn'} value={f.origins} onChange={(e) => upd({ origins: e.target.value })} />
            <small>
              À remplir le jour où vous achetez un nom de domaine (une adresse par ligne). Inutile pour l&apos;adresse
              actuelle{here && <> ({here})</>}, déjà autorisée.
            </small>
          </div>
        </details>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="a-btn"><LockI /> Enregistrer les paiements</button>
        </div>
      </form>

      <form className="card" onSubmit={saveDelivery}>
        <h2>Livraison</h2>
        <div className="grid-2">
          {fee('deliveryFeeDakar', 'Frais Dakar et banlieue', 'Dakar, Pikine, Guédiawaye, Rufisque, Keur Massar…')}
          {fee('deliveryFeeRegions', 'Frais régions', 'Toutes les autres villes du Sénégal')}
          {fee('freeDeliveryFrom', 'Livraison offerte dès', '0 = jamais offerte')}
        </div>
        <div className="field">
          <label htmlFor="deliveryInfo">Informations de livraison</label>
          <textarea id="deliveryInfo" className="textarea" value={delivery.deliveryInfo} onChange={(e) => setDelivery({ ...delivery, deliveryInfo: e.target.value })} />
          <small>Affiché sur les fiches produit et la page de commande.</small>
        </div>
        <p className="hint" style={{ marginBottom: 12 }}>
          Exemple : un panier de 25 000 FCFA livré à Thiès coûtera{' '}
          {formatPrice(25000 + (delivery.freeDeliveryFrom > 0 && 25000 >= delivery.freeDeliveryFrom ? 0 : delivery.deliveryFeeRegions))}.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="a-btn ghost" disabled={savingDelivery}>{savingDelivery ? <span className="spinner" /> : 'Enregistrer la livraison'}</button>
        </div>
      </form>

      {askPwd && (
        <div className="modal-back" onClick={() => !saving && setAskPwd(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <h2>Confirmez avec votre mot de passe</h2>
            <p className="hint">Ces numéros reçoivent l&apos;argent de vos clientes. Saisissez votre mot de passe d&apos;administration pour valider.</p>
            <div className="field">
              <label htmlFor="cpwd">Mot de passe</label>
              <input id="cpwd" className="input" type="password" autoComplete="current-password" autoFocus required value={pwd} onChange={(e) => setPwd(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button type="button" className="a-btn ghost" disabled={saving} onClick={() => setAskPwd(false)}>Annuler</button>
              <button className="a-btn" disabled={saving || !pwd}>{saving ? <span className="spinner" /> : 'Confirmer'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
