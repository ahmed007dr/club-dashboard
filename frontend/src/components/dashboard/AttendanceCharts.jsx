import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AttendanceDashboard = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [loading, setLoading] = useState({
    monthly: true,
    weekly: true,
    hourly: true
  });
  const [error, setError] = useState({});

  const fetchData = async (endpoint, setter, key) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/attendance/api/attendances/${endpoint}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error(`Failed to fetch ${key} data`);

      const result = await response.json();
      setter(result || []); // fallback to empty array if null
    } catch (err) {
      setError(prev => ({ ...prev, [key]: err.message }));
      setter([]); // prevent null value from being set
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  useEffect(() => {
    fetchData('monthly', setMonthlyData, 'monthly');
    fetchData('weekly', setWeeklyData, 'weekly');
    fetchData('hourly', setHourlyData, 'hourly');
  }, []);

  const renderFullWidthChart = (data, labels, label, colors, title) => {
    if (!Array.isArray(data) || data.length === 0) {
      return (
        <div className="w-full bg-white dark:bg-gray-800 rounded-2xl p-6 shadow mb-6">
          <div className="text-center py-8">لا توجد بيانات لعرضها</div>
        </div>
      );
    }

    const chartData = {
      labels: labels,
      datasets: [
        {
          label: label,
          data: data,
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: title,
          font: { size: 16 }
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.raw} حضور`,
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: title.includes('ساعة') ? 'الساعة' : 'التاريخ',
            font: { weight: 'bold' }
          },
        },
        y: {
          title: {
            display: true,
            text: 'عدد الحضور',
            font: { weight: 'bold' }
          },
          beginAtZero: true,
        },
      },
    };

    return (
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl p-6 shadow mb-6" style={{ height: '400px' }}>
        <Bar data={chartData} options={options} />
      </div>
    );
  };

  if (Object.values(error).some(err => err)) {
    return (
      <div className="w-full text-center py-8 text-red-500">
        خطأ في تحميل البيانات: {Object.entries(error).filter(([_, err]) => err).map(([key]) => key).join(', ')}
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      {/* Monthly Chart */}
      {loading.monthly ? (
        <div className="w-full bg-white dark:bg-gray-800 rounded-2xl p-6 shadow mb-6">
          <div className="text-center py-8">جاري تحميل البيانات الشهرية...</div>
        </div>
      ) : renderFullWidthChart(
        monthlyData.map(item => item.count),
        monthlyData.map(item => item.date),
        'عدد الحضور الشهري',
        { backgroundColor: 'rgba(54, 162, 235, 0.6)', borderColor: 'rgba(54, 162, 235, 1)' },
        'إحصائيات الحضور الشهري'
      )}

      {/* Weekly Chart */}
      {loading.weekly ? (
        <div className="w-full bg-white dark:bg-gray-800 rounded-2xl p-6 shadow mb-6">
          <div className="text-center py-8">جاري تحميل البيانات الأسبوعية...</div>
        </div>
      ) : renderFullWidthChart(
        weeklyData.map(item => item.count),
        weeklyData.map(item => item.date),
        'عدد الحضور الأسبوعي',
        { backgroundColor: 'rgba(255, 159, 64, 0.6)', borderColor: 'rgba(255, 159, 64, 1)' },
        'إحصائيات الحضور الأسبوعي'
      )}

      {/* Hourly Chart */}
      {loading.hourly ? (
        <div className="w-full bg-white dark:bg-gray-800 rounded-2xl p-6 shadow mb-6">
          <div className="text-center py-8">جاري تحميل البيانات اليومية...</div>
        </div>
      ) : renderFullWidthChart(
        hourlyData.map((item, index) => item || 0), // handle undefined/null values
        Array.from({ length: 24 }, (_, i) => `${i}:00`),
        'عدد الحضور بالساعة',
        { backgroundColor: 'rgba(75, 192, 192, 0.6)', borderColor: 'rgba(75, 192, 192, 1)' },
        'إحصائيات الحضور حسب الساعة'
      )}
    </div>
  );
};

export default AttendanceDashboard;
