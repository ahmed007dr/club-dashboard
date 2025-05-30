import { fetchStaff } from "@/redux/slices/staff";
import { fetchFreeInvites } from "@/redux/slices/invitesSlice";
import { fetchReceipts } from "@/redux/slices/receiptsSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers } from "@/redux/slices/memberSlice";
import { fetchSubscriptions } from "@/redux/slices/subscriptionsSlice";
import { fetchTickets } from "@/redux/slices/ticketsSlice";
import { fetchAttendances } from "@/redux/slices/AttendanceSlice";
import { RiGroupLine, RiVipCrown2Line } from "react-icons/ri";
import { MdSubscriptions } from "react-icons/md";
import { FaRegCalendarCheck, FaReceipt } from "react-icons/fa";
import { BsPeopleFill } from "react-icons/bs";
import { IoTicketOutline } from "react-icons/io5";
import { Link } from "react-router-dom";
import AttendanceContributionsChart from './AttendanceContributionsChart';
import AttendanceCharts from './AttendanceCharts';

const Main = () => {
  const dispatch = useDispatch();
  const [isTodayView, setIsTodayView] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('week'); // فلتر زمني افتراضي أسبوعي

  const [totalMembers, setTotalMembers] = useState(0);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [totalAttendances, setTotalAttendances] = useState(0);
  const [totalStaff, setTotalStaff] = useState(0);
  const [totalInvites, setTotalInvites] = useState(0);
  const [totalReceipts, setTotalReceipts] = useState(0);

  // جلب بيانات الحضور من Redux
  const attendances = useSelector((state) => state.attendance.data) || [];
  const attendanceError = useSelector((state) => state.attendance.error);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        dispatch(fetchUsers())
          .unwrap()
          .then((res) => setTotalMembers(res?.count || 0))
          .catch((err) => {
            console.error("Error fetching users:", err);
            setTotalMembers(0);
          }),

        dispatch(fetchSubscriptions())
          .unwrap()
          .then((res) => setTotalSubscriptions(res?.count || 0))
          .catch((err) => {
            console.error("Error fetching subscriptions:", err);
            setTotalSubscriptions(0);
          }),

        dispatch(fetchTickets({ page: 1, page_size: 100 }))
          .unwrap()
          .then((res) => setTotalTickets(res?.count || (Array.isArray(res) ? res.length : res?.results?.length) || 0))
          .catch((err) => {
            console.error("Error fetching tickets:", err);
            setTotalTickets(0);
          }),

        dispatch(fetchAttendances({ 
          page: 1, 
          pageSize: 500,
          startDate: '2025-05-01',
          endDate: '2025-05-30'
        }))
          .unwrap()
          .then((res) => {
            console.log("Attendances fetched:", res);
            setTotalAttendances(res?.count || (Array.isArray(res.data) ? res.data.length : res?.data?.length) || 0);
          })
          .catch((err) => {
            console.error("Error fetching attendances:", err);
            setTotalAttendances(0);
          }),

        dispatch(fetchStaff({ page: 1, page_size: 100 }))
          .unwrap()
          .then((res) => setTotalStaff(res?.count || (Array.isArray(res) ? res.length : res?.results?.length) || 0))
          .catch((err) => {
            console.error("Error fetching staff:", err);
            setTotalStaff(0);
          }),

        dispatch(fetchFreeInvites())
          .unwrap()
          .then((res) => setTotalInvites(res?.count || 0))
          .catch((err) => {
            console.error("Error fetching free invites:", err);
            setTotalInvites(0);
          }),

        dispatch(fetchReceipts())
          .unwrap()
          .then((res) => setTotalReceipts(res?.data?.length || 0))
          .catch((err) => {
            console.error("Error fetching receipts:", err);
            setTotalReceipts(0);
          }),
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [dispatch, isTodayView, timeFilter]);

  // دالة لتنسيق التاريخ حسب الفلتر
  const formatDateBasedOnFilter = (dateStr, filter) => {
    const date = new Date(dateStr);
    switch(filter) {
      case 'day': return date.toISOString().split('T')[0];
      case 'week': return `الأسبوع ${getWeekNumber(date)}-${date.getFullYear()}`;
      case 'month': return `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      case 'year': return `${date.getFullYear()}`;
      default: return date.toISOString().split('T')[0];
    }
  };

  // دالة لحساب رقم الأسبوع
  const getWeekNumber = (date) => {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    return Math.ceil((((date - firstDay) / 86400000) + firstDay.getDay() + 1) / 7);
  };

  // معالجة بيانات الحضور حسب الفلتر الزمني
  const getAttendanceData = () => {
    const data = {};
    attendances.forEach((attendance) => {
      if (attendance.attendance_date) {
        const dateKey = formatDateBasedOnFilter(attendance.attendance_date, timeFilter);
        data[dateKey] = (data[dateKey] || 0) + 1;
      }
    });

    // تحويل البيانات إلى مصفوفة للعرض
    return Object.entries(data).map(([date, count]) => ({ date, count }));
  };

  // معالجة بيانات الحضور بالساعة
  const getHourlyData = () => {
    const hours = Array(24).fill(0);
    attendances.forEach((attendance) => {
      if (attendance.entry_time) {
        const hour = parseInt(attendance.entry_time.split(':')[0]);
        if (!isNaN(hour) && hour >= 0 && hour <= 23) {
          hours[hour]++;
        }
      }
    });
    return hours;
  };

  // حساب متوسط الحضور
  const getAverageAttendance = () => {
    if (attendances.length === 0) return 0;
    const hourlyData = getHourlyData();
    const sum = hourlyData.reduce((a, b) => a + b, 0);
    return Math.round(sum / hourlyData.filter(h => h > 0).length || 1);
  };

  if (isLoading) {
    return (
      <div className="main-content flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (attendanceError) {
    return (
      <div className="main-content p-4 sm:p-6">
        <p className="text-red-500 text-center">خطأ في جلب بيانات الحضور: {attendanceError}</p>
      </div>
    );
  }

  const cardClasses = "bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow transition hover:shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4";
  const iconClasses = "text-3xl sm:text-4xl text-blue-500 bg-blue-100 dark:bg-blue-900 p-2 rounded-full shrink-0";
  const textLinkClasses = "text-xs sm:text-sm text-blue-500 hover:underline mt-2 sm:mt-0 inline-block";

  return (
    <div className="main-content p-4 sm:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-white">
          لوحة التحكم - {isTodayView ? "بيانات اليوم" : "الإجمالي الكلي"}
        </h2>
        <button
          onClick={() => setIsTodayView((prev) => !prev)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm shadow"
        >
          {isTodayView ? "عرض الإجمالي الكلي" : "عرض بيانات اليوم"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        <DataCard
            label="إجمالي التذاكر"
            value={totalTickets}
            icon={<IoTicketOutline />}
            link="/tickets"
            gradient="from-emerald-500 to-teal-600"
            bgGradient="from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20"
          />
          <DataCard
            label="إجمالي الأعضاء"
            value={totalMembers}
            icon={<RiGroupLine />}
            link="/members"
            gradient="from-blue-500 to-cyan-600"
            bgGradient="from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20"
          />
          <DataCard
            label="إجمالي الاشتراكات"
            value={totalSubscriptions}
            icon={<MdSubscriptions />}
            link="/subscriptions"
            gradient="from-purple-500 to-indigo-600"
            bgGradient="from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20"
          />
          <DataCard
            label="إجمالي الحضور"
            value={totalAttendances}
            icon={<FaRegCalendarCheck />}
            link="/attendance"
            gradient="from-orange-500 to-red-600"
            bgGradient="from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20"
          />
          <DataCard
            label="إجمالي الموظفين"
            value={totalStaff}
            icon={<BsPeopleFill />}
            link="/staff"
            gradient="from-pink-500 to-rose-600"
            bgGradient="from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20"
          />
          <DataCard
            label="الدعوات"
            value={totalInvites}
            icon={<RiVipCrown2Line />}
            link="/free-invites"
            gradient="from-yellow-500 to-amber-600"
            bgGradient="from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20"
          />
          <DataCard
            label="الإيصالات"
            value={totalReceipts}
            icon={<FaReceipt />}
            link="/receipts"
            gradient="from-slate-500 to-gray-600"
            bgGradient="from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20"
          />
      </div>

      {/* فلتر زمني */}
      {/* <div className="flex gap-4 mt-6 mb-4">
        <select 
          className="bg-white dark:bg-gray-700 rounded-lg px-4 py-2 shadow"
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
        >
          <option value="day">يومي</option>
          <option value="week">أسبوعي</option>
          <option value="month">شهري</option>
          <option value="year">سنوي</option>
        </select>
        
        <div className="bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-lg">
          <span className="font-bold">متوسط الحضور: </span>
          <span>{getAverageAttendance()}</span>
          <span className="text-sm text-gray-500 mr-2"> (شخص/ساعة)</span>
        </div>
      </div>*/}

      {/* المخططات */}
      <div className="grid grid-cols-1 gap-6 mt-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-white mb-4">
            حضور المشتركين حسب {timeFilter === 'day' ? 'اليوم' : timeFilter === 'week' ? 'الأسبوع' : timeFilter === 'month' ? 'الشهر' : 'السنة'}
          </h3>
          <div className="h-96"> {/* ارتفاع كبير */}
            {attendances.length === 0 ? (
              <p className="text-gray-500 text-center py-20">لا توجد بيانات حضور متاحة</p>
            ) : (
              <AttendanceContributionsChart  />
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 ">
         
          <div className="h-80"> {/* ارتفاع متوسط */}
            {attendances.length === 0 ? (
              <p className="text-gray-500 text-center py-16">لا توجد بيانات حضور متاحة</p>
            ) : (
              <AttendanceCharts  />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DataCard = ({ label, value, icon, link, gradient, bgGradient }) => {
  return (
    <div
      className={`group relative overflow-hidden bg-gradient-to-br ${bgGradient} backdrop-blur-sm border border-white/20 dark:border-gray-700/50 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent"></div>
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <div className="space-y-3">
          <h3 className="text-gray-600 dark:text-gray-300 text-sm font-medium leading-tight">{label}</h3>
          <p className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">
            {value !== undefined ? value.toLocaleString() : "جاري التحميل..."}
          </p>
          <Link
            to={link}
            className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 group-hover:translate-x-1 transform"
          >
            عرض الكل
            <svg
              className="w-4 h-4 mr-1 transition-transform duration-200 group-hover:-translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        </div>

        <div
          className={`flex-shrink-0 w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          <div className="text-white text-2xl">{icon}</div>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  )
}


export default Main;