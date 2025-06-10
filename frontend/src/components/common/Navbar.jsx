import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import { fetchClubList, switchClub } from '../../redux/slices/clubSlice'; // Added switchClub import
import { FiMenu, FiX, FiUser, FiMoon, FiSun } from 'react-icons/fi';
import { Menu } from '@headlessui/react';
import axios from 'axios';
import BASE_URL from '../../config/api';
import toast from 'react-hot-toast';



const Navbar = ({ hideMenuButton = false }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Redux state
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
  const clubList = useSelector((state) => state.club.clubList);
  const clubStatus = useSelector((state) => state.club.status);
  const clubError = useSelector((state) => state.club.error);
  const currentClub = useSelector((state) => state.club.currentClub);

  // Local state
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('token'));
  const [profile, setProfile] = useState(null);

  // Set theme
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

  // Check login status
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, [location.pathname]);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await axios.get(`${BASE_URL}accounts/api/profile/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setProfile(res.data);
      } catch (error) {
        console.error('Error fetching profile:', error.response?.data || error.message);
      }
    };

    if (isLoggedIn) {
      fetchProfile();
    }
  }, [isLoggedIn]);

  // Fetch clubs for all logged-in users
  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchClubList());
    }
  }, [isLoggedIn, dispatch]);

  // Handlers
  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleSwitchClub = (clubId) => {
    dispatch(switchClub(clubId))
      .unwrap()
      .then(() => {
        toast.success(`Switched to club successfully`);
        window.location.reload();
      })
      .catch((error) => {
        toast.error(`Failed to switch club: ${error}`);
      });
  };

  const handleLogout = async () => {
    const logoutToast = toast.loading('Logging out...');
    
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const accessToken = localStorage.getItem('token');

      // Perform client-side cleanup immediately
      cleanupAndRedirect();

      if (!refreshToken) {
        toast.success('Logged out successfully', { id: logoutToast });
        return;
      }

      await axios.post(
        `${BASE_URL}accounts/api/logout/`,
        { refresh: refreshToken },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      toast.success('Logged out successfully', { id: logoutToast });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(
        error.response?.data?.detail || 'Logout failed (local cleanup completed)',
        { id: logoutToast }
      );
    }
  };

  const cleanupAndRedirect = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setIsLoggedIn(false);
    setProfile(null);
    navigate('/login', { replace: true });
  };

  // Hide navbar on login page
  if (location.pathname === '/login') {
    return null;
  }

  return (
    <header className="border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-4">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {!hideMenuButton && (
            <button
              onClick={handleToggleSidebar}
              className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white lg:hidden"
            >
              {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          )}
          <Link
            to="/"
            className="flex items-center space-x-2 text-xl font-bold text-blue-600 dark:text-white"
          >
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="hidden sm:inline text-purple-800">Fitness Time</span>
          </Link>
          {/* Display current club name for owners */}

        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:block">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
                   {isLoggedIn && profile?.club && (
  <span className="text-sm font-semibold text-gray-900">
    {profile.club.name}
  </span>
)}

          {isLoggedIn && (
            <div className="flex space-x-4">
              {/* Club List Dropdown for Owners */}
              {profile?.role === 'owner' && (
                <Menu as="div" className="relative inline-block text-left">
                  <Menu.Button className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                    <span>أندية</span>
                    {currentClub && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-1 rounded">
                        {currentClub.name}
                      </span>
                    )}
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-80 overflow-y-auto">
                    <div className="py-2">
                      <p className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        لأندية الخاصة بك
                      </p>
                      {clubStatus === 'loading' ? (
                        <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 italic animate-pulse">
                          Loading clubs...
                        </p>
                      ) : clubStatus === 'failed' ? (
                        <p className="px-4 py-3 text-sm text-red-600 dark:text-red-400 font-medium">
                          Error: {clubError || 'Failed to load clubs'}
                        </p>
                      ) : clubList.length > 0 ? (
                        clubList.map((club) => (
                          <Menu.Item key={club.id}>
                            {({ active }) => (
                              <button
                                onClick={() => handleSwitchClub(club.id)}
                                className={`w-full text-left block px-4 py-3 text-sm truncate ${
                                  active
                                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-700 dark:text-gray-300'
                                } ${
                                  currentClub?.id === club.id 
                                    ? 'font-bold bg-blue-100 dark:bg-blue-800' 
                                    : ''
                                }`}
                              >
                                {club.name}
                              </button>
                            )}
                          </Menu.Item>
                        ))
                      ) : (
                        <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 italic">
                          لا توجد أندية متاحة
                        </p>
                      )}
                    </div>
                  </Menu.Items>
                </Menu>
              )}

              {/* Profile Dropdown */}
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
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {profile?.email || 'No email'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {profile?.role || 'No role'}
                    </p>
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
            </div>
          )}

          {/* Dark Mode Toggle */}
          {/* <button
            onClick={handleToggleDarkMode}
            className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white"
          >
            {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button> */}
        </div>
      </div>
    </header>
  );
};

export default Navbar;