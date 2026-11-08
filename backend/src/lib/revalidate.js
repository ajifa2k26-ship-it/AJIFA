import { config } from '../config.js';

// Demande au site (Vercel) de régénérer ses pages après une modification dans l'admin.
// Silencieux en cas d'échec : le site se régénère de toute façon périodiquement.
export function triggerRevalidate() {
  const { revalidateUrl, revalidateSecret } = config.frontend;
  if (!revalidateUrl || !revalidateSecret) return;
  fetch(revalidateUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': revalidateSecret },
    body: JSON.stringify({ all: true }),
    signal: AbortSignal.timeout(8000),
  }).catch((e) => console.warn('Revalidation du site échouée :', e.message));
}
