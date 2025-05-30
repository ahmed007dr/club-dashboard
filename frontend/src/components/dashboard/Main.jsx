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
          icon={<IoTicketOutline className={iconClasses} />}
          link="/tickets"
        />
        <DataCard
          label="إجمالي الأعضاء"
          value={totalMembers}
          icon={<RiGroupLine className={iconClasses} />}
          link="/members"
        />
        <DataCard
          label="إجمالي الاشتراكات"
          value={totalSubscriptions}
          icon={<MdSubscriptions className={iconClasses} />}
          link="/subscriptions"
        />
        <DataCard
          label="إجمالي الحضور"
          value={totalAttendances}
          icon={<FaRegCalendarCheck className={iconClasses} />}
          link="/attendance"
        />
        <DataCard
          label="إجمالي الموظفين"
          value={totalStaff}
          icon={<BsPeopleFill className={iconClasses} />}
          link="/staff"
        />
        <DataCard
          label="الدعوات"
          value={totalInvites}
          icon={<RiVipCrown2Line className={iconClasses} />}
          link="/free-invites"
        />
        <DataCard
          label="الإيصالات"
          value={totalReceipts}
          icon={<FaReceipt className={iconClasses} />}
          link="/receipts"
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

const DataCard = ({ label, value, icon, link }) => {
  const cardClasses = "bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow transition hover:shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4";
  const textLinkClasses = "text-xs sm:text-sm text-blue-500 hover:underline mt-2 sm:mt-0 inline-block";

  return (
    <div className={cardClasses}>
      <div className="text-center sm:text-right">
        <h3 className="text-gray-600 dark:text-gray-300 text-sm sm:text-base font-semibold">{label}</h3>
        <p className="text-xl sm:text-2xl font-extrabold text-gray-800 dark:text-white truncate">
          {value !== undefined ? value : 'جاري التحميل...'}
        </p>
        <Link to={link} className={textLinkClasses}>عرض الكل</Link>
      </div>
      {icon}
    </div>
  );
};

export default Main;