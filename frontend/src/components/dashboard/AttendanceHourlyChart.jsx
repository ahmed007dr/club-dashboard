import React from 'react';
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

const AttendanceHourlyChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-4">لا توجد بيانات لعرضها</div>;
  }

  const chartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'عدد الحضور',
        data: data,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.raw} حضور`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'الساعة' },
      },
      y: {
        title: { display: true, text: 'عدد الحضور' },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default AttendanceHourlyChart;