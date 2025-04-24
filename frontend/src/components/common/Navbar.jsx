import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toggleSidebar } from "../../redux/slices/uiSlice";
import {
  FiMenu,
  FiX,
  FiSearch,
  FiBell,
  FiUser,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import { Dumbbell } from "lucide-react";
// import { logout } from "../../redux/slices/authSlice"; // if using Redux for auth

const Navbar = ({ hideMenuButton = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
  const location = useLocation();

  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleSidebar = () => dispatch(toggleSidebar());
  const handleToggleDarkMode = () => setIsDarkMode((prev) => !prev);

  if (location.pathname === "/login") {
    return (
      <header className="absolute top-2 left-3">
        <div className="flex items-center">
          <Link to="/" className="text-center flex items-center space-y-1">
            <div className="rounded-full bg-blue-100/10 p-3">
              <Dumbbell className="h-12 w-12 text-white" />
            </div>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-4">
        {/* Left: Sidebar, Logo, Search */}
        <div className="flex items-center space-x-4">
          {!hideMenuButton && (
            <button
              onClick={handleToggleSidebar}
              className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white lg:hidden"
            >
              {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          )}
          <Link to="/" className="text-center flex items-center space-y-1">
            <div className="rounded-full bg-blue-500/10 p-3">
              <Dumbbell className="h-8 w-8 text-blue-500 dark:text-white" />
            </div>
          </Link>

          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <FiSearch className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        {/* Right: Notifications, Date, Profile, Theme Toggle, Login */}
        <div className="flex items-center space-x-4">
          <button className="p-1 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white">
            <FiBell size={20} />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:block">
            {new Date().toLocaleDateString(undefined, {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className="w-8 h-8 cursor-pointer rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <FiUser className="text-gray-600 dark:text-gray-300" />
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md  shadow-lg z-50">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setDropdownOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    // dispatch(logout());
                    navigate("/login");
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-800"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleToggleDarkMode}
            className="p-2 rounded-full cursor-pointer text-gray-500 dark:text-gray-300"
          >
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
