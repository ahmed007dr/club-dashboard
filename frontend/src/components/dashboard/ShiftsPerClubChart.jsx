import React from 'react';
import { useSelector } from 'react-redux';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const ShiftsPerClubChart = () => {
  const staff = useSelector((state) => state.staff.items || []);

  // Aggregate shifts per club
//   console.log('staff:', staff);
  const clubCounts = staff.reduce((acc, shift) => {
    const clubName = shift.club_details?.name || 'Unknown';
    acc[clubName] = (acc[clubName] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(clubCounts).map(([name, count]) => ({ name, count }));

  return (
    <div className="w-full h-96 p-4 bg-white shadow rounded">
      <h3 className="text-lg font-semibold mb-4">عدد الورديات لكل نادي</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={0} textAnchor="middle" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#34a1eb" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ShiftsPerClubChart;



