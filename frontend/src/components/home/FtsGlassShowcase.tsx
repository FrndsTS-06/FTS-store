import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import {
  GlassPanel,
  GlassCard,
  GlassButton,
  GlassBadge
} from '../common/glass';

export const FtsGlassShowcase: React.FC = () => {
  const [isBlurDisabled, setIsBlurDisabled] = useState(false);

  return (
    <section
      className={`my-16 transition-all duration-300 ${isBlurDisabled ? 'no-backdrop-blur' : ''}`}
      aria-label="FTS 3D Glassmorphism Design Showcase"
      id="fts-glass-showcase"
    >
      <GlassPanel
        variant="elevated"
        hasSpecularEdge={true}
        isLuminous={true}
        className="p-6 sm:p-10 border border-white/15 bg-gradient-to-br from-slate-900/80 via-slate-950/90 to-blue-950/40"
      >
        {/* Header Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <GlassBadge variant="cyan" hasDot={true} glow={true}>
              PHASE 1 DESIGN SYSTEM
            </GlassBadge>
            <GlassBadge variant="blue">
              WCAG AA Compliant
            </GlassBadge>
          </div>

          {/* Live Fallback Toggle for QA Verification */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Blur Fallback:</span>
            <button
              onClick={() => setIsBlurDisabled(prev => !prev)}
              id="toggle-blur-fallback-btn"
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                isBlurDisabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-sm'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/20'
              }`}
              title="Toggle backdrop-filter blur on/off to verify readability without blur"
            >
              {isBlurDisabled ? 'Blur: OFF (Opaque Fallback Active)' : 'Blur: ON (Frosted Active)'}
            </button>
          </div>
        </div>

        {/* Headline & Description */}
        <div className="max-w-2xl mb-8">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display mb-3">
            FTS Cyber Glass Architecture
          </h3>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Engineered with deep cosmic navy layers, frosted translucent surfaces, subtle specular top reflections, and high-contrast typography designed for the future of tech e-commerce.
          </p>
        </div>

        {/* 3 Representative Showcase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* Card 1: Translucent Depth */}
          <GlassCard
            interactive={true}
            hoverGlow="blue"
            className="p-6 bg-slate-900/60 border border-white/10"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-400/30 text-blue-400 flex items-center justify-center mb-4 shadow-fts-glow-blue">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-base font-bold text-white font-display">Layered Depth</h4>
              <GlassBadge variant="blue" hasDot={true}>Active</GlassBadge>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
              Multi-stop translucent backgrounds with hardware-accelerated backdrop blur and dynamic cursor-following specular sheen.
            </p>
            <div className="flex items-center text-xs font-semibold text-blue-400">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Dynamic Cursor Sheen
            </div>
          </GlassCard>

          {/* Card 2: Luminous Cyber Accents */}
          <GlassCard
            interactive={true}
            hoverGlow="cyan"
            luminousBorder={true}
            className="p-6 bg-slate-900/60 border border-cyan-400/30"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 flex items-center justify-center mb-4 shadow-fts-glow-cyan">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-base font-bold text-white font-display">Specular Reflections</h4>
              <GlassBadge variant="cyan" hasDot={true}>Luminous</GlassBadge>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
              Micro-thin specular edge glints with electric blue and radiant cyan luminous accent borders for ultra-premium tech presence.
            </p>
            <div className="flex items-center text-xs font-semibold text-cyan-400">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              1px Luminous Gradient Rim
            </div>
          </GlassCard>

          {/* Card 3: Resilient Fallback */}
          <GlassCard
            interactive={true}
            hoverGlow="blue"
            className="p-6 bg-slate-900/60 border border-white/10"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-base font-bold text-white font-display">Zero-Jank Fallback</h4>
              <GlassBadge variant="emerald" hasDot={true}>Protected</GlassBadge>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
              Automatic solid deep-navy fallback protects contrast and legibility if backdrop blur is unsupported or disabled by the OS.
            </p>
            <div className="flex items-center text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              High-Contrast Opaque Backing
            </div>
          </GlassCard>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>FTS Design Tokens v1.0.0 Active • 60 FPS Composite Layer</span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/products">
              <GlassButton variant="cyber" size="md" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
                Explore Products
              </GlassButton>
            </Link>
          </div>
        </div>
      </GlassPanel>
    </section>
  );
};
