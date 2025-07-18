import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import BASE_URL from '@/config/api';
import { User, Calendar, Eye, Download, AlertTriangle, DollarSign, ShoppingCart, Loader2, Printer } from 'lucide-react';
import { format, differenceInHours, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


// إعداد axios مع BASE_URL وإضافة interceptor للتوكن
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ErrorBoundary للتعامل مع الأخطاء
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
  const [activeTab, setActiveTab] = useState('summary');

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
      toast.error(errorMessage);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setError('');
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
      <div className="max-w-6xl mx-auto p-6 print:p-0 print:bg-white" dir="rtl">
        <style jsx>{`
          @media print {
            .no-print { display: none !important; }
            .print-report { margin: 0; padding: 20px; background: white; border: none; box-shadow: none; }
            .print-report table { width: 100%; border-collapse: collapse; }
            .print-report th, .print-report td { border: 1px solid #e5e7eb; padding: 12px; text-align: right; }
            .print-report th { background: #f3f4f6; font-weight: bold; }
            .print-report h4 { font-size: 1.25rem; margin-bottom: 1rem; }
          }
          .react-datepicker__input-container input {
            direction: rtl;
            padding: 10px;
            border-radius: 8px;
            border: 1px solid #d1d5db;
            width: 100%;
            background: white;
          }
          .react-datepicker__header {
            background-color: #f3f4f6;
            border-bottom: none;
          }
          .custom-tabs {
            border-bottom: 2px solid #e5e7eb;
          }
          .custom-tabs button {
            padding: 10px 20px;
            font-size: 1.1rem;
            font-weight: 500;
          }
        `}</style>

        {error && (
          <Alert variant="destructive" className="max-w-2xl mx-auto mb-6 text-right">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>حدث خطأ</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg border-gray-200 dark:border-gray-700 mb-8 no-print">
          <CardHeader>
            <CardTitle className="text-right text-3xl font-bold flex items-center gap-3 text-gray-800 dark:text-white">
              <DollarSign className="text-blue-600 bg-blue-100 p-2 rounded-full w-10 h-10" />
              تقرير يومي للموظف
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {(userRole === 'admin' || userRole === 'owner') ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      <SelectTrigger className="w-full text-right bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg py-3">
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
                      className="w-full text-right bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg py-3"
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
                    <DatePicker
                      selected={endDate}
                      onChange={(date) => setEndDate(date)}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="d MMMM yyyy, h:mm aa"
                      locale={ar}
                      className="w-full text-right bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg py-3"
                      disabled={loading || previewLoading}
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>
              </div>
            ) : (
              <Alert className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <AlertDescription className="text-right text-gray-600 dark:text-gray-400">
                  سيتم إنشاء تقرير لورديتك الحالية فقط (من تسجيل الحضور حتى الآن).
                </AlertDescription>
              </Alert>
            )}
            <div className="flex gap-4 justify-end">
              <Button
                onClick={handlePreviewReport}
                disabled={loading || previewLoading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 py-3 px-6"
              >
                {previewLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Eye className="w-5 h-5" />}
                معاينة التقرير
              </Button>
              {reportData && (
                <>
                  <Button
                    onClick={handleGenerateReport}
                    disabled={loading}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 py-3 px-6"
                  >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
                    تنزيل التقرير
                  </Button>
                  <Button
                    onClick={handlePrintReport}
                    disabled={loading || previewLoading}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 py-3 px-6"
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
          <Card className="shadow-lg border-gray-200 dark:border-gray-700 print-report">
            <CardHeader>
              <CardTitle className="text-right text-2xl font-bold flex items-center gap-3 text-gray-800 dark:text-white">
                <Eye className="text-blue-600 bg-blue-100 p-2 rounded-full w-10 h-10" />
                تقرير يومي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab} className="custom-tabs">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6">
                  <TabsTrigger value="summary" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg">
                    الإجماليات
                  </TabsTrigger>
                  <TabsTrigger value="details" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg">
                    التفاصيل
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="summary">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <Card className="bg-blue-50 dark:bg-blue-900 border-none">
                        <CardContent className="p-6 flex items-center gap-4">
                          <DollarSign className="text-blue-600 w-8 h-8" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">إجمالي الإيرادات</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{reportData.total_income || '0'}</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-red-50 dark:bg-red-900 border-none">
                        <CardContent className="p-6 flex items-center gap-4">
                          <ShoppingCart className="text-red-600 w-8 h-8" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">إجمالي المصروفات</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{reportData.total_expenses || '0'}</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-50 dark:bg-green-900 border-none">
                        <CardContent className="p-6 flex items-center gap-4">
                          <DollarSign className="text-green-600 w-8 h-8" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">صافي الربح</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{reportData.net_profit || '0'}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <Card className="bg-gray-50 dark:bg-gray-800 border-none">
                      <CardContent className="p-6 space-y-4">
                        <p className="text-gray-700 dark:text-gray-300"><strong>اسم الموظف:</strong> {reportData.employee_name || 'غير متوفر'}</p>
                        <p className="text-gray-700 dark:text-gray-300"><strong>النادي:</strong> {reportData.club_name || 'غير متوفر'}</p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>فترة الوردية:</strong> من {formatDate(reportData.check_in)} إلى {formatDate(reportData.check_out)}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300"><strong>مدة الوردية:</strong> {getShiftDuration(reportData.check_in, reportData.check_out)}</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="details">
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">تفاصيل الإيرادات</h4>
                      {(reportData.incomes && reportData.incomes.length > 0) ? (
                        <Table className="border border-gray-200 dark:border-gray-700 rounded-lg">
                          <TableHeader>
                            <TableRow className="bg-gray-100 dark:bg-gray-900">
                              <TableHead className="text-right font-bold text-gray-700 dark:text-gray-300">المصدر</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 dark:text-gray-300">العدد</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 dark:text-gray-300">الإجمالي</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 dark:text-gray-300">التاريخ</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.incomes.map((income, index) => (
                              <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">
                                <TableCell>{income.source || 'غير محدد'}</TableCell>
                                <TableCell>{income.count || '0'}</TableCell>
                                <TableCell>{income.total || '0'}</TableCell>
                                <TableCell>{formatDate(income.date)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <Alert className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          <AlertDescription className="text-right">لا توجد إيرادات متاحة لهذه الفترة.</AlertDescription>
                        </Alert>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">تفاصيل المصروفات</h4>
                      {(reportData.expenses && reportData.expenses.length > 0) ? (
                        <Table className="border border-gray-200 dark:border-gray-700 rounded-lg">
                          <TableHeader>
                            <TableRow className="bg-gray-100 dark:bg-gray-900">
                              <TableHead className="text-right font-bold text-gray-700 dark:text-gray-300">الفئة</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 dark:text-gray-300">القيمة</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 dark:text-gray-300">الوصف</TableHead>
                              <TableHead className="text-right font-bold text-gray-700 dark:text-gray-300">التاريخ</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.expenses.map((expense, index) => (
                              <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">
                                <TableCell>{expense.category || 'غير محدد'}</TableCell>
                                <TableCell>{expense.total || '0'}</TableCell>
                                <TableCell>{expense.description || 'لا يوجد وصف'}</TableCell>
                                <TableCell>{formatDate(expense.date)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <Alert className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          <AlertDescription className="text-right">لا توجد مصروفات متاحة لهذه الفترة.</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default DailyReportButton;