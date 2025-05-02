import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchExpenseCategories } from "../../redux/slices/financeSlice"; // Import your fetchExpenseCategories action
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ExpenseCategoryChart = () => {
  const dispatch = useDispatch();

  // Access the state from Redux
  const { expenseCategories, loading, error } = useSelector((state) => state.finance);

  // Fetch expense categories on component mount
  useEffect(() => {
    dispatch(fetchExpenseCategories());
  }, [dispatch]);

  // Prepare the data for the chart
  const prepareChartData = () => {
    const categoryCounts = expenseCategories.reduce((acc, category) => {
      const club = category.club || "غير متاح";
      acc[club] = (acc[club] || 0) + 1;
      return acc;
    }, {});

    // Convert the data into an array format for Recharts
    return Object.keys(categoryCounts).map((key) => ({
      name: key,
      count: categoryCounts[key],
    }));
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl text-right">إحصائيات فئات المصروفات</h2>

        {/* Chart Section */}
        <div className="w-full h-72 mt-6">
          {expenseCategories.length > 0 && !loading && !error ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={prepareChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          ) : loading ? (
            <p className="text-lg text-gray-600 text-right">جاري التحميل...</p>
          ) : error ? (
            <p className="text-lg text-red-600 text-right">خطأ: {error}</p>
          ) : (
            <p className="text-lg text-gray-600 text-right">لا توجد بيانات لعرضها</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseCategoryChart;
