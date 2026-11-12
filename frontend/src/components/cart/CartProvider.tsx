'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
};

type CartCtx = {
  items: CartItem[];
  ready: boolean; // false tant que le panier n'est pas relu depuis l'appareil
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

export const MAX_QTY = 20;
const STORAGE_KEY = 'ajifa_cart_v1';
export const lineKey = (i: Pick<CartItem, 'productId' | 'size' | 'color'>) => `${i.productId}|${i.size}|${i.color}`;

const CartContext = createContext<CartCtx | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé dans <CartProvider>');
  return ctx;
}

function read(): CartItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((i) => i && i.productId && i.quantity > 0) : [];
  } catch {
    return [];
  }
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Relit le panier enregistré sur l'appareil, et le synchronise entre les onglets
  useEffect(() => {
    setItems(read());
    setReady(true);
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && setItems(read());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = useCallback((updater: (prev: CartItem[]) => CartItem[]) => {
    setItems((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* stockage indisponible : le panier reste en mémoire */
      }
      return next;
    });
  }, []);

  const add = useCallback<CartCtx['add']>(
    (item, quantity = 1) =>
      persist((prev) => {
        const key = lineKey(item);
        const existing = prev.find((i) => lineKey(i) === key);
        if (existing) {
          return prev.map((i) => (lineKey(i) === key ? { ...i, ...item, quantity: Math.min(i.quantity + quantity, MAX_QTY) } : i));
        }
        return [...prev, { ...item, quantity: Math.min(quantity, MAX_QTY) }];
      }),
    [persist],
  );

  const setQuantity = useCallback<CartCtx['setQuantity']>(
    (key, quantity) =>
      persist((prev) =>
        quantity < 1 ? prev.filter((i) => lineKey(i) !== key) : prev.map((i) => (lineKey(i) === key ? { ...i, quantity: Math.min(quantity, MAX_QTY) } : i)),
      ),
    [persist],
  );

  const remove = useCallback((key: string) => persist((prev) => prev.filter((i) => lineKey(i) !== key)), [persist]);
  const clear = useCallback(() => persist(() => []), [persist]);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      ready,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [items, ready, add, setQuantity, remove, clear, drawerOpen],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
