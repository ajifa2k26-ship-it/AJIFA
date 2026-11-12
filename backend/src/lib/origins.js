import { config } from '../config.js';

// Adresses du site autorisées à appeler l'API depuis le navigateur.
// = CORS_ORIGINS (Render) + celles ajoutées dans l'administration, gardées en mémoire.
let extra = new Set();

export function setExtraOrigins(list = []) {
  extra = new Set(list);
}

export function isAllowedOrigin(origin) {
  return config.corsOrigins.includes(origin) || extra.has(origin);
}

/** Normalise une adresse saisie (« ajifa.sn/ » → « https://ajifa.sn »). Renvoie null si invalide. */
export function normalizeOrigin(raw) {
  let v = String(raw || '').trim();
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  try {
    const u = new URL(v);
    const local = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    if (u.protocol !== 'https:' && !local) return null;
    if (!u.hostname.includes('.') && !local) return null;
    return u.origin;
  } catch {
    return null;
  }
}
