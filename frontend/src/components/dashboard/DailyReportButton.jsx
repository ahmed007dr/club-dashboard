
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import BASE_URL from '@/config/api';
import { User, Calendar, Eye, Download, AlertTriangle, DollarSign, ShoppingCart, Loader2, Printer } from 'lucide-react';
import { format, differenceInHours, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive" className="max-w-2xl mx-auto mt-6 text-right">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>حدث خطأ</AlertTitle>
          <AlertDescription>{this.state.error?.message || 'خطأ غير معروف'}</AlertDescription>
        </Alert>
      );
    }
    return this.props.children;
  }
}

const DailyReportButton = () => {
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [employees, setEmployees] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const { user } = useSelector((state) => state.auth || {});
  const userRole = user?.role;

  useEffect(() => {
    if (userRole === 'admin' || userRole === 'owner') {
      setEmployeeLoading(true);
      api.get('accounts/api/active-users/')
        .then((response) => setEmployees(response.data || []))
        .catch((error) => {
          console.error('خطأ في جلب الموظفين:', error);
          setError('فشل في جلب قائمة الموظفين');
          setIsErrorModalOpen(true);
          toast.error('فشل في جلب قائمة الموظفين');
        })
        .finally(() => setEmployeeLoading(false));
    }
  }, [userRole]);

  const formatDateForApi = (date) => {
    return format(date, "yyyy-MM-dd'T'HH:mm", { locale: ar });
  };

  const handlePreviewReport = async () => {
    setPreviewLoading(true);
    setError('');
    setReportData(null);
    setIsErrorModalOpen(false);
    try {
      let params = {};
      if (userRole === 'admin' || userRole === 'owner') {
        if (employeeId) params.employee_id = employeeId;
        if (startDate) params.start_date = formatDateForApi(startDate);
        if (endDate) params.end_date = formatDateForApi(endDate);
        if (!startDate || !endDate) {
          throw new Error('يجب تحديد تاريخ البداية والنهاية');
        }
      }
      const response = await api.get('finance/api/employee/daily-report/', { params });
      setReportData(response.data || {});
      toast.success('تم تحميل التقرير بنجاح');
    } catch (error) {
      console.error('خطأ في جلب بيانات التقرير:', error);
      const errorMessage = error.response?.data?.error || error.message || 'حدث خطأ أثناء جلب بيانات التقرير';
      setError(errorMessage);
      setIsErrorModalOpen(true);
      toast.error(errorMessage);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setError('');
    setIsErrorModalOpen(false);
    try {
      let params = {};
      if (userRole === 'admin' || userRole === 'owner') {
        if (employeeId) params.employee_id = employeeId;
        if (startDate) params.start_date = formatDateForApi(startDate);
        if (endDate) params.end_date = formatDateForApi(endDate);
        if (!startDate || !endDate) {
          throw new Error('يجب تحديد تاريخ البداية والنهاية');
        }
      }
      const response = await api.get('finance/api/employee/daily-report/pdf/', {
        responseType: 'blob',
        params,
      });
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
      let filename = 'daily_report.pdf';
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.includes('filename=')) {
        const matches = disposition.match(/filename="([^"]+)"/);
        if (matches && matches[1]) filename = matches[1];
      }
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
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
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

  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'd MMMM yyyy، h:mm a', { locale: ar });
    } catch {
      return dateString || 'غير متوفر';
    }
  };

  return (
    <ErrorBoundary>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 print:p-0 bg-gray-50 dark:bg-gray-900 min-h-screen" dir="rtl">
        <style jsx>{`
          @media print {
            .no-print { display: none !important; }
            .print-report { margin: 0; padding: 20px; background: white; border: none; box-shadow: none; }
            .print-report table { width: 100%; border-collapse: collapse; }
            .print-report th, .print-report td { border: 1px solid #e5e7eb; padding: 8px; text-align: right; }
            .print-report th { background: #f3f4f6; font-weight: 600; }
          }
          .react-datepicker__input-container input {
            direction: rtl;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #d1d5db;
            background-color: #ffffff;
            width: 100%;
            font-size: 0.875rem;
          }
          .react-datepicker__header {
            background-color: #f3f4f6;
            border-bottom: none;
            border-radius: 4px 4px 0 0;
          }
          .react-datepicker {
            border: 1px solid #d1d5db;
            border-radius: 4px;
            font-family: inherit;
          }
          .react-datepicker__day-name, .react-datepicker__day, .react-datepicker__time-name {
            color: #1f2937;
          }
          .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected {
            background-color: #1e40af;
            color: white;
          }
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.3s ease-in-out;
          }
        `}</style>

        {isErrorModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg max-w-md w-full text-right">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="text-red-600 w-8 h-8" />
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">حدث خطأ</h3>
              </div>
              <p className="text-red-600 mb-6 text-sm">{error}</p>
              <Button
                onClick={() => setIsErrorModalOpen(false)}
                className="bg-red-600 text-white hover:bg-red-700 text-sm py-2 px-4"
              >
                إغلاق
              </Button>
            </div>
          </div>
        )}

        <Card className="shadow-sm border-gray-200 dark:border-gray-700 no-print bg-white dark:bg-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-right text-xl sm:text-2xl font-bold flex items-center gap-3 text-gray-800 dark:text-white">
              <DollarSign className="text-blue-700 bg-blue-100 p-1.5 rounded-full w-8 h-8" />
              تقرير يومي للموظف
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {(userRole === 'admin' || userRole === 'owner') ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
                      <SelectTrigger className="w-full text-right bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md py-2 text-sm">
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
                    <DatePicker
                      selected={startDate}
                      onChange={(date) => setStartDate(date)}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="d MMMM yyyy, h:mm aa"
                      locale={ar}
                      className="w-full text-right bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-600"
                      disabled={loading || previewLoading}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تاريخ النهاية
                  </label>
                  <div className="relative">
                    <DatePicker
                      selected={endDate}
                      onChange={(date) => setEndDate(date)}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="d MMMM yyyy, h:mm aa"
                      locale={ar}
                      className="w-full text-right bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-600"
                      disabled={loading || previewLoading}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <Alert className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4 rounded-lg text-right text-sm text-gray-600 dark:text-gray-400">
                <AlertDescription>
                  سيتم إنشاء تقرير لورديتك الحالية فقط (من تسجيل الحضور حتى الآن).
                </AlertDescription>
              </Alert>
            )}
            <div className="flex flex-wrap gap-3 justify-end">
              <Button
                onClick={handlePreviewReport}
                disabled={loading || previewLoading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 text-sm"
              >
                {previewLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Eye className="w-5 h-5" />}
                معاينة التقرير
              </Button>
              {reportData && (
                <>
                  <Button
                    onClick={handleGenerateReport}
                    disabled={loading}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 text-sm"
                  >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
                    تنزيل التقرير كـ PDF
                  </Button>
                  <Button
                    onClick={handlePrintReport}
                    disabled={loading || previewLoading}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-2 px-4 text-sm"
                  >
                    <Printer className="w-5 h-5" />
                    طباعة التقرير
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {reportData && (
          <Card className="mt-6 shadow-sm border-gray-200 dark:border-gray-700 print-report bg-white dark:bg-gray-800 animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-right text-lg sm:text-xl font-bold flex items-center gap-3 text-gray-800 dark:text-white">
                <Eye className="text-blue-700 bg-blue-100 p-1.5 rounded-full w-8 h-8" />
                معاينة التقرير
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg flex items-center gap-3">
                  <DollarSign className="text-blue-700 w-6 h-6" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">إجمالي الإيرادات</p>
                    <p className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">{reportData.total_income || '0'}</p>
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg flex items-center gap-3">
                  <ShoppingCart className="text-red-600 w-6 h-6" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">إجمالي النفقات</p>
                    <p className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">{reportData.total_expenses || '0'}</p>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg flex items-center gap-3">
                  <DollarSign className="text-green-600 w-6 h-6" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">صافي الربح</p>
                    <p className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">{reportData.net_profit || '0'}</p>
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
                        <th className="p-3 font-semibold text-sm">العدد</th>
                        <th className="p-3 font-semibold text-sm">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {(reportData.incomes || []).map((income, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">
                          <td className="p-3 text-gray-800 dark:text-white text-sm">{income.source || 'غير محدد'}</td>
                          <td className="p-3 text-gray-800 dark:text-white text-sm">{income.count || '0'}</td>
                          <td className="p-3 text-gray-800 dark:text-white text-sm">{income.total || '0'}</td>
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
                          <td className="p-3 text-gray-800 dark:text-white text-sm">{expense.total || '0'}</td>
                          <td className="p-3 text-gray-800 dark:text-white text-sm">{expense.description || 'لا يوجد وصف'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4">الملخص</h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2 text-sm">
                  <p className="text-gray-700 dark:text-gray-300"><strong>إجمالي الإيرادات:</strong> {reportData.total_income || '0'}</p>
                  <p className="text-gray-700 dark:text-gray-300"><strong>إجمالي النفقات:</strong> {reportData.total_expenses || '0'}</p>
                  <p className="text-gray-700 dark:text-gray-300"><strong>صافي الربح:</strong> {reportData.net_profit || '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default DailyReportButton;
