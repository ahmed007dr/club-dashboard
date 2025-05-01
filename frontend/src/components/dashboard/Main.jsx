import { deleteStaff, editStaff, fetchStaff } from '@/redux/slices/staff';
import { fetchFreeInvites } from '../../redux/slices/invitesSlice'; // Changed from fetchInviteById
import { fetchReceipts } from '../../redux/slices/receiptsSlice'; // Changed from fetchReceiptById
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers } from "../../redux/slices/memberSlice";
import { fetchSubscriptions } from '../../redux/slices/subscriptionsSlice';
import { fetchTickets } from '../../redux/slices/ticketsSlice';
import { fetchAttendances } from "@/redux/slices/AttendanceSlice";
import { RiGroupLine } from "react-icons/ri";
import { MdSubscriptions } from "react-icons/md";
import { FaRegCalendarCheck } from "react-icons/fa";
import { BsPeopleFill } from "react-icons/bs";
import { BiMailSend } from "react-icons/bi";
import { FaReceipt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { RiVipCrown2Line } from 'react-icons/ri';
import { IoTicketOutline } from "react-icons/io5";
import SubscriptionStats from "./SubscriptionStats"; // Import the SubscriptionStats component
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

  const cardClasses = "bg-white shadow-md rounded-2xl p-5 flex items-center justify-between hover:shadow-lg transition";
  const iconClasses = "text-4xl text-blue-600";
  const textLinkClasses = "text-sm text-blue-600 hover:underline mt-1 block";

  return (
    <div className="">
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
  {/* التذاكر */}
  <div className={cardClasses}>
    <div>
      <h3 className="text-gray-700 text-sm font-medium">إجمالي التذاكر</h3>
      <p className="text-2xl font-bold text-gray-900">{totalTickets}</p>
      <Link to="/tickets" className={textLinkClasses}>عرض الكل</Link>
    </div>
    <IoTicketOutline className={iconClasses} />
  </div>

  {/* الأعضاء */}
  <div className={cardClasses}>
    <div>
      <h3 className="text-gray-700 text-sm font-medium">إجمالي الأعضاء</h3>
      <p className="text-2xl font-bold text-gray-900">{totalMembers}</p>
      <Link to="/members" className={textLinkClasses}>عرض الكل</Link>
    </div>
    <RiGroupLine className={iconClasses} />
  </div>

  {/* الاشتراكات */}
  <div className={cardClasses}>
    <div>
      <h3 className="text-gray-700 text-sm font-medium">إجمالي الاشتراكات</h3>
      <p className="text-2xl font-bold text-gray-900">{totalSubscriptions}</p>
      <Link to="/subscriptions" className={textLinkClasses}>إدارة</Link>
    </div>
    <MdSubscriptions className={iconClasses} />
  </div>

  {/* الحضور */}
  <div className={cardClasses}>
    <div>
      <h3 className="text-gray-700 text-sm font-medium">إجمالي الحضور</h3>
      <p className="text-2xl font-bold text-gray-900">{totalAttendances}</p>
      <Link to="/attendances" className={textLinkClasses}>تتبع</Link>
    </div>
    <FaRegCalendarCheck className={iconClasses} />
  </div>

  {/* الموظفين */}
  <div className={cardClasses}>
    <div>
      <h3 className="text-gray-700 text-sm font-medium">إجمالي الموظفين</h3>
      <p className="text-2xl font-bold text-gray-900">{totalStaff}</p>
      <Link to="/staff" className={textLinkClasses}>إدارة</Link>
    </div>
    <BsPeopleFill className={iconClasses} />
  </div>

  {/* الدعوات */}
  <div className={cardClasses}>
    <div>
      <h3 className="text-gray-700 text-sm font-medium">الدعوات</h3>
      <p className="text-2xl font-bold text-gray-900">{invites?.length || 0}</p>
    </div>
    <RiVipCrown2Line className={iconClasses} />
  </div>

  {/* الإيصالات */}
  <div className={cardClasses}>
    <div>
      <h3 className="text-gray-700 text-sm font-medium">الإيصالات</h3>
      <p className="text-2xl font-bold text-gray-900">{receipts?.length || 0}</p>
    </div>
    <FaReceipt className={iconClasses} />
  </div>
</div>

    {/* Subscription Stats */}
    <SubscriptionStats />
  </div>
  
  );
};

export default Main;






