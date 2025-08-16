import React, { useState, useEffect } from 'react';
import { FiDownload } from 'react-icons/fi';
import { Button } from '../ui/button';
import { fetchSubscriptionReport, fetchExportSubscriptionReport } from '../../config/api';
import BASE_URL from '@/config/api';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import * as XLSX from 'xlsx';

const SubscriptionReportTable = ({ title, dataKey, initialData, columns, params }) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 20; // نفس قيمة paginator.page_size في الـ backend
  const totalPages = Math.ceil(data.count / pageSize);

  // تحديث البيانات عند تغيير الصفحة
  const handlePageChange = async (page) => {
    if (page < 1 || page > totalPages) return;
    setLoading(true);
    try {
      const url = `${BASE_URL}members/api/members/subscription-report/?days=${params.days}&inactive_days=${params.inactive_days}&page=${page}`;
      const newData = await fetchSubscriptionReport(params, url);
      setData(newData[dataKey]);
      setCurrentPage(page);
    } catch (err) {
      console.error('خطأ في تحميل الصفحة:', err);
    } finally {
      setLoading(false);
    }
  };

  // تنسيق التاريخ بالعربية
  const formatDate = (dateString) => {
    if (!dateString) return 'غير متوفر';
    try {
      const date = parseISO(dateString);
      return format(date, 'd MMMM yyyy', { locale: ar });
    } catch {
      return dateString;
    }
  };

  // تصدير البيانات إلى Excel
  const handleExportExcel = async () => {
    setLoading(true);
    try {
//       console.log('جاري جلب كل البيانات للتصدير:', title);
      const response = await fetchExportSubscriptionReport(params);
      const allData = response[dataKey].results;
//       console.log('عدد السجلات المصدرة:', allData.length);

      const headers = columns.map(col => col.header);
      const rows = allData.map(item =>
        columns.map(col =>
          col.accessor.includes('date') ? formatDate(item[col.accessor]) : item[col.accessor] || 'غير متوفر'
        )
      );

      const worksheet = XLSX.utils.json_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, title);
      XLSX.writeFile(workbook, `${title.replace(/\s/g, '_')}.xlsx`);
    } catch (err) {
      console.error('خطأ في تصدير البيانات:', err);
    } finally {
      setLoading(false);
    }
  };

  // عرض أرقام الصفحات
  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          onClick={() => handlePageChange(i)}
          disabled={loading || i === currentPage}
          className={cn(
            'mx-1',
            i === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
          )}
        >
          {i}
        </Button>
      );
    }

    return (
      <div className="flex justify-center items-center mt-4">
        <Button
          disabled={currentPage === 1 || loading}
          onClick={() => handlePageChange(currentPage - 1)}
          className={cn("mx-1 bg-gray-600 hover:bg-gray-700")}
        >
          السابق
        </Button>
        {pages}
        <Button
          disabled={currentPage === totalPages || loading}
          onClick={() => handlePageChange(currentPage + 1)}
          className={cn("mx-1 bg-gray-600 hover:bg-gray-700")}
        >
          التالي
        </Button>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title} ({data.count})</h3>
        <Button
          onClick={handleExportExcel}
          className={cn("flex items-center gap-2 bg-green-600 hover:bg-green-700")}
          disabled={loading}
        >
          <FiDownload className="w-5 h-5" />
          تصدير إلى Excel
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
      {renderPagination()}
    </div>
  );
};

export default SubscriptionReportTable;