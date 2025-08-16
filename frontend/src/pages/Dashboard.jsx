import React from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from '../components/dashboard/Sidebar';
import { closeSidebar } from '../redux/slices/uiSlice';
import { MdOutlineDashboard } from 'react-icons/md';
import { FiUsers } from 'react-icons/fi';
import { RiUserLine, RiGroupLine, RiVipCrown2Line } from 'react-icons/ri';
import { AiOutlineSchedule } from 'react-icons/ai';
import { MdOutlineSubscriptions } from 'react-icons/md';
import { IoMdAnalytics } from 'react-icons/io';
import { HiOutlineDocumentReport } from 'react-icons/hi';
import { GiTicket } from 'react-icons/gi';
import { TbReportAnalytics } from "react-icons/tb";
import { GiReceiveMoney } from "react-icons/gi";
import { GiPayMoney } from "react-icons/gi";

const Dashboard = () => {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
  const navItems = [
    {
      name: 'لوحة التحكم',
      icon: <MdOutlineDashboard />,
      permission: ['owner'], // Only owners can access
      children: [
        { path: '', name: 'الرئيسية', icon: <IoMdAnalytics /> },
      ],
    },
    {
      name: 'الأعضاء والعضوية',
      icon: <FiUsers />,
      permission: ['owner', 'admin', 'staff'], // All roles can access
      children: [
        { path: 'member-profile', name: 'الأعضاء', icon: <RiGroupLine /> },
        { path: 'subscriptions', name: 'الاشتراكات', icon: <MdOutlineSubscriptions /> },
        { path: 'attendance', name: 'حضور الأعضاء', icon: <AiOutlineSchedule /> },
        { path: 'free-invites', name: 'الدعوات المجانية', icon: <RiVipCrown2Line /> },
        { path: 'tickets', name: 'التذاكر', icon: <GiTicket /> },
      ],
    },
    {
      name: 'إدارة الموظفين',
      icon: <RiUserLine />,
      permission: ['owner', 'admin'], // Owners and admins only
      children: [
        { path: 'staff', name: 'شيفتات الموظفين', icon: <RiUserLine /> },
        { path: 'staff-attendance', name: 'حضور الموظفين', icon: <AiOutlineSchedule /> },
      ],
    },
    {
      name: 'التقارير والتحليلات',
      icon: <TbReportAnalytics />,
      permission: ['owner', 'admin'], // Owners and admins only
      children: [
        { path: 'subscription-report', name: 'تقرير الاشتراكات', icon: <HiOutlineDocumentReport /> },
        { path: 'subscription-analytics', name: 'تحليل الاشتراكات', icon: <IoMdAnalytics /> },
        { path: 'staff-salary-report', name: 'تقرير رواتب الموظفين', icon: <HiOutlineDocumentReport /> },
        { path: 'staff-attendance-reports', name: 'تقارير حضور الموظفين', icon: <RiUserLine /> },
        { path: 'income-sources', name: 'الإيرادات', icon: <GiReceiveMoney /> },
        { path: 'expense', name: 'المصروفات', icon: <GiPayMoney /> },
        { path: 'financial-reports', name: 'تقرير الإيرادات', icon: <GiReceiveMoney /> },
        { path: 'financial-analysis', name: 'التحليل المالي', icon: <TbReportAnalytics /> },
        { path: 'stock-analytics', name: 'تحليل المخزون', icon: <IoMdAnalytics /> },
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