import React from "react";
import { Button } from "@/components/ui/button";

const PaginationControls = ({
  currentPage,
  totalPages,
  totalItems,
  paginationRange,
  handlePageChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 space-y-4 sm:space-y-0" dir="rtl">
      <span className="text-sm text-gray-600">
        صفحة {currentPage} من {totalPages} (إجمالي: {totalItems} اشتراك)
      </span>
      <div className="flex gap-2 flex-wrap justify-center">
        <Button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className={currentPage === 1 ? "bg-gray-300 text-gray-500" : "bg-blue-600 hover:bg-blue-700"}
        >
          الأول
        </Button>
        <Button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={currentPage === 1 ? "bg-gray-300 text-gray-500" : "bg-blue-600 hover:bg-blue-700"}
        >
          السابق
        </Button>
        {paginationRange.map((page) => (
          <Button
            key={page}
            onClick={() => handlePageChange(page)}
            className={currentPage === page ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}
          >
            {page}
          </Button>
        ))}
        <Button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={currentPage === totalPages ? "bg-gray-300 text-gray-500" : "bg-blue-600 hover:bg-blue-700"}
        >
          التالي
        </Button>
        <Button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={currentPage === totalPages ? "bg-gray-300 text-gray-500" : "bg-blue-600 hover:bg-blue-700"}
        >
          الأخير
        </Button>
      </div>
    </div>
  );
};

export default PaginationControls;