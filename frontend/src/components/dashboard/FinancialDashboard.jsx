import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import Select from 'react-select';
import toast, { Toaster } from 'react-hot-toast';
import { FiFilter, FiDownload } from 'react-icons/fi';
import BASE_URL from '@/config/api';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

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

  const periodOptions = [
    { value: 'daily', label: 'يومي' },
    { value: 'weekly', label: 'أسبوعي' },
    { value: 'monthly', label: 'شهري' },
    { value: 'yearly', label: 'سنوي' },
  ];

  // Fetch users, categories, and sources for filters
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('لا يوجد رمز توثيق. يرجى تسجيل الدخول.');
        }
        console.log('Fetching filter data with token:', token); // Debug
        const [usersRes, categoriesRes, sourcesRes] = await Promise.all([
          axios.get(`${BASE_URL}accounts/api/users/`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(err => { throw new Error(`Users API failed: ${err.message}`); }),
          axios.get(`${BASE_URL}finance/api/expense-categories/`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(err => { throw new Error(`Expense Categories API failed: ${err.message}`); }),
          axios.get(`${BASE_URL}finance/api/income-sources/`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(err => { throw new Error(`Income Sources API failed: ${err.message}`); }),
        ]);
        console.log('Users Response:', usersRes.data); // Debug
        console.log('Categories Response:', categoriesRes.data); // Debug
        console.log('Sources Response:', sourcesRes.data); // Debug
        setUsers(usersRes.data.map(user => ({ value: user.id, label: user.username })));
        setCategories(categoriesRes.data.results ? categoriesRes.data.results.map(cat => ({ value: cat.id, label: cat.name })) : categoriesRes.data.map(cat => ({ value: cat.id, label: cat.name })));
        setSources(sourcesRes.data.results ? sourcesRes.data.results.map(src => ({ value: src.id, label: src.name })) : sourcesRes.data.map(src => ({ value: src.id, label: src.name })));
      } catch (err) {
        console.error('Filter Data Error:', err.message || err); // Improved error logging
        toast.error('فشل جلب بيانات الفلاتر: ' + (err.message || 'خطأ غير معروف'));
      }
    };
    fetchFilterData();
  }, []);

  // Fetch financial analysis data
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('لا يوجد رمز توثيق');
      console.log('Fetching financial analysis with token:', token); // Debug
      const params = {
        period_type: filters.periodType,
        start: filters.startDate,
        end: filters.endDate,
        user: filters.user?.value,
        category: filters.category?.value,
        source: filters.source?.value,
        details: filters.details,
      };
      const response = await axios.get(`${BASE_URL}finance/api/financial-analysis/`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Financial Analysis Response:', response.data); // Debug
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('API Error:', err.message || err); // Improved error logging
      setError(err.response?.data?.error || 'حدث خطأ أثناء جلب البيانات');
      toast.error('فشل جلب البيانات: ' + (err.response?.data?.error || 'خطأ غير معروف'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Chart data preparation
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
          backgroundColor: netProfitData.map(val => val >= 0 ? '#4CAF50' : '#F44336'),
        },
      ],
    };
  };

  const preparePieChartData = (type) => {
    if (!data?.[type === 'income' ? 'income_source_analysis' : 'expense_category_analysis']) return { labels: [], datasets: [] };
    const analysis = data[type === 'income' ? 'income_source_analysis' : 'expense_category_analysis'];
    return {
      labels: analysis.map(item => type === 'income' ? item.source : item.category),
      datasets: [
        {
          data: analysis.map(item => item.percentage),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
        },
      ],
    };
  };

  // Export report (simplified)
  const exportReport = () => {
    toast.success('تم تصدير التقرير (غير مدعوم حاليًا)');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6">
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">لوحة التحليل المالي</h1>
          <button
            onClick={exportReport}
            className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiDownload className="mr-2" /> تصدير التقرير
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <FiFilter className="mr-2" /> فلاتر
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">نوع الفترة</label>
              <Select
                options={periodOptions}
                value={periodOptions.find(opt => opt.value === filters.periodType)}
                onChange={opt => handleFilterChange('periodType', opt.value)}
                className="mt-1"
                classNamePrefix="select"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">تاريخ البداية</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={e => handleFilterChange('startDate', e.target.value)}
                className="mt-1 block w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">تاريخ النهاية</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={e => handleFilterChange('endDate', e.target.value)}
                className="mt-1 block w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">المستخدم</label>
              <Select
                options={users}
                value={filters.user}
                onChange={opt => handleFilterChange('user', opt)}
                className="mt-1"
                classNamePrefix="select"
                isClearable
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">فئة المصروفات</label>
              <Select
                options={categories}
                value={filters.category}
                onChange={opt => handleFilterChange('category', opt)}
                className="mt-1"
                classNamePrefix="select"
                isClearable
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">مصدر الإيرادات</label>
              <Select
                options={sources}
                value={filters.source}
                onChange={opt => handleFilterChange('source', opt)}
                className="mt-1"
                classNamePrefix="select"
                isClearable
              />
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        {data?.financial_position && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">إجمالي الإيرادات</h3>
              <p className="text-2xl font-bold text-green-600">{data.financial_position.total_income.toFixed(2)} ج.م</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">إجمالي المصروفات</h3>
              <p className="text-2xl font-bold text-red-600">{data.financial_position.total_expense.toFixed(2)} ج.م</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">صافي الربح</h3>
              <p className={`text-2xl font-bold ${data.financial_position.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.financial_position.net_profit.toFixed(2)} ج.م
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">الرصيد النقدي</h3>
              <p className="text-2xl font-bold text-blue-600">{data.financial_position.cash_balance.toFixed(2)} ج.م</p>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">الإيرادات والمصروفات حسب الفترة</h2>
            <div className="h-80">
              <Line data={prepareLineChartData()} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">صافي الربح حسب الفترة</h2>
            <div className="h-80">
              <Bar data={prepareBarChartData()} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">توزيع الإيرادات حسب المصادر</h2>
            <div className="h-80">
              <Pie data={preparePieChartData('income')} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">توزيع المصروفات حسب الفئات</h2>
            <div className="h-80">
              <Pie data={preparePieChartData('expense')} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        {/* Top 5 Categories and Sources */}
        {(data?.top_expense_categories || data?.top_income_sources) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {data.top_expense_categories && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">أعلى 5 فئات مصروفات</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">الفئة</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">المبلغ</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">النسبة</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {data.top_expense_categories.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 text-right">{item.category}</td>
                          <td className="px-6 py-4 text-right text-red-600">{item.total_amount.toFixed(2)} ج.م</td>
                          <td className="px-6 py-4 text-right">{item.percentage.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {data.top_income_sources && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">أعلى 5 مصادر إيرادات</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">المصدر</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">المبلغ</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">النسبة</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {data.top_income_sources.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 text-right">{item.source}</td>
                          <td className="px-6 py-4 text-right text-green-600">{item.total_amount.toFixed(2)} ج.م</td>
                          <td className="px-6 py-4 text-right">{item.percentage.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expense and Income Analysis Tables */}
        {(data?.expense_category_analysis || data?.income_source_analysis) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {data.expense_category_analysis && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">تحليل فئات المصروفات</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">الفئة</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">المبلغ</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">النسبة</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {data.expense_category_analysis.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 text-right">{item.category}</td>
                          <td className="px-6 py-4 text-right text-red-600">{item.total_amount.toFixed(2)} ج.م</td>
                          <td className="px-6 py-4 text-right">{item.percentage.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {data.income_source_analysis && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">تحليل مصادر الإيرادات</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">المصدر</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">المبلغ</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">النسبة</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {data.income_source_analysis.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 text-right">{item.source}</td>
                          <td className="px-6 py-4 text-right text-green-600">{item.total_amount.toFixed(2)} ج.م</td>
                          <td className="px-6 py-4 text-right">{item.percentage.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Period Analysis Table */}
        {data?.period_analysis && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">تحليل الفترات</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">الفترة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">الإيرادات</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">المصروفات</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">صافي الربح</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {data.period_analysis.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-right">{item.period}</td>
                      <td className="px-6 py-4 text-right text-green-600">{item.total_income.toFixed(2)} ج.م</td>
                      <td className="px-6 py-4 text-right text-red-600">{item.total_expense.toFixed(2)} ج.م</td>
                      <td className={`px-6 py-4 text-right ${item.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.net_profit.toFixed(2)} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Alerts and Recommendations */}
        {(data?.alerts?.length > 0 || data?.recommendations?.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {data.alerts?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">التنبيهات</h2>
                <ul className="list-disc pr-5">
                  {data.alerts.map((alert, index) => (
                    <li key={index} className="text-red-600 mb-2">{alert}</li>
                  ))}
                </ul>
              </div>
            )}
            {data.recommendations?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">التوجيهات</h2>
                <ul className="list-disc pr-5">
                  {data.recommendations.map((rec, index) => (
                    <li key={index} className="text-blue-600 mb-2">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Forecasts */}
        {data?.forecasts && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">التوقعات للفترة القادمة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">الإيرادات المتوقعة</h3>
                <p className="text-xl font-bold text-green-600">{data.forecasts.next_period_income.toFixed(2)} ج.م</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">المصروفات المتوقعة</h3>
                <p className="text-xl font-bold text-red-600">{data.forecasts.next_period_expense.toFixed(2)} ج.م</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">صافي الربح المتوقع</h3>
                <p className={`text-xl font-bold ${data.forecasts.next_period_net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.forecasts.next_period_net.toFixed(2)} ج.م
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Tables (Income and Expenses) */}
        {(data?.income_details || data?.expense_details) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.income_details && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">تفاصيل الإيرادات</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">التاريخ</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">المصدر</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">المبلغ</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">الوصف</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {data.income_details.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 text-right">{new Date(item.date).toLocaleDateString('ar-EG')}</td>
                          <td className="px-6 py-4 text-right">{item.source.name}</td>
                          <td className="px-6 py-4 text-right text-green-600">{item.amount.toFixed(2)} ج.م</td>
                          <td className="px-6 py-4 text-right">{item.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {data.expense_details && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">تفاصيل المصروفات</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">التاريخ</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">الفئة</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">المبلغ</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300">الوصف</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {data.expense_details.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 text-right">{new Date(item.date).toLocaleDateString('ar-EG')}</td>
                          <td className="px-6 py-4 text-right">{item.category.name}</td>
                          <td className="px-6 py-4 text-right text-red-600">{item.amount.toFixed(2)} ج.م</td>
                          <td className="px-6 py-4 text-right">{item.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {loading && <p className="text-center text-gray-600 dark:text-gray-300">جارٍ التحميل...</p>}
        {error && <p className="text-center text-red-600">{error}</p>}
      </div>
    </div>
  );
};

export default FinancialDashboard;