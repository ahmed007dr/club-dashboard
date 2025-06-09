import React from 'react';
import { FiDollarSign } from 'react-icons/fi';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';

const IncomeTable = ({ incomes, handleEditClick, handleDeleteClick }) => (
  <div className="hidden lg:block rounded-md border border-gray-200">
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr className="bg-gray-100 text-gray-700">
          <th className="px-4 py-3 text-right text-sm font-semibold"></th>
          <th className="px-4 py-3 text-right text-sm font-semibold">مصدر الدخل</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">المبلغ</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">الوصف</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">التاريخ</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">المستلم</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">الإجراءات</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {incomes?.map((income) => (
          <tr key={income.id} className="hover:bg-gray-50 transition-all duration-200">
            <td className="px-4 py-3">
              <FiDollarSign className="text-green-600 w-5 h-5" />
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
              {income.source_details?.name || "غير متاح"}
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
              {income.amount ? `${income.amount} جنيه` : "غير متاح"}
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
              {income.description || "لا يوجد وصف"}
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
              {income.date || "غير متاح"}
            </td>
            <td className="px-4 py-3 text-sm text-gray-800">
              {income.received_by_details?.username || "غير متاح"}
            </td>
            <td className="px-4 py-3 text-sm flex gap-2 justify-end">
              <DropdownMenu dir="rtl">
                <DropdownMenuTrigger asChild>
                  <button className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full hover:bg-gray-300 transition-all duration-200">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => handleEditClick(income)}
                    className="cursor-pointer text-yellow-600 hover:bg-yellow-50"
                  >
                    تعديل
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteClick(income.id)}
                    className="cursor-pointer text-red-600 hover:bg-red-50"
                  >
                    حذف
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default IncomeTable;