import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchShifts } from "@/redux/slices/staff";
import { fetchFreeInvites } from "../../redux/slices/invitesSlice";
import { fetchReceipts } from "../../redux/slices/receiptsSlice";
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

const isToday = (dateStr) => {
  const today = new Date();
  const date = new Date(dateStr);
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

const filterByDate = (data, isTodayView) => {
  if (!isTodayView) return data;
  return data.filter((item) => isToday(item.created_at));
};

const Main = () => {
  const dispatch = useDispatch();
  const { selectedClub } = useSelector((state) => state.club);
  const { loading, error, shifts } = useSelector((state) => state.staff);
  const { loading: usersLoading, error: usersError } = useSelector((state) => state.userslice);
  const { loading: subscriptionsLoading, error: subscriptionsError } = useSelector((state) => state.subscriptions);
  const { loading: ticketsLoading, error: ticketsError } = useSelector((state) => state.tickets);
  const { loading: attendancesLoading, error: attendancesError } = useSelector((state) => state.attendance);
  const { loading: invitesLoading, error: invitesError } = useSelector((state) => state.invites);
  const { loading: receiptsLoading, error: receiptsError } = useSelector((state) => state.receipts);

  const [isTodayView, setIsTodayView] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [totalAttendances, setTotalAttendances] = useState(0);
  const [totalStaff, setTotalStaff] = useState(0);
  const [totalInvites, setTotalInvites] = useState(0);
  const [totalReceipts, setTotalReceipts] = useState(0);

  const fetchAll = () => {
    if (!selectedClub?.id) return;

    dispatch(fetchUsers({ clubId: selectedClub.id }))
      .unwrap()
      .then((res) => setTotalMembers(res.results ? filterByDate(res.results, isTodayView).length : 0))
      .catch((err) => console.error("Failed to fetch users:", err));

    dispatch(fetchSubscriptions({ clubId: selectedClub.id }))
      .unwrap()
      .then((res) => setTotalSubscriptions(res ? filterByDate(res, isTodayView).length : 0))
      .catch((err) => console.error("Failed to fetch subscriptions:", err));

    dispatch(fetchTickets({ clubId: selectedClub.id }))
      .unwrap()
      .then((res) => setTotalTickets(res ? filterByDate(res, isTodayView).length : 0))
      .catch((err) => console.error("Failed to fetch tickets:", err));

    dispatch(fetchAttendances({ clubId: selectedClub.id }))
      .unwrap()
      .then((res) => setTotalAttendances(res ? filterByDate(res, isTodayView).length : 0))
      .catch((err) => console.error("Failed to fetch attendances:", err));

    dispatch(fetchShifts({ clubId: selectedClub.id }))
      .unwrap()
      .then((res) => {
        const uniqueStaff = [
          ...new Set(res.results?.map((shift) => shift.staff_details?.id) || []),
        ].filter(Boolean);
        setTotalStaff(res.results ? filterByDate(res.results, isTodayView).length ? uniqueStaff.length : 0 : 0);
      })
      .catch((err) => console.error("Failed to fetch shifts:", err));

    dispatch(fetchFreeInvites({ clubId: selectedClub.id }))
      .unwrap()
      .then((res) => setTotalInvites(res ? filterByDate(res, isTodayView).length : 0))
      .catch((err) => console.error("Failed to fetch free invites:", err));

    dispatch(fetchReceipts({ clubId: selectedClub.id }))
      .unwrap()
      .then((res) => setTotalReceipts(res ? filterByDate(res, isTodayView).length : 0))
      .catch((err) => console.error("Failed to fetch receipts:", err));
  };

  useEffect(() => {
    fetchAll();
  }, [dispatch, isTodayView, selectedClub]);

  const isLoading = loading.shifts || usersLoading || subscriptionsLoading || ticketsLoading || attendancesLoading || invitesLoading || receiptsLoading;
  const hasError = error.shifts || usersError || subscriptionsError || ticketsError || attendancesError || invitesError || receiptsError;

  if (isLoading) {
    return (
      <div
        className="flex justify-center items-center h-screen bg-gray-50 text-lg font-medium text-gray-700"
        dir="rtl"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mr-3"></div>
        جاري التحميل...
      </div>
    );
  }

  if (hasError) {
    return (
      <div
        className="flex justify-center items-center h-screen bg-gray-50 text-lg font-medium text-red-600"
        dir="rtl"
      >
        <div className="bg-red-100 p-4 rounded-lg shadow-md">
          خطأ: {hasError}
        </div>
      </div>
    );
  }

  const cardClasses =
    "bg-white rounded-2xl p-4 sm:p-6 shadow transition hover:shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4";
  const iconClasses =
    "text-3xl sm:text-4xl text-blue-500 bg-blue-100 p-2 rounded-full shrink-0";
  const textLinkClasses =
    "text-xs sm:text-sm text-blue-500 hover:underline mt-2 sm:mt-0 inline-block";

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50" dir="rtl">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-white">
          لوحة التحكم - {isTodayView ? "بيانات اليوم" : "الإجمالي الكلي"}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsTodayView((prev) => !prev)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm shadow"
          >
            {isTodayView ? "عرض الإجمالي الكلي" : "عرض بيانات اليوم"}
          </button>
          <button
            onClick={fetchAll}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm shadow"
            disabled={isLoading}
          >
            تحديث البيانات
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        <DataCard
          label="إجمالي التذاكر"
          value={totalTickets}
          icon={<IoTicketOutline className={iconClasses} />}
          link="/dashboard/tickets"
        />
        <DataCard
          label="إجمالي الأعضاء"
          value={totalMembers}
          icon={<RiGroupLine className={iconClasses} />}
          link="/dashboard/members"
        />
        <DataCard
          label="إجمالي الاشتراكات"
          value={totalSubscriptions}
          icon={<MdSubscriptions className={iconClasses} />}
          link="/dashboard/subscriptions"
        />
        <DataCard
          label="إجمالي الحضور"
          value={totalAttendances}
          icon={<FaRegCalendarCheck className={iconClasses} />}
          link="/dashboard/attendance"
        />
        <DataCard
          label="إجمالي الموظفين"
          value={totalStaff}
          icon={<BsPeopleFill className={iconClasses} />}
          link="/dashboard/staff"
        />
        <DataCard
          label="الدعوات"
          value={totalInvites}
          icon={<RiVipCrown2Line className={iconClasses} />}
          link="/dashboard/free-invites"
        />
        <DataCard
          label="الإيصالات"
          value={totalReceipts}
          icon={<FaReceipt className={iconClasses} />}
          link="/dashboard/receipts"
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
        <h3 className="text-gray-600 text-sm sm:text-base font-semibold">
          {label}
        </h3>
        <p className="text-2xl sm:text-3xl font-extrabold text-gray-800 truncate">
          {value}
        </p>
        <Link to={link} className={textLinkClasses}>
          عرض الكل
        </Link>
      </div>
      {icon}
    </div>
  );
};

export default Main;