import React from "react";
import { FiDollarSign } from "react-icons/fi";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";

const ExpenseTable = ({ expenses, handleEditClick, handleDeleteClick, canEditExpense, canDeleteExpense }) => (
  <div className="hidden lg:block rounded-md border border-gray-200 overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr className="bg-teal-50 text-gray-700">
          <th className="px-4 py-3 text-right text-sm font-semibold"></th>
          <th className="px-4 py-3 text-right text-sm font-semibold">الفئة</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">المبلغ</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">الوصف</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">التاريخ</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">الموظف</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">الإجراءات</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {expenses?.length > 0 ? (
          expenses.map((expense) => (
            <tr key={expense.id} className="hover:bg-teal-50 transition-all duration-200">
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
                {expense.related_employee_details?.first_name && expense.related_employee_details?.last_name
                  ? `${expense.related_employee_details.first_name} ${expense.related_employee_details.last_name}`
                  : expense.related_employee_details?.username || expense.paid_by_details?.username || "غير متاح"}
              </td>
              <td className="px-4 py-3 text-sm flex gap-2 justify-end">
                <DropdownMenu dir="rtl">
                  <DropdownMenuTrigger asChild>
                    <button className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full hover:bg-gray-300 transition-all duration-200">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {canEditExpense && (
                      <DropdownMenuItem
                        onClick={() => handleEditClick(expense)}
                        className="cursor-pointer text-yellow-600 hover:bg-yellow-50"
                      >
                        تعديل
                      </DropdownMenuItem>
                    )}
                    {canDeleteExpense && (
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(expense.id)}
                        className="cursor-pointer text-red-600 hover:bg-red-50"
                      >
                        حذف
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7" className="px-4 py-3 text-center text-sm text-gray-500">
              لا توجد مصروفات متاحة
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default ExpenseTable;
