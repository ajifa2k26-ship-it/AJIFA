'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { adminApi, tokenStore } from '@/lib/admin-api';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(params.get('expired') ? 'Votre session a expiré, veuillez vous reconnecter.' : '');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await adminApi.login(email, password);
      tokenStore.set(token);
      router.replace('/admin');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <form className="card" onSubmit={submit}>
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="AJIFA" />
          <span className="eyebrow" style={{ color: 'var(--muted)' }}>Administration</span>
        </div>
        {error && <div className="alert error">{error}</div>}
        <div className="field">
          <label htmlFor="email">Adresse e-mail</label>
          <input id="email" className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">Mot de passe</label>
          <input id="password" className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="a-btn" style={{ width: '100%', marginTop: 6 }} disabled={loading}>
          {loading ? <span className="spinner" /> : 'Se connecter'}
        </button>
        {loading && (
          <p style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'center', marginTop: 12 }}>
            Le serveur peut mettre jusqu&apos;à 30 secondes à se réveiller…
          </p>
        )}
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
