import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import BASE_URL from '../../config/api';
import { User, Calendar, Eye, Download, AlertTriangle, DollarSign, ShoppingCart, Loader2, Printer } from 'lucide-react';
import { format, differenceInHours, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';

// ملاحظة: لو عايز تستخدم Alert من @shadcn، شغّل الأمر:
// npx shadcn@latest add alert
// وبعدها استورد:
// import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const DailyReportButton = () => {
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [employees, setEmployees] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  // جلب دور المستخدم من Redux
  const { user } = useSelector((state) => state.auth || {});
  const userRole = user?.role;

  // جلب قائمة الموظفين النشطين لـ admin و owner
  useEffect(() => {
    if (userRole === 'admin' || userRole === 'owner') {
      setEmployeeLoading(true);
      axios
        .get(`${BASE_URL}accounts/api/active-users/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })
        .then((response) => {
          setEmployees(response.data || []);
        })
        .catch((error) => {
          console.error('خطأ في جلب الموظفين:', error);
          setError('فشل في جلب قائمة الموظفين');
          setIsErrorModalOpen(true);
        })
        .finally(() => {
          setEmployeeLoading(false);
        });
    }
  }, [userRole]);

  // جلب بيانات التقرير للمعاينة
  const handlePreviewReport = async () => {
    setPreviewLoading(true);
    setError('');
    setReportData(null);
    setIsErrorModalOpen(false);
    try {
      const url = `${BASE_URL}finance/api/employee/daily-report/`;
      let params = {};

      if (userRole === 'admin' || userRole === 'owner') {
        if (employeeId) params.employee_id = employeeId;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (!startDate || !endDate) {
          throw new Error('يجب تحديد تاريخ البداية والنهاية');
        }
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        params,
      });

      setReportData(response.data || {});
    } catch (error) {
      console.error('خطأ في جلب بيانات التقرير:', error);
      const errorMessage = error.response?.data?.error || error.message || 'حدث خطأ أثناء جلب بيانات التقرير';
      setError(errorMessage);
      setIsErrorModalOpen(true);
    } finally {
      setPreviewLoading(false);
    }
  };

  // تنزيل ملف PDF
  const handleGenerateReport = async () => {
    setLoading(true);
    setError('');
    setIsErrorModalOpen(false);
    try {
      const url = `${BASE_URL}finance/api/employee/daily-report/pdf/`;
      let params = {};

      if (userRole === 'admin' || userRole === 'owner') {
        if (employeeId) params.employee_id = employeeId;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (!startDate || !endDate) {
          throw new Error('يجب تحديد تاريخ البداية والنهاية');
        }
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        responseType: 'blob',
        params,
      });

      // التحقق من نوع المحتوى
      const contentType = response.headers['content-type'];
      if (contentType !== 'application/pdf') {
        const text = await response.data.text();
        try {
          const json = JSON.parse(text);
          throw new Error(json.error || 'استجابة غير متوقعة من الخادم');
        } catch (e) {
          throw new Error(`الاستجابة ليست ملف PDF صالح: ${text}`);
        }
      }

      // استخراج اسم الملف
      let filename = 'daily_report.pdf';
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.includes('filename=')) {
        const matches = disposition.match(/filename="([^"]+)"/);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // إنشاء رابط التنزيل
      const urlBlob = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = urlBlob;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);

      toast.success('تم تنزيل التقرير بنجاح');
    } catch (error) {
      console.error('خطأ في إنشاء التقرير:', error);
      const errorMessage = error.message || 'حدث خطأ أثناء إنشاء التقرير';
      setError(errorMessage);
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // طباعة التقرير
  const handlePrintReport = () => {
    window.print();
  };

  // حساب مدة الوردية بالساعات
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

  // تنسيق التاريخ بالعربية
  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'd MMMM yyyy، h:mm a', { locale: ar });
    } catch {
      return dateString || 'غير متوفر';
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 print:p-0 print:bg-white" dir="rtl">
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-report {
            margin: 0;
            padding: 20px;
            background: white;
            border: none;
            box-shadow: none;
          }
          .print-report table {
            width: 100%;
            border-collapse: collapse;
          }
          .print-report th, .print-report td {
            border: 1px solid #e5e7eb;
            padding: 8px;
            text-align: right;
          }
          .print-report th {
            background: #f3f4f6;
          }
        }
      `}</style>

      {/* Error Modal */}
      {isErrorModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg max-w-md w-full text-right">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-600 w-8 h-8" />
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">حدث خطأ</h3>
            </div>
            <p className="text-red-600 mb-6">{error}</p>
            <Button
              onClick={() => setIsErrorModalOpen(false)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              إغلاق
            </Button>
          </div>
        </div>
      )}

      {/* Main Card */}
      <Card className="shadow-sm border-gray-200 dark:border-gray-700 no-print">
        <CardHeader className="pb-3">
          <CardTitle className="text-right text-2xl flex items-center gap-3 text-gray-800 dark:text-white">
            <DollarSign className="text-blue-700 bg-blue-100 p-1.5 rounded-full w-8 h-8" />
            تقرير يومي للموظف
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Section */}
          {(userRole === 'admin' || userRole === 'owner') ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label htmlFor="employeeSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  اختيار الموظف
                </label>
                <div className="relative">
                  <Select
                    value={employeeId}
                    onValueChange={setEmployeeId}
                    disabled={employeeLoading || loading || previewLoading}
                  >
                    <SelectTrigger className="w-full text-right bg-white dark:bg-gray-800 text-gray-700 dark:text-white border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder={employeeLoading ? 'جارٍ تحميل الموظفين...' : 'اختر موظفًا'} />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.first_name || employee.last_name
                            ? `${employee.first_name} ${employee.last_name}`
                            : employee.username} (RFID: {employee.rfid_code || 'غير متوفر'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تاريخ البداية
                </label>
                <div className="relative">
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-right bg-white dark:bg-gray-800 text-gray-700 dark:text-white border-gray-300 dark:border-gray-600"
                    disabled={loading || previewLoading}
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تاريخ النهاية
                </label>
                <div className="relative">
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-right bg-white dark:bg-gray-800 text-gray-700 dark:text-white border-gray-300 dark:border-gray-600"
                    disabled={loading || previewLoading}
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 text-right text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              سيتم إنشاء تقرير لورديتك الحالية فقط (من تسجيل الحضور حتى الآن).
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button
              onClick={handlePreviewReport}
              disabled={loading || previewLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {previewLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Eye className="w-5 h-5" />}
              معاينة التقرير
            </Button>
            {reportData && (
              <>
                <Button
                  onClick={handleGenerateReport}
                  disabled={loading}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
                  تنزيل التقرير كـ PDF
                </Button>
                <Button
                  onClick={handlePrintReport}
                  disabled={loading || previewLoading}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400"
                >
                  <Printer className="w-5 h-5" />
                  طباعة التقرير
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Preview Section */}
      {reportData && (
        <Card className="mt-6 shadow-sm border-gray-200 dark:border-gray-700 print-report">
          <CardHeader className="pb-3">
            <CardTitle className="text-right text-xl flex items-center gap-3 text-gray-800 dark:text-white">
              <Eye className="text-blue-700 bg-blue-100 p-1.5 rounded-full w-8 h-8" />
              معاينة التقرير
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg flex items-center gap-3">
                <DollarSign className="text-blue-700 w-6 h-6" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">إجمالي الإيرادات</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">{reportData.total_income || '0'}</p>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg flex items-center gap-3">
                <ShoppingCart className="text-red-600 w-6 h-6" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">إجمالي النفقات</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">{reportData.total_expenses || '0'}</p>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg flex items-center gap-3">
                <DollarSign className="text-green-600 w-6 h-6" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">صافي الربح</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">{reportData.net_profit || '0'}</p>
                </div>
              </div>
            </div>

            {/* Report Details */}
            <div className="space-y-6">
              <div>
                <p className="text-gray-700 dark:text-gray-300"><strong>اسم الموظف:</strong> {reportData.employee_name || 'غير متوفر'}</p>
                <p className="text-gray-700 dark:text-gray-300"><strong>النادي:</strong> {reportData.club_name || 'غير متوفر'}</p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>فترة الوردية:</strong> من {formatDate(reportData.check_in)} إلى {formatDate(reportData.check_out)}
                </p>
                <p className="text-gray-700 dark:text-gray-300"><strong>مدة الوردية:</strong> {getShiftDuration(reportData.check_in, reportData.check_out)}</p>
              </div>

              {/* Incomes Table */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">الإيرادات</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg text-right">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                        <th className="p-3 font-semibold">البند</th>
                        <th className="p-3 font-semibold">العدد</th>
                        <th className="p-3 font-semibold">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {(reportData.incomes || []).map((income, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">
                          <td className="p-3 text-gray-800 dark:text-white">{income.source || 'غير محدد'}</td>
                          <td className="p-3 text-gray-800 dark:text-white">{income.count || '0'}</td>
                          <td className="p-3 text-gray-800 dark:text-white">{income.total || '0'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expenses Table */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">النفقات</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg text-right">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                        <th className="p-3 font-semibold">البند</th>
                        <th className="p-3 font-semibold">القيمة</th>
                        <th className="p-3 font-semibold">الوصف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {(reportData.expenses || []).map((expense, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">
                          <td className="p-3 text-gray-800 dark:text-white">{expense.category || 'غير محدد'}</td>
                          <td className="p-3 text-gray-800 dark:text-white">{expense.total || '0'}</td>
                          <td className="p-3 text-gray-800 dark:text-white">{expense.description || 'لا يوجد وصف'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">الملخص</h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                  <p className="text-gray-700 dark:text-gray-300"><strong>إجمالي الإيرادات:</strong> {reportData.total_income || '0'}</p>
                  <p className="text-gray-700 dark:text-gray-300"><strong>إجمالي النفقات:</strong> {reportData.total_expenses || '0'}</p>
                  <p className="text-gray-700 dark:text-gray-300"><strong>صافي الربح:</strong> {reportData.net_profit || '0'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DailyReportButton;