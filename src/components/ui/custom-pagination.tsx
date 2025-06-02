
import React from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
}

export const CustomPagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
}) => {
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, totalItems);
  const indexOfFirstItem = indexOfLastItem - Math.min(itemsPerPage, indexOfLastItem - (currentPage - 1) * itemsPerPage);

  // Function to show appropriate page buttons
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    if (totalPages <= 5) {
      // If 5 or fewer pages, show all
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      // Calculate range around current page
      if (currentPage <= 3) {
        // Near start
        pageNumbers.push(2, 3);
        // Add ellipsis and last page
        if (totalPages > 3) {
          pageNumbers.push('ellipsis', totalPages);
        }
      } else if (currentPage >= totalPages - 2) {
        // Near end
        // Add ellipsis after first page
        pageNumbers.push('ellipsis');
        // Add last few pages
        for (let i = totalPages - 2; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Middle - show current page and neighbors
        pageNumbers.push('ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
      }
    }
    
    return pageNumbers;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
      <div className="text-sm text-graydark dark:text-gray-400 w-full sm:w-auto">
        Showing {indexOfFirstItem + 1} to {indexOfLastItem} of {totalItems} items
      </div>
      <div className="flex items-center space-x-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        
        {getPageNumbers().map((page, index) => 
          page === 'ellipsis' ? (
            <span 
              key={`ellipsis-${index}`} 
              className="px-2 py-2 text-gray-500 dark:text-gray-400"
            >
              ...
            </span>
          ) : (
            <Button
              key={`page-${page}`}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page as number)}
              className={currentPage === page ? 
                "bg-greenprimary hover:bg-greenprimary/80 text-white" : 
                "dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"}
            >
              {page}
            </Button>
          )
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
