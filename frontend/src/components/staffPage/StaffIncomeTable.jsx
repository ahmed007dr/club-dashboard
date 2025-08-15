import React from 'react';
import { FiDollarSign } from 'react-icons/fi';

const StaffIncomeTable = ({ incomes }) => (
  <div className="rounded-md border border-gray-200 overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200" dir="rtl">
      <thead>
        <tr className="bg-gray-100 text-gray-700">
          <th className="px-4 py-3 text-right text-sm font-semibold"></th>
          <th className="px-4 py-3 text-right text-sm font-semibold">مصدر الدخل</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">عنصر المخزون</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">الكمية</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">المبلغ</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">الوصف</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">التاريخ</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">تم التسجيل بواسطة</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {incomes?.length ? incomes.map((income) => (
          <tr key={income.id} className="hover:bg-gray-50 transition-all duration-200">
            <td className="px-4 py-3">
              <FiDollarSign className="text-green-600 w-5 h-5" />
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
              {income.source_details?.name || 'غير متاح'}
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
              {income.stock_transaction_details?.stock_item_details?.name || 'غير متاح'}
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
              {income.quantity || 1}
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
              {income.amount ? `${income.amount} جنيه` : 'غير متاح'}
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
              {income.description || 'لا يوجد وصف'}
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
              {income.date || 'غير متاح'}
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
              {income.received_by_details?.first_name && income.received_by_details?.last_name
                ? `${income.received_by_details.first_name} ${income.received_by_details.last_name}`
                : income.received_by_details?.username || 'غير متوفر'}
            </td>
          </tr>
        )) : (
          <tr>
            <td colSpan="8" className="px-4 py-3 text-center text-gray-500">
              لا توجد إيرادات متاحة
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default StaffIncomeTable;