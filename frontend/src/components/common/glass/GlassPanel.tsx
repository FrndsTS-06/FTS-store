import React from 'react';

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'heavy' | 'elevated' | 'glow';
  hasSpecularEdge?: boolean;
  isLuminous?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  variant = 'surface',
  hasSpecularEdge = true,
  isLuminous = false,
  children,
  className = '',
  ...rest
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'heavy':
        return 'fts-glass-panel border-white/15 bg-slate-950/80 shadow-2xl';
      case 'elevated':
        return 'fts-glass-panel border-white/20 bg-slate-900/75 shadow-fts-glass-panel';
      case 'glow':
        return 'fts-glass-panel border-blue-500/30 bg-slate-950/85 shadow-fts-glow-blue';
      case 'surface':
      default:
        return 'fts-glass-card border-white/10 bg-slate-950/60 shadow-lg';
    }
  };

  return (
    <div
      className={`relative rounded-3xl transition-all duration-300 ${getVariantStyles()} ${
        hasSpecularEdge ? 'fts-specular-edge' : ''
      } ${isLuminous ? 'fts-border-luminous' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};
