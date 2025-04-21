// components/Sidebar.jsx
import React from 'react';
import { FiX } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ navItems, sidebarOpen, closeSidebar }) => {
  const location = useLocation();

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-gray-800/30 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside className={`fixed z-20 top-0 left-0 bg-white dark:bg-gray-900 md:relative transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-64 h-full border-r border-gray-200 transition-transform duration-300 ease-in-out`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Logo</h1>
            <button
              onClick={closeSidebar}
              className="md:hidden text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <nav className="flex-1 space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname.endsWith(item.path);
                return (
                  <Link
                    to={item.path}
                    key={item.name}
                    onClick={closeSidebar}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-gray-200">
            Footer Content
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
