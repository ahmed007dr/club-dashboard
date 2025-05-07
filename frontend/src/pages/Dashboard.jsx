import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../components/dashboard/Sidebar";
import { closeSidebar } from "../redux/slices/uiSlice";
import {
  checkInStaff,
  checkOutStaff,
  getAttendanceAnalysis,
  clearError,
} from "../redux/slices/staff";
import BASE_URL from "@/config/api";
import axios from "axios";

import { MdOutlineDashboard, MdOutlineSubscriptions } from "react-icons/md";
import { FiUsers } from "react-icons/fi";
import { FaRegBuilding } from "react-icons/fa";
import { TbMoneybag } from "react-icons/tb";
import { BsPersonBoundingBox } from "react-icons/bs";
import {
  RiUserLine,
  RiGroupLine,
  RiVipCrown2Line,
  RiLogoutBoxLine,
} from "react-icons/ri";
import { AiOutlineSchedule } from "react-icons/ai";
import { IoMdAnalytics } from "react-icons/io";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { GiTeamIdea, GiMoneyStack, GiTicket } from "react-icons/gi";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
  const { selectedClub } = useSelector((state) => state.club);
  const { loading, error, analysis } = useSelector((state) => state.staff || {});
  const [userProfile, setUserProfile] = useState(null);
  const [rfidCode, setRfidCode] = useState("");
  const [checkInOutModal, setCheckInOutModal] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${BASE_URL}/accounts/api/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserProfile(response.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (selectedClub?.id) {
      dispatch(getAttendanceAnalysis({ clubId: selectedClub.id }));
    }
  }, [dispatch, selectedClub]);

  const navItems = [
    {
      name: "لوحة التحكم",
      icon: <MdOutlineDashboard />,
      children: [
        { path: "", name: "الرئيسية", icon: <IoMdAnalytics /> },
        { path: "profile", name: "الملف الشخصي", icon: <BsPersonBoundingBox /> },
      ],
    },
    {
      name: "العضوية",
      icon: <FiUsers />,
      children: [
        { path: "members", name: "الأعضاء", icon: <RiGroupLine /> },
        { path: "attendance", name: "الحضور", icon: <AiOutlineSchedule /> },
        { path: "free-invites", name: "الدعوات المجانية", icon: <RiVipCrown2Line /> },
        { path: "subscriptions", name: "الاشتراكات", icon: <MdOutlineSubscriptions /> },
      ],
    },
    {
      name: "الإدارة",
      icon: <FaRegBuilding />,
      children: [
        { path: "staff", name: "الموظفون", icon: <RiUserLine /> },
        { path: "club", name: "النادي", icon: <HiOutlineDocumentReport /> },
        { path: "tickets", name: "التذاكر", icon: <GiTicket /> },
      ],
    },
    {
      name: "المحاسبة",
      icon: <TbMoneybag />,
      children: [
        { path: "finance", name: "المالية", icon: <GiMoneyStack /> },
        { path: "receipts", name: "الإيصالات", icon: <HiOutlineDocumentReport /> },
      ],
    },
    {
      name: "التقارير",
      icon: <HiOutlineDocumentReport />,
      children: [
        { path: "attendance-report", name: "تقرير الحضور", icon: <AiOutlineSchedule /> },
      ],
    },
  ];

  const handleCheckInOutSubmit = (e, action) => {
    e.preventDefault();
    if (!rfidCode) {
      setFormError("برجاء إدخال كود RFID.");
      return;
    }

    const thunk = action === "checkIn" ? checkInStaff : checkOutStaff;
    dispatch(thunk(rfidCode))
      .unwrap()
      .then(() => {
        setCheckInOutModal(false);
        setRfidCode("");
        setFormError(null);
        if (selectedClub?.id) {
          dispatch(getAttendanceAnalysis({ clubId: selectedClub.id }));
        }
      })
      .catch((err) => {
        setFormError(
          `فشل في تسجيل ${action === "checkIn" ? "الدخول" : "الخروج"}: ` +
            (err.error || "خطأ غير معروف")
        );
      });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50" dir="rtl">
      <Sidebar
        className="sidebar-right"
        navItems={navItems}
        sidebarOpen={sidebarOpen}
        closeSidebar={() => dispatch(closeSidebar())}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCheckInOutModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              disabled={loading?.attendance}
            >
              تسجيل حضور/انصراف
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              <RiLogoutBoxLine />
              تسجيل الخروج
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {(error?.attendance || error?.analysis) && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 text-sm">
              خطأ: {error?.attendance || error?.analysis}
              <button
                onClick={() => dispatch(clearError("attendance"))}
                className="mr-2 text-blue-600 hover:underline"
              >
                مسح
              </button>
            </div>
          )}
          {!window.location.pathname.includes("dashboard/") ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">
                نظرة عامة
              </h2>
              {loading?.analysis ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                </div>
              ) : analysis ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-700">
                      الموظفون الحاضرون اليوم
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {analysis.present_today || 0}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-700">
                      إجمالي الشيفتات هذا الأسبوع
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {analysis.total_shifts_week || 0}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-700">
                      متوسط ساعات العمل
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {analysis.avg_hours_per_shift || 0} ساعة
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">
                  لا توجد بيانات إحصائية متاحة حاليًا
                </p>
              )}
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
      {checkInOutModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50 p-4">
          <div
            className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg sm:text-xl font-bold mb-4">
              تسجيل حضور/انصراف
            </h2>
            {formError && (
              <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-right text-sm">
                {formError}
              </div>
            )}
            {loading?.attendance && (
              <div className="text-center text-sm mb-4">جاري التحميل...</div>
            )}
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  كود RFID
                </label>
                <input
                  type="text"
                  value={rfidCode}
                  onChange={(e) => setRfidCode(e.target.value)}
                  placeholder="أدخل كود RFID"
                  className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-blue-200"
                  required
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCheckInOutModal(false);
                    setRfidCode("");
                    setFormError(null);
                    dispatch(clearError("attendance"));
                  }}
                  className="px-4 py-2 bg-gray-300 rounded text-sm hover:bg-gray-400"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  onClick={(e) => handleCheckInOutSubmit(e, "checkIn")}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  disabled={!rfidCode || loading?.attendance}
                >
                  تسجيل دخول
                </button>
                <button
                  type="submit"
                  onClick={(e) => handleCheckInOutSubmit(e, "checkOut")}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  disabled={!rfidCode || loading?.attendance}
                >
                  تسجيل خروج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;