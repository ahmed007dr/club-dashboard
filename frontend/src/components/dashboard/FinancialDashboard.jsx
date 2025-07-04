import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Select from 'react-select';
import toast, { Toaster } from 'react-hot-toast';
import { FiFilter, FiDownload } from 'react-icons/fi';
import BASE_URL from '@/config/api';

// تسجيل مكونات Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

// مكون ErrorBoundary للتعامل مع الأخطاء غير المتوقعة
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary: ', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center text-right text-red-600 p-4" dir="rtl">
          <h2 className="text-lg font-semibold">حدث خطأ</h2>
          <p>{this.state.error?.message || 'يرجى إعادة تحميل الصفحة أو التواصل مع الدعم.'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const FinancialDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    periodType: 'monthly',
    startDate: '',
    endDate: '',
    user: null,
    category: null,
    source: null,
    details: true,
  });
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sources, setSources] = useState([]);
  // حالات لتتبع الصفحات الحالية
  const [incomePage, setIncomePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const itemsPerPage = 10; // عدد العناصر لكل صفحة

  const periodOptions = [
    { value: 'daily', label: 'يومي' },
    { value: 'weekly', label: 'أسبوعي' },
    { value: 'monthly', label: 'شهري' },
    { value: 'yearly', label: 'سنوي' },
  ];

  // جلب بيانات المستخدمين، الفئات، والمصادر للفلاتر
  const fetchFilterData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('لا يوجد رمز توثيق. يرجى تسجيل الدخول.');

      const [usersRes, categoriesRes, sourcesRes] = await Promise.all([
        axios.get(`${BASE_URL}accounts/api/users/`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${BASE_URL}finance/api/expense-categories/`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${BASE_URL}finance/api/income-sources/`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      // التعامل مع استجابات تحتوي على results
      const usersData = usersRes.data.results || usersRes.data;
      const categoriesData = categoriesRes.data.results || categoriesRes.data;
      const sourcesData = sourcesRes.data.results || sourcesRes.data;

      // التحقق من أن البيانات عبارة عن قوائم
      if (!Array.isArray(usersData)) throw new Error('بيانات المستخدمين ليست قائمة');
      if (!Array.isArray(categoriesData)) throw new Error('بيانات الفئات ليست قائمة');
      if (!Array.isArray(sourcesData)) throw new Error('بيانات المصادر ليست قائمة');

      setUsers(usersData.map(user => ({ value: user.id, label: user.username })));
      setCategories(categoriesData.map(cat => ({ value: cat.id, label: cat.name })));
      setSources(sourcesData.map(src => ({ value: src.id, label: src.name })));
    } catch (err) {
      console.error('خطأ في جلب بيانات الفلاتر:', err);
      toast.error('فشل جلب بيانات الفلاتر: ' + (err.message || 'خطأ غير معروف'));
    }
  }, []);

  // جلب بيانات التحليل المالي
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('لا يوجد رمز توثيق. يرجى تسجيل الدخول.');

      const params = {
        period_type: filters.periodType,
        start: filters.startDate || undefined,
        end: filters.endDate || undefined,
        user: filters.user?.value,
        category: filters.category?.value,
        source: filters.source?.value,
        details: filters.details,
      };

      const response = await axios.get(`${BASE_URL}finance/api/financial-analysis/`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      setData(response.data);
      setError(null);
      // إعادة تعيين الصفحات إلى 1 عند جلب بيانات جديدة
      setIncomePage(1);
      setExpensePage(1);
    } catch (err) {
      let errorMessage = 'حدث خطأ أثناء جلب البيانات';
      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = err.response.data.error || 'طلب غير صحيح. تحقق من البيانات المدخلة.';
        } else if (err.response.status === 500) {
          errorMessage = 'خطأ في الخادم. حاول لاحقًا أو تواصل مع الدعم.';
        } else {
          errorMessage = err.response.data.error || err.message;
        }
      } else {
        errorMessage = err.message;
      }
      console.error('خطأ في جلب البيانات:', err);
      setError(errorMessage);
      toast.error('فشل جلب البيانات: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFilterData();
  }, [fetchFilterData]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 500); // تأخير لتقليل الطلبات
    return () => clearTimeout(timer);
  }, [fetchData]);

  // التعامل مع تغييرات الفلاتر
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // دالة لتقسيم البيانات إلى صفحات
  const paginate = (items, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  // حساب عدد الصفحات للإيرادات والمصروفات
  const incomeTotalPages = data?.income_details
    ? Math.ceil(data.income_details.length / itemsPerPage)
    : 0;
  const expenseTotalPages = data?.expense_details
    ? Math.ceil(data.expense_details.length / itemsPerPage)
    : 0;

  // تحضير بيانات الرسوم البيانية
  const prepareLineChartData = () => {
    if (!data?.period_analysis) return { labels: [], datasets: [] };
    const labels = data.period_analysis.map(item => item.period);
    const incomeData = data.period_analysis.map(item => item.total_income);
    const expenseData = data.period_analysis.map(item => item.total_expense);
    return {
      labels,
      datasets: [
        { label: 'الإيرادات', data: incomeData, borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.2)', fill: true },
        { label: 'المصروفات', data: expenseData, borderColor: '#F44336', backgroundColor: 'rgba(244, 67, 54, 0.2)', fill: true },
      ],
    };
  };

  const prepareBarChartData = () => {
    if (!data?.period_analysis) return { labels: [], datasets: [] };
    const labels = data.period_analysis.map(item => item.period);
    const netProfitData = data.period_analysis.map(item => item.net_profit);
    return {
      labels,
      datasets: [
        {
          label: 'صافي الربح',
          data: netProfitData,
          backgroundColor: netProfitData.map(val => (val >= 0 ? '#4CAF50' : '#F44336')),
        },
      ],
    };
  };

  const preparePieChartData = (type) => {
    if (!data?.[type === 'income' ? 'income_source_analysis' : 'expense_category_analysis']) return { labels: [], datasets: [] };
    const analysis = data[type === 'income' ? 'income_source_analysis' : 'expense_category_analysis'];
    return {
      labels: analysis.map(item => (type === 'income' ? (item.source || 'غير معروف') : item.category)),
      datasets: [
        {
          data: analysis.map(item => item.percentage),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
        },
      ],
    };
  };

  // تصدير التقرير (مؤقت)
  const exportReport = () => {
    toast.success('تم تصدير التقرير (غير مدعوم حاليًا)');
  };

  // تنسيق الأعداد بفواصل
  const formatNumber = (number) => {
    if (number === null || number === undefined) return '0.00';
    return Number(number).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6" dir="rtl">
        <Toaster position="top-center" />
        <div className="max-w-7xl mx-auto">
          {/* العنوان */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white text-right">
              لوحة التحليل المالي
            </h1>
            <button
              onClick={exportReport}
              className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FiDownload className="ml-2" /> تصدير التقرير
            </button>
          </div>

          {/* الفلاتر */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center text-right">
              <FiFilter className="ml-2" /> فلاتر
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right">نوع الفترة</label>
                <Select
                  options={periodOptions}
                  value={periodOptions.find(opt => opt.value === filters.periodType)}
                  onChange={opt => handleFilterChange('periodType', opt.value)}
                  className="mt-1 text-right"
                  classNamePrefix="select"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right">تاريخ البداية</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={e => handleFilterChange('startDate', e.target.value)}
                  className="mt-1 block w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right">تاريخ النهاية</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={e => handleFilterChange('endDate', e.target.value)}
                  className="mt-1 block w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right">المستخدم</label>
                <Select
                  options={users}
                  value={filters.user}
                  onChange={opt => handleFilterChange('user', opt)}
                  className="mt-1 text-right"
                  classNamePrefix="select"
                  isClearable
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right">فئة المصروفات</label>
                <Select
                  options={categories}
                  value={filters.category}
                  onChange={opt => handleFilterChange('category', opt)}
                  className="mt-1 text-right"
                  classNamePrefix="select"
                  isClearable
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right">مصدر الإيرادات</label>
                <Select
                  options={sources}
                  value={filters.source}
                  onChange={opt => handleFilterChange('source', opt)}
                  className="mt-1 text-right"
                  classNamePrefix="select"
                  isClearable
                />
              </div>
            </div>
          </div>

          {/* بطاقات النظرة العامة */}
          {data?.financial_position && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 text-right">إجمالي الإيرادات</h3>
                <p className="text-2xl font-bold text-green-600 text-right">
                  {formatNumber(data.financial_position.total_income)} جنيه
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 text-right">إجمالي المصروفات</h3>
                <p className="text-2xl font-bold text-red-600 text-right">
                  {formatNumber(data.financial_position.total_expense)} جنيه
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 text-right">صافي الربح</h3>
                <p
                  className={`text-2xl font-bold text-right ${
                    data.financial_position.net_profit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatNumber(data.financial_position.net_profit)} جنيه
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 text-right">الرصيد النقدي</h3>
                <p className="text-2xl font-bold text-blue-600 text-right">
                  {formatNumber(data.financial_position.cash_balance)} جنيه
                </p>
              </div>
            </div>
          )}

          {/* الرسوم البيانية */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-right">
                الإيرادات والمصروفات حسب الفترة
              </h2>
              <div className="h-80">
                <Line data={prepareLineChartData()} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-right">
                صافي الربح حسب الفترة
              </h2>
              <div className="h-80">
                <Bar data={prepareBarChartData()} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-right">
                توزيع الإيرادات حسب المصادر
              </h2>
              <div className="h-80">
                <Pie data={preparePieChartData('income')} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-right">
                توزيع المصروفات حسب الفئات
              </h2>
              <div className="h-80">
                <Pie data={preparePieChartData('expense')} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>

          {/* أعلى 5 فئات ومصادر */}
          {(data?.top_expense_categories || data?.top_income_sources) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {data.top_expense_categories && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-right">
                    أعلى 5 فئات مصروفات
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                            الفئة
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                            المبلغ
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                            النسبة
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {data.top_expense_categories.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 text-right">{item.category}</td>
                            <td className="px-6 py-4 text-right text-red-600">
                              {formatNumber(item.total_amount)} جنيه
                            </td>
                            <td className="px-6 py-4 text-right">{formatNumber(item.percentage)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {data.top_income_sources && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-right">
                    أعلى 5 مصادر إيرادات
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                            المصدر
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                            المبلغ
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                            النسبة
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {data.top_income_sources.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 text-right">{item.source || 'غير معروف'}</td>
                            <td className="px-6 py-4 text-right text-green-600">
                              {formatNumber(item.total_amount)} جنيه
                            </td>
                            <td className="px-6 py-4 text-right">{formatNumber(item.percentage)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* تحليل فئات المصروفات ومصادر الإيرادات */}
          {(data?.expense_category_analysis || data?.income_source_analysis) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {data.expense_category_analysis && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-right">
                    تحليل فئات المصروفات
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                            الفئة
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                            المبلغ
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                            النسبة
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {data.expense_category_analysis.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 text-right">{item.category}</td>
                            <td className="px-6 py-4 text-right text-red-600">
                              {formatNumber(item.total_amount)} جنيه
                            </td>
                            <td className="px-6 py-4 text-right">{formatNumber(item.percentage)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {data.income_source_analysis && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-right">
                    تحليل مصادر الإيرادات
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                            المصدر
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                            المبلغ
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                            النسبة
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {data.income_source_analysis.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 text-right">{item.source || 'غير معروف'}</td>
                            <td className="px-6 py-4 text-right text-green-600">
                              {formatNumber(item.total_amount)} جنيه
                            </td>
                            <td className="px-6 py-4 text-right">{formatNumber(item.percentage)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* تحليل الفترات */}
          {data?.period_analysis && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-right">تحليل الفترات</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                        الفترة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                        الإيرادات
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                        المصروفات
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                        صافي الربح
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {data.period_analysis.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 text-right">{item.period}</td>
                        <td className="px-6 py-4 text-right text-green-600">
                          {formatNumber(item.total_income)} جنيه
                        </td>
                        <td className="px-6 py-4 text-right text-red-600">
                          {formatNumber(item.total_expense)} جنيه
                        </td>
                        <td
                          className={`px-6 py-4 text-right ${
                            item.net_profit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formatNumber(item.net_profit)} جنيه
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* التنبيهات والتوصيات */}
          {(data?.alerts?.length > 0 || data?.recommendations?.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {data.alerts?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-right">التنبيهات</h2>
                  <ul className="list-disc pr-5 text-right">
                    {data.alerts.map((alert, index) => (
                      <li key={index} className="text-red-600 mb-2">{alert}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.recommendations?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-right">التوجيهات</h2>
                  <ul className="list-disc pr-5 text-right">
                    {data.recommendations.map((rec, index) => (
                      <li key={index} className="text-blue-600 mb-2">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* التوقعات */}
          {data?.forecasts && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-right">
                التوقعات للفترة القادمة
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 text-right">
                    الإيرادات المتوقعة
                  </h3>
                  <p className="text-xl font-bold text-green-600 text-right">
                    {formatNumber(data.forecasts.next_period_income)} جنيه
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 text-right">
                    المصروفات المتوقعة
                  </h3>
                  <p className="text-xl font-bold text-red-600 text-right">
                    {formatNumber(data.forecasts.next_period_expense)} جنيه
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 text-right">
                    صافي الربح المتوقع
                  </h3>
                  <p
                    className={`text-xl font-bold text-right ${
                      data.forecasts.next_period_net >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatNumber(data.forecasts.next_period_net)} جنيه
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* تفاصيل الإيرادات والمصروفات */}
          {(data?.income_details || data?.expense_details) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.income_details && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-right">
                    تفاصيل الإيرادات
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                            التاريخ
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                            المصدر
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                            المبلغ
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                            الوصف
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginate(data.income_details, incomePage).map((item, index) => (
                          <tr key={item.id || index}>
                            <td className="px-6 py-4 text-right">
                              {new Date(item.date).toLocaleDateString('ar-EG')}
                            </td>
                            <td className="px-6 py-4 text-right">{item.source_name || 'غير معروف'}</td>
                            <td className="px-6 py-4 text-right text-green-600">
                              {formatNumber(item.amount)} جنيه
                            </td>
                            <td className="px-6 py-4 text-right">-</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* أزرار التنقل للإيرادات */}
                  {incomeTotalPages > 1 && (
                    <div className="flex justify-between mt-4">
                      <button
                        onClick={() => setIncomePage(prev => Math.max(prev - 1, 1))}
                        disabled={incomePage === 1}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg disabled:opacity-50"
                      >
                        السابق
                      </button>
                      <span className="text-gray-800 dark:text-gray-200">
                        الصفحة {incomePage} من {incomeTotalPages}
                      </span>
                      <button
                        onClick={() => setIncomePage(prev => Math.min(prev + 1, incomeTotalPages))}
                        disabled={incomePage === incomeTotalPages}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg disabled:opacity-50"
                      >
                        التالي
                      </button>
                    </div>
                  )}
                </div>
              )}
              {data.expense_details && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-right">
                    تفاصيل المصروفات
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                            التاريخ
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                            الفئة
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                            المبلغ
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">
                            الوصف
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginate(data.expense_details, expensePage).map((item, index) => (
                          <tr key={item.id || index}>
                            <td className="px-6 py-4 text-right">
                              {new Date(item.date).toLocaleDateString('ar-EG')}
                            </td>
                            <td className="px-6 py-4 text-right">{item.category_name || 'غير معروف'}</td>
                            <td className="px-6 py-4 text-right text-red-600">
                              {formatNumber(item.amount)} جنيه
                            </td>
                            <td className="px-6 py-4 text-right">-</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* أزرار التنقل للمصروفات */}
                  {expenseTotalPages > 1 && (
                    <div className="flex justify-between mt-4">
                      <button
                        onClick={() => setExpensePage(prev => Math.max(prev - 1, 1))}
                        disabled={expensePage === 1}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg disabled:opacity-50"
                      >
                        السابق
                      </button>
                      <span className="text-gray-800 dark:text-gray-200">
                        الصفحة {expensePage} من {expenseTotalPages}
                      </span>
                      <button
                        onClick={() => setExpensePage(prev => Math.min(prev + 1, expenseTotalPages))}
                        disabled={expensePage === expenseTotalPages}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg disabled:opacity-50"
                      >
                        التالي
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {loading && <p className="text-center text-gray-600 dark:text-gray-300 text-right">جارٍ التحميل...</p>}
          {error && <p className="text-center text-red-600 text-right">{error}</p>}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default FinancialDashboard;