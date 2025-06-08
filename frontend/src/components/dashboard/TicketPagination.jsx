import React from 'react';
import { Button } from '../ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';

const TicketPagination = ({
  currentPage,
  totalItems,
  itemsPerPage,
  setCurrentPage,
  setItemsPerPage,
  itemsPerPageOptions = [5, 10, 15],
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    const halfPages = Math.floor(maxPagesToShow / 2);
    let startPage = Math.max(1, currentPage - halfPages);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && totalItems > 0) {
      setCurrentPage(pageNumber);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    totalItems > 0 && (
      <div className="flex flex-wrap justify-between items-center mt-6 space-y-4 sm:space-y-0">
        <div className="text-sm text-gray-700">
          عرض {(currentPage - 1) * itemsPerPage + 1}–
          {Math.min(currentPage * itemsPerPage, totalItems)} من {totalItems} تذكرة
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {itemsPerPageOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option} لكل صفحة
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1 || totalItems === 0}
          >
            الأول
          </Button>
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentPage === 1 || totalItems === 0}
          >
            السابق
          </Button>
          {getPageNumbers().map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              onClick={() => handlePageChange(page)}
              disabled={totalItems === 0}
            >
              {page}
            </Button>
          ))}
          {totalPages > getPageNumbers().length && getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
            <span className="px-3 py-1 text-sm">...</span>
          )}
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentPage === totalPages || totalItems === 0}
          >
            التالي
          </Button>
          <Button
            variant="outline"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || totalItems === 0}
          >
            الأخير
          </Button>
        </div>
      </div>
    )
  );
};

export default TicketPagination;