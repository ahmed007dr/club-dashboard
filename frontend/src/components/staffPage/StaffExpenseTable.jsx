import React from "react";
import { FiDollarSign } from "react-icons/fi";

const StaffExpenseTable = ({ expenses }) => (
  <div className="rounded-md border border-gray-200 overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200" dir="rtl">
      <thead>
        <tr className="bg-gray-100 text-gray-700">
          <th className="px-4 py-3 text-right text-sm font-semibold"></th>
          <th className="px-4 py-3 text-right text-sm font-semibold">الفئة</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">المبلغ</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">الوصف</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">التاريخ</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">موظف الشيفت</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">الموظف المرتبط</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {expenses?.length ? expenses.map((expense) => (
          <tr key={expense.id} className="hover:bg-gray-50 transition-all duration-200">
            <td className="px-4 py-3">
              <FiDollarSign className="text-teal-600 w-5 h-5" />
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
              {expense.category_details?.name || expense.category_name || "غير متاح"}
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
              {expense.amount ? `${expense.amount} جنيه` : "غير متاح"}
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
              {expense.description || "غير متاح"}
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
              {expense.date || "غير متاح"}
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
              {expense.paid_by_details?.first_name && expense.paid_by_details?.last_name
                ? `${expense.paid_by_details.first_name} ${expense.paid_by_details.last_name}`
                : expense.paid_by_details?.username || expense.paid_by_username || 'غير متاح'}
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
              {expense.related_employee_username ||
                (expense.related_employee_details?.first_name && expense.related_employee_details?.last_name
                  ? `${expense.related_employee_details.first_name} ${expense.related_employee_details.last_name}`
                  : expense.related_employee_details?.username || 'غير محدد')}
            </td>
          </tr>
        )) : (
          <tr>
            <td colSpan="7" className="px-4 py-3 text-center text-gray-500">
              لا توجد مصروفات متاحة
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default StaffExpenseTable;