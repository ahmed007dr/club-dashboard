import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import { FiMenu, FiX, FiSearch, FiBell, FiUser, FiSun, FiMoon } from 'react-icons/fi';
import { Dumbbell } from 'lucide-react';
import axios from 'axios';
import { Menu } from '@headlessui/react';
import BASE_URL from '../../config/api';

const Navbar = ({ hideMenuButton = false }) => {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
  const location = useLocation();

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('token'));
  const [profile, setProfile] = useState(null);

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, [location]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/accounts/api/profile/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setProfile(res.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    if (isLoggedIn) fetchProfile();
  }, [isLoggedIn]);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return;

      await axios.post(
        `${BASE_URL}/accounts/api/logout/`,
        { refresh: refreshToken },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setIsLoggedIn(false);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error.response?.data || error.message);
    }
  };

  if (location.pathname === '/login') {
    return null;
  }

  return (
    <header className="border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-4">
        {/* Left Side */}
        <div className="flex items-center space-x-4">
          {!hideMenuButton && (
            <button
              onClick={handleToggleSidebar}
              className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white lg:hidden"
            >
              {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          )}

          <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-blue-600 dark:text-white">
            <Dumbbell className="w-8 h-8" />
          </Link>

        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-4">


          <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:block">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>

          {/* Profile Dropdown */}
          {isLoggedIn && (
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="flex items-center space-x-2 cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <FiUser className="text-gray-600 dark:text-gray-300" />
                </div>
                <span className="hidden md:inline text-sm font-medium text-gray-900 dark:text-gray-100">
                  {profile?.username || 'User'}
                </span>
              </Menu.Button>
              <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{profile?.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{profile?.role}</p>
                </div>
                <div className="mt-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          active
                            ? 'bg-red-100 dark:bg-red-600 text-red-600 dark:text-white'
                            : 'text-red-500 dark:text-red-400'
                        }`}
                      >
                        Logout
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Menu>
          )}

          {/* Dark Mode Toggle */}
          <button onClick={handleToggleDarkMode} className="p-2 rounded-full text-gray-500 dark:text-gray-300">
            {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>

          {!isLoggedIn && (
            <Link
              to="/login"
              className="text-sm px-4 py-1 border rounded-md text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white transition"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
