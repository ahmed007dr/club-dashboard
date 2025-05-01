// components/charts/SubscriptionChart.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionTypes } from '../../redux/slices/subscriptionsSlice';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';


const COLORS = ['#00C49F', '#FF8042', '#0088FE', '#FFBB28', '#AA336A'];

const SubscriptionChart = () => {
  const dispatch = useDispatch();

  const { subscriptionTypes, loading, error } = useSelector(
    (state) => state.subscriptions
  );

  useEffect(() => {
    dispatch(fetchSubscriptionTypes());
  }, [dispatch]);

  const data = [
    {
      name: 'نشطة',
      value: subscriptionTypes.filter((s) => s.is_active).length,
    },
    {
      name: 'غير نشطة',
      value: subscriptionTypes.filter((s) => !s.is_active).length,
    },
    {
      name: 'تشمل صالة الألعاب الرياضية',
      value: subscriptionTypes.filter((s) => s.includes_gym).length,
    },
    {
      name: 'تشمل المسبح',
      value: subscriptionTypes.filter((s) => s.includes_pool).length,
    },
    {
      name: 'تشمل الصفوف',
      value: subscriptionTypes.filter((s) => s.includes_classes).length,
    },
  ];

  if (loading) return <p>جاري التحميل...</p>;
  if (error) return <p className="text-red-500">حدث خطأ: {error}</p>;

  return (
    <div className="w-full flex justify-center items-center p-4">
      <PieChart width={400} height={400}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          outerRadius={120}
          fill="#8884d8"
          label
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
};

export default SubscriptionChart;
