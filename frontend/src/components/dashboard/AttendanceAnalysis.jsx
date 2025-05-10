import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { analyzeAttendance, getStaffAttendanceReport } from "@/redux/slices/AttendanceSlice";

const AttendanceAnalysis = () => {
  const { staffId } = useParams();
  const dispatch = useDispatch();

  const { analysisData, reportData, loading, error } = useSelector(state => state.attendance);

  useEffect(() => {
    if (staffId) {
      dispatch(analyzeAttendance(staffId));
      dispatch(getStaffAttendanceReport(staffId));
    }
  }, [dispatch, staffId]);

  if (loading) return <div className="text-center py-8 text-blue-600 font-semibold">جارٍ تحميل البيانات...</div>;
  if (error) return <div className="text-center py-8 text-red-600 font-semibold">حدث خطأ أثناء تحميل البيانات.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded space-y-8" dir="rtl">
      
      {/* بيانات التقرير */}
      {reportData && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2">تقرير الموظف</h2>
          <p><span className="font-medium">الاسم:</span> {reportData.staff_name}</p>
          <p><span className="font-medium">رقم الموظف:</span> {reportData.staff_id}</p>
          <p><span className="font-medium">رمز RFID:</span> {reportData.rfid_code}</p>
          <p><span className="font-medium">عدد أيام الحضور:</span> {reportData.attendance_days}</p>
          <p><span className="font-medium">إجمالي الساعات:</span> {reportData.total_hours} ساعة</p>
        </div>
      )}

      {/* بيانات التحليل */}
      {analysisData && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2">تحليل الحضور</h2>
          <p><span className="font-medium">الحالة:</span> {analysisData.status.replace(/_/g, ' ')}</p>
          <p><span className="font-medium">التأخير بالدقائق:</span> {analysisData.late_by_minutes}</p>
          <p><span className="font-medium">المغادرة المبكرة بالدقائق:</span> {analysisData.left_early_by_minutes}</p>
          <p><span className="font-medium">الساعات الفعلية:</span> {analysisData.actual_hours} ساعة</p>
          <p><span className="font-medium">الساعات المتوقعة:</span> {analysisData.expected_hours} ساعة</p>
        </div>
      )}

    </div>
  );
};

export default AttendanceAnalysis;

