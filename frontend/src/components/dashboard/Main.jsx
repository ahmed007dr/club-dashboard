import { fetchStaff } from "@/redux/slices/staff";
import { fetchFreeInvites } from "../../redux/slices/invitesSlice";
import { fetchReceipts } from "../../redux/slices/receiptsSlice";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchUsers } from "../../redux/slices/memberSlice";
import { fetchSubscriptions } from "../../redux/slices/subscriptionsSlice";
import { fetchTickets } from "../../redux/slices/ticketsSlice";
import { fetchAttendances } from "@/redux/slices/AttendanceSlice";
import { RiGroupLine, RiVipCrown2Line } from "react-icons/ri";
import { MdSubscriptions } from "react-icons/md";
import { FaRegCalendarCheck, FaReceipt } from "react-icons/fa";
import { BsPeopleFill } from "react-icons/bs";
import { IoTicketOutline } from "react-icons/io5";
import { Link } from "react-router-dom";
import SubscriptionStats from "./SubscriptionStats";
import SubscriptionChart from "./SubscriptionChart";
import ShiftsPerClubChart from "./ShiftsPerClubChart";

const Main = () => {
  const dispatch = useDispatch();
  const [isTodayView, setIsTodayView] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [totalMembers, setTotalMembers] = useState(0);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [totalAttendances, setTotalAttendances] = useState(0);
  const [totalStaff, setTotalStaff] = useState(0);
  const [totalInvites, setTotalInvites] = useState(0);
  const [totalReceipts, setTotalReceipts] = useState(0);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        dispatch(fetchUsers())
          .unwrap()
          .then((res) => {
            console.log('Users data:', res);
            setTotalMembers(res?.count || 0);
          })
          .catch((err) => {
            console.error("Error fetching users:", err);
            setTotalMembers(0);
          }),

        dispatch(fetchSubscriptions())
          .unwrap()
          .then((res) => {
            console.log('Subscriptions data:', res);
            setTotalSubscriptions(res?.count || 0);
          })
          .catch((err) => {
            console.error("Error fetching subscriptions:", err);
            setTotalSubscriptions(0);
          }),

        dispatch(fetchTickets())
          .unwrap()
          .then((res) => {
            console.log('Tickets data:', res);
            setTotalTickets(res?.count || res?.results?.length || 0);
          })
          .catch((err) => {
            console.error("Error fetching tickets:", err);
            setTotalTickets(0);
          }),

        dispatch(fetchAttendances())
          .unwrap()
          .then((res) => {
            console.log('Attendances data:', res);
            // Handle case where res is the array or res.results contains the array
            const attendanceCount = Array.isArray(res) ? res.length : (res?.count || res?.results?.length || 0);
            setTotalAttendances(attendanceCount);
          })
          .catch((err) => {
            console.error("Error fetching attendances:", err);
            setTotalAttendances(0);
          }),

        dispatch(fetchStaff())
          .unwrap()
          .then((res) => {
            console.log('Staff data:', res);
            // Handle case where res is the array or res.results contains the array
            const staffCount = Array.isArray(res) ? res.length : (res?.count || res?.results?.length || 0);
            setTotalStaff(staffCount);
          })
          .catch((err) => {
            console.error("Error fetching staff:", err);
            setTotalStaff(0);
          }),

        dispatch(fetchFreeInvites())
          .unwrap()
          .then((res) => {
            console.log('Free invites data:', res);
            setTotalInvites(res?.count || 0);
          })
          .catch((err) => {
            console.error("Error fetching free invites:", err);
            setTotalInvites(0);
          }),

        dispatch(fetchReceipts())
          .unwrap()
          .then((res) => {
            console.log('Receipts data:', res);
            setTotalReceipts(res?.data?.length || 0);
          })
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
  }, [dispatch, isTodayView]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const cardClasses =
    "bg-white rounded-2xl p-4 sm:p-6 shadow transition hover:shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4";
  const iconClasses =
    "text-3xl sm:text-4xl text-blue-500 bg-blue-100 p-2 rounded-full shrink-0";
  const textLinkClasses =
    "text-xs sm:text-sm text-blue-500 hover:underline mt-2 sm:mt-0 inline-block";

  return (
    <div className="min-h-screen p-4 sm:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-white">
          لوحة التحكم - {isTodayView ? "بيانات اليوم" : "الإجمالي الكلي"}
        </h2>
        <button
          onClick={() => setIsTodayView((prev) => !prev)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm shadow"
        >
          {isTodayView ? "عرض الإجمالي الكلي" : "عرض بيانات اليوم"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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

      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6 mt-6">
        <div className="w-full sm:w-1/2">
          <SubscriptionStats />
        </div>
        <div className="w-full sm:w-1/2">
          <SubscriptionChart />
        </div>
      </div>

      <div className="mt-6">
        <ShiftsPerClubChart />
      </div>
    </div>
  );
};

const DataCard = ({ label, value, icon, link }) => {
  const cardClasses =
    "bg-white rounded-2xl p-4 sm:p-6 shadow transition hover:shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4";
  const textLinkClasses =
    "text-xs sm:text-sm text-blue-500 hover:underline mt-2 sm:mt-0 inline-block";

  return (
    <div className={cardClasses}>
      <div className="text-center sm:text-right">
        <h3 className="text-gray-600 text-sm sm:text-base font-semibold">{label}</h3>
        <p className="text-2xl sm:text-3xl font-extrabold text-gray-800 truncate">
          {value !== undefined ? value : 'Loading...'}
        </p>
        <Link to={link} className={textLinkClasses}>عرض الكل</Link>
      </div>
      {icon}
    </div>
  );
};

export default Main;