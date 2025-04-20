import React, { useEffect, useState } from 'react';
import { FiX, FiDollarSign, FiFileText, FiCalendar, FiGift, FiUsers } from 'react-icons/fi';
import { IoTicketOutline } from "react-icons/io5";
import { MdOutlineDashboard } from "react-icons/md";
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import Subscriptions from '../components/dashboard/Subscriptions';
import Receipts from '../components/dashboard/Receipts';
import Tickets from '../components/dashboard/Tickets';
import Attendance from '../components/dashboard/Attendance';
import FreeInvites from '../components/dashboard/FreeInvites';
import Leads from '../components/dashboard/Leads';
import Members from '../components/dashboard/Members';
import Main from '../components/dashboard/Main';

import { closeSidebar } from '../redux/slices/uiSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "main";
  const [activeContent, setActiveContent] = useState(defaultTab);

  const handleTabClick = (id) => {
    setActiveContent(id);
    setSearchParams({ tab: id });
  };

  const navItems = [
    { id: 'main', name: 'Main', icon: <MdOutlineDashboard />, content: <Main /> },
    { id: 'subscriptions', name: 'Subscriptions', icon: <FiDollarSign />, content: <Subscriptions /> },
    { id: 'receipts', name: 'Receipts', icon: <FiFileText />, content: <Receipts /> },
    { id: 'members', name: 'Members', icon: <FiUsers />, content: <Members /> },
    { id: 'tickets', name: 'Tickets', icon: <IoTicketOutline />, content: <Tickets /> },
    { id: 'attendance', name: 'Attendance', icon: <FiCalendar />, content: <Attendance /> },
    { id: 'free-invites', name: 'Free Invites', icon: <FiGift />, content: <FreeInvites /> },
    { id: 'leads', name: 'Leads', icon: <FiUsers />, content: <Leads /> },
  ];

  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (currentTab && currentTab !== activeContent) {
      setActiveContent(currentTab);
    }
  }, [searchParams]);

  return (
    <div className="flex h-screen  overflow-hidden">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-gray-800/30 md:hidden"
          onClick={() => dispatch(closeSidebar())}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed z-20 top-0 left-0  bg-white dark:bg-gray-900 md:relative transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-64 h-full  border-r border-gray-200 transition-transform duration-300 ease-in-out`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Logo</h1>
            <button
              onClick={() => dispatch(closeSidebar())}
              className="md:hidden text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <nav className="flex-1 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 text-left ${
                    activeContent === item.id
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 border-t border-gray-200">
            Footer Content
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <main className="flex-1 p-4 overflow-auto">
          {navItems.find(item => item.id === activeContent)?.content}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;


