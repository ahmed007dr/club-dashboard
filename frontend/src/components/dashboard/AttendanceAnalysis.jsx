import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { analyzeAttendance, getStaffAttendanceReport } from "@/redux/slices/AttendanceSlice";



import { FiUser, FiBarChart2, FiAlertTriangle } from 'react-icons/fi';




const AttendanceAnalysis = () => {
  const { staffId } = useParams();
  const dispatch = useDispatch();

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

  // Loading state for initial load
  if (loading && !reportData && !analysisData) {
    return (
      <div className="text-center py-8 text-blue-600 font-semibold">
        جارٍ تحميل البيانات...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded space-y-8" dir="rtl">
      
      {/* Employee Report Table - in Arabic */}
      {reportData && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
            <FiUser className="text-blue-600 border-2 border-blue-600 p-1 rounded-full" /> 
            تقرير الموظف
          </h2>
          <table className="w-full border border-gray-300 rounded text-right">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <th className="p-3 font-medium bg-gray-100">الاسم</th>
                <td className="p-3">{reportData.staff_name}</td>
              </tr>
              <tr>
                <th className="p-3 font-medium bg-gray-100">رقم الموظف</th>
                <td className="p-3">{reportData.staff_id}</td>
              </tr>
              <tr>
                <th className="p-3 font-medium bg-gray-100">رمز RFID</th>
                <td className="p-3">{reportData.rfid_code}</td>
              </tr>
              <tr>
                <th className="p-3 font-medium bg-gray-100">عدد أيام الحضور</th>
                <td className="p-3">{reportData.attendance_days}</td>
              </tr>
              <tr>
                <th className="p-3 font-medium bg-gray-100">إجمالي الساعات</th>
                <td className="p-3">{reportData.total_hours} ساعة</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Attendance Analysis Section - English errors, Arabic table */}
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


