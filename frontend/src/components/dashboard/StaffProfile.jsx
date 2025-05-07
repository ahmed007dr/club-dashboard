import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getStaffShifts, getStaffReport } from "@/redux/slices/staff";
import { RiUserLine } from "react-icons/ri";
import axios from "axios";
import BASE_URL from "@/config/api";

const StaffProfile = () => {
  const dispatch = useDispatch();
  const { id } = useParams();
  const shifts = useSelector((state) => state.staff.staffShifts[id] || []);
  const report = useSelector((state) => state.staff.report);
  const { loading, error } = useSelector((state) => state.staff);
  const [staffProfile, setStaffProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorProfile, setErrorProfile] = useState(null);

  // Fetch staff profile
  useEffect(() => {
    const fetchStaffProfile = async () => {
      try {
        setLoadingProfile(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`${BASE_URL}/accounts/api/users/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStaffProfile(response.data);
        setLoadingProfile(false);
      } catch (err) {
        setErrorProfile("فشل في جلب بيانات الموظف: " + (err.message || "خطأ غير معروف"));
        setLoadingProfile(false);
      }
    };

    if (id) {
      fetchStaffProfile();
      dispatch(getStaffShifts(id));
    }
  }, [dispatch, id]);

  // Fetch attendance report
  const handleFetchReport = () => {
    dispatch(getStaffReport(id)).unwrap().catch((err) => {
      console.error("Failed to fetch report:", err);
    });
  };

  if (loadingProfile || loading.staffShifts) {
    return (
      <div
        className="flex justify-center items-center h-screen bg-gray-50 text-lg font-medium text-gray-700"
        dir="rtl"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mr-3"></div>
        جاري التحميل...
      </div>
    );
  }

  if (errorProfile || error.staffShifts) {
    return (
      <div
        className="flex justify-center items-center h-screen bg-gray-50 text-lg font-medium text-red-600"
        dir="rtl"
      >
        <div className="bg-red-100 p-4 rounded-lg shadow-md">
          خطأ: {errorProfile || error.staffShifts}
        </div>
      </div>
    );
  }

  if (!staffProfile) {
    return (
      <div
        className="flex justify-center items-center h-screen bg-gray-50 text-lg font-medium text-gray-500"
        dir="rtl"
      >
        <div className="bg-gray-100 p-4 rounded-lg shadow-md">
          لا توجد بيانات لهذا الموظف
        </div>
      </div>
    );
  }

  const parseTime = (timeStr) => {
    if (!timeStr) return "غير متاح";
    if (timeStr.includes(".")) timeStr = timeStr.split(".")[0];
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
      return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return new Date(timeStr).toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 space-x-reverse mb-8">
          <RiUserLine className="text-blue-600 w-8 h-8" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            ملف الموظف
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-full">
                  <RiUserLine className="text-blue-600 w-16 h-16" />
                </div>
              </div>

              <div className="text-center space-y-3">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                  {staffProfile.first_name} {staffProfile.last_name}
                </h3>
                <p className="text-sm text-gray-600">
                  اسم المستخدم: {staffProfile.username}
                </p>
                <p className="text-sm text-gray-600">
                  البريد الإلكتروني: {staffProfile.email || "غير متاح"}
                </p>
                <p className="text-sm text-gray-600">
                  كود RFID: {staffProfile.rfid_code || "غير متاح"}
                </p>
              </div>

              {/* Attendance Report Section */}
              <div className="w-full border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">
                    تقرير الحضور
                  </h4>
                  <button
                    onClick={handleFetchReport}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                    disabled={loading.report}
                  >
                    {loading.report ? "جاري التحميل..." : "جلب التقرير"}
                  </button>
                </div>
                {error.report && (
                  <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 text-sm">
                    خطأ: {error.report}
                  </div>
                )}
              
              </div>

              {/* Shifts Section */}
              <div className="w-full border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  الورديات
                </h4>
                {shifts.length > 0 ? (
                  <ul className="space-y-4">
                    {shifts.map((shift) => (
                      <li
                        key={shift.id}
                        className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                          <p>
                            <strong>تاريخ البداية:</strong>{" "}
                            {new Date(shift.date).toLocaleDateString("ar-EG")}
                          </p>
                          <p>
                            <strong>من:</strong> {parseTime(shift.shift_start)}
                          </p>
                          <p>
                            <strong>تاريخ النهاية:</strong>{" "}
                            {shift.shift_end_date
                              ? new Date(shift.shift_end_date).toLocaleDateString(
                                  "ar-EG"
                                )
                              : new Date(shift.date).toLocaleDateString("ar-EG")}
                          </p>
                          <p>
                            <strong>إلى:</strong> {parseTime(shift.shift_end)}
                          </p>
                          <p>
                            <strong>النادي:</strong> {shift.club_details?.name}
                          </p>
                          <p>
                            <strong>الموقع:</strong>{" "}
                            {shift.club_details?.location || "غير متاح"}
                          </p>
                          <p>
                            <strong>تمت الموافقة من:</strong>{" "}
                            {shift.approved_by_details
                              ? shift.approved_by_details.username
                              : "لم تتم الموافقة بعد"}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    لا توجد ورديات لهذا الموظف
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
            >
              العودة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;