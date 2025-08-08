import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart } from 'lucide-react';
import { format, differenceInHours, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

const DailyReportPreview = ({ reportData }) => {
  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'd MMMM yyyy، h:mm a', { locale: ar });
    } catch {
      return dateString || 'جارٍ';
    }
  };

  const getShiftDuration = (checkIn, checkOut) => {
    try {
      const start = parseISO(checkIn);
      const end = parseISO(checkOut);
      const hours = differenceInHours(end, start);
      return hours > 0 ? `${hours} ساعة` : 'أقل من ساعة';
    } catch {
      return 'غير متوفر';
    }
  };

  return (
    <Card className="mt-6 shadow-sm border-gray-200 dark:border-gray-700 print-report bg-white dark:bg-gray-800 animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-right text-lg sm:text-xl font-bold flex items-center gap-3 text-gray-800 dark:text-white">
          <DollarSign className="text-blue-700 bg-blue-100 p-1.5 rounded-full w-8 h-8" />
          معاينة التقرير
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg flex items-center gap-3">
            <DollarSign className="text-blue-700 w-6 h-6" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">إجمالي الإيرادات</p>
              <p className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">{reportData.total_income?.toFixed(2) || '0'}</p>
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg flex items-center gap-3">
            <ShoppingCart className="text-red-600 w-6 h-6" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">إجمالي النفقات</p>
              <p className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">{reportData.total_expenses?.toFixed(2) || '0'}</p>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg flex items-center gap-3">
            <DollarSign className="text-green-600 w-6 h-6" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">صافي الربح</p>
              <p className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">{reportData.net_profit?.toFixed(2) || '0'}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2 text-sm">
          <p className="text-gray-700 dark:text-gray-300"><strong>اسم الموظف:</strong> {reportData.employee_name || 'غير متوفر'}</p>
          <p className="text-gray-700 dark:text-gray-300"><strong>النادي:</strong> {reportData.club_name || 'غير متوفر'}</p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>فترة الوردية:</strong> من {formatDate(reportData.check_in)} إلى {formatDate(reportData.check_out)}
          </p>
          <p className="text-gray-700 dark:text-gray-300"><strong>مدة الوردية:</strong> {getShiftDuration(reportData.check_in, reportData.check_out)}</p>
        </div>
        <div>
          <h4 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4">الإيرادات</h4>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg text-right">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                  <th className="p-3 font-semibold text-sm">البند</th>
                  <th className="p-3 font-semibold text-sm">طريقة الدفع</th>
                  <th className="p-3 font-semibold text-sm">العدد</th>
                  <th className="p-3 font-semibold text-sm">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {(reportData.incomes || []).map((income, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">
                    <td className="p-3 text-gray-800 dark:text-white text-sm">{income.source || 'غير محدد'}</td>
                    <td className="p-3 text-gray-800 dark:text-white text-sm">{income.payment_method || 'غير محدد'}</td>
                    <td className="p-3 text-gray-800 dark:text-white text-sm">{income.count || '0'}</td>
                    <td className="p-3 text-gray-800 dark:text-white text-sm">{income.total?.toFixed(2) || '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h4 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4">النفقات</h4>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg text-right">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                  <th className="p-3 font-semibold text-sm">البند</th>
                  <th className="p-3 font-semibold text-sm">القيمة</th>
                  <th className="p-3 font-semibold text-sm">الوصف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {(reportData.expenses || []).map((expense, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">
                    <td className="p-3 text-gray-800 dark:text-white text-sm">{expense.category || 'غير محدد'}</td>
                    <td className="p-3 text-gray-800 dark:text-white text-sm">{expense.total?.toFixed(2) || '0'}</td>
                    <td className="p-3 text-gray-800 dark:text-white text-sm">{expense.description || 'لا يوجد وصف'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h4 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4">طرق الدفع</h4>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg text-right">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                  <th className="p-3 font-semibold text-sm">طريقة الدفع</th>
                  <th className="p-3 font-semibold text-sm">إجمالي الإيرادات</th>
                  <th className="p-3 font-semibold text-sm">إجمالي النفقات</th>
                  <th className="p-3 font-semibold text-sm">صافي الربح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {(reportData.payment_methods || []).map((method, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">
                    <td className="p-3 text-gray-800 dark:text-white text-sm">{method.payment_method || 'غير محدد'}</td>
                    <td className="p-3 text-gray-800 dark:text-white text-sm">{method.total_income?.toFixed(2) || '0'}</td>
                    <td className="p-3 text-gray-800 dark:text-white text-sm">{method.total_expense?.toFixed(2) || '0'}</td>
                    <td className="p-3 text-gray-800 dark:text-white text-sm">{method.net_profit?.toFixed(2) || '0'}</td>
                  </tr>
                ))}
                {(!reportData.payment_methods || reportData.payment_methods.length === 0) && (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-gray-600 dark:text-gray-300">
                      لا توجد بيانات لطرق الدفع
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h4 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4">الملخص</h4>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2 text-sm">
            <p className="text-gray-700 dark:text-gray-300"><strong>إجمالي الإيرادات:</strong> {reportData.total_income?.toFixed(2) || '0'}</p>
            <p className="text-gray-700 dark:text-gray-300"><strong>إجمالي النفقات:</strong> {reportData.total_expenses?.toFixed(2) || '0'}</p>
            <p className="text-gray-700 dark:text-gray-300"><strong>صافي الربح:</strong> {reportData.net_profit?.toFixed(2) || '0'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyReportPreview;
