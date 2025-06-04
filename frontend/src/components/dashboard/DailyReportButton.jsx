import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import BASE_URL from '../../config/api';
import { FiUser, FiCalendar, FiEye, FiDownload, FiAlertTriangle, FiDollarSign, FiShoppingCart } from 'react-icons/fi';
import { Loader2 } from 'lucide-react';
import { format, differenceInHours, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

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
  const { user } = useSelector((state) => state.auth);
  const userRole = user?.role;

  // جلب قائمة الموظفين النشطين لـ admin و owner فقط
  useEffect(() => {
    if (userRole === 'admin' || userRole === 'owner') {
      setEmployeeLoading(true);
      axios
        .get(`${BASE_URL}/accounts/api/active-users/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })
        .then((response) => {
          setEmployees(response.data);
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
      const url = `${BASE_URL}/finance/api/employee/daily-report/`;
      let params = {};

      if (userRole === 'admin' || userRole === 'owner') {
        if (employeeId) params.employee_id = employeeId;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (!startDate || !endDate) {
          setError('يجب تحديد تاريخ البداية والنهاية');
          setIsErrorModalOpen(true);
          return;
        }
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        params,
      });

      setReportData(response.data);
    } catch (error) {
      console.error('خطأ في جلب بيانات التقرير:', error);
      const errorMessage = error.response?.data?.error || 'حدث خطأ أثناء جلب بيانات التقرير';
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
      const url = `${BASE_URL}/finance/api/employee/daily-report/pdf/`;
      let params = {};

      if (userRole === 'admin' || userRole === 'owner') {
        if (employeeId) params.employee_id = employeeId;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (!startDate || !endDate) {
          setError('يجب تحديد تاريخ البداية والنهاية');
          setIsErrorModalOpen(true);
          return;
        }
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        responseType: 'blob',
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

      alert('تم تنزيل التقرير بنجاح');
    } catch (error) {
      console.error('خطأ في إنشاء التقرير:', error);
      const errorMessage = error.message || 'حدث خطأ أثناء إنشاء التقرير';
      setError(errorMessage);
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // حساب مدة الوردية بالساعات
  const getShiftDuration = (checkIn, checkOut) => {
    try {
      const start = parseISO(checkIn);
      const end = parseISO(checkOut);
      const hours = differenceInHours(end, start);
      return hours > 0 ? `${hours} ساعة` : 'أقل من ساعة';
    } catch (e) {
      return 'غير متوفر';
    }
  };

  // تنسيق التاريخ بالعربية
  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'd MMMM yyyy، h:mm a', { locale: ar });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6" dir="rtl">
      {/* Error Modal */}
      {isErrorModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full text-right">
            <div className="flex items-center gap-3 mb-4">
              <FiAlertTriangle className="text-red-600 w-8 h-8" />
              <h3 className="text-lg font-bold text-gray-800">حدث خطأ</h3>
            </div>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => setIsErrorModalOpen(false)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-6">
          <FiDollarSign className="text-blue-600 bg-blue-100 p-1.5 rounded-full w-8 h-8" />
          تقرير يومي للموظف
        </h2>

        {/* Input Section */}
        {(userRole === 'admin' || userRole === 'owner') ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="employeeSelect" className="block text-sm font-medium text-gray-700 mb-2">
                اختيار الموظف
              </label>
              <div className="relative">
                <FiUser className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  id="employeeSelect"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 disabled:bg-gray-100"
                  disabled={employeeLoading || loading || previewLoading}
                >
                  <option value="">
                    {employeeLoading ? 'جارٍ تحميل الموظفين...' : 'اختر موظفًا'}
                  </option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.first_name || employee.last_name
                        ? `${employee.first_name} ${employee.last_name}`
                        : employee.username} (RFID: {employee.rfid_code || 'غير متوفر'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                تاريخ البداية
              </label>
              <div className="relative">
                <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 disabled:bg-gray-100"
                  disabled={loading || previewLoading}
                />
              </div>
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                تاريخ النهاية
              </label>
              <div className="relative">
                <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 disabled:bg-gray-100"
                  disabled={loading || previewLoading}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 text-right text-gray-600 bg-gray-50 p-4 rounded-lg">
            سيتم إنشاء تقرير لورديتك الحالية فقط (من تسجيل الحضور حتى الآن).
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            onClick={handlePreviewReport}
            disabled={loading || previewLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {previewLoading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <FiEye className="w-5 h-5" />
            )}
            معاينة التقرير
          </button>
          {reportData && (
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <FiDownload className="w-5 h-5" />
              )}
              تنزيل التقرير كـ PDF
            </button>
          )}
        </div>
      </div>

      {/* Report Preview Section */}
      {reportData && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3 mb-6">
            <FiEye className="text-blue-600 bg-blue-100 p-1.5 rounded-full w-8 h-8" />
            معاينة التقرير
          </h3>

          {/* Summary Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
              <FiDollarSign className="text-blue-600 w-6 h-6" />
              <div>
                <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
                <p className="text-lg font-semibold text-gray-800">{reportData.total_income}</p>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3">
              <FiShoppingCart className="text-red-600 w-6 h-6" />
              <div>
                <p className="text-sm text-gray-600">إجمالي النفقات</p>
                <p className="text-lg font-semibold text-gray-800">{reportData.total_expenses}</p>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg flex items-center gap-3">
              <FiDollarSign className="text-green-600 w-6 h-6" />
              <div>
                <p className="text-sm text-gray-600">صافي الربح</p>
                <p className="text-lg font-semibold text-gray-800">{reportData.net_profit}</p>
              </div>
            </div>
          </div>

          {/* Report Details */}
          <div className="space-y-6">
            <div>
              <p className="text-gray-700"><strong>اسم الموظف:</strong> {reportData.employee_name}</p>
              <p className="text-gray-700"><strong>النادي:</strong> {reportData.club_name}</p>
              <p className="text-gray-700">
                <strong>فترة الوردية:</strong> من {formatDate(reportData.check_in)} إلى {formatDate(reportData.check_out)}
              </p>
              <p className="text-gray-700"><strong>مدة الوردية:</strong> {getShiftDuration(reportData.check_in, reportData.check_out)}</p>
            </div>

            {/* Incomes Table */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">الإيرادات</h4>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg text-right">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="p-3 font-semibold">البند</th>
                      <th className="p-3 font-semibold">العدد</th>
                      <th className="p-3 font-semibold">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.incomes.map((income, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-all duration-200">
                        <td className="p-3 text-gray-800">{income.source}</td>
                        <td className="p-3 text-gray-800">{income.count}</td>
                        <td className="p-3 text-gray-800">{income.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Expenses Table */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">النفقات</h4>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg text-right">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="p-3 font-semibold">البند</th>
                      <th className="p-3 font-semibold">القيمة</th>
                      <th className="p-3 font-semibold">الوصف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.expenses.map((expense, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-all duration-200">
                        <td className="p-3 text-gray-800">{expense.category}</td>
                        <td className="p-3 text-gray-800">{expense.total}</td>
                        <td className="p-3 text-gray-800">{expense.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">الملخص</h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-gray-700"><strong>إجمالي الإيرادات:</strong> {reportData.total_income}</p>
                <p className="text-gray-700"><strong>إجمالي النفقات:</strong> {reportData.total_expenses}</p>
                <p className="text-gray-700"><strong>صافي الربح:</strong> {reportData.net_profit}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReportButton;