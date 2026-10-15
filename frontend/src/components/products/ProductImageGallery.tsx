import React, { useState, useRef, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X, ChevronLeft, ChevronRight, Sparkles, Box, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { ProductImage } from '../../types/catalog';
import { getFallbackImage } from '../../utils/formatters';
import { usePrefersReducedMotion } from '../../motion';

const LazyProduct3DViewer = lazy(() => import('./Product3DViewer'));

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
  const shouldReduceMotion = usePrefersReducedMotion();

  // Mode: 2D Photo vs Interactive 3D Studio
  const [viewMode, setViewMode] = useState<'photo' | '3d'>('photo');

  // Sorted gallery images
  const galleryList = images.length > 0
    ? [...images].sort((a, b) => (a.is_primary ? -1 : b.is_primary ? 1 : a.display_order - b.display_order))
    : [{ id: 'fallback', url: defaultFallback, alt_text: productName, is_primary: true, display_order: 0, created_at: '' }];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [failedIndices, setFailedIndices] = useState<Record<number, boolean>>({});
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // 3D Perspective Tilt State
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const activeImage = galleryList[selectedIndex] || galleryList[0];
  const isCurrentFailed = failedIndices[selectedIndex];
  const currentSrc = isCurrentFailed ? defaultFallback : activeImage.url;

  const handleImageError = (index: number) => {
    setFailedIndices(prev => ({ ...prev, [index]: true }));
  };

  // 3D pointer parallax
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || e.pointerType === 'touch' || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Max 10 deg tilt
    const rX = ((y - centerY) / centerY) * -10;
    const rY = ((x - centerX) / centerX) * 10;

    setRotateX(rX);
    setRotateY(rY);
    setMousePos({ x: Math.round(percentX), y: Math.round(percentY) });
    setIsHovered(true);
  }, [shouldReduceMotion]);

  const handlePointerLeave = useCallback(() => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  }, []);

  const handleNextImage = () => {
    setSelectedIndex((prev) => (prev + 1) % galleryList.length);
  };

  const handlePrevImage = () => {
    setSelectedIndex((prev) => (prev - 1 + galleryList.length) % galleryList.length);
  };

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      {/* View Mode Switcher Pill */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center p-1 rounded-2xl fts-glass-card border border-slate-800 shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode('photo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'photo'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>2D Photo Stage</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === '3d'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-cyan-400" />
            <span>3D Interactive</span>
          </button>
        </div>

        {viewMode === '3d' && (
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded-xl hidden sm:inline-block">
            WebGL 3D Studio Active
          </span>
        )}
      </div>

      {/* Main Display Area */}
      {viewMode === '3d' ? (
        <Suspense
          fallback={
            <div className="aspect-square w-full rounded-3xl fts-glass-panel border border-slate-700/60 flex flex-col items-center justify-center gap-3 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 animate-spin">
                <RefreshCw className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-cyan-300">Loading 3D Studio...</span>
            </div>
          }
        >
          <LazyProduct3DViewer
            productName={productName}
            categorySlug={categorySlug}
            fallbackImage={currentSrc}
            onSwitchToPhoto={() => setViewMode('photo')}
          />
        </Suspense>
      ) : (
        <>
          {/* 3D Perspective CSS Media Showcase Stage */}
          <div
            className="relative w-full"
            style={{ perspective: '1200px' }}
          >
            <div
              ref={cardRef}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              style={{
                transform: shouldReduceMotion
                  ? 'none'
                  : `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${isHovered ? 1.02 : 1}, ${isHovered ? 1.02 : 1}, 1)`,
                transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                transformStyle: 'preserve-3d',
                '--mouse-x': `${mousePos.x}%`,
                '--mouse-y': `${mousePos.y}%`,
              } as React.CSSProperties}
              className="relative aspect-square w-full rounded-3xl overflow-hidden fts-glass-panel fts-specular-edge shadow-2xl group cursor-crosshair border border-slate-700/60"
            >
              {/* Specular Radial Sheen Tracking Cursor */}
              <div
                className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(450px circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.18), rgba(6, 182, 212, 0.08) 35%, transparent 70%)`,
                  opacity: isHovered ? 1 : 0,
                }}
              />

              {/* Ambient Corner Glow Orbs */}
              <div className="pointer-events-none absolute -top-20 -left-20 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -right-20 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl" />

              {/* High-Resolution Product Image */}
              <div className="relative w-full h-full p-6 flex items-center justify-center">
                <motion.img
                  key={currentSrc}
                  src={currentSrc}
                  alt={activeImage.alt_text || productName}
                  onError={() => handleImageError(selectedIndex)}
                  loading="eager"
                  decoding="async"
                  initial={shouldReduceMotion ? { opacity: 0.8 } : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="max-h-full max-w-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Floating Frosted Glass Badges */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
                <div className="flex flex-wrap gap-2">
                  {badge && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900/80 text-cyan-300 border border-cyan-500/40 shadow-lg backdrop-blur-md">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      {badge}
                    </span>
                  )}
                </div>

                {discountPct && discountPct > 0 ? (
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/30 border border-rose-400/40 backdrop-blur-md ml-auto">
                    Save {discountPct}%
                  </span>
                ) : null}
              </div>

              {/* Expand / Lightbox Button */}
              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                aria-label="Enlarge product image"
                title="Inspect high resolution"
                className="absolute bottom-4 right-4 z-20 p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Left/Right Fast Flip Controls (if multiple images) */}
              {galleryList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Luminous Specular Base Line */}
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Multi-Image Frosted Thumbnails Selector */}
          {galleryList.length > 1 && (
            <div
              className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none"
              role="tablist"
              aria-label="Product image thumbnails"
            >
              {galleryList.map((img, idx) => {
                const isSelected = idx === selectedIndex;
                const thumbSrc = failedIndices[idx] ? defaultFallback : img.url;

                return (
                  <button
                    key={img.id || idx}
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden p-1.5 transition-all duration-250 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                      isSelected
                        ? 'fts-glass-card border-2 border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.45)] scale-105'
                        : 'bg-slate-900/50 border border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100 hover:scale-102'
                    }`}
                    role="tab"
                    aria-selected={isSelected}
                    aria-label={`View image ${idx + 1} of ${productName}`}
                  >
                    <img
                      src={thumbSrc}
                      alt={img.alt_text || `Thumbnail ${idx + 1}`}
                      onError={() => handleImageError(idx)}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain filter drop-shadow-md"
                    />

                    {isSelected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#06b6d4]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Fullscreen Frosted Glass Lightbox Modal */}
      <AnimatePresence>
        {isZoomOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={`High resolution view of ${productName}`}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsZoomOpen(false)}
              className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl cursor-zoom-out"
            />

            {/* Modal Body */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative max-w-4xl max-h-[85vh] w-full fts-glass-panel rounded-3xl p-6 sm:p-10 border border-slate-700/80 shadow-2xl flex flex-col items-center justify-center z-10 overflow-hidden"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                aria-label="Close high-res view"
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="relative w-full h-[60vh] flex items-center justify-center p-4">
                <img
                  src={currentSrc}
                  alt={activeImage.alt_text || productName}
                  className="max-h-full max-w-full object-contain filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                />
              </div>

              {/* Caption & Counter */}
              <div className="mt-4 flex items-center justify-between w-full text-xs text-slate-400 border-t border-slate-800/80 pt-4">
                <span className="font-semibold text-slate-200 truncate mr-4">{productName}</span>
                <span>Image {selectedIndex + 1} of {galleryList.length}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
