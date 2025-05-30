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
    setter(result || []);
    
    // Log specifically for hourly data
    if (key === 'hourly') {
      console.log('Hourly Data:', result);
    }
  } catch (err) {
    setError(prev => ({ ...prev, [key]: err.message }));
    setter([]);
  } finally {
    setLoading(prev => ({ ...prev, [key]: false }));
  }
};

  useEffect(() => {
    fetchData('monthly', setMonthlyData, 'monthly');
    fetchData('weekly', setWeeklyData, 'weekly');
    fetchData('hourly', setHourlyData, 'hourly');
  }, []);

  const renderChart = (data, labels, label, title) => {
    if (!Array.isArray(data) || data.length === 0) {
      return (
        <div className="w-full bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-lg mb-6">
          <div className="text-center text-purple-500 py-8">لا توجد بيانات لعرضها</div>
        </div>
      );
    }

    const chartData = {
      labels: labels,
      datasets: [
        {
          label: label,
          data: data,
          backgroundColor: 'rgba(128, 90, 213, 0.7)', // Purple (Tailwind: purple-600)
          borderColor: 'rgba(107, 70, 193, 1)', // Purple (Tailwind: purple-700)
          borderWidth: 0,
          borderRadius: 6,
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
      color: '#6b46c1', // Keep title purple
      font: { size: 18, weight: 'bold' },
      padding: { top: 10, bottom: 20 }
    },
    tooltip: {
      callbacks: {
        label: (context) => `${context.raw} حضور`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#6b7280', font: { weight: 'bold' } } // Gray: Tailwind slate-500
    },
    y: {
      beginAtZero: true,
      grid: { display: false },
      ticks: { color: '#6b7280', font: { weight: 'bold' } } // Gray: Tailwind slate-500
    },
  },
};


    return (
      <div className="w-full bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-lg mb-6" style={{ height: '400px' }}>
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
    <div className="w-full p-4 bg-gradient-to-br from-purple-100 to-white dark:from-gray-800 dark:to-gray-900 min-h-screen">
      {loading.monthly ? (
        <div className="w-full bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-lg mb-6 text-center text-purple-500">
          جاري تحميل البيانات الشهرية...
        </div>
      ) : renderChart(
        monthlyData.map(item => item.count),
        monthlyData.map(item => item.date),
        'عدد الحضور الشهري',
        'إحصائيات الحضور الشهري'
      )}

      {loading.weekly ? (
        <div className="w-full bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-lg mb-6 text-center text-purple-500">
          جاري تحميل البيانات الأسبوعية...
        </div>
      ) : renderChart(
        weeklyData.map(item => item.count),
        weeklyData.map(item => item.date),
        'عدد الحضور الأسبوعي',
        'إحصائيات الحضور الأسبوعي'
      )}

      {loading.hourly ? (
        <div className="w-full bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-lg mb-6 text-center text-purple-500">
          جاري تحميل البيانات اليومية...
        </div>
      ) : renderChart(
        hourlyData.map((item) => item || 0),
        Array.from({ length: 24 }, (_, i) => `${i}:00`),
        'عدد الحضور بالساعة',
        'إحصائيات الحضور حسب الساعة'
      )}
    </div>
  );
};

export default AttendanceDashboard;

