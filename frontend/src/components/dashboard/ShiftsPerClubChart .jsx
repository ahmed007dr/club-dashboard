import React from "react";
import { useSelector } from "react-redux";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const ShiftsPerClubChart = () => {
  const staff = useSelector((state) => state.staff.items || []);

  // Aggregate shifts per club
  const clubCounts = staff.reduce((acc, shift) => {
    const clubName = shift.club_details?.name || "غير معروف";
    acc[clubName] = (acc[clubName] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(clubCounts).map(([name, count]) => ({
    name,
    count,
  }));

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200 text-right">
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          <p className="text-sm text-gray-600">
            عدد الورديات: <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="w-full bg-white rounded-2xl p-4 sm:p-6 shadow-md"
      aria-label="مخطط عدد الورديات لكل نادي"
      dir="rtl"
    >
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
        عدد الورديات لكل نادي
      </h3>
      <div className="w-full h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              interval={0}
              height={60}
              tick={{ fontSize: 12, fill: "#4b5563" }}
              tickFormatter={(value) => (value.length > 10 ? `${value.slice(0, 10)}...` : value)}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#4b5563" }}
              stroke="#e5e7eb"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="count"
              fill="#34a1eb"
              radius={[8, 8, 0, 0]} // Rounded top corners
              barSize={40} // Adjust bar width
              className="transition-all duration-300 hover:opacity-80"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  };

export default ShiftsPerClubChart;