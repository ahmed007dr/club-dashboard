import React from 'react';
import { FiCalendar, FiList, FiSearch } from 'react-icons/fi';
import { Button } from '../ui/button';

const SummaryFilters = ({ summaryFilters, incomeSources, handleFilterChange, handleTotalCalculation, user }) => (
  <div className="border-t pt-4">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      <div className="relative">
        <label className="block text-sm font-medium mb-1 text-right">من</label>
        <div className="relative">
          <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="date"
            name="startDate"
            value={summaryFilters.startDate}
            onChange={handleFilterChange}
            className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
            pattern="\d{4}-\d{2}-\d{2}"
          />
        </div>
      </div>
      <div className="relative">
        <label className="block text-sm font-medium mb-1 text-right">إلى</label>
        <div className="relative">
          <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="date"
            name="endDate"
            value={summaryFilters.endDate}
            onChange={handleFilterChange}
            className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
            pattern="\d{4}-\d{2}-\d{2}"
          />
        </div>
      </div>
      <div className="relative">
        <label className="block text-sm font-medium mb-1 text-right">مصدر الدخل</label>
        <div className="relative">
          <FiList className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            name="sourceId"
            value={summaryFilters.sourceId}
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
      <div className="flex items-end">
        <Button
          onClick={handleTotalCalculation}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          <FiSearch className="w-5 h-5 mr-2" />
          حساب الإجمالي
        </Button>
      </div>
    </div>
  </div>
);

export default SummaryFilters;