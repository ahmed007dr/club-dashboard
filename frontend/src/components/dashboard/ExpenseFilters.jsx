import React from 'react';
import { FiList, FiCalendar } from 'react-icons/fi';
import { Button } from '../ui/button';

const ExpenseFilters = ({ filters, expenseCategories, handleFilterChange, handleReset, handleCalculateTotal }) => {
  const labelMapping = {
    category: 'فئة المصروف',
    startDate: 'من',
    endDate: 'إلى',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
      <div className="relative">
        <label className="block text-sm font-medium mb-1 text-right">{labelMapping.category}</label>
        <div className="relative">
          <FiList className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all duration-200 text-right"
          >
            <option value="">الكل</option>
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="relative">
        <label className="block text-sm font-medium mb-1 text-right">{labelMapping.startDate}</label>
        <div className="relative">
          <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all duration-200 text-right"
          />
        </div>
      </div>
      <div className="relative">
        <label className="block text-sm font-medium mb-1 text-right">{labelMapping.endDate}</label>
        <div className="relative">
          <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all duration-200 text-right"
          />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <Button
          onClick={handleReset}
          variant="outline"
          className="w-full text-sm"
        >
          إعادة تعيين
        </Button>
        <Button
          onClick={handleCalculateTotal}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm"
        >
          حساب الإجمالي
        </Button>
      </div>
    </div>
  );
};

export default ExpenseFilters;