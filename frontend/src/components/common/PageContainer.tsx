import React from 'react';

export interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full ${className}`}>
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-4 border-b border-slate-800">
          <div>
            {title && (
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex items-center gap-3">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
