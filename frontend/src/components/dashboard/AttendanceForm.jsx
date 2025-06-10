import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  checkInStaff,
  checkOutStaff,
} from "../../redux/slices/AttendanceSlice";
import { FiLogIn, FiLogOut, FiTag, FiUser, FiShield, FiHome, FiAlertTriangle } from "react-icons/fi";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import BASE_URL from "../../config/api";
import usePermission from "@/hooks/usePermission";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
        `${BASE_URL}accounts/api/users/?q=${rfid}`,
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

    setLoadingCheckIn(true);
    const result = await dispatch(checkInStaff(rfidCodeCheckIn));
    setLoadingCheckIn(false);

    if (checkInStaff.fulfilled.match(result)) {
      toast.success("تم تسجيل الدخول بنجاح", { icon: "✅" });
      setRfidCodeCheckIn("");
      setFoundStaffCheckIn(null);
    } else {
      toast.error(result.payload?.error || "فشل في تسجيل الدخول", { icon: "❌" });
    }
  };

  const handleCheckOutSubmit = async (e) => {
    e.preventDefault();
    if (!foundStaffCheckOut) {
      setErrorCheckOut("الرجاء إدخال رمز RFID صحيح لتسجيل الخروج");
      return;
    }

    setLoadingCheckOut(true);
    const result = await dispatch(checkOutStaff(rfidCodeCheckOut));
    setLoadingCheckOut(false);

    if (checkOutStaff.fulfilled.match(result)) {
      toast.success("تم تسجيل الخروج بنجاح", { icon: "✅" });
      setRfidCodeCheckOut("");
      setFoundStaffCheckOut(null);
    } else {
      toast.error(result.payload?.error || "فشل في تسجيل الخروج", { icon: "❌" });
    }
  };

  const handleResetCheckIn = () => {
    setRfidCodeCheckIn("");
    setFoundStaffCheckIn(null);
    setErrorCheckIn("");
  };

  const handleResetCheckOut = () => {
    setRfidCodeCheckOut("");
    setFoundStaffCheckOut(null);
    setErrorCheckOut("");
  };

  if (!canAddAttendance) {
    return (
      <div className="flex items-center justify-center h-screen" dir="rtl">
        <Card className="shadow-sm border-gray-200 max-w-md w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-right text-xl flex items-center gap-2">
              <FiAlertTriangle className="text-red-600 w-6 h-6" />
              عدم صلاحية الوصول
            </CardTitle>
            <CardDescription className="text-right text-base">
              ليس لديك صلاحية للوصول لهذه الصفحة
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold text-right flex items-center gap-3">
        <FiLogIn className="text-green-600 w-8 h-8" />
        تسجيل حضور الموظفين
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Check-In Form */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-right text-xl flex items-center gap-2">
              <FiLogIn className="text-green-600 w-6 h-6" />
              تسجيل الدخول
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCheckInSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium mb-1 text-right">
                  رمز RFID
                </label>
                <div className="relative">
                  <FiTag className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={rfidCodeCheckIn}
                    onChange={handleCheckInChange}
                    placeholder="أدخل رمز RFID لتسجيل الدخول"
                    className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
                    disabled={loadingCheckIn || loading}
                  />
                </div>
              </div>

              {loadingCheckIn && (
                <div className="flex justify-center items-center py-2">
                  <Loader2 className="animate-spin w-6 h-6 text-green-600" />
                  <span className="mr-2 text-gray-600">جاري البحث...</span>
                </div>
              )}

              {errorCheckIn && (
                <div className="bg-red-50 p-3 rounded-lg flex items-center gap-2 text-right">
                  <FiAlertTriangle className="text-red-600 w-5 h-5" />
                  <p className="text-red-600 text-sm">{errorCheckIn}</p>
                </div>
              )}

              {foundStaffCheckIn && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium mb-3 text-right">بيانات الموظف</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 hover:shadow-sm transition-all duration-200">
                        {foundStaffCheckIn.photo ? (
                          <img
                            src={foundStaffCheckIn.photo}
                            alt="Staff"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FiUser className="text-gray-500 w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {foundStaffCheckIn.first_name} {foundStaffCheckIn.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{foundStaffCheckIn.role}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FiShield className="text-gray-500 w-5 h-5" />
                        <p className="text-sm">
                          <span className="font-medium">الحالة: </span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              foundStaffCheckIn.is_active
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {foundStaffCheckIn.is_active ? "نشط" : "غير نشط"}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiHome className="text-gray-500 w-5 h-5" />
                        <p className="text-sm">
                          <span className="font-medium">النادي: </span>
                          {foundStaffCheckIn.club?.name || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  onClick={handleResetCheckIn}
                  variant="outline"
                  className="px-4 py-2"
                  disabled={loadingCheckIn || loading}
                >
                  إعادة تعيين
                </Button>
                <Button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white"
                  disabled={loadingCheckIn || loading || !foundStaffCheckIn}
                >
                  {loadingCheckIn || loading ? (
                    <Loader2 className="animate-spin w-5 h-5 mr-2" />
                  ) : (
                    <FiLogIn className="mr-2 h-5 w-5" />
                  )}
                  تسجيل الدخول
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Check-Out Form */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-right text-xl flex items-center gap-2">
              <FiLogOut className="text-red-600 w-6 h-6" />
              تسجيل الخروج
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCheckOutSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium mb-1 text-right">
                  رمز RFID
                </label>
                <div className="relative">
                  <FiTag className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={rfidCodeCheckOut}
                    onChange={handleCheckOutChange}
                    placeholder="أدخل رمز RFID لتسجيل الخروج"
                    className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
                    disabled={loadingCheckOut || loading}
                  />
                </div>
              </div>

              {loadingCheckOut && (
                <div className="flex justify-center items-center py-2">
                  <Loader2 className="animate-spin w-6 h-6 text-green-600" />
                  <span className="mr-2 text-gray-600">جاري البحث...</span>
                </div>
              )}

              {errorCheckOut && (
                <div className="bg-red-50 p-3 rounded-lg flex items-center gap-2 text-right">
                  <FiAlertTriangle className="text-red-600 w-5 h-5" />
                  <p className="text-red-600 text-sm">{errorCheckOut}</p>
                </div>
              )}

              {foundStaffCheckOut && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium mb-3 text-right">بيانات الموظف</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 hover:shadow-sm transition-all duration-200">
                        {foundStaffCheckOut.photo ? (
                          <img
                            src={foundStaffCheckOut.photo}
                            alt="Staff"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FiUser className="text-gray-500 w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {foundStaffCheckOut.first_name} {foundStaffCheckOut.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{foundStaffCheckOut.role}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FiShield className="text-gray-500 w-5 h-5" />
                        <p className="text-sm">
                          <span className="font-medium">الحالة: </span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              foundStaffCheckOut.is_active
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {foundStaffCheckOut.is_active ? "نشط" : "غير نشط"}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiHome className="text-gray-500 w-5 h-5" />
                        <p className="text-sm">
                          <span className="font-medium">النادي: </span>
                          {foundStaffCheckOut.club?.name || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  onClick={handleResetCheckOut}
                  variant="outline"
                  className="px-4 py-2"
                  disabled={loadingCheckOut || loading}
                >
                  إعادة تعيين
                </Button>
                <Button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
                  disabled={loadingCheckOut || loading || !foundStaffCheckOut}
                >
                  {loadingCheckOut || loading ? (
                    <Loader2 className="animate-spin w-5 h-5 mr-2" />
                  ) : (
                    <FiLogOut className="mr-2 h-5 w-5" />
                  )}
                  تسجيل الخروج
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AttendanceForm;