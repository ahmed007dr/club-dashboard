import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchSubscriptions } from "@/redux/slices/subscriptionsSlice";
import { fetchTickets } from "@/redux/slices/ticketsSlice";
import { fetchAttendances } from "@/redux/slices/AttendanceSlice";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const UpdatedDashboardCharts = () => {
  const dispatch = useDispatch();
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    Promise.all([
      dispatch(fetchSubscriptions()).unwrap(),
      dispatch(fetchTickets()).unwrap(),
      dispatch(fetchAttendances()).unwrap(),
    ]).then(([subs, tickets, attendance]) => {
      const daysMap = {};

      const processData = (data, key) => {
        data.forEach((item) => {
          const date = new Date(item.created_at).toLocaleDateString("ar-EG", {
            day: "2-digit",
            month: "2-digit",
          });
          if (!daysMap[date]) daysMap[date] = { date, اشتراكات: 0, تذاكر: 0, حضور: 0 };
          daysMap[date][key] += 1;
        });
      };

      processData(subs, "اشتراكات");
      processData(tickets, "تذاكر");
      processData(attendance, "حضور");

      const sortedData = Object.values(daysMap).sort((a, b) => new Date(a.date) - new Date(b.date));
      setChartData(sortedData);
    });
  }, [dispatch]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow">
      <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-4">الإحصائيات اليومية</h3>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="تذاكر" fill="#8884d8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="حضور" fill="#82ca9d" radius={[4, 4, 0, 0]} />
          <Line type="monotone" dataKey="اشتراكات" stroke="#ff7300" strokeWidth={2} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UpdatedDashboardCharts;
