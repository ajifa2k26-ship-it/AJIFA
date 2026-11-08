'use client';

// Loader d'images : utilise les transformations Cloudinary (format et qualité automatiques)
export default function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
    const params = ['f_auto', `q_${quality || 'auto'}`, `w_${width}`, 'c_limit'].join(',');
    return src.replace('/upload/', `/upload/${params}/`);
  }
  // Images locales (logo, etc.) : servies telles quelles
  return src.startsWith('/') ? `${src}?w=${width}` : src;
}
