import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import BASE_URL from '@/config/api';
import ErrorBoundary from '../reports/ErrorBoundary';
import ReportFilters from '../reports/ReportFilters';
import ReportActions from '../reports/ReportActions';
import DailyReportPreview from '../reports/DailyReportPreview';
import ShiftReportModal from '../reports/ShiftReportModal';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign } from 'lucide-react';
import '../reports/styles.css';

// تعريف axios محليًا باستخدام BASE_URL
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const DailyReportButton = () => {
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [employees, setEmployees] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [shiftReportData, setShiftReportData] = useState(null);
  const [isShiftReportOpen, setIsShiftReportOpen] = useState(false);
  const [error, setError] = useState('');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [currentShiftId, setCurrentShiftId] = useState(null);
  const [paymentMethodsWarning, setPaymentMethodsWarning] = useState('');

  const { user } = useSelector((state) => state.auth || {});
  const userRole = user?.role;

  useEffect(() => {
    if (userRole === 'admin' || userRole === 'owner') {
      setEmployeeLoading(true);
      api.get('accounts/api/system-users/')
        .then((response) => {
          setEmployees(Array.isArray(response.data) ? response.data : []);
        })
        .catch((error) => {
          console.error('خطأ في جلب الموظفين:', error);
          setError('فشل في جلب قائمة الموظفين');
          setIsErrorModalOpen(true);
          toast.error('فشل في جلب قائمة الموظفين');
          setEmployees([]);
        })
        .finally(() => setEmployeeLoading(false));
    } else {
      // Fetch current shift for non-admin/owner users
      api.get('accounts/api/shift-reports/')
        .then((response) => {
          const shiftData = response.data;
          console.log("Shift reports response:", shiftData);
          const userShifts = shiftData.find((report) => report.user_id === user.id);
          const latestShift = userShifts?.shifts?.find((shift) => !shift.check_out);
          if (latestShift) {
            setCurrentShiftId(latestShift.shift_id);
            setStartDate(new Date(latestShift.check_in));
            setEndDate(latestShift.check_out ? new Date(latestShift.check_out) : new Date());
          } else {
            setError('لا يوجد شيفت مفتوح لهذا الموظف');
            setIsErrorModalOpen(true);
            toast.error('لا يوجد شيفت مفتوح لهذا الموظف');
          }
        })
        .catch((error) => {
          console.error('خطأ في جلب تقارير الشيفت:', error);
          setError('فشل في جلب تقارير الشيفت');
          setIsErrorModalOpen(true);
          toast.error('فشل في جلب تقارير الشيفت');
        });
    }
  }, [userRole, user.id]);

  const formatDateForApi = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  };

  const handlePreviewReport = async () => {
    setPreviewLoading(true);
    setError('');
    setReportData(null);
    setPaymentMethodsWarning('');
    setIsErrorModalOpen(false);
    try {
      let params = {};
      if (userRole === 'admin' || userRole === 'owner') {
        if (employeeId) params.employee_id = employeeId;
        if (startDate) params.start_date = formatDateForApi(startDate);
        if (endDate) params.end_date = formatDateForApi(endDate);
        console.log('Preview Report Params:', params);
        if (!startDate || !endDate) {
          throw new Error('يجب تحديد تاريخ البداية والنهاية');
        }
      } else {
        if (currentShiftId) params.shift_id = currentShiftId;
      }
      const response = await api.get('finance/api/employee/daily-report/', { params });
      console.log('Daily Report Response:', response.data);
      const data = response.data || {};
      setReportData(data);
      // Check if payment_methods are all "غير محدد"
      if (data.payment_methods && data.payment_methods.every((method) => method.payment_method === 'غير محدد')) {
        setPaymentMethodsWarning('جميع طرق الدفع غير محددة. الرجاء التحقق من بيانات الإيرادات.');
        toast.warning('جميع طرق الدفع غير محددة');
      }
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

  const handleGenerateShiftReport = async () => {
    setLoading(true);
    setError('');
    setShiftReportData(null);
    try {
      const params = {
        start_date: formatDateForApi(startDate),
        end_date: formatDateForApi(endDate)
      };
      console.log('Shift Report Params:', params);
      const response = await api.get('accounts/api/shift-reports/', { params });
      console.log('Shift Report Response:', response.data);
      setShiftReportData(Array.isArray(response.data) ? response.data : []);
      setIsShiftReportOpen(true);
      toast.success('تم تحميل تقرير الشيفتات بنجاح');
    } catch (error) {
      console.error('خطأ في جلب تقرير الشيفتات:', error);
      const errorMessage = error.response?.data?.error || error.message || 'حدث خطأ أثناء جلب تقرير الشيفتات';
      setError(errorMessage);
      setIsErrorModalOpen(true);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
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
        console.log('Generate Report Params:', params);
        if (!startDate || !endDate) {
          throw new Error('يجب تحديد تاريخ البداية والنهاية');
        }
      } else {
        if (currentShiftId) params.shift_id = currentShiftId;
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
      const errorMessage = error.response?.data?.error || error.message || 'حدث خطأ أثناء إنشاء التقرير';
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

  return (
    <ErrorBoundary>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 print:p-0 bg-gray-50 dark:bg-gray-900 min-h-screen" dir="rtl">
        <Card className="shadow-sm border-gray-200 dark:border-gray-700 no-print bg-white dark:bg-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-right text-xl sm:text-2xl font-bold flex items-center gap-3 text-gray-800 dark:text-white">
              <DollarSign className="text-blue-700 bg-blue-100 p-1.5 rounded-full w-8 h-8" />
              تقرير يومي للموظف
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {(userRole === 'admin' || userRole === 'owner') ? (
              <ReportFilters
                userRole={userRole}
                employeeId={employeeId}
                setEmployeeId={setEmployeeId}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                employees={Array.isArray(employees) ? employees : []}
                employeeLoading={employeeLoading}
                loading={loading}
                previewLoading={previewLoading}
              />
            ) : (
              <Alert className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4 rounded-lg text-right text-sm text-gray-600 dark:text-gray-400">
                <AlertDescription>
                  سيتم إنشاء تقرير لورديتك الحالية فقط (من تسجيل الحضور حتى الآن).
                </AlertDescription>
              </Alert>
            )}
            {paymentMethodsWarning && (
              <Alert className="bg-yellow-50 border-yellow-200 p-4 rounded-lg text-right text-sm text-yellow-800">
                <AlertDescription>{paymentMethodsWarning}</AlertDescription>
              </Alert>
            )}
            <ReportActions
              loading={loading}
              previewLoading={previewLoading}
              handlePreviewReport={handlePreviewReport}
              reportData={reportData}
              handleGenerateReport={handleGenerateReport}
              handlePrintReport={handlePrintReport}
              handleGenerateShiftReport={handleGenerateShiftReport}
            />
          </CardContent>
        </Card>

        {reportData && <DailyReportPreview reportData={reportData} />}

        <ShiftReportModal
          isOpen={isShiftReportOpen}
          onOpenChange={setIsShiftReportOpen}
          shiftReportData={shiftReportData}
        />
      </div>
    </ErrorBoundary>
  );
};

export default DailyReportButton;