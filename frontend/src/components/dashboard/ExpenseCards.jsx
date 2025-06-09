import React from 'react';
import { CiEdit, CiTrash } from 'react-icons/ci';
import { MoreVertical } from 'lucide-react';
import { Button } from '../ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';

const ExpenseCards = ({ expenses, handleEditClick, handleDeleteClick, canEditExpense, canDeleteExpense }) => (
  <div className="lg:hidden space-y-4">
    {expenses?.length > 0 ? (
      expenses.map((expense, index) => (
        <div
          key={index}
          className="border border-gray-200 rounded-lg p-4 shadow-sm hover:bg-gray-50 transition-all duration-200"
        >
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">النادي</p>
              <p>{expense.club_details?.name || "غير متاح"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">الفئة</p>
              <p>{expense.category_details?.name || "غير متاح"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">المبلغ</p>
              <p>{expense.amount ? `${expense.amount} جنيه` : "غير متاح"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">التاريخ</p>
              <p>{expense.date || "غير متاح"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500">الوصف</p>
              <p>{expense.description || "غير متاح"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500">رقم الفاتورة</p>
              <p>{expense.invoice_number || "غير متاح"}</p>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            {canEditExpense && (
              <Button
                onClick={() => handleEditClick(expense)}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-yellow-600"
              >
                <CiEdit className="h-4 w-4" /> تعديل
              </Button>
            )}
            {canDeleteExpense && (
              <Button
                onClick={() => handleDeleteClick(expense.id)}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-red-600"
              >
                <CiTrash className="h-4 w-4" /> حذف
              </Button>
            )}
          </div>
        </div>
      ))
    ) : (
      <div className="border rounded-lg p-4 text-center text-sm text-gray-500 bg-white">
        لا توجد مصروفات متاحة
      </div>
    )}
  </div>
);

export default ExpenseCards;