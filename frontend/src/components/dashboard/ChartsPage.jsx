import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAttendances } from "@/redux/slices/AttendanceSlice";
import AttendanceContributionsChart from './AttendanceContributionsChart';
import AttendanceCharts from './AttendanceCharts';

const ChartsPage = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const attendances = useSelector((state) => state.attendance.data) || [];
  const attendanceError = useSelector((state) => state.attendance.error);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await dispatch(fetchAttendances({ page: 1, pageSize: 500, startDate: '2025-05-01', endDate: '2025-05-30' }))
          .unwrap();
      } catch (err) {
        console.error("Error fetching attendances:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="main-content flex items-center justify-center min-h-screen" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (attendanceError) {
    return (
      <div className="main-content p-4 sm:p-6" dir="rtl">
        <p className="text-red-500 text-center">خطأ في جلب بيانات الحضور: {attendanceError}</p>
      </div>
    );
  }

  return (
    <div className="main-content p-4 sm:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-white">تحليلات الحضور</h2>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-white mb-4">
            حضور المشتركين حسب السنة
          </h3>
          <div className="h-96">
            {attendances.length === 0 ? (
              <p className="text-gray-500 text-center py-20">لا توجد بيانات حضور متاحة</p>
            ) : (
              <AttendanceContributionsChart />
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
          <div className="h-80">
            {attendances.length === 0 ? (
              <p className="text-gray-500 text-center py-16">لا توجد بيانات حضور متاحة</p>
            ) : (
              <AttendanceCharts />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsPage;