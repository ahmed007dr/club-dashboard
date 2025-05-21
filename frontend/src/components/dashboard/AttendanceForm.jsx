import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  checkInStaff,
  checkOutStaff,
} from "../../redux/slices/AttendanceSlice";
import { FaUser } from "react-icons/fa";
import toast from "react-hot-toast";
import axios from "axios";
import BASE_URL from "../../config/api";
import usePermission from "@/hooks/usePermission";

const AttendanceForm = () => {
  const [rfidCodeCheckIn, setRfidCodeCheckIn] = useState("");
  const [rfidCodeCheckOut, setRfidCodeCheckOut] = useState("");
  const [foundStaffCheckIn, setFoundStaffCheckIn] = useState(null);
  const [foundStaffCheckOut, setFoundStaffCheckOut] = useState(null);
  const [errorCheckIn, setErrorCheckIn] = useState("");
  const [errorCheckOut, setErrorCheckOut] = useState("");
  const [loadingCheckIn, setLoadingCheckIn] = useState(false);
  const [loadingCheckOut, setLoadingCheckOut] = useState(false);

  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.attendance);
  const canAddAttendance = usePermission("add_attendance");

  const fetchStaffByRfid = async (rfid) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(
        `${BASE_URL}/accounts/api/users/?q=${rfid}`,
        { headers }
      );
      return response.data.results || null;
    } catch (error) {
      console.error("Error fetching staff:", error);
      return null;
    }
  };

  const handleCheckInChange = async (e) => {
    const value = e.target.value;
    setRfidCodeCheckIn(value);
    setErrorCheckIn("");
    setFoundStaffCheckIn(null);

    if (value) {
      setLoadingCheckIn(true);
      const results = await fetchStaffByRfid(value);
      setLoadingCheckIn(false);

      const staff = results.find((staff) => staff.rfid_code === value);

      if (!staff) {
        setErrorCheckIn("لم يتم العثور على موظف بهذا الرمز");
      } else {
        setFoundStaffCheckIn(staff);
      }
    }
  };

  const handleCheckOutChange = async (e) => {
    const value = e.target.value;
    setRfidCodeCheckOut(value);
    setErrorCheckOut("");
    setFoundStaffCheckOut(null);

    if (value) {
      setLoadingCheckOut(true);
      const results = await fetchStaffByRfid(value);
      setLoadingCheckOut(false);

      const staff = results.find((staff) => staff.rfid_code === value);

      if (!staff) {
        setErrorCheckOut("لم يتم العثور على موظف بهذا الرمز");
      } else {
        setFoundStaffCheckOut(staff);
      }
    }
  };

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!foundStaffCheckIn) {
      setErrorCheckIn("الرجاء إدخال رمز RFID صحيح لتسجيل الدخول");
      return;
    }

    const result = await dispatch(checkInStaff(rfidCodeCheckIn));
    if (checkInStaff.fulfilled.match(result)) {
      toast.success("تم تسجيل الدخول بنجاح");
      setRfidCodeCheckIn("");
      setFoundStaffCheckIn(null);
    } else {
      toast.error(result.payload?.error || "فشل في تسجيل الدخول");
    }
  };

  const handleCheckOutSubmit = async (e) => {
    e.preventDefault();
    if (!foundStaffCheckOut) {
      setErrorCheckOut("الرجاء إدخال رمز RFID صحيح لتسجيل الخروج");
      return;
    }

    const result = await dispatch(checkOutStaff(rfidCodeCheckOut));
    if (checkOutStaff.fulfilled.match(result)) {
      toast.success("تم تسجيل الخروج بنجاح");
      setRfidCodeCheckOut("");
      setFoundStaffCheckOut(null);
    } else {
      toast.error(result.payload?.error || "فشل في تسجيل الخروج");
    }
  };

  if (!canAddAttendance)
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-2xl font-bold text-red-500">
          لا يمكنك الوصول لهذه الصفحة
        </p>
      </div>
    );

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-4 p-4">
      {/* Check-In Form */}
      <div
        className="bg-white p-6 shadow-md rounded-md text-right w-full max-w-md"
        dir="rtl"
      >
        <h2 className="text-xl font-semibold mb-4">تسجيل دخول الموظف</h2>
        <form onSubmit={handleCheckInSubmit} className="space-y-4">
          <input
            type="text"
            value={rfidCodeCheckIn}
            onChange={handleCheckInChange}
            placeholder="أدخل رمز RFID لتسجيل الدخول"
            className="w-full p-2 border border-gray-300 rounded text-right"
          />

          {loadingCheckIn && (
            <div className="text-center py-2">
              <p>جاري البحث...</p>
            </div>
          )}

          {errorCheckIn && (
            <p className="text-red-500 text-sm text-right">{errorCheckIn}</p>
          )}

          {foundStaffCheckIn && (
            <div className="border-t pt-4 mt-2">
              <h4 className="font-medium mb-2">بيانات الموظف:</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    {foundStaffCheckIn.photo ? (
                      <img
                        src={foundStaffCheckIn.photo}
                        alt="Staff"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FaUser className="text-gray-500 w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {foundStaffCheckIn.first_name}{" "}
                      {foundStaffCheckIn.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {foundStaffCheckIn.role}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium">الحالة: </span>
                    <span
                      className={`px-1 py-0.5 rounded text-xs ${
                        foundStaffCheckIn.is_active
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {foundStaffCheckIn.is_active ? "نشط" : "غير نشط"}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">النادي: </span>
                    {foundStaffCheckIn.club?.name || "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !foundStaffCheckIn}
            className={`w-full btn ${
              !foundStaffCheckIn ? "bg-gray-400 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "جارٍ التسجيل..." : "تسجيل الدخول"}
          </button>
        </form>
      </div>

      {/* Check-Out Form */}
      <div
        className="bg-white p-6 shadow-md rounded-md text-right w-full max-w-md"
        dir="rtl"
      >
        <h2 className="text-xl font-semibold mb-4">تسجيل خروج الموظف</h2>
        <form onSubmit={handleCheckOutSubmit} className="space-y-4">
          <input
            type="text"
            value={rfidCodeCheckOut}
            onChange={handleCheckOutChange}
            placeholder="أدخل رمز RFID لتسجيل الخروج"
            className="w-full p-2 border border-gray-300 rounded text-right"
          />

          {loadingCheckOut && (
            <div className="text-center py-2">
              <p>جاري البحث...</p>
            </div>
          )}

          {errorCheckOut && (
            <p className="text-red-500 text-sm text-right">{errorCheckOut}</p>
          )}

          {foundStaffCheckOut && (
            <div className="border-t pt-4 mt-2">
              <h4 className="font-medium mb-2">بيانات الموظف:</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    {foundStaffCheckOut.photo ? (
                      <img
                        src={foundStaffCheckOut.photo}
                        alt="Staff"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FaUser className="text-gray-500 w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {foundStaffCheckOut.first_name}{" "}
                      {foundStaffCheckOut.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {foundStaffCheckOut.role}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium">الحالة: </span>
                    <span
                      className={`px-1 py-0.5 rounded text-xs ${
                        foundStaffCheckOut.is_active
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {foundStaffCheckOut.is_active ? "نشط" : "غير نشط"}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">النادي: </span>
                    {foundStaffCheckOut.club?.name || "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !foundStaffCheckOut}
            className={`w-full btn ${
              !foundStaffCheckOut ? "bg-gray-400 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AttendanceForm;
