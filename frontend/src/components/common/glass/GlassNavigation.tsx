import React, { useState, useEffect } from 'react';

export interface GlassNavigationProps extends React.HTMLAttributes<HTMLElement> {
  isScrolled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const GlassNavigation: React.FC<GlassNavigationProps> = ({
  isScrolled: externalIsScrolled,
  children,
  className = '',
  ...rest
}) => {
  const [internalIsScrolled, setInternalIsScrolled] = useState(false);
  const isScrolled = externalIsScrolled !== undefined ? externalIsScrolled : internalIsScrolled;

  useEffect(() => {
    if (externalIsScrolled !== undefined) return;
    const handleScroll = () => {
      setInternalIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [externalIsScrolled]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 fts-glass-nav ${
        isScrolled
          ? 'bg-slate-950/80 backdrop-blur-2xl border-b border-white/15 shadow-2xl shadow-blue-950/30'
          : 'bg-slate-950/50 backdrop-blur-xl border-b border-white/10 shadow-lg'
      } ${className}`}
      {...rest}
    >
      {/* Top subtle glint */}
      <div className="fts-specular-edge" aria-hidden="true" />
      {children}
    </header>
  );
};
