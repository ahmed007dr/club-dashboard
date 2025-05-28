import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';


const Sidebar = ({ navItems, sidebarOpen, closeSidebar }) => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (name) => {
    setOpenMenus((prev) => ({
      // This will automatically close all other menus
      [name]: !prev[name],
    }));
  };

  return (
    <>
      {/* Overlay only on small screens */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-gray-800/30 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed z-20 top-0 left-0 md:relative transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 w-64 h-full border-r border-gray-200 transition-transform duration-300 ease-in-out max-sm:bg-gray-100  `}
        dir="rtl">
        <div className="h-full flex flex-col">
         <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-blue-600 dark:text-white">
           <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
           <span className="hidden sm:inline text-purple-800">Fitness Time</span>
         </Link>
          <div className="p-4 border-b border-gray-200 flex items-center justify-between sm:hidden">
            <h1 className="text-xl font-semibold">Club</h1>
            <button onClick={closeSidebar} className="sm:hidden hover:text-gray-700">
              <FiX size={24} />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <nav className="flex-1 space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname.endsWith(item.path);
                const hasChildren = !!item.children;

                return (
                  <div key={item.name}>
                    <div
                      onClick={() =>
                        hasChildren ? toggleMenu(item.name) : closeSidebar()
                      }
                      className={`w-full flex items-center justify-between cursor-pointer space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                        isActive ? 'bg-blue-50 text-blue-600 font-medium' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                      {hasChildren && (
                        <span className="text-xl">
                          {openMenus[item.name] ? <IoIosArrowUp /> : <IoIosArrowDown />}
                        </span>
                      )}
                    </div>

                    {hasChildren && openMenus[item.name] && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            to={child.path}
                            key={child.name}
                            onClick={closeSidebar}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                              location.pathname === '/' && child.path === ''
                                ? 'bg-blue-500 text-white font-medium'
                                : location.pathname.endsWith(child.path) && child.path !== ''
                                ? 'bg-blue-500 text-white font-medium'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                            }`}
                          >
                            <span className="text-base">{child.icon}</span>
                            <span>{child.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
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
