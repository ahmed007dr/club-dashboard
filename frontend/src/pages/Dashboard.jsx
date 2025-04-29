import React from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from '../components/dashboard/Sidebar';
import { closeSidebar } from '../redux/slices/uiSlice';

// استيراد الأيقونات
import { MdOutlineDashboard } from 'react-icons/md';
import { FiUsers } from 'react-icons/fi';
import { FaRegBuilding } from 'react-icons/fa';
import { TbMoneybag } from 'react-icons/tb';
import { BsPersonBoundingBox } from 'react-icons/bs';
import { RiUserLine, RiGroupLine, RiVipCrown2Line } from 'react-icons/ri';
import { AiOutlineSchedule } from 'react-icons/ai';
import { MdOutlineSubscriptions } from 'react-icons/md';
import { IoMdAnalytics } from 'react-icons/io';
import { HiOutlineDocumentReport } from 'react-icons/hi';
import { GiTeamIdea, GiMoneyStack, GiTicket } from 'react-icons/gi';

const Dashboard = () => {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);

  const navItems = [
    {
      name: 'Dashboard',
      icon: <MdOutlineDashboard />,
      children: [
        { path: '', name: 'Main', icon: <IoMdAnalytics /> },
        { path: 'profile', name: 'Profile', icon: <BsPersonBoundingBox /> },
      ],
    },
    {
      name: 'Membership',
      icon: <FiUsers />,
      children: [
        { path: 'members', name: 'Members', icon: <RiGroupLine /> },
        { path: 'attendance', name: 'Attendance', icon: <AiOutlineSchedule /> },
        { path: 'free-invites', name: 'Free Invites', icon: <RiVipCrown2Line /> },
        { path: 'leads', name: 'Leads', icon: <GiTeamIdea /> },
        { path: 'subscriptions', name: 'Subscription', icon: <MdOutlineSubscriptions /> },
      ],
    },
    {
      name: 'Management',
      icon: <FaRegBuilding />,
      children: [
        { path: 'staff', name: 'Staff', icon: <RiUserLine /> },
        { path: 'club', name: 'Club', icon: <HiOutlineDocumentReport /> },
        { path: 'tickets', name: 'Tickets', icon: <GiTicket /> },
      ],
    },
    {
      name: 'Accounting',
      icon: <TbMoneybag />,
      children: [
        { path: 'finance', name: 'Finance', icon: <GiMoneyStack /> },
        { path: 'receipts', name: 'Receipts', icon: <HiOutlineDocumentReport /> },
      ],
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* منطقة المحتوى الرئيسية */}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <main className="flex-1 p-4 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* الشريط الجانبي على اليمين */}
      <Sidebar
        className="sidebar-right"
        navItems={navItems}
        sidebarOpen={sidebarOpen}
        closeSidebar={() => dispatch(closeSidebar())}
      />
    </div>
  );
};

export default Dashboard;