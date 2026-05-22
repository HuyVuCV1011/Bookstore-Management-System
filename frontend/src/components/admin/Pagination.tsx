import React from 'react';

interface PaginationProps {
  currentPage?: number;
  page?: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, page, totalPages, onPageChange }) => {
  const activePage = currentPage ?? page ?? 0;
  const pages = Array.from({ length: totalPages }, (_, i) => i);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(activePage - 1)}
        disabled={activePage === 0}
        className="rounded-button border border-border bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        ←
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`rounded-button border px-3 py-2 text-sm font-semibold transition ${
            page === activePage
              ? 'border-primary bg-primary text-white'
              : 'border-border bg-white text-gray-700 hover:border-primary hover:text-primary'
          }`}
        >
          {page + 1}
        </button>
      ))}
      <button
        onClick={() => onPageChange(activePage + 1)}
        disabled={activePage === totalPages - 1}
        className="rounded-button border border-border bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        →
      </button>
    </div>
  );
};
