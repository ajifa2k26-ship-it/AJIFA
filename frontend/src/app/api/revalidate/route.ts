import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { CACHE_TAG } from '@/lib/api';
import { API_URL } from '@/lib/site';

// Purge le cache du site public après une modification dans l'administration.
// Accepte soit le secret partagé (appel depuis l'API Render), soit un jeton admin valide (appel depuis le navigateur).
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  const headerSecret = req.headers.get('x-revalidate-secret');
  let allowed = Boolean(secret && headerSecret && headerSecret === secret);

  if (!allowed) {
    const auth = req.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: auth },
          cache: 'no-store',
          signal: AbortSignal.timeout(15000),
        });
        allowed = res.ok;
      } catch {
        allowed = false;
      }
    }
  }

  if (!allowed) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  revalidateTag(CACHE_TAG);
  revalidatePath('/', 'layout');
  return NextResponse.json({ revalidated: true, at: Date.now() });
}
