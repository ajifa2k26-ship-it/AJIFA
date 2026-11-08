'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ImageAsset } from '@/lib/types';
import { ChevronLeft, ChevronRight, CloseIcon } from './Icons';

export default function ProductGallery({ images, name }: { images: ImageAsset[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = images.length;

  const go = useCallback((d: number) => setIndex((i) => (i + d + count) % count), [count]);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(false);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [zoom, go]);

  if (!count) {
    return (
      <div className="gallery">
        <div className="gallery-main" style={{ display: 'grid', placeItems: 'center', cursor: 'default' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--line)' }}>AJIFA</span>
        </div>
      </div>
    );
  }

  const current = images[index];
  const swipe = {
    onTouchStart: (e: React.TouchEvent) => {
      touchX.current = e.touches[0].clientX;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchX.current == null) return;
      const dx = e.changedTouches[0].clientX - touchX.current;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      touchX.current = null;
    },
  };

  return (
    <div>
      <div className="gallery">
        <div className="gallery-main" onClick={() => setZoom(true)} {...swipe}>
          <Image
            key={current.url}
            src={current.url}
            alt={current.alt || `${name} — photo ${index + 1}`}
            fill
            priority={index === 0}
            sizes="(max-width: 900px) 100vw, 55vw"
          />
          {count > 1 && (
            <>
              <button className="gallery-nav prev" aria-label="Photo précédente" onClick={(e) => { e.stopPropagation(); go(-1); }}>
                <ChevronLeft width={20} />
              </button>
              <button className="gallery-nav next" aria-label="Photo suivante" onClick={(e) => { e.stopPropagation(); go(1); }}>
                <ChevronRight width={20} />
              </button>
            </>
          )}
        </div>
        {count > 1 && (
          <div className="gallery-thumbs">
            {images.map((img, i) => (
              <button key={img.url} className="gallery-thumb" aria-current={i === index} aria-label={`Voir la photo ${i + 1}`} onClick={() => setIndex(i)}>
                <Image src={img.url} alt="" fill sizes="80px" />
              </button>
            ))}
          </div>
        )}
      </div>
      {count > 1 && (
        <div className="gallery-dots" aria-hidden>
          {images.map((img, i) => (
            <span key={img.url} className={i === index ? 'on' : ''} />
          ))}
        </div>
      )}

      {zoom && (
        <div className="lightbox" role="dialog" aria-label="Photo agrandie" onClick={() => setZoom(false)} {...swipe}>
          <button className="icon-btn close" aria-label="Fermer" onClick={() => setZoom(false)}>
            <CloseIcon />
          </button>
          {count > 1 && (
            <>
              <button className="icon-btn prev" aria-label="Précédente" onClick={(e) => { e.stopPropagation(); go(-1); }}>
                <ChevronLeft />
              </button>
              <button className="icon-btn next" aria-label="Suivante" onClick={(e) => { e.stopPropagation(); go(1); }}>
                <ChevronRight />
              </button>
            </>
          )}
          <div className="lightbox-img" onClick={(e) => e.stopPropagation()}>
            <Image src={current.url} alt={current.alt || name} fill sizes="92vw" quality={90} />
          </div>
        </div>
      )}
    </div>
  );
}
