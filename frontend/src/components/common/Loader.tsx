import React from 'react';

export interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  label = 'Loading...',
  className = '',
}) => {
  const sizeClass = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center p-6 space-y-3 ${className}`} role="status">
      <div
        className={`${sizeClass} rounded-full border-indigo-500/20 border-t-indigo-500 animate-spin`}
        aria-hidden="true"
      />
      {label && <span className="text-xs font-medium text-slate-400 animate-pulse">{label}</span>}
      <span className="sr-only">{label}</span>
    </div>
  );
};
