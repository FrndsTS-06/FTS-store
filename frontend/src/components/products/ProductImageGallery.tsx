import React, { useState } from 'react';
import { ProductImage } from '../../types/catalog';
import { getFallbackImage } from '../../utils/formatters';

export interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
  categorySlug?: string;
  badge?: string | null;
  discountPct?: number | null;
  className?: string;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images,
  productName,
  categorySlug,
  badge,
  discountPct,
  className = '',
}) => {
  const defaultFallback = getFallbackImage(categorySlug);
  
  // Sorted gallery images
  const galleryList = images.length > 0
    ? [...images].sort((a, b) => (a.is_primary ? -1 : b.is_primary ? 1 : a.display_order - b.display_order))
    : [{ id: 'fallback', url: defaultFallback, alt_text: productName, is_primary: true, display_order: 0, created_at: '' }];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [failedIndices, setFailedIndices] = useState<Record<number, boolean>>({});

  const activeImage = galleryList[selectedIndex] || galleryList[0];
  const isCurrentFailed = failedIndices[selectedIndex];
  const currentSrc = isCurrentFailed ? defaultFallback : activeImage.url;

  const handleImageError = (index: number) => {
    setFailedIndices(prev => ({ ...prev, [index]: true }));
  };

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      {/* Main Large Display View */}
      <div className="relative aspect-square w-full rounded-3xl overflow-hidden border border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur-md">
        <img
          src={currentSrc}
          alt={activeImage.alt_text || productName}
          onError={() => handleImageError(selectedIndex)}
          loading="eager"
          decoding="async"
          className="h-full w-full object-cover object-center transition-all duration-300"
        />

        {/* Badges on Top of Main Image */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          {badge && (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-600/90 text-white shadow-lg backdrop-blur-md">
              {badge}
            </span>
          )}
          {discountPct && discountPct > 0 ? (
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500 text-white shadow-lg ml-auto">
              Save {discountPct}%
            </span>
          ) : null}
        </div>
      </div>

      {/* Thumbnails Row if multiple images */}
      {galleryList.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none" role="tablist" aria-label="Product thumbnails">
          {galleryList.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            const thumbSrc = failedIndices[idx] ? defaultFallback : img.url;

            return (
              <button
                key={img.id || idx}
                onClick={() => setSelectedIndex(idx)}
                className={`relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 scale-105'
                    : 'border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                }`}
                role="tab"
                aria-selected={isSelected}
                aria-label={`View thumbnail ${idx + 1} of ${productName}`}
              >
                <img
                  src={thumbSrc}
                  alt={img.alt_text || `Thumbnail ${idx + 1}`}
                  onError={() => handleImageError(idx)}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
