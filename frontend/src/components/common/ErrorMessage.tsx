import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'An error occurred',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border border-rose-500/20 bg-rose-950/20 p-4 text-rose-200 flex items-start space-x-3.5 backdrop-blur-sm ${className}`}
      role="alert"
    >
      <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-rose-200">{title}</h4>
        <p className="text-xs text-rose-300/80 mt-0.5 leading-relaxed">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs font-semibold text-rose-300 underline hover:text-white transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
};
