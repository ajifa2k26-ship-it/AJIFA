// Enveloppe les handlers async pour transmettre les erreurs à Express
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors)[0];
    return res.status(400).json({ error: first?.message || 'Données invalides' });
  }
  if (err.name === 'CastError') return res.status(400).json({ error: 'Identifiant invalide' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Image trop lourde (10 Mo maximum)' });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  return res.status(status).json({ error: status >= 500 ? 'Erreur serveur' : err.message });
}
