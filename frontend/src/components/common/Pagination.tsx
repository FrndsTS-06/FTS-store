import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <nav
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-slate-800/80 ${className}`}
      aria-label="Pagination Navigation"
    >
      {/* Summary Text */}
      <p className="text-xs text-slate-400">
        Showing <span className="font-semibold text-slate-200">{startItem}</span> to{' '}
        <span className="font-semibold text-slate-200">{endItem}</span> of{' '}
        <span className="font-semibold text-slate-200">{totalItems}</span> products
      </p>

      {/* Page Buttons List */}
      <div className="flex items-center space-x-1.5">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, idx) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-slate-600">
                ...
              </span>
            );
          }

          const pageNum = Number(page);
          const isActive = pageNum === currentPage;

          return (
            <button
              key={`page-${pageNum}`}
              onClick={() => onPageChange(pageNum)}
              className={`min-w-[36px] h-9 px-3 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800'
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Go to page ${pageNum}`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};
