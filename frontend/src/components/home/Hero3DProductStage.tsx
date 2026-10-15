import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Star, Laptop, Smartphone, Headphones, Watch } from 'lucide-react';
import { HeroSlide } from './HeroBanner';

export interface Hero3DProductStageProps {
  slide: HeroSlide;
  mousePos: { x: number; y: number };
  isDesktopPointer: boolean;
  shouldReduceMotion: boolean;
  imageErrors: Record<string, boolean>;
  onImageError: (key: string) => void;
}

export const Hero3DProductStage: React.FC<Hero3DProductStageProps> = ({
  slide,
  mousePos,
  isDesktopPointer,
  shouldReduceMotion,
  imageErrors,
  onImageError,
}) => {
  // Motion values for smooth 3D spring physics
  const rotateXTarget = useMotionValue(0);
  const rotateYTarget = useMotionValue(0);

  const springConfig = { stiffness: 120, damping: 18, mass: 0.8 };
  const smoothRotateX = useSpring(rotateXTarget, springConfig);
  const smoothRotateY = useSpring(rotateYTarget, springConfig);

  // Sync mouse position with spring rotation targets on desktop
  useEffect(() => {
    if (!isDesktopPointer || shouldReduceMotion) {
      rotateXTarget.set(0);
      rotateYTarget.set(0);
      return;
    }
    // mousePos.x and mousePos.y are normalized between -0.5 and 0.5
    rotateXTarget.set(-mousePos.y * 14); // Tilt up/down
    rotateYTarget.set(mousePos.x * 16);  // Tilt left/right
  }, [mousePos, isDesktopPointer, shouldReduceMotion, rotateXTarget, rotateYTarget]);

  return (
    <div
      className="relative w-full max-w-lg lg:max-w-none flex items-center justify-center"
      style={{ perspective: 1200 }}
    >
      {/* Ambient Radial Lighting Bloom */}
      <div 
        className="absolute -inset-4 sm:-inset-8 rounded-full bg-gradient-to-tr from-blue-600/25 via-cyan-500/20 to-indigo-600/20 blur-3xl pointer-events-none transform -translate-y-4" 
        aria-hidden="true" 
      />

      {/* Main 3D Stage Container */}
      <motion.div
        style={{
          rotateX: shouldReduceMotion ? 0 : smoothRotateX,
          rotateY: shouldReduceMotion ? 0 : smoothRotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-3xl p-3 sm:p-4 transition-shadow duration-300"
      >
        {/* ====================================================================
            LAYER 1: The Frosted Cyber Glass Baseplate (Z: 10px)
            ==================================================================== */}
        <div
          style={{ transform: 'translateZ(10px)' }}
          className="absolute inset-0 rounded-3xl fts-glass-panel border border-cyan-400/25 bg-slate-950/70 shadow-2xl backdrop-blur-2xl overflow-hidden pointer-events-none"
        >
          {/* Subtle Cyber Grid Texture */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(rgba(6, 182, 212, 0.8) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          {/* Top specular edge reflection */}
          <div className="fts-specular-edge" />
          {/* Neon Corner Glow Accents */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-400/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-44 h-44 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* ====================================================================
            LAYER 2: The Primary Device Showcase (Z: 38px) - Laptop / Hardware
            ==================================================================== */}
        <motion.div
          style={{ transform: 'translateZ(38px)' }}
          className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-950/90 border border-white/15 shadow-2xl shadow-black/80 group"
        >
          {!imageErrors[`laptop-${slide.id}`] ? (
            <img
              src={slide.featuredDevices.laptopImage}
              alt={`${slide.headline} - Main Device`}
              onError={() => onImageError(`laptop-${slide.id}`)}
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-300 p-6">
              <Laptop className="w-16 h-16 text-blue-400 mb-2" />
              <span className="font-bold text-sm">FTS Tech Flagship Collection</span>
            </div>
          )}

          {/* Screen Glint Sweep */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.07] to-transparent pointer-events-none" />

          {/* ================================================================
              LAYER 3: Floating Info Panels (Z: 75px) - Rating & Pricing
              ================================================================ */}
          {/* Rating Pill Badge */}
          <motion.div
            style={{ transform: 'translateZ(75px)' }}
            animate={shouldReduceMotion ? undefined : { y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-3 left-3 px-3 py-1.5 rounded-xl fts-glass-panel border border-cyan-400/30 flex items-center gap-2 text-white shadow-xl backdrop-blur-xl"
          >
            <div className="w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-extrabold leading-none text-white tracking-wide">4.9 ★★★★★</div>
              <div className="text-[9px] text-cyan-200/80 leading-none mt-0.5">12,400+ Verified Buyers</div>
            </div>
          </motion.div>

          {/* Pricing Highlight Pill */}
          {slide.pricingHighlight && (
            <motion.div
              style={{ transform: 'translateZ(75px)' }}
              whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
              className="absolute top-3 right-3 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/40 text-xs font-extrabold tracking-wide border border-cyan-300/40"
            >
              {slide.pricingHighlight}
            </motion.div>
          )}

          {/* ================================================================
              LAYER 4: Floating Electronics Pods (Z: 85px) - Mobile, Audio, Watch
              ================================================================ */}
          <motion.div
            style={{ transform: 'translateZ(85px)' }}
            className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/85 backdrop-blur-2xl border border-cyan-400/25 text-white shadow-2xl"
          >
            {/* Smartphone Pod */}
            <div className="flex items-center gap-2 flex-1 min-w-0 pr-1 border-r border-white/10 group/item hover:bg-white/5 rounded-lg p-1 transition-all">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 flex items-center justify-center border border-white/15">
                {!imageErrors[`phone-${slide.id}`] ? (
                  <img
                    src={slide.featuredDevices.phoneImage}
                    alt="Smartphone preview"
                    onError={() => onImageError(`phone-${slide.id}`)}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <Smartphone className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <div className="min-w-0 truncate text-left">
                <div className="text-[10px] font-bold text-slate-100 truncate">Smartphones</div>
                <div className="text-[9px] text-cyan-400 font-medium truncate">5G Flagship</div>
              </div>
            </div>

            {/* Earbuds Pod */}
            <div className="flex items-center gap-2 flex-1 min-w-0 px-1 border-r border-white/10 group/item hover:bg-white/5 rounded-lg p-1 transition-all">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 flex items-center justify-center border border-white/15">
                {!imageErrors[`earbuds-${slide.id}`] ? (
                  <img
                    src={slide.featuredDevices.earbudsImage}
                    alt="Wireless earbuds preview"
                    onError={() => onImageError(`earbuds-${slide.id}`)}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <Headphones className="w-4 h-4 text-purple-400" />
                )}
              </div>
              <div className="min-w-0 truncate text-left">
                <div className="text-[10px] font-bold text-slate-100 truncate">Audio Gear</div>
                <div className="text-[9px] text-purple-400 font-medium truncate">ANC Studio</div>
              </div>
            </div>

            {/* Smartwatch Pod */}
            <div className="flex items-center gap-2 flex-1 min-w-0 pl-1 group/item hover:bg-white/5 rounded-lg p-1 transition-all">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 flex items-center justify-center border border-white/15">
                {!imageErrors[`watch-${slide.id}`] ? (
                  <img
                    src={slide.featuredDevices.watchImage}
                    alt="Smartwatch preview"
                    onError={() => onImageError(`watch-${slide.id}`)}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <Watch className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div className="min-w-0 truncate text-left">
                <div className="text-[10px] font-bold text-slate-100 truncate">Wearables</div>
                <div className="text-[9px] text-emerald-400 font-medium truncate">BioTracker</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};
