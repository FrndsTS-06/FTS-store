import React from 'react';

export interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'blue' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'neutral';
  hasDot?: boolean;
  glow?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  variant = 'blue',
  hasDot = false,
  glow = false,
  children,
  className = '',
  ...rest
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'cyan':
        return {
          container: 'bg-cyan-500/10 text-cyan-300 border-cyan-400/30',
          dot: 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]',
          glowStyle: glow ? 'shadow-[0_0_12px_rgba(6,182,212,0.3)]' : '',
        };
      case 'emerald':
        return {
          container: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30',
          dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
          glowStyle: glow ? 'shadow-[0_0_12px_rgba(16,185,129,0.3)]' : '',
        };
      case 'amber':
        return {
          container: 'bg-amber-500/10 text-amber-300 border-amber-400/30',
          dot: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
          glowStyle: glow ? 'shadow-[0_0_12px_rgba(245,158,11,0.3)]' : '',
        };
      case 'rose':
        return {
          container: 'bg-rose-500/10 text-rose-300 border-rose-400/30',
          dot: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]',
          glowStyle: glow ? 'shadow-[0_0_12px_rgba(244,63,94,0.3)]' : '',
        };
      case 'neutral':
        return {
          container: 'bg-white/10 text-slate-200 border-white/20',
          dot: 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]',
          glowStyle: glow ? 'shadow-[0_0_12px_rgba(255,255,255,0.2)]' : '',
        };
      case 'blue':
      default:
        return {
          container: 'bg-blue-500/10 text-blue-300 border-blue-400/30',
          dot: 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]',
          glowStyle: glow ? 'shadow-[0_0_12px_rgba(59,130,246,0.3)]' : '',
        };
    }
  };

  const { container, dot, glowStyle } = getVariantStyles();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border fts-glass-badge ${container} ${glowStyle} ${className}`}
      {...rest}
    >
      {hasDot && <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dot}`} aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
};
