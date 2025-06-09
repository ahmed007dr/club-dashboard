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
import { BiLogIn, BiLogOut } from 'react-icons/bi';
import { TbReportAnalytics } from "react-icons/tb";
import { GiReceiveMoney } from "react-icons/gi";
import { MdCategory } from "react-icons/md";
import { GiPayMoney } from "react-icons/gi";

const Dashboard = () => {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);

  const navItems = [
    {
      name: 'لوحة التحكم',
      icon: <MdOutlineDashboard />,
      children: [
        { path: '', name: 'الرئيسية', icon: <IoMdAnalytics /> },
        { path: 'profile', name: 'الملف الشخصي', icon: <BsPersonBoundingBox /> },
      ],
    },
    {
      name: 'الأعضاء والعضوية',
      icon: <FiUsers />,
      children: [
        { path: 'members', name: 'الأعضاء', icon: <RiGroupLine /> },
        { path: 'subscriptions', name: 'الاشتراكات', icon: <MdOutlineSubscriptions /> },
        { path: 'attendance', name: 'الحضور', icon: <AiOutlineSchedule /> },
        { path: 'free-invites', name: 'الدعوات المجانية', icon: <RiVipCrown2Line /> },
        { path: 'tickets', name: 'التذاكر', icon: <GiTicket /> },
        { path: 'dashboard/subscription-report', name: 'تقرير الاشتراكات', icon: <HiOutlineDocumentReport /> },
        { path: 'dashboard/subscription-analytics', name: 'تحليل الاشتراكات الشامل', icon: <IoMdAnalytics /> }, // العنصر الجديد
      ],
    },
    {
      name: 'الإدارة',
      icon: <FaRegBuilding />,
      children: [
        { path: 'staff', name: 'شيفت الموظفين', icon: <RiUserLine /> },
        { path: 'manage-users', name: 'إدارة الموظفين', icon: <FiUsers /> },
        { path: 'attendance-form', name: 'بصمه الدخول والخروج', icon: <BiLogIn /> },
        { path: 'shift-attendance', name: 'بيان حضور الموظفي', icon: <AiOutlineSchedule /> },
        { path: 'club', name: 'النادي', icon: <HiOutlineDocumentReport /> },
        { path: 'receipts', name: 'الإيصالات', icon: <HiOutlineDocumentReport /> },
      ],
    },
    {
      name: 'تقارير الموظفين',
      icon: <TbReportAnalytics />,
      children: [
        { path: 'staff-reports', name: 'تقارير الموظفين', icon: <RiUserLine /> },
        { path: 'reports', name: 'تقرير الايراد', icon: <HiOutlineDocumentReport /> },
      ],
    },
    {
      name: 'المالية',
      icon: <GiMoneyStack />,
      children: [
        { path: 'income-sources', name: 'الايرادات', icon: <GiReceiveMoney /> },
        { path: 'expense', name: 'المصروفات', icon: <GiPayMoney /> },
        { path: 'dashboard/financial-analysis', name: 'التحليل المالي', icon: <TbReportAnalytics /> },
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