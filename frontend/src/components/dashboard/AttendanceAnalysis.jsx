import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { analyzeAttendance, getStaffAttendanceReport } from "@/redux/slices/AttendanceSlice";
import { FiUser, FiBarChart2, FiAlertTriangle, FiCalendar, FiClock, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const AttendanceAnalysis = () => {
  const { staffId } = useParams();
  const dispatch = useDispatch();
  const [selectedMonth, setSelectedMonth] = useState('');

  const { 
    analysisData, 
    reportData, 
    loading, 
    error, 
    errorDetails 
  } = useSelector(state => state.attendance);

  useEffect(() => {
    if (staffId) {
      dispatch(analyzeAttendance(staffId));
      dispatch(getStaffAttendanceReport(staffId));
    }
  }, [dispatch, staffId]);

  // Set the default selected month when data loads
  useEffect(() => {
    if (reportData && reportData[0]?.monthly_data?.length > 0) {
      setSelectedMonth(reportData[0].monthly_data[0].month);
    }
  }, [reportData]);

  // Loading state with spinner
  if (loading && !reportData && !analysisData) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
        <span className="mr-4 text-blue-600 font-semibold">جارٍ تحميل البيانات...</span>
      </div>
    );
  }

  const staffData = reportData && reportData[0];
  const monthlyData = staffData?.monthly_data?.find(data => data.month === selectedMonth);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8" dir="rtl">
      {/* Employee Report Section */}
      {staffData && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <FiUser className="text-blue-600 bg-blue-100 p-1.5 rounded-full w-8 h-8" /> 
              تقرير الموظف الشهري
            </h2>
            {staffData.monthly_data?.length > 0 && (
              <div className="relative flex items-center gap-2">
                <FiCalendar className="text-gray-500 w-5 h-5" />
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="border border-gray-300 rounded-lg py-2 px-4 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200"
                >
                  {staffData.monthly_data.map((monthData, index) => (
                    <option key={index} value={monthData.month}>
                      {monthData.month}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Summary Widgets */}
          {monthlyData && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
                <FiCalendar className="text-blue-600 w-6 h-6" />
                <div>
                  <p className="text-sm text-gray-600">أيام الحضور</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {monthlyData.attendance_days !== undefined ? `${monthlyData.attendance_days} يوم` : 'غير محسوب'}
                  </p>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg flex items-center gap-3">
                <FiClock className="text-green-600 w-6 h-6" />
                <div>
                  <p className="text-sm text-gray-600">إجمالي الساعات</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {monthlyData.total_hours !== undefined ? `${monthlyData.total_hours.toFixed(2)} ساعة` : 'غير محسوب'}
                  </p>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg flex items-center gap-3">
                <FiTrendingUp className="text-purple-600 w-6 h-6" />
                <div>
                  <p className="text-sm text-gray-600">نسبة التغيير</p>
                  <p className={`text-lg font-semibold ${monthlyData.percentage_change > 0 ? 'text-green-600' : monthlyData.percentage_change < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                    {monthlyData.percentage_change !== undefined 
                      ? `${monthlyData.percentage_change > 0 ? '+' : ''}${monthlyData.percentage_change}%` 
                      : 'غير محسوب'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Employee Report Table */}
          {monthlyData ? (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg text-right">
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50 transition-all duration-200">
                    <th className="p-4 font-medium bg-gray-100 text-gray-700 w-1/3">الشهر</th>
                    <td className="p-4 text-gray-800">{monthlyData.month || 'غير محدد'}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-all duration-200">
                    <th className="p-4 font-medium bg-gray-100 text-gray-700">الاسم</th>
                    <td className="p-4 text-gray-800">{staffData.staff_name || 'غير متوفر'}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-all duration-200">
                    <th className="p-4 font-medium bg-gray-100 text-gray-700">رمز RFID</th>
                    <td className="p-4 text-gray-800">{staffData.rfid_code || 'غير مسجل'}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-all duration-200">
                    <th className="p-4 font-medium bg-gray-100 text-gray-700">عدد أيام الحضور</th>
                    <td className="p-4 text-gray-800">
                      <div className="flex items-center gap-2">
                        <FiCalendar className="text-blue-500 w-5 h-5" />
                        {monthlyData.attendance_days !== undefined ? `${monthlyData.attendance_days} يوم` : 'غير محسوب'}
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-all duration-200">
                    <th className="p-4 font-medium bg-gray-100 text-gray-700">إجمالي الساعات</th>
                    <td className="p-4 text-gray-800">
                      <div className="flex items-center gap-2">
                        <FiClock className="text-green-500 w-5 h-5" />
                        {monthlyData.total_hours !== undefined ? `${monthlyData.total_hours.toFixed(2)} ساعة` : 'غير محسوب'}
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-all duration-200">
                    <th className="p-4 font-medium bg-gray-100 text-gray-700">التغيير في الساعات</th>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {monthlyData.hours_change > 0 ? (
                          <FiTrendingUp className="text-green-600 w-5 h-5" />
                        ) : monthlyData.hours_change < 0 ? (
                          <FiTrendingDown className="text-red-600 w-5 h-5" />
                        ) : null}
                        <span className={`${monthlyData.hours_change > 0 ? 'text-green-600' : monthlyData.hours_change < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                          {monthlyData.hours_change !== undefined 
                            ? `${monthlyData.hours_change > 0 ? '+' : ''}${monthlyData.hours_change.toFixed(2)} ساعة` 
                            : 'غير محسوب'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-all duration-200">
                    <th className="p-4 font-medium bg-gray-100 text-gray-700">نسبة التغيير</th>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {monthlyData.percentage_change > 0 ? (
                          <FiTrendingUp className="text-green-600 w-5 h-5" />
                        ) : monthlyData.percentage_change < 0 ? (
                          <FiTrendingDown className="text-red-600 w-5 h-5" />
                        ) : null}
                        <span className={`${monthlyData.percentage_change > 0 ? 'text-green-600' : monthlyData.percentage_change < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                          {monthlyData.percentage_change !== undefined 
                            ? `${monthlyData.percentage_change > 0 ? '+' : ''}${monthlyData.percentage_change}%` 
                            : 'غير محسوب'}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              لا توجد بيانات متاحة للشهر المحدد
            </div>
          )}
        </div>
      )}

      {/* Attendance Analysis Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-6">
          <FiBarChart2 className="text-blue-600 bg-blue-100 p-1.5 rounded-full w-8 h-8" /> 
          تحليل الحضور
        </h2>
        
        {error ? (
          <div className="flex flex-col items-center justify-center py-8 bg-red-50 rounded-lg">
            <FiAlertTriangle className="text-red-600 text-4xl mb-4" />
            <p className="text-red-600 font-semibold mb-2">
              {errorDetails?.error || error || 'فشل تحميل بيانات التحليل'}
            </p>
            <button 
              onClick={() => dispatch(analyzeAttendance(staffId))}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : analysisData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'الحالة', value: analysisData.status.replace(/_/g, ' '), icon: FiUser },
              { label: 'التأخير بالدقائق', value: analysisData.late_by_minutes, icon: FiClock },
              { label: 'المغادرة المبكرة بالدقائق', value: analysisData.left_early_by_minutes, icon: FiClock },
              { label: 'الساعات الفعلية', value: `${analysisData.actual_hours} ساعة`, icon: FiClock },
              { label: 'الساعات المتوقعة', value: `${analysisData.expected_hours} ساعة`, icon: FiClock },
            ].map((item, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg flex items-center gap-3">
                <item.icon className="text-blue-600 w-6 h-6" />
                <div>
                  <p className="text-sm text-gray-600">{item.label}</p>
                  <p className="text-lg font-semibold text-gray-800">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center py-8 bg-gray-50 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
            <span className="mr-4 text-gray-500">جارٍ تحميل بيانات التحليل...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceAnalysis;