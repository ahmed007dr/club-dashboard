import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  checkInStaff,
  checkOutStaff,
  fetchShiftAttendances,
} from "../../redux/slices/AttendanceSlice";
import { FiLogIn, FiLogOut, FiTag, FiUser, FiShield, FiHome, FiAlertTriangle, FiRefreshCw, FiFilter, FiX, FiDownload } from "react-icons/fi";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import BASE_URL from "../../config/api";
import usePermission from "@/hooks/usePermission";
import { debounce } from "lodash";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AttendanceDashboard = () => {
  const dispatch = useDispatch();
  const { shiftAttendances, isLoading, error, lastFetched, loading } = useSelector((state) => state.attendance);
  const canAddAttendance = usePermission("add_attendance");
  const canViewShifts = usePermission("view_shift");

  // Form states
  const [rfidCodeCheckIn, setRfidCodeCheckIn] = useState("");
  const [rfidCodeCheckOut, setRfidCodeCheckOut] = useState("");
  const [foundStaffCheckIn, setFoundStaffCheckIn] = useState(null);
  const [foundStaffCheckOut, setFoundStaffCheckOut] = useState(null);
  const [errorCheckIn, setErrorCheckIn] = useState("");
  const [errorCheckOut, setErrorCheckOut] = useState("");
  const [loadingCheckIn, setLoadingCheckIn] = useState(false);
  const [loadingCheckOut, setLoadingCheckOut] = useState(false);
  const rfidCheckInRef = useRef("");
  const rfidCheckOutRef = useRef("");

  // Table states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [filters, setFilters] = useState({
    staffName: "",
    dateFrom: "",
    dateTo: "",
    status: "checkedIn",
  });

  // Fetch staff by RFID using check-in/check-out endpoints
  const fetchStaffByRfid = async (rfid, isCheckIn = true) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token missing");
      const endpoint = isCheckIn ? 'check-in' : 'check-out';
      const response = await axios.post(
        `${BASE_URL}staff/api/${endpoint}/`,
        { rfid_code: rfid },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data.staff_details || null;
    } catch (error) {
      console.error(`Error fetching staff for ${isCheckIn ? 'check-in' : 'check-out'}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.error || "فشل البحث عن الموظف");
    }
  };

  // Debounced RFID search for Check-In
  const debouncedFetchStaffCheckIn = debounce(async (value) => {
    setLoadingCheckIn(true);
    try {
      const staff = await fetchStaffByRfid(value, true);
      setLoadingCheckIn(false);
      if (!staff) {
        setErrorCheckIn("لم يتم العثور على موظف بهذا الرمز");
      } else {
        setFoundStaffCheckIn(staff);
        toast.success("تم تسجيل الحضور بنجاح", { icon: "✅" });
        dispatch(fetchShiftAttendances()); // Update attendance table
      }
    } catch (error) {
      setLoadingCheckIn(false);
      setErrorCheckIn(error.message);
    }
  }, 500);

  // Debounced RFID search for Check-Out
  const debouncedFetchStaffCheckOut = debounce(async (value) => {
    setLoadingCheckOut(true);
    try {
      const staff = await fetchStaffByRfid(value, false);
      setLoadingCheckOut(false);
      if (!staff) {
        setErrorCheckOut("لم يتم العثور على موظف بهذا الرمز");
      } else {
        setFoundStaffCheckOut(staff);
        toast.success("تم تسجيل الانصراف بنجاح", { icon: "✅" });
        dispatch(fetchShiftAttendances()); // Update attendance table
      }
    } catch (error) {
      setLoadingCheckOut(false);
      setErrorCheckOut(error.message);
    }
  }, 1000);

  // Handle RFID input change
  const handleCheckInChange = (e) => {
    const value = e.target.value;
    rfidCheckInRef.current = value;
    setRfidCodeCheckIn(value);
    setErrorCheckIn("");
    setFoundStaffCheckIn(null);

    if (value) {
      debouncedFetchStaffCheckIn(value);
    } else {
      debouncedFetchStaffCheckIn.cancel();
    }
  };

  const handleCheckOutChange = (e) => {
    const value = e.target.value;
    rfidCheckOutRef.current = value;
    setRfidCodeCheckOut(value);
    setErrorCheckOut("");
    setFoundStaffCheckOut(null);

    if (value) {
      debouncedFetchStaffCheckOut(value);
    } else {
      debouncedFetchStaffCheckOut.cancel();
    }
  };

  // Handle form submission
  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!foundStaffCheckIn) {
      setErrorCheckIn("الرجاء إدخال رمز RFID صحيح");
      return;
    }
    // Check-in is already handled in debouncedFetchStaffCheckIn
    setRfidCodeCheckIn("");
    rfidCheckInRef.current = "";
    setFoundStaffCheckIn(null);
    setErrorCheckIn("");
  };

  const handleCheckOutSubmit = async (e) => {
    e.preventDefault();
    if (!foundStaffCheckOut) {
      setErrorCheckOut("الرجاء إدخال رمز RFID صحيح");
      return;
    }
    // Check-out is already handled in debouncedFetchStaffCheckOut
    setRfidCodeCheckOut("");
    rfidCheckOutRef.current = "";
    setFoundStaffCheckOut(null);
    setErrorCheckOut("");
  };

  // Handle reset
  const handleResetCheckIn = () => {
    setRfidCodeCheckIn("");
    rfidCheckInRef.current = "";
    setFoundStaffCheckIn(null);
    setErrorCheckIn("");
  };

  const handleResetCheckOut = () => {
    setRfidCodeCheckOut("");
    rfidCheckOutRef.current = "";
    setFoundStaffCheckOut(null);
    setErrorCheckOut("");
  };

  // Fetch attendances
  useEffect(() => {
    if (canViewShifts) {
      dispatch(fetchShiftAttendances());
    }
  }, [dispatch, canViewShifts]);

  // Filter handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      staffName: "",
      dateFrom: "",
      dateTo: "",
      status: "checkedIn",
    });
    setCurrentPage(1);
  };

  // Memoized filtered data
  const filteredData = useMemo(() => {
    return shiftAttendances
      .filter((attendance) => {
        const matchesStaff = `${attendance.staff_details.first_name} ${attendance.staff_details.last_name}`.toLowerCase().includes(filters.staffName.toLowerCase());
        const matchesDateFrom = filters.dateFrom === "" || new Date(attendance.check_in) >= new Date(filters.dateFrom);
        const matchesDateTo = filters.dateTo === "" || new Date(attendance.check_in) <= new Date(filters.dateTo);
        const matchesStatus =
          filters.status === "all" ||
          (filters.status === "checkedIn" && !attendance.check_out) ||
          (filters.status === "checkedOut" && attendance.check_out);

        return matchesStaff && matchesDateFrom && matchesDateTo && matchesStatus;
      })
      .sort((a, b) => new Date(b.check_in) - new Date(a.check_in));
  }, [shiftAttendances, filters]);

  // Excel export function
  const exportToExcel = () => {
    const data = filteredData.map((attendance) => ({
      "اسم الموظف": `${attendance.staff_details.first_name} ${attendance.staff_details.last_name}`,
      "وقت الحضور": new Date(attendance.check_in).toLocaleString("ar-EG"),
      "وقت الانصراف": attendance.check_out ? new Date(attendance.check_out).toLocaleString("ar-EG") : "لا يزال موجوداً",
      "المدة (ساعات)": attendance.duration_hours ? attendance.duration_hours.toFixed(2) : "غير متاح",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `Attendance_${new Date().toLocaleDateString("ar-EG").replace(/\//g, "-")}.xlsx`);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (!canAddAttendance && !canViewShifts) {
    return (
      <div className="flex items-center justify-center h-screen" dir="rtl">
        <Card className="shadow-sm border-gray-200 max-w-md w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-right text-xl flex items-center gap-2">
              <FiAlertTriangle className="text-red-600 w-6 h-6" />
              عدم صلاحية الوصول
            </CardTitle>
            <p className="text-right text-base text-gray-600">ليس لديك صلاحية للوصول لهذه الصفحة</p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold text-right flex items-center gap-3">
        <FiLogIn className="text-green-600 w-8 h-8" />
        لوحة تسجيل الحضور
      </h1>

      {/* Attendance Form */}
      {canAddAttendance && (
        <div className="space-y-6">
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
                      {loadingCheckIn ? (
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
                        className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all duration-200 text-right"
                        disabled={loadingCheckOut || loading}
                      />
                    </div>
                  </div>

                  {loadingCheckOut && (
                    <div className="flex justify-center items-center py-2">
                      <Loader2 className="animate-spin w-6 h-6 text-red-600" />
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
                      {loadingCheckOut ? (
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
        </div>
      )}

      {/* Attendance Table */}
      {canViewShifts && (
        <div className="space-y-6">
          {/* Filter Section */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <FiFilter className="w-5 h-5" />
                تصفية النتائج
              </h3>
              <div className="flex items-center gap-3">
                {filteredData.length > 0 && (
                  <Button
                    onClick={exportToExcel}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <FiDownload className="mr-2" />
                    تصدير إلى Excel
                  </Button>
                )}
                <Button
                  onClick={resetFilters}
                  variant="outline"
                  className="flex items-center px-4 py-2"
                >
                  <FiX className="mr-2" />
                  إعادة ضبط
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">اسم الموظف</label>
                <input
                  type="text"
                  name="staffName"
                  value={filters.staffName}
                  onChange={handleFilterChange}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  placeholder="ابحث باسم الموظف"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">من تاريخ</label>
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">إلى تاريخ</label>
                <input
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">حالة الحضور</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                >
                  <option value="all">الكل</option>
                  <option value="checkedIn">موجود حاليًا</option>
                  <option value="checkedOut">تم الانصراف</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="p-6 bg-blue-50 text-blue-700 rounded-2xl shadow-sm animate-pulse">
              جاري التحميل...
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-6 bg-red-50 text-red-700 rounded-2xl shadow-sm flex items-center justify-between">
              <span className="font-medium">خطأ: {error}</span>
              <Button
                onClick={() => dispatch(fetchShiftAttendances())}
                variant="outline"
                className="flex items-center px-4 py-2"
              >
                <FiRefreshCw className="mr-2" />
                إعادة المحاولة
              </Button>
            </div>
          )}

          {/* Results Info */}
          {filteredData.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm text-gray-600">
              <p>
                عرض <span className="font-medium">{indexOfFirstItem + 1}</span> إلى{" "}
                <span className="font-medium">{Math.min(indexOfLastItem, filteredData.length)}</span> من أصل{" "}
                <span className="font-medium">{filteredData.length}</span> سجل
              </p>
              <p>آخر تحديث: {new Date(lastFetched).toLocaleString("ar-EG")}</p>
            </div>
          )}

          {/* Attendance Table */}
          {currentItems.length > 0 ? (
            <div>
              {/* Table View - Larger Screens */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-100 shadow-lg">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        اسم الموظف
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        وقت الحضور
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        وقت الانصراف
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        المدة (ساعات)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {currentItems.map((attendance) => (
                      <tr key={attendance.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <Link
                            to={`/attendance/${attendance.staff_details.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {`${attendance.staff_details.first_name} ${attendance.staff_details.last_name}`}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(attendance.check_in).toLocaleString("ar-EG")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {attendance.check_out ? new Date(attendance.check_out).toLocaleString("ar-EG") : "لا يزال موجوداً"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {attendance.duration_hours ? attendance.duration_hours.toFixed(2) : "غير متاح"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Card View - Mobile Screens */}
              <div className="md:hidden space-y-4">
                {currentItems.map((attendance) => (
                  <div
                    key={attendance.id}
                    className="border border-gray-100 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="grid grid-cols-2 gap-y-4">
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">اسم الموظف</p>
                        <p className="text-sm font-medium">
                          <Link
                            to={`/attendance/${attendance.staff_details.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {`${attendance.staff_details.first_name} ${attendance.staff_details.last_name}`}
                          </Link>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">المدة (ساعات)</p>
                        <p className="text-sm">{attendance.duration_hours ? attendance.duration_hours.toFixed(2) : "غير متاح"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">وقت الحضور</p>
                        <p className="text-sm">{new Date(attendance.check_in).toLocaleString("ar-EG")}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">وقت الانصراف</p>
                        <p className="text-sm">
                          {attendance.check_out ? new Date(attendance.check_out).toLocaleString("ar-EG") : "لا يزال موجوداً"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            !isLoading &&
            !error && (
              <div className="p-6 bg-yellow-50 text-yellow-700 rounded-2xl shadow-sm text-center border border-yellow-100">
                لا توجد سجلات مطابقة لمعايير البحث
              </div>
            )
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="inline-flex rounded-lg shadow-sm -space-x-px">
                <Button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="px-4 py-2 rounded-r-lg"
                >
                  السابق
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      className={`px-4 py-2 ${currentPage === pageNum ? "bg-blue-500 text-white" : ""}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="px-4 py-2 rounded-l-lg"
                >
                  التالي
                </Button>
              </nav>
            </div>
          )}
        </div>
      )}

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

export default AttendanceDashboard;