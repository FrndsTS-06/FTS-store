import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { usePrefersReducedMotion } from '../../../motion';

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'cyber' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  className?: string;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...rest
}) => {
  const shouldReduceMotion = usePrefersReducedMotion();

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3.5 py-1.5 text-xs font-semibold rounded-xl gap-1.5';
      case 'lg':
        return 'px-7 py-3.5 text-base font-bold rounded-2xl gap-3';
      case 'md':
      default:
        return 'px-5 py-2.5 text-sm font-semibold rounded-xl gap-2';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'cyber':
        return 'bg-gradient-to-r from-blue-600/80 via-cyan-500/80 to-blue-600/80 text-white shadow-fts-glow-cyan border border-cyan-300/40 hover:border-cyan-200 hover:shadow-cyan-400/50 backdrop-blur-md';
      case 'secondary':
        return 'bg-slate-800/60 hover:bg-slate-700/70 text-slate-100 border border-white/10 hover:border-white/20 backdrop-blur-md shadow-md';
      case 'outline':
        return 'bg-transparent hover:bg-white/5 text-slate-200 border border-white/20 hover:border-blue-400/60 hover:text-white backdrop-blur-sm';
      case 'ghost':
        return 'bg-transparent hover:bg-white/10 text-slate-300 hover:text-white border border-transparent hover:border-white/10 backdrop-blur-none hover:backdrop-blur-sm';
      case 'primary':
      default:
        return 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-fts-glow-blue border border-blue-400/30 hover:border-blue-300/60 hover:shadow-blue-500/50 backdrop-blur-md';
    }
  };

  return (
    <motion.button
      whileHover={shouldReduceMotion || disabled || isLoading ? undefined : { scale: 1.02, y: -1 }}
      whileTap={shouldReduceMotion || disabled || isLoading ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      disabled={disabled || isLoading}
      className={`relative inline-flex items-center justify-center font-display transition-all duration-200 select-none overflow-hidden ${getSizeStyles()} ${getVariantStyles()} ${
        disabled || isLoading ? 'opacity-55 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
      } ${className}`}
      {...(rest as any)}
    >
      {/* Subtle top specular glint */}
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
        </>
      )}
    </motion.button>
  );
};
