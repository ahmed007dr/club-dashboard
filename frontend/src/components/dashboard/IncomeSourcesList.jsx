import React from 'react';
import { useSelector } from 'react-redux';
import { FiAlertTriangle, FiList } from 'react-icons/fi';

const IncomeSourcesList = () => {
  const { incomeSources, loading, error } = useSelector((state) => state.finance || {});

  return (
    <div className="rounded-md border border-gray-200 overflow-x-auto" dir="rtl">
      {error && (
        <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 text-right mb-4">
          <FiAlertTriangle className="text-red-600 w-6 h-6" />
          <p className="text-red-600">{error}</p>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-6">
          <svg className="animate-spin h-8 w-8 text-green-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="px-4 py-3 text-right text-sm font-semibold"></th>
              <th className="px-4 py-3 text-right text-sm font-semibold">الاسم</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">الوصف</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">النادي</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">السعر</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">عنصر المخزون</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">الكمية الباقية</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">تم الإنشاء بواسطة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {incomeSources?.length ? (
              incomeSources.map((source) => (
                <tr key={source.id} className="hover:bg-gray-50 transition-all duration-200">
                  <td className="px-4 py-3">
                    <FiList className="text-green-600 w-5 h-5" />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">{source.name || 'غير متاح'}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{source.description || 'لا يوجد وصف'}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{source.club_details?.name || 'غير متاح'}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{source.price ? `${source.price} جنيه` : 'غير متاح'}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{source.stock_item?.name || 'بدون مخزون'}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{source.stock_item?.current_quantity ?? 'غير متاح'}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {source.created_by_details?.first_name && source.created_by_details?.last_name
                      ? `${source.created_by_details.first_name} ${source.created_by_details.last_name}`
                      : source.created_by_details?.username || 'غير متوفر'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-4 py-3 text-center text-gray-500">
                  لا توجد مصادر مبيعات متاحة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default IncomeSourcesList;