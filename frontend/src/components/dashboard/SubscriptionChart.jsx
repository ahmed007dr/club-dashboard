import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSubscriptionTypes } from "../../redux/slices/subscriptionsSlice";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Refined color palette for better contrast and aesthetic
const COLORS = ["#34a1eb", "#60a5fa", "#22c55e", "#f97316", "#a855f7"];

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
      name: "نشطة",
      value: subscriptionTypes.results.filter((s) => s.is_active).length,
    },
    {
      name: "غير نشطة",
      value: subscriptionTypes.results.filter((s) => !s.is_active).length,
    },
    {
      name: "تشمل صالة الألعاب الرياضية",
      value: subscriptionTypes.results.filter((s) => s.includes_gym).length,
    },
    {
      name: "تشمل المسبح",
      value: subscriptionTypes.results.filter((s) => s.includes_pool).length,
    },
    {
      name: "تشمل الصفوف",
      value: subscriptionTypes.results.filter((s) => s.includes_classes).length,
    },
  ].filter((item) => item.value > 0); // Remove zero-value entries

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3  rounded-lg shadow-md border border-gray-200 text-right">
          <p className="text-sm font-semibold text-gray-800">
            {payload[0].name}
          </p>
          <p className="text-sm text-gray-600">
            العدد: <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom Label
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#4b5563"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={window.innerWidth < 640 ? 12 : 14}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-2xl shadow-md p-4 sm:p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-2xl shadow-md text-center">
        حدث خطأ: {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md text-center text-gray-600">
        لا توجد بيانات لعرضها
      </div>
    );
  }

  return (
    <div
      className="w-full bg-white rounded-2xl p-4 sm:p-6 shadow-md"
      aria-label="مخطط أنواع الاشتراكات"
      dir="rtl"
    >
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
        إحصائيات الاشتراكات
      </h3>
      <div className="w-full h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={window.innerWidth < 640 ? 80 : 120}
              innerRadius={window.innerWidth < 640 ? 30 : 50}
              fill="#8884d8"
              label={renderCustomLabel}
              labelLine
              paddingAngle={5}
              isAnimationActive={true}
              animationDuration={800}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  className="transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              align="center"
              verticalAlign="bottom"
              iconSize={12}
              wrapperStyle={{
                fontSize: window.innerWidth < 640 ? 12 : 14,
                color: "#4b5563",
                paddingTop: 10,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SubscriptionChart;
