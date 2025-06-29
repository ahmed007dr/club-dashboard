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

const AttendanceDashboard = () => {
  const dispatch = useDispatch();
  const { shiftAttendances, isLoading, error, lastFetched, loading } = useSelector((state) => state.attendance);
  const canAddAttendance = usePermission("add_attendance");
  const canViewShifts = usePermission("view_shift");

  // Form states
  const [rfidCode, setRfidCode] = useState("");
  const [foundStaff, setFoundStaff] = useState(null);
  const [formError, setFormError] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const rfidRef = useRef("");
  const [actionType, setActionType] = useState("checkIn");

  // Table states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [filters, setFilters] = useState({
    staffName: "",
    dateFrom: "",
    dateTo: "",
    status: "checkedIn", // Default to "موجود حاليًا"
  });

  // Fetch staff by RFID
  const fetchStaffByRfid = async (rfid) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${BASE_URL}accounts/api/users/?q=${rfid}`, { headers });
      return response.data.results || null;
    } catch (error) {
      console.error("Error fetching staff:", error);
      return null;
    }
  };

  // Debounced RFID search
  const debouncedFetchStaff = debounce(async (value) => {
    setLoadingAction(true);
    const results = await fetchStaffByRfid(value);
    setLoadingAction(false);

    const staff = results.find((staff) => staff.rfid_code === value);
    if (!staff) {
      setFormError("لم يتم العثور على موظف بهذا الرمز");
    } else {
      setFoundStaff(staff);
    }
  }, 700);

  // Handle RFID input change
  const handleRfidChange = (e) => {
    const value = e.target.value;
    rfidRef.current = value;
    setRfidCode(value);
    setFormError("");
    setFoundStaff(null);

    if (value) {
      debouncedFetchStaff(value);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!foundStaff) {
      setFormError("الرجاء إدخال رمز RFID صحيح");
      return;
    }

    setLoadingAction(true);
    const action = actionType === "checkIn" ? checkInStaff : checkOutStaff;
    const result = await dispatch(action(rfidRef.current));
    setLoadingAction(false);

    if (action.fulfilled.match(result)) {
      toast.success(`تم تسجيل ${actionType === "checkIn" ? "الدخول" : "الخروج"} بنجاح`, { icon: "✅" });
      setRfidCode("");
      rfidRef.current = "";
      setFoundStaff(null);
      dispatch(fetchShiftAttendances());
    } else {
      toast.error(result.payload?.error || `فشل في تسجيل ${actionType === "checkIn" ? "الدخول" : "الخروج"}`, { icon: "❌" });
    }
  };

  // Handle reset
  const handleReset = () => {
    setRfidCode("");
    rfidRef.current = "";
    setFoundStaff(null);
    setFormError("");
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
      <div className="flex items-center justify-center min-h-screen" dir="rtl">
        <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md w-full border border-gray-100">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="text-red-600 w-8 h-8" />
            <h2 className="text-xl font-semibold text-gray-800">عدم صلاحية الوصول</h2>
          </div>
          <p className="mt-2 text-gray-600">ليس لديك صلاحية للوصول لهذه الصفحة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8" dir="rtl">
      <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
        <FiLogIn className="text-green-600 w-10 h-10" />
        لوحة تسجيل الحضور
      </h1>

      {/* Attendance Form */}
      {canAddAttendance && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Check-In Section */}
            <div className="bg-green-50 p-6 rounded-xl border border-green-200">
              <h2 className="text-xl font-semibold text-green-800 flex items-center gap-2 mb-6">
                <FiLogIn className="w-6 h-6" />
                تسجيل الدخول
              </h2>
              <form onSubmit={actionType === "checkIn" ? handleSubmit : null} className="space-y-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-600 mb-2">رمز RFID</label>
                  <div className="relative">
                    <FiTag className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={actionType === "checkIn" ? rfidCode : ""}
                      onChange={actionType === "checkIn" ? handleRfidChange : null}
                      placeholder="أدخل رمز RFID لتسجيل الدخول"
                      className="w-full p-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-700 transition-all duration-200 text-right"
                      disabled={loadingAction || loading || actionType !== "checkIn"}
                    />
                  </div>
                </div>

                {loadingAction && actionType === "checkIn" && (
                  <div className="flex justify-center items-center py-3">
                    <Loader2 className="animate-spin w-6 h-6 text-green-600" />
                    <span className="mr-2 text-gray-600">جاري البحث...</span>
                  </div>
                )}

                {formError && actionType === "checkIn" && (
                  <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3">
                    <FiAlertTriangle className="text-red-600 w-5 h-5" />
                    <p className="text-red-600 text-sm">{formError}</p>
                  </div>
                )}

                {foundStaff && actionType === "checkIn" && (
                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                    <h3 className="font-semibold mb-4 text-gray-800 text-right">بيانات الموظف</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 hover:shadow-sm transition-all duration-200">
                          {foundStaff.photo ? (
                            <img src={foundStaff.photo} alt="Staff" className="w-full h-full object-cover" />
                          ) : (
                            <FiUser className="text-gray-500 w-8 h-8" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {foundStaff.first_name} {foundStaff.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{foundStaff.role}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <FiShield className="text-gray-500 w-5 h-5" />
                          <p className="text-sm">
                            <span className="font-medium">الحالة: </span>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                foundStaff.is_active ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                              }`}
                            >
                              {foundStaff.is_active ? "نشط" : "غير نشط"}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <FiHome className="text-gray-500 w-5 h-5" />
                          <p className="text-sm">
                            <span className="font-medium">النادي: </span>
                            {foundStaff.club?.name || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-5 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    disabled={loadingAction || loading}
                  >
                    إعادة تعيين
                  </button>
                  <button
                    type="submit"
                    onClick={() => setActionType("checkIn")}
                    className="px-5 py-2.5 rounded-lg bg-green-600 text-white flex items-center gap-2 hover:bg-green-700 transition-colors"
                    disabled={loadingAction || loading || (actionType === "checkIn" && !foundStaff)}
                  >
                    {loadingAction && actionType === "checkIn" ? (
                      <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                      <FiLogIn className="w-5 h-5" />
                    )}
                    تسجيل الدخول
                  </button>
                </div>
              </form>
            </div>

            {/* Check-Out Section */}
            <div className="bg-red-50 p-6 rounded-xl border border-red-200">
              <h2 className="text-xl font-semibold text-red-800 flex items-center gap-2 mb-6">
                <FiLogOut className="w-6 h-6" />
                تسجيل الخروج
              </h2>
              <form onSubmit={actionType === "checkOut" ? handleSubmit : null} className="space-y-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-600 mb-2">رمز RFID</label>
                  <div className="relative">
                    <FiTag className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={actionType === "checkOut" ? rfidCode : ""}
                      onChange={actionType === "checkOut" ? handleRfidChange : null}
                      placeholder="أدخل رمز RFID لتسجيل الخروج"
                      className="w-full p-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-700 transition-all duration-200 text-right"
                      disabled={loadingAction || loading || actionType !== "checkOut"}
                    />
                  </div>
                </div>

                {loadingAction && actionType === "checkOut" && (
                  <div className="flex justify-center items-center py-3">
                    <Loader2 className="animate-spin w-6 h-6 text-red-600" />
                    <span className="mr-2 text-gray-600">جاري البحث...</span>
                  </div>
                )}

                {formError && actionType === "checkOut" && (
                  <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3">
                    <FiAlertTriangle className="text-red-600 w-5 h-5" />
                    <p className="text-red-600 text-sm">{formError}</p>
                  </div>
                )}

                {foundStaff && actionType === "checkOut" && (
                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                    <h3 className="font-semibold mb-4 text-gray-800 text-right">بيانات الموظف</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 hover:shadow-sm transition-all duration-200">
                          {foundStaff.photo ? (
                            <img src={foundStaff.photo} alt="Staff" className="w-full h-full object-cover" />
                          ) : (
                            <FiUser className="text-gray-500 w-8 h-8" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {foundStaff.first_name} {foundStaff.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{foundStaff.role}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <FiShield className="text-gray-500 w-5 h-5" />
                          <p className="text-sm">
                            <span className="font-medium">الحالة: </span>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                foundStaff.is_active ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                              }`}
                            >
                              {foundStaff.is_active ? "نشط" : "غير نشط"}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <FiHome className="text-gray-500 w-5 h-5" />
                          <p className="text-sm">
                            <span className="font-medium">النادي: </span>
                            {foundStaff.club?.name || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-5 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    disabled={loadingAction || loading}
                  >
                    إعادة تعيين
                  </button>
                  <button
                    type="submit"
                    onClick={() => setActionType("checkOut")}
                    className="px-5 py-2.5 rounded-lg bg-red-600 text-white flex items-center gap-2 hover:bg-red-700 transition-colors"
                    disabled={loadingAction || loading || (actionType === "checkOut" && !foundStaff)}
                  >
                    {loadingAction && actionType === "checkOut" ? (
                      <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                      <FiLogOut className="w-5 h-5" />
                    )}
                    تسجيل الخروج
                  </button>
                </div>
              </form>
            </div>
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
                  <button
                    onClick={exportToExcel}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    <FiDownload className="mr-2" />
                    تصدير إلى Excel
                  </button>
                )}
                <button
                  onClick={resetFilters}
                  className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 transition-colors"
                >
                  <FiX className="mr-2" />
                  إعادة ضبط
                </button>
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
              <button
                onClick={() => dispatch(fetchShiftAttendances())}
                className="flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm transition-colors"
              >
                <FiRefreshCw className="mr-2" />
                إعادة المحاولة
              </button>
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
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-r-lg border border-gray-200 text-sm font-medium transition-colors ${
                    currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  السابق
                </button>
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
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`px-4 py-2 border-t border-b border-gray-200 text-sm font-medium transition-colors ${
                        currentPage === pageNum ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-l-lg border border-gray-200 text-sm font-medium transition-colors ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  التالي
                </button>
              </nav>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceDashboard;