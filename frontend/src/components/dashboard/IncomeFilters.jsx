import React from 'react';
import { FiList, FiSearch, FiCalendar } from 'react-icons/fi';
import { Button } from '../ui/button';

const IncomeFilters = ({ filters, incomeSources, handleFilterChange, handleReset, handleCalculateTotal }) => {
  const labelMapping = {
    source: 'مصدر الدخل',
    amount: 'المبلغ',
    description: 'الوصف',
    startDate: 'من',
    endDate: 'إلى',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
      <div className="relative">
        <label className="block text-sm font-medium mb-1 text-right">{labelMapping.source}</label>
        <div className="relative">
          <FiList className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            name="source"
            value={filters.source}
            onChange={handleFilterChange}
            className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
          >
            <option value="">الكل</option>
            {incomeSources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
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
            className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
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
            className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
          />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <Button
          onClick={handleReset}
          variant="outline"
          className="w-full"
        >
          إعادة تعيين
        </Button>
        <Button
          onClick={handleCalculateTotal}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          حساب الإجمالي
        </Button>
      </div>
    </div>
  );
};

export default IncomeFilters;