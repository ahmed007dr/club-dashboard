import React from 'react';
import { FiSearch } from 'react-icons/fi';
import { Button } from '../ui/button';

const CategoryFilters = ({ filters, handleFilterChange, handleReset }) => {
  const labelMapping = {
    name: 'الاسم',
    description: 'الوصف',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
      {["name", "description"].map((field) => (
        <div key={field} className="relative">
          <label className="block text-sm font-medium mb-1 text-right">{labelMapping[field]}</label>
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name={field}
              value={filters[field]}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all duration-200 text-right"
              placeholder={`ابحث بـ ${labelMapping[field]}`}
            />
          </div>
        </div>
      ))}
      <div className="flex items-end">
        <Button
          onClick={handleReset}
          variant="outline"
          className="w-full text-sm"
        >
          إعادة تعيين
        </Button>
      </div>
    </div>
  );
};

export default CategoryFilters;