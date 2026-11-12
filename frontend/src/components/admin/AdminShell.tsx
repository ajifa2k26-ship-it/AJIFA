'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { adminApi, tokenStore, type AdminUser } from '@/lib/admin-api';
import { BagI, DressI, ExternalI, FolderI, GearI, HomeI, LogoutI, PlusI } from './AdminIcons';

type Toast = { message: string; type: 'ok' | 'error' } | null;
type Ctx = { user: AdminUser | null; notify: (message: string, type?: 'ok' | 'error') => void; logout: () => void };

const AdminContext = createContext<Ctx>({ user: null, notify: () => {}, logout: () => {} });
export const useAdmin = () => useContext(AdminContext);

const NAV = [
  { href: '/admin', label: 'Accueil', icon: HomeI, exact: true },
  { href: '/admin/commandes', label: 'Commandes', icon: BagI },
  { href: '/admin/produits', label: 'Articles', icon: DressI },
  { href: '/admin/produits/nouveau', label: 'Ajouter', icon: PlusI, mobileOnly: true },
  { href: '/admin/categories', label: 'Catégories', icon: FolderI },
  { href: '/admin/parametres', label: 'Réglages', icon: GearI },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname.startsWith('/admin/login');
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(!isLogin);
  const [toast, setToast] = useState<Toast>(null);

  const notify = useCallback((message: string, type: 'ok' | 'error' = 'ok') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), type === 'error' ? 5000 : 2800);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    router.replace('/admin/login');
  }, [router]);

  useEffect(() => {
    if (isLogin) {
      setChecking(false);
      return;
    }
    if (!tokenStore.get()) {
      router.replace('/admin/login');
      return;
    }
    if (user) return;
    setChecking(true);
    adminApi
      .me()
      .then(({ user: u }) => setUser(u))
      .catch(() => router.replace('/admin/login'))
      .finally(() => setChecking(false));
  }, [isLogin, router, user]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || (pathname.startsWith(`${href}/`) && !pathname.endsWith('/nouveau'));

  const toastEl = toast && <div className={`toast${toast.type === 'error' ? ' error' : ''}`} role="status">{toast.message}</div>;

  if (isLogin) {
    return (
      <AdminContext.Provider value={{ user, notify, logout }}>
        {children}
        {toastEl}
      </AdminContext.Provider>
    );
  }

  if (checking || !user) {
    return (
      <div className="center-load">
        <span className="spinner" />
      </div>
    );
  }

  return (
    <AdminContext.Provider value={{ user, notify, logout }}>
      <div className="adm">
        <aside className="adm-side">
          <Link href="/admin" className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="AJIFA" />
            <span>Administration</span>
          </Link>
          <nav className="adm-nav">
            {NAV.filter((n) => !n.mobileOnly).map(({ href, label, icon: Icon, exact }) => (
              <Link key={href} href={href} aria-current={isActive(href, exact) ? 'page' : undefined}>
                <Icon /> {label}
              </Link>
            ))}
          </nav>
          <Link href="/admin/produits/nouveau" className="a-btn">
            <PlusI /> Nouvel article
          </Link>
          <div className="adm-side-foot">
            <a href="/" target="_blank" rel="noopener">
              <ExternalI width={15} style={{ verticalAlign: -2, marginRight: 8 }} />Voir le site
            </a>
            <button onClick={logout}>
              <LogoutI width={15} style={{ verticalAlign: -2, marginRight: 8 }} />Se déconnecter
            </button>
            <span style={{ padding: '6px 14px', color: 'var(--muted)', fontSize: 12 }}>{user.email}</span>
          </div>
        </aside>

        <main className="adm-main">{children}</main>

        <nav className="adm-tabbar" aria-label="Navigation administration">
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <Link key={href} href={href} aria-current={(href.endsWith('/nouveau') ? pathname === href : isActive(href, exact)) ? 'page' : undefined}>
              <Icon /> {label}
            </Link>
          ))}
        </nav>
      </div>
      {toastEl}
    </AdminContext.Provider>
  );
}
