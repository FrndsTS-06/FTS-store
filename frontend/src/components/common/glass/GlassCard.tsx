import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../../../motion';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  hoverGlow?: 'blue' | 'cyan' | 'none';
  luminousBorder?: boolean;
  hasSpecularSheen?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  interactive = true,
  hoverGlow = 'blue',
  luminousBorder = false,
  hasSpecularSheen = true,
  children,
  className = '',
  onClick,
  ...rest
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: string; y: string }>({ x: '50%', y: '50%' });
  const shouldReduceMotion = usePrefersReducedMotion();

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasSpecularSheen || shouldReduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = `${e.clientX - rect.left}px`;
    const y = `${e.clientY - rect.top}px`;
    setMousePos({ x, y });
  }, [hasSpecularSheen, shouldReduceMotion]);

  const getGlowStyles = () => {
    if (!interactive) return '';
    if (hoverGlow === 'cyan') return 'hover:border-cyan-400/50 hover:shadow-fts-glow-cyan';
    if (hoverGlow === 'blue') return 'hover:border-blue-400/50 hover:shadow-fts-glow-blue';
    return 'hover:border-white/20';
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      whileHover={interactive && !shouldReduceMotion ? { y: -4, scale: 1.01 } : undefined}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      style={{
        '--mouse-x': mousePos.x,
        '--mouse-y': mousePos.y,
      } as React.CSSProperties}
      className={`relative rounded-2xl fts-glass-card ${
        interactive ? 'fts-glass-card-hover cursor-pointer' : ''
      } ${luminousBorder ? 'fts-border-luminous' : ''} ${getGlowStyles()} ${className}`}
      {...(rest as any)}
    >
      {/* Dynamic Specular Sheen Layer that tracks pointer */}
      {hasSpecularSheen && <div className="fts-glass-specular" aria-hidden="true" />}
      
      {/* Top subtle glint */}
      <div className="fts-specular-edge" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};
