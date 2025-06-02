import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { analyzeAttendance, getStaffAttendanceReport } from "@/redux/slices/AttendanceSlice";
import { FiUser, FiBarChart2, FiAlertTriangle, FiCalendar } from 'react-icons/fi';

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

  // Loading state for initial load
  if (loading && !reportData && !analysisData) {
    return (
      <div className="text-center py-8 text-blue-600 font-semibold">
        جارٍ تحميل البيانات...
      </div>
    );
  }

  const staffData = reportData && reportData[0];
  const monthlyData = staffData?.monthly_data?.find(data => data.month === selectedMonth);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded space-y-8" dir="rtl">
      
      {/* Employee Report Table - in Arabic */}
      {staffData && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FiUser className="text-blue-600 border-2 border-blue-600 p-1 rounded-full" /> 
              تقرير الموظف الشهري
            </h2>
            
            {staffData.monthly_data?.length > 0 && (
              <div className="flex items-center gap-2">
                <FiCalendar className="text-gray-500" />
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="border rounded p-2 text-sm"
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
          
          {monthlyData ? (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg text-right">
                <tbody className="divide-y divide-gray-200">
                  {/* Month */}
                  <tr className="hover:bg-gray-50">
                    <th className="p-3 font-medium bg-gray-100 text-gray-700">الشهر</th>
                    <td className="p-3">{monthlyData.month || 'غير محدد'}</td>
                  </tr>
                  
                  {/* Basic Info */}
                  <tr className="hover:bg-gray-50">
                    <th className="p-3 font-medium bg-gray-100 text-gray-700">الاسم</th>
                    <td className="p-3">{staffData.staff_name || 'غير متوفر'}</td>
                  </tr>
                 
                  <tr className="hover:bg-gray-50">
                    <th className="p-3 font-medium bg-gray-100 text-gray-700">رمز RFID</th>
                    <td className="p-3">{staffData.rfid_code || 'غير مسجل'}</td>
                  </tr>
                  
                  {/* Attendance Stats */}
                  <tr className="hover:bg-gray-50">
                    <th className="p-3 font-medium bg-gray-100 text-gray-700">عدد أيام الحضور</th>
                    <td className="p-3">
                      {monthlyData.attendance_days !== undefined ? `${monthlyData.attendance_days} يوم` : 'غير محسوب'}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <th className="p-3 font-medium bg-gray-100 text-gray-700">إجمالي الساعات</th>
                    <td className="p-3">
                      {monthlyData.total_hours !== undefined ? `${monthlyData.total_hours.toFixed(2)} ساعة` : 'غير محسوب'}
                    </td>
                  </tr>
                  
                  {/* Change Indicators */}
                  <tr className="hover:bg-gray-50">
                    <th className="p-3 font-medium bg-gray-100 text-gray-700">التغيير في الساعات</th>
                    <td className={`p-3 ${monthlyData.hours_change > 0 ? 'text-green-600' : monthlyData.hours_change < 0 ? 'text-red-600' : ''}`}>
                      {monthlyData.hours_change !== undefined 
                        ? `${monthlyData.hours_change > 0 ? '+' : ''}${monthlyData.hours_change.toFixed(2)} ساعة` 
                        : 'غير محسوب'}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <th className="p-3 font-medium bg-gray-100 text-gray-700">نسبة التغيير</th>
                    <td className={`p-3 ${monthlyData.percentage_change > 0 ? 'text-green-600' : monthlyData.percentage_change < 0 ? 'text-red-600' : ''}`}>
                      {monthlyData.percentage_change !== undefined 
                        ? `${monthlyData.percentage_change > 0 ? '+' : ''}${monthlyData.percentage_change}%` 
                        : 'غير محسوب'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              لا توجد بيانات متاحة للشهر المحدد
            </div>
          )}
        </div>
      )}

      {/* Attendance Analysis Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
          <FiBarChart2 className="text-blue-600 border-2 border-blue-600 p-1 rounded-full" /> 
          تحليل الحضور
        </h2>
        
        {error ? (
          <div className="flex flex-col items-center justify-center py-8 text-red-600">
            <FiAlertTriangle className="text-4xl mb-4" />
            <p className="text-gray-700 mb-4">
              {errorDetails?.error || error || 'Failed to load analysis data'}
            </p>
          </div>
        ) : analysisData ? (
          <table className="w-full border border-gray-300 rounded text-right">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <th className="p-3 font-medium bg-gray-100">الحالة</th>
                <td className="p-3">{analysisData.status.replace(/_/g, ' ')}</td>
              </tr>
              <tr>
                <th className="p-3 font-medium bg-gray-100">التأخير بالدقائق</th>
                <td className="p-3">{analysisData.late_by_minutes}</td>
              </tr>
              <tr>
                <th className="p-3 font-medium bg-gray-100">المغادرة المبكرة بالدقائق</th>
                <td className="p-3">{analysisData.left_early_by_minutes}</td>
              </tr>
              <tr>
                <th className="p-3 font-medium bg-gray-100">الساعات الفعلية</th>
                <td className="p-3">{analysisData.actual_hours} ساعة</td>
              </tr>
              <tr>
                <th className="p-3 font-medium bg-gray-100">الساعات المتوقعة</th>
                <td className="p-3">{analysisData.expected_hours} ساعة</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            جارٍ تحميل بيانات التحليل...
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceAnalysis;


