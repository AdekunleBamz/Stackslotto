import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pages = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) pages.push(1, '...');
  for (let i = startPage; i <= endPage; i++) pages.push(i);
  if (endPage < totalPages) pages.push('...', totalPages);

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
      >
        <ChevronLeft size={20} />
      </button>

      {pages.map((page, i) => (
        <React.Fragment key={i}>
          {page === '...' ? (
            <span className="text-gray-500">...</span>
          ) : (
            <button
              onClick={() => onPageChange(page as number)}
              className={`px-3 py-2 rounded font-medium ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};
