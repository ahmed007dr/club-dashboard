import React, { useState, useEffect } from 'react';
import { FiDownload } from 'react-icons/fi';
import { Button } from '../ui/button';
import { exportToCSV } from '../../lib/utils';
import { fetchSubscriptionReport } from '../../config/api';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '../../lib/utils';

const SubscriptionReportTable = ({ title, dataKey, initialData, columns, params }) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const handlePageChange = async (url) => {
    if (!url) return;
    setLoading(true);
    try {
      const newData = await fetchSubscriptionReport(params, url);
      setData(newData[dataKey]);
    } catch (err) {
      console.error('خطأ في تحميل الصفحة:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'غير متوفر';
    try {
      const date = parseISO(dateString);
      return format(date, 'd MMMM yyyy', { locale: ar });
    } catch {
      return dateString;
    }
  };

  const handleExportCSV = async () => {
    setLoading(true);
    try {
      console.log('Fetching all data for export:', title);
      const response = await fetchExportSubscriptionReport(params);
      const allData = response[dataKey].results;
      console.log('Total data count for export:', allData.length);
  
      const headers = columns.map(col => col.header);
      const rows = allData.map(item =>
        columns.map(col =>
          col.accessor.includes('date') ? formatDate(item[col.accessor]) : item[col.accessor] || 'غير متوفر'
        )
      );
      exportToCSV([headers, ...rows], `${title.replace(/\s/g, '_')}.csv`);
    } catch (err) {
      console.error('خطأ في تصدير البيانات:', err);
    } finally {
      setLoading(false);
    }
  };
  
    console.log('Final data count for export:', allData.length);

    const headers = columns.map(col => col.header);
    const rows = allData.map(item =>
      columns.map(col =>
        col.accessor.includes('date') ? formatDate(item[col.accessor]) : item[col.accessor] || 'غير متوفر'
      )
    );
    exportToCSV([headers, ...rows], `${title.replace(/\s/g, '_')}.csv`);
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title} ({data.count})</h3>
        <Button
          onClick={handleExportCSV}
          className={cn("flex items-center gap-2 bg-green-600 hover:bg-green-700")}
          disabled={loading}
        >
          <FiDownload className="w-5 h-5" />
          تصدير إلى CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 rounded-lg text-right">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              {columns.map((col, index) => (
                <th key={index} className="p-3 font-semibold">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.results.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-all duration-200">
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="p-3 text-gray-800">
                  {col.accessor.includes('date')
                    ? formatDate(item[col.accessor])
                    : item[col.accessor] || 'غير متوفر'}
                </td>
              ))}
            </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between mt-4">
        <Button
          disabled={!data.previous || loading}
          onClick={() => handlePageChange(data.previous)}
          className={cn("bg-gray-600 hover:bg-gray-700")}
        >
          الصفحة السابقة
        </Button>
        <Button
          disabled={!data.next || loading}
          onClick={() => handlePageChange(data.next)}
          className={cn("bg-gray-600 hover:bg-gray-700")}
        >
          الصفحة التالية
        </Button>
      </div>
    </div>
  );
};

export default SubscriptionReportTable;