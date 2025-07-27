import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

const ShiftReportModal = ({ isOpen, onOpenChange, shiftReportData }) => {
  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'd MMMM yyyy، h:mm a', { locale: ar });
    } catch {
      return dateString || 'جارٍ';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl text-right bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-gray-800 dark:text-white">
            <Clock className="text-indigo-600 w-8 h-8" />
            تقرير الشيفتات
          </DialogTitle>
        </DialogHeader>
        <div className="scrollable-table">
          <table className="w-full text-lg">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                <th className="p-4">اسم المستخدم</th>
                <th className="p-4">الدور</th>
                <th className="p-4">بداية الشيفت</th>
                <th className="p-4">نهاية الشيفت</th>
                <th className="p-4">مدة الشيفت (ساعات)</th>
                <th className="p-4">إجمالي الإيرادات</th>
                <th className="p-4">إجمالي المصروفات</th>
                <th className="p-4">صافي الربح</th>
              </tr>
            </thead>
            <tbody>
              {shiftReportData && Array.isArray(shiftReportData) && shiftReportData.length > 0 ? (
                shiftReportData.flatMap((user) =>
                  user.shifts.map((shift) => (
                    <tr key={`${user.user_id}-${shift.shift_id}`} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="p-4 text-gray-800 dark:text-white">{user.username}</td>
                      <td className="p-4 text-gray-800 dark:text-white">{user.role}</td>
                      <td className="p-4 text-gray-800 dark:text-white">{formatDate(shift.check_in)}</td>
                      <td className="p-4 text-gray-800 dark:text-white">{shift.check_out ? formatDate(shift.check_out) : 'جارٍ'}</td>
                      <td className="p-4 text-gray-800 dark:text-white">{shift.shift_duration.toFixed(2)}</td>
                      <td className="p-4 text-gray-800 dark:text-white">{shift.total_income.toFixed(2)}</td>
                      <td className="p-4 text-gray-800 dark:text-white">{shift.total_expense.toFixed(2)}</td>
                      <td className="p-4 text-gray-800 dark:text-white">{shift.net_profit.toFixed(2)}</td>
                    </tr>
                  ))
                )
              ) : (
                <tr>
                  <td colSpan="8" className="p-4 text-center text-gray-600 dark:text-gray-300">
                    لا توجد شيفتات في النطاق الزمني المحدد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShiftReportModal;