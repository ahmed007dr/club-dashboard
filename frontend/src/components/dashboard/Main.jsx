import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSubscriptions } from "@/redux/slices/subscriptionsSlice";
import { fetchAttendances } from "@/redux/slices/AttendanceSlice";
import { fetchStaff } from "@/redux/slices/staff";
import { fetchFreeInvites } from "@/redux/slices/invitesSlice";
import { RiGroupLine, RiVipCrown2Line } from "react-icons/ri";
import { MdSubscriptions } from "react-icons/md";
import { FaRegCalendarCheck } from "react-icons/fa";
import { BsPeopleFill } from "react-icons/bs";
import { IoTicketOutline } from "react-icons/io5";
import { AiOutlineSchedule } from "react-icons/ai";
import { GiReceiveMoney } from "react-icons/gi";
import { Link } from "react-router-dom";

const Main = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        dispatch(fetchSubscriptions()).unwrap().catch((err) => console.error("Error fetching subscriptions:", err)),
        dispatch(fetchAttendances({ page: 1, pageSize: 500, startDate: '2025-05-01', endDate: '2025-05-30' }))
          .unwrap()
          .catch((err) => console.error("Error fetching attendances:", err)),
        dispatch(fetchStaff({ page: 1, page_size: 100 })).unwrap().catch((err) => console.error("Error fetching staff:", err)),
        dispatch(fetchFreeInvites()).unwrap().catch((err) => console.error("Error fetching free invites:", err)),
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [dispatch]);

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

  const linkCards = [
    { label: "حضور الأعضاء", icon: <FaRegCalendarCheck />, link: "/attendance", gradient: "from-orange-500 to-red-600", bgGradient: "from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20" },
    { label: "الأعضاء", icon: <RiGroupLine />, link: "/member-profile", gradient: "from-blue-500 to-cyan-600", bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20" },
    { label: "الاشتراكات", icon: <MdSubscriptions />, link: "/EmployeeSubscriptionList", gradient: "from-pink-500 to-rose-600", bgGradient: "from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20" },
    { label: "التذاكر", icon: <IoTicketOutline />, link: "/tickets", gradient: "from-emerald-500 to-teal-600", bgGradient: "from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20" },
    { label: "حضور الموظفين", icon: <AiOutlineSchedule />, link: "/AttendanceDashboard", gradient: "from-purple-500 to-indigo-600", bgGradient: "from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20" },
    // { label: "شيفتات الموظفين", icon: <BsPeopleFill />, link: "/staff", gradient: "from-pink-500 to-rose-600", bgGradient: "from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20" },
    { label: "تقرير الإيرادات", icon: <GiReceiveMoney />, link: "/reports", gradient: "from-green-500 to-lime-600", bgGradient: "from-green-50 to-lime-50 dark:from-green-900/20 dark:to-lime-900/20" },
    { label: "الدعوات المجانية", icon: <RiVipCrown2Line />, link: "/free-invites", gradient: "from-yellow-500 to-amber-600", bgGradient: "from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20" },

  ];

  return (
    <div className="main-content p-4 sm:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-white">لوحة التحكم</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {linkCards.map((card, index) => (
          <DataCard key={index} label={card.label} icon={card.icon} link={card.link} gradient={card.gradient} bgGradient={card.bgGradient} />
        ))}
      </div>
    </div>
  );
};

const DataCard = ({ label, icon, link, gradient, bgGradient }) => {
  return (
    <div
      className={`group relative overflow-hidden bg-gradient-to-br ${bgGradient} backdrop-blur-sm border border-white/20 dark:border-gray-700/50 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 w-full max-w-xs md:max-w-sm lg:max-w-md aspect-square mx-auto`}
    >
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <div
          className={`flex-shrink-0 w-20 h-20 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4`}
        >
          <div className="text-white text-4xl">{icon}</div>
        </div>
        <h3 className="text-gray-600 dark:text-gray-300 text-lg font-medium leading-tight text-center mb-4">{label}</h3>
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

      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
};

export default Main;