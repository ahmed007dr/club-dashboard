import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionStats } from '../../redux/slices/subscriptionsSlice'; 
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SubscriptionStats = () => {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector((state) => state.subscriptions);

  useEffect(()  => {
    dispatch(fetchSubscriptionStats());
  }, [dispatch]);

  if (loading) return <div className="text-center p-4">جاري تحميل الإحصائيات...</div>;
  if (error) return <div className="text-center p-4 text-red-500">خطأ: {error}</div>;
  if (!stats) return null; 

  // Data for the BarChart
  const chartData = [
    { name: 'نشط', value: stats.active },
    { name: 'منتهٍ', value: stats.expired },
    { name: 'قادم', value: stats.upcoming },
  ];

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">إحصائيات الاشتراكات</h2>
      {/* Recharts BarChart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="url(#gradient)" />
        </BarChart>
      </ResponsiveContainer>
      {/* Stats in List */}
      <ul className="space-y-2">
        <li className="flex justify-between text-gray-700">
          <span>الاشتراكات النشطة:</span>
          <span className="font-semibold">{stats.active}</span>
        </li>
        <li className="flex justify-between text-gray-700">
          <span>الاشتراكات المنتهية:</span>
          <span className="font-semibold">{stats.expired}</span>
        </li>
        <li className="flex justify-between text-gray-700">
          <span>إجمالي الاشتراكات:</span>
          <span className="font-semibold">{stats.total}</span>
        </li>
        <li className="flex justify-between text-gray-700">
          <span>الاشتراكات القادمة:</span>
          <span className="font-semibold">{stats.upcoming}</span>
        </li>
      </ul>
      {/* Define Gradient for Chart */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#4c1d95", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#7c3aed", stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default SubscriptionStats;



