import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionStats } from '../../redux/slices/subscriptionsSlice';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const SubscriptionStats = () => {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector((state) => state.subscriptions);

  useEffect(() => {
    dispatch(fetchSubscriptionStats());
  }, [dispatch]);

  if (loading) return <div className="text-center p-4">جاري تحميل الإحصائيات...</div>;
  if (error) return <div className="text-center p-4 text-red-500">خطأ: {error}</div>;
  if (!stats) return null;

  const chartData = [
    { name: 'نشط', value: stats.active },
    { name: 'منتهٍ', value: stats.expired },
    { name: 'قادم', value: stats.upcoming },
  ];

  return (
    <div className="w-full bg-white rounded-2xl p-4 sm:p-6 shadow-md">
      {/* Background Shape */}


      <h2 className="text-2xl font-bold text-center text-indigo-900 mb-6 relative z-10">إحصائيات الاشتراكات</h2>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} barSize={45}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#4c1d95', fontWeight: 600 }} />
          <YAxis tick={{ fill: '#4c1d95' }} />
          <Tooltip />
          <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-6 space-y-3 relative z-10">
        <div className="flex justify-between text-sm sm:text-base text-indigo-900 bg-white/70 px-4 py-2 rounded-lg shadow-sm">
          <span>الاشتراكات النشطة</span>
          <span className="font-semibold">{stats.active}</span>
        </div>
        <div className="flex justify-between text-sm sm:text-base text-indigo-900 bg-white/70 px-4 py-2 rounded-lg shadow-sm">
          <span>الاشتراكات المنتهية</span>
          <span className="font-semibold">{stats.expired}</span>
        </div>
        <div className="flex justify-between text-sm sm:text-base text-indigo-900 bg-white/70 px-4 py-2 rounded-lg shadow-sm">
          <span>الاشتراكات القادمة</span>
          <span className="font-semibold">{stats.upcoming}</span>
        </div>
        <div className="flex justify-between text-sm sm:text-base text-indigo-900 bg-white/70 px-4 py-2 rounded-lg shadow-sm">
          <span>إجمالي الاشتراكات</span>
          <span className="font-semibold">{stats.total}</span>
        </div>
      </div>

      {/* Bar Gradient */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#c4b5fd" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default SubscriptionStats;
