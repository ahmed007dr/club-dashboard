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
import { GiTicket } from 'react-icons/gi';
import { BiLogIn } from 'react-icons/bi';
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
        { path: 'attendance', name: 'حضور الأعضاء', icon: <AiOutlineSchedule /> },
        { path: 'free-invites', name: 'الدعوات المجانية', icon: <RiVipCrown2Line /> },
        { path: 'tickets', name: 'التذاكر', icon: <GiTicket /> },
      ],
    },
    {
      name: 'إدارة الموظفين',
      icon: <RiUserLine />,
      children: [
        { path: 'staff', name: 'شيفتات الموظفين', icon: <AiOutlineSchedule /> },
        { path: 'attendance-form', name: 'بصمة الدخول والخروج', icon: <BiLogIn /> },
        { path: 'shift-attendance', name: 'حضور الموظفين', icon: <AiOutlineSchedule /> },
      ],
    },
    {
      name: 'المالية',
      icon: <TbMoneybag />,
      children: [
        { path: 'income-sources', name: 'الإيرادات', icon: <GiReceiveMoney /> },
        { path: 'expense', name: 'المصروفات', icon: <GiPayMoney /> },
        { path: 'receipts', name: 'الإيصالات', icon: <HiOutlineDocumentReport /> },
        { path: 'reports', name: 'تقرير الإيرادات', icon: <GiReceiveMoney /> },
      ],
    },
    {
      name: 'إدارة النادي',
      icon: <FaRegBuilding />,
      children: [
        { path: 'club', name: 'بيانات النادي', icon: <FaRegBuilding /> },
      ],
    },
    {
      name: 'التقارير والتحليلات',
      icon: <TbReportAnalytics />,
      children: [
        { path: 'dashboard/subscription-report', name: 'تقرير الاشتراكات', icon: <HiOutlineDocumentReport /> },
        { path: 'dashboard/subscription-analytics', name: 'تحليل الاشتراكات', icon: <IoMdAnalytics /> },
        { path: 'attendance-StaffSalaryReport', name: 'تقرير رواتب الموظفين', icon: <HiOutlineDocumentReport /> },
        { path: 'staff-reports', name: 'تقارير حضور الموظفين', icon: <RiUserLine /> },
        { path: 'reports', name: 'تقرير الإيرادات', icon: <GiReceiveMoney /> },
        { path: 'dashboard/financial-analysis', name: 'التحليل المالي', icon: <TbReportAnalytics /> },
        { path: 'dashboard/StockAnalytics', name: 'تحليل المخزون', icon: <IoMdAnalytics /> },
        { path: 'manage-users', name: 'إدارة الموظفين', icon: <FiUsers /> },
      ],
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <main className="flex-1 p-4 overflow-auto">
          <Outlet />
        </main>
      </div>
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