import { fetchStaff } from "@/redux/slices/staff";
import { fetchFreeInvites } from "../../redux/slices/invitesSlice";
import { fetchReceipts } from "../../redux/slices/receiptsSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers } from "../../redux/slices/memberSlice";
import { fetchSubscriptions } from "../../redux/slices/subscriptionsSlice";
import { fetchTickets } from "../../redux/slices/ticketsSlice";
import { fetchAttendances } from "@/redux/slices/AttendanceSlice";
import { RiGroupLine } from "react-icons/ri";
import { MdSubscriptions } from "react-icons/md";
import { FaRegCalendarCheck, FaReceipt } from "react-icons/fa";
import { BsPeopleFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import { RiVipCrown2Line } from "react-icons/ri";
import { IoTicketOutline } from "react-icons/io5";
import SubscriptionStats from "./SubscriptionStats";
import SubscriptionChart from "./SubscriptionChart";
import ShiftsPerClubChart from "./ShiftsPerClubChart ";
import ExpenseCategories from "./ExpenseCategories"
const Main = () => {
  const dispatch = useDispatch();
  const { invites } = useSelector((state) => state.invites);
  const { receipts } = useSelector((state) => state.receipts);

  const [totalMembers, setTotalMembers] = useState(0);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [totalAttendances, setTotalAttendances] = useState(0);
  const [totalStaff, setTotalStaff] = useState(0);

  useEffect(() => {
    dispatch(fetchUsers())
      .unwrap()
      .then((res) => setTotalMembers(res.results.length))
      .catch(console.error);
    dispatch(fetchSubscriptions())
      .unwrap()
      .then((res) => setTotalSubscriptions(res.length))
      .catch(console.error);
    dispatch(fetchTickets())
      .unwrap()
      .then((res) => setTotalTickets(res.length))
      .catch(console.error);
    dispatch(fetchAttendances())
      .unwrap()
      .then((res) => setTotalAttendances(res.length))
      .catch(console.error);
    dispatch(fetchStaff())
      .unwrap()
      .then((res) => setTotalStaff(res.length))
      .catch(console.error);
    dispatch(fetchFreeInvites());
    dispatch(fetchReceipts());
  }, [dispatch]);

  const cardClasses =
    "bg-white rounded-2xl p-4 sm:p-6 shadow transition hover:shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4";
  const iconClasses =
    "text-3xl sm:text-4xl text-blue-500 bg-blue-100 p-2 rounded-full shrink-0";
  const textLinkClasses =
    "text-xs sm:text-sm text-blue-500 hover:underline mt-2 sm:mt-0 inline-block";

  return (
    <div className="min-h-screen p-4 sm:p-6" dir="rtl">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-white mb-4 sm:mb-6">
        لوحة التحكم
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* التذاكر */}
        <div className={cardClasses}>
          <div className="text-center sm:text-right">
            <h3 className="text-gray-600 text-sm sm:text-base font-semibold">
              إجمالي التذاكر
            </h3>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-800 truncate">
              {totalTickets}
            </p>
            <Link
              to="/tickets"
              className={textLinkClasses}
              aria-label="عرض جميع التذاكر"
            >
              عرض الكل
            </Link>
          </div>
          <IoTicketOutline className={iconClasses} />
        </div>

        {/* الأعضاء */}
        <div className={cardClasses}>
          <div className="text-center sm:text-right">
            <h3 className="text-gray-600 text-sm sm:text-base font-semibold">
              إجمالي الأعضاء
            </h3>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-800 truncate">
              {totalMembers}
            </p>
            <Link
              to="/members"
              className={textLinkClasses}
              aria-label="عرض جميع الأعضاء"
            >
              عرض الكل
            </Link>
          </div>
          <RiGroupLine className={iconClasses} />
        </div>

        {/* الاشتراكات */}
        <div className={cardClasses}>
          <div className="text-center sm:text-right">
            <h3 className="text-gray-600 text-sm sm:text-base font-semibold">
              إجمالي الاشتراكات
            </h3>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-800 truncate">
              {totalSubscriptions}
            </p>
            <Link
              to="/subscriptions"
              className={textLinkClasses}
              aria-label="إدارة الاشتراكات"
            >
              إدارة
            </Link>
          </div>
          <MdSubscriptions className={iconClasses} />
        </div>

        {/* الحضور */}
        <div className={cardClasses}>
          <div className="text-center sm:text-right">
            <h3 className="text-gray-600 text-sm sm:text-base font-semibold">
              إجمالي الحضور
            </h3>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-800 truncate">
              {totalAttendances}
            </p>
            <Link
              to="/attendance"
              className={textLinkClasses}
              aria-label="تتبع الحضور"
            >
              تتبع
            </Link>
          </div>
          <FaRegCalendarCheck className={iconClasses} />
        </div>

        {/* الموظفين */}
        <div className={cardClasses}>
          <div className="text-center sm:text-right">
            <h3 className="text-gray-600 text-sm sm:text-base font-semibold">
              إجمالي الموظفين
            </h3>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-800 truncate">
              {totalStaff}
            </p>
            <Link
              to="/staff"
              className={textLinkClasses}
              aria-label="إدارة الموظفين"
            >
              إدارة
            </Link>
          </div>
          <BsPeopleFill className={iconClasses} />
        </div>

        {/* الدعوات */}
        <div className={cardClasses}>
          <div className="text-center sm:text-right">
            <h3 className="text-gray-600 text-sm sm:text-base font-semibold">
              الدعوات
            </h3>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-800 truncate">
              {invites?.length || 0}
            </p>
            <Link
              to="/free-invites"
              className={textLinkClasses}
              aria-label="عرض جميع الدعوات"
            >
              عرض الكل
            </Link>
          </div>
          <RiVipCrown2Line className={iconClasses} />
        </div>

        {/* الإيصالات */}
        <div className={cardClasses}>
          <div className="text-center sm:text-right">
            <h3 className="text-gray-600 text-sm sm:text-base font-semibold">
              الإيصالات
            </h3>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-800 truncate">
              {receipts?.length || 0}
            </p>
            <Link
              to="/receipts"
              className={textLinkClasses}
              aria-label="عرض جميع الإيصالات"
            >
              عرض الكل
            </Link>
          </div>
          <FaReceipt className={iconClasses} />
        </div>
      </div>

      {/* Subscription Stats and Chart Section */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6 mt-6">
        <div className="w-full sm:w-1/2">
          <SubscriptionStats />
        </div>
        <div className="w-full sm:w-1/2">
          <SubscriptionChart />
        </div>
      </div>

      {/* Shifts Per Club Chart Section */}
      <div className="mt-6">
        <div className="w-full">
          <ShiftsPerClubChart />
        </div>
      </div>
    </div>
  );
};

export default Main;