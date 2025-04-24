import { Dumbbell } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Sidebar = ({ navItems, sidebarOpen, closeSidebar }) => {
  // Set the first nav item as the default active one if no active item is saved in localStorage
  const [activePath, setActivePath] = useState(localStorage.getItem('activePath') || navItems[0]?.path);

  // Update activePath in localStorage whenever it changes
  useEffect(() => {
    if (activePath) {
      localStorage.setItem('activePath', activePath);
    }
  }, [activePath]);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-gray-800/30 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside className={`fixed z-20 top-0 left-0 bg-white dark:bg-gray-900 md:relative transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-64 h-full border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out`}>
        <div className="h-full flex flex-col ">
          {sidebarOpen && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <Dumbbell className="h-8 w-8 text-blue-500 dark:text-white" />
              <button
                onClick={closeSidebar}
                className="md:hidden text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
              >
                <FiX size={24} />
              </button>
            </div>
          )}

          <div className="flex-1 p-4 overflow-y-auto">
            <nav className="flex-1 space-y-2">
              {navItems.map((item) => (
                <Link
                  to={item.path}
                  key={item.name}
                  onClick={() => {
                    setActivePath(item.path);
                    closeSidebar();
                  }}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                    activePath === item.path
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-white font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
