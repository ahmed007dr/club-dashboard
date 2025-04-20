import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import { FiMenu, FiX, FiSearch, FiBell, FiUser, FiSun, FiMoon } from 'react-icons/fi';
import logo from '../../images/logo.png'; 

const Navbar = ({ hideMenuButton = false }) => {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);

  // State to manage dark mode
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem('theme') === 'dark'
  );

  // Toggle dark mode in the root HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark'); 
      localStorage.setItem('theme', 'dark'); 
    } else {
      root.classList.remove('dark'); 
      localStorage.setItem('theme', 'light'); 
    }
  }, [isDarkMode]);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const handleToggleDarkMode = () => {
    setIsDarkMode(prev => !prev); // Toggle dark mode
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between p-4">
  
      {/* Left: Menu Button → Logo → Search */}
      <div className="flex items-center space-x-4">
        {/* Menu Button */}
        {!hideMenuButton && (
          <button
            onClick={handleToggleSidebar}
            className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white lg:hidden"
          >
            {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        )}
  
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-blue-600 dark:text-white">
          <img src={logo} alt="Logo" className="h-8 w-8" />
          <span className="hidden sm:inline">CLUB</span>
        </Link>
  
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <FiSearch className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
      </div>
  
      {/* Right: User Controls */}
      <div className="flex items-center space-x-4">
        <button className="p-1 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white">
          <FiBell size={20} />
        </button>
  
        <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:block">
          {new Date().toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
  
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <FiUser className="text-gray-600 dark:text-gray-300" />
          </div>
          <span className="hidden md:inline text-sm font-medium text-gray-900 dark:text-gray-100">User</span>
        </div>
  
        <button onClick={handleToggleDarkMode} className="p-2 rounded-full text-gray-500 dark:text-gray-300">
          {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button>
  
        <Link 
          to="/login" 
          className="text-sm px-4 py-1 border rounded-md text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white transition"
        >
          Login
        </Link>
      </div>
  
    </div>
  </header>
  
  );
};

export default Navbar;

