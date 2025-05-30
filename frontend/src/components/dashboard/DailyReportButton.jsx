import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import BASE_URL from '../../config/api';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {isErrorModalOpen && (
        <div style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          zIndex: 1000,
          maxWidth: '400px',
          width: '90%',
          textAlign: 'right',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>حدث خطأ</h3>
          <p style={{ color: 'red', marginBottom: '16px' }}>{error}</p>
          <button
            onClick={() => setIsErrorModalOpen(false)}
            style={{
              padding: '8px 16px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            إغلاق
          </button>
        </div>
      )}
      
      {(userRole === 'admin' || userRole === 'owner') ? (
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label htmlFor="employeeSelect" style={{ display: 'block', marginBottom: '8px', fontWeight: 'medium' }}>
              اختيار الموظف
            </label>
            <select
              id="employeeSelect"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px',
              }}
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
          <div>
            <label htmlFor="startDate" style={{ display: 'block', marginBottom: '8px', fontWeight: 'medium' }}>
              تاريخ البداية
            </label>
            <input
              id="startDate"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px',
              }}
              disabled={loading || previewLoading}
            />
          </div>
          <div>
            <label htmlFor="endDate" style={{ display: 'block', marginBottom: '8px', fontWeight: 'medium' }}>
              تاريخ النهاية
            </label>
            <input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px',
              }}
              disabled={loading || previewLoading}
            />
          </div>
        </div>
      ) : (
        <p style={{ textAlign: 'right', color: '#555' }}>
          سيتم إنشاء تقرير لورديتك الحالية فقط (من تسجيل الحضور حتى الآن).
        </p>
      )}
      <button
        onClick={handlePreviewReport}
        disabled={loading || previewLoading}
        style={{
          padding: '10px 20px',
          background: (loading || previewLoading) ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: (loading || previewLoading) ? 'not-allowed' : 'pointer',
          fontSize: '16px',
        }}
      >
        {previewLoading ? (
          <>
            <Loader2 style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} />
            جارٍ تحميل البيانات...
          </>
        ) : (
          'معاينة التقرير'
        )}
      </button>

      {reportData && (
        <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '16px', borderRadius: '4px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'right' }}>
            معاينة التقرير
          </h3>
          <p><strong>اسم الموظف:</strong> {reportData.employee_name}</p>
          <p><strong>النادي:</strong> {reportData.club_name}</p>
          <p>
            <strong>فترة الوردية:</strong> من {formatDate(reportData.check_in)} إلى {formatDate(reportData.check_out)}
          </p>
          <p><strong>مدة الوردية:</strong> {getShiftDuration(reportData.check_in, reportData.check_out)}</p>

          <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: '16px 0 8px', textAlign: 'right' }}>
            الإيرادات
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>البند</th>
                <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>العدد</th>
                <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {reportData.incomes.map((income, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{income.source}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{income.count}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{income.total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: '16px 0 8px', textAlign: 'right' }}>
            النفقات
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>البند</th>
                <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>القيمة</th>
                <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>الوصف</th>
              </tr>
            </thead>
            <tbody>
              {reportData.expenses.map((expense, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{expense.category}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{expense.total}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{expense.description}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: '16px 0 8px', textAlign: 'right' }}>
            الملخص
          </h4>
          <p><strong>إجمالي الإيرادات:</strong> {reportData.total_income}</p>
          <p><strong>إجمالي النفقات:</strong> {reportData.total_expenses}</p>
          <p><strong>صافي الربح:</strong> {reportData.net_profit}</p>

          <button
            onClick={handleGenerateReport}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              marginTop: '16px',
            }}
          >
            {loading ? (
              <>
                <Loader2 style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} />
                جارٍ إنشاء التقرير...
              </>
            ) : (
              'تنزيل التقرير كـ PDF'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default DailyReportButton;