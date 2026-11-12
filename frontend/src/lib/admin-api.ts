'use client';

import { API_URL } from './site';
import type { Category, ImageAsset, Order, OrderStatus, PaymentStatus, Product, Settings } from './types';

const TOKEN_KEY = 'ajifa_admin_token';

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* stockage indisponible */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* stockage indisponible */
    }
  },
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Serveur injoignable. Vérifiez votre connexion (le serveur peut mettre ~30 s à se réveiller).');
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/api/auth/login') {
    tokenStore.clear();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin/login')) {
      window.location.href = '/admin/login?expired=1';
    }
  }
  if (!res.ok) throw new ApiError(res.status, data.error || `Erreur ${res.status}`);
  return data as T;
}

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body ? JSON.stringify(body) : undefined });

// Demande au site public de se mettre à jour immédiatement
export async function refreshSite() {
  const token = tokenStore.get();
  if (!token) return;
  try {
    await fetch('/api/revalidate', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  } catch {
    /* le site se mettra à jour tout seul dans quelques minutes */
  }
}

async function mutate<T>(path: string, init: RequestInit): Promise<T> {
  const data = await request<T>(path, init);
  refreshSite();
  return data;
}

export type AdminUser = { _id: string; email: string; name: string };

export const adminApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: AdminUser }>('/api/auth/login', json('POST', { email, password })),
  me: () => request<{ user: AdminUser }>('/api/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: true }>('/api/auth/password', json('PUT', { currentPassword, newPassword })),

  products: () => request<{ items: Product[] }>('/api/products/admin/all'),
  product: (id: string) => request<{ item: Product & { category: string | null } }>(`/api/products/admin/${id}`),
  createProduct: (data: Partial<ProductInput>) => mutate<{ item: Product }>('/api/products', json('POST', data)),
  updateProduct: (id: string, data: Partial<ProductInput>) => mutate<{ item: Product }>(`/api/products/${id}`, json('PUT', data)),
  deleteProduct: (id: string) => mutate<{ ok: true }>(`/api/products/${id}`, json('DELETE')),

  categories: () => request<{ items: Category[] }>('/api/categories/admin/all'),
  createCategory: (data: Partial<CategoryInput>) => mutate<{ item: Category }>('/api/categories', json('POST', data)),
  updateCategory: (id: string, data: Partial<CategoryInput>) => mutate<{ item: Category }>(`/api/categories/${id}`, json('PUT', data)),
  deleteCategory: (id: string) => mutate<{ ok: true }>(`/api/categories/${id}`, json('DELETE')),

  settings: () => request<{ settings: Settings }>('/api/settings'),
  updateSettings: (data: Partial<Settings>) => mutate<{ settings: Settings }>('/api/settings', json('PUT', data)),

  async upload(files: File[], folder: 'produits' | 'categories' | 'site' = 'produits'): Promise<ImageAsset[]> {
    const form = new FormData();
    const prepared = await Promise.all(files.map(compressImage));
    prepared.forEach((f) => form.append('images', f));
    const data = await request<{ images: ImageAsset[] }>(`/api/upload?folder=${folder}`, { method: 'POST', body: form });
    return data.images;
  },
  orders: (params: { status?: string; payment?: string; q?: string; page?: number } = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v).map(([k, v]) => [k, String(v)]));
    return request<{ items: Order[]; total: number; page: number; pages: number; counts: Record<OrderStatus, number> }>(`/api/orders/admin?${qs}`);
  },
  order: (id: string) => request<{ item: Order }>(`/api/orders/admin/${id}`),
  updateOrder: (id: string, data: Partial<{ status: OrderStatus; paymentStatus: PaymentStatus; adminNote: string; paymentReference: string }>) =>
    request<{ item: Order }>(`/api/orders/admin/${id}`, json('PATCH', data)),
  deleteOrder: (id: string) => request<{ ok: true }>(`/api/orders/admin/${id}`, json('DELETE')),

  discardImage: (publicId: string) => request<{ ok: true }>('/api/upload', json('DELETE', { publicId })),
};

export type ProductInput = Omit<Product, '_id' | 'category' | 'createdAt' | 'updatedAt' | 'slug'> & {
  category: string | null;
  slug?: string;
};
export type CategoryInput = Omit<Category, '_id' | 'productCount' | 'slug'> & { slug?: string };

/**
 * Réduit les photos avant l'envoi (max 2000 px, JPEG 85 %).
 * Très utile depuis un téléphone avec une connexion mobile : une photo de 6 Mo passe à ~400 Ko.
 * Si le navigateur ne sait pas lire le format (ex : HEIC), le fichier original est envoyé.
 */
async function compressImage(file: File): Promise<File> {
  const MAX = 2000;
  if (!file.type.startsWith('image/') || file.size < 400 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
