import React from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { MoreVertical } from 'lucide-react';
import { Button } from '../ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';

const IncomeCards = ({ incomes, handleEditClick, handleDeleteClick }) => (
  <div className="lg:hidden space-y-4">
    {incomes?.map((income) => (
      <div
        key={income.id}
        className="border border-gray-200 rounded-lg p-4 shadow-sm hover:bg-gray-50 transition-all duration-200"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">مصدر الدخل</p>
              <p className="text-sm text-gray-800">
                {income.source_details?.name || "غير متاح"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">المبلغ</p>
              <p className="text-sm text-gray-800">
                {income.amount ? `${income.amount} جنيه` : "غير متاح"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">طريقة الدفع</p>
              <p className="text-sm text-gray-800">
                {income.payment_method || "غير محدد"}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">الوصف</p>
              <p className="text-sm text-gray-800">
                {income.description || "لا يوجد وصف"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <FiCalendar className="text-gray-500 w-5 h-5" />
              <div>
                <p className="text-xs text-gray-500">التاريخ</p>
                <p className="text-sm text-gray-800">
                  {income.date || "غير متاح"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FiUser className="text-gray-500 w-5 h-5" />
              <div>
                <p className="text-xs text-gray-500">المستلم</p>
                <p className="text-sm text-gray-800">
                  {income.received_by_details?.username || "غير متاح"}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                الإجراءات
                <MoreVertical className="h-4 w-4" />
              </Button>
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
        </div>
      </div>
    ))}
  </div>
);

export default IncomeCards;