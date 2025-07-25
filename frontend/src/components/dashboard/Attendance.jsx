import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addAttendance, deleteAttendance, fetchAttendances } from "@/redux/slices/AttendanceSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FiUsers, FiUser, FiHash, FiTrash, FiDollarSign, FiCalendar, FiSearch, FiFileText, FiPlus, FiList, FiPhone, FiAlertTriangle, FiEye, FiEyeOff, FiTag } from "react-icons/fi";
import { Loader2, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "react-hot-toast";
import usePermission from "@/hooks/usePermission";
import BASE_URL from "@/config/api";
import EntryLogs from "./EntryLogs";

// دالة debounce مخصصة
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// مكون الفلاتر
const FilterComponent = ({ filters, setFilters, onReset, onSearch }) => (
  <div className="flex flex-col sm:flex-row gap-4 mb-4">
    <div className="relative flex-1">
      <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <Input
        placeholder="ابحث باسم العضو"
        value={filters.member_name}
        onChange={(e) => setFilters((prev) => ({ ...prev, member_name: e.target.value.trim() }))}
        className="py-2 pr-10 pl-4 text-right"
      />
    </div>
    <div className="relative">
      <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <Input
        type="date"
        value={filters.attendance_date}
        onChange={(e) => setFilters((prev) => ({ ...prev, attendance_date: e.target.value }))}
        className="py-2 pr-10 pl-4 text-right"
      />
    </div>
    <Button onClick={onReset} variant="outline">إعادة تعيين</Button>
    <Button onClick={onSearch}>بحث</Button>
  </div>
);

// مكون التصفح
const PaginationControls = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const maxButtons = 5;
  let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let end = Math.min(totalPages, start + maxButtons - 1);

  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1);
  }

  const buttons = [];
  if (start > 1) {
    buttons.push(1);
    if (start > 2) buttons.push("...");
  }
  for (let page = start; page <= end; page++) {
    buttons.push(page);
  }
  if (end < totalPages) {
    if (end < totalPages - 1) buttons.push("...");
    buttons.push(totalPages);
  }

  return (
    <div className="flex justify-center items-center mt-6 gap-4" dir="rtl">
      {totalItems === 0 ? (
        <div className="text-sm text-gray-600">لا توجد سجلات حضور</div>
      ) : (
        <>
          <Button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
            className="px-3 py-1"
          >
            السابق
          </Button>
          <div className="flex gap-1">
            {buttons.map((page, index) => (
              <Button
                key={index}
                onClick={() => typeof page === "number" && onPageChange(page)}
                variant={currentPage === page ? "default" : "outline"}
                disabled={typeof page !== "number"}
                className={`px-3 py-1 ${typeof page !== "number" ? "cursor-default" : ""}`}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
            className="px-3 py-1"
          >
            التالي
          </Button>
          <span className="text-sm text-gray-600">صفحة {currentPage} من {totalPages || 1}</span>
        </>
      )}
    </div>
  );
};

const Attendance = () => {
  const dispatch = useDispatch();
  const { data: attendances, count: attendanceCount, loading, error } = useSelector((state) => state.attendance);
  const canViewAttendance = usePermission("view_attendance");
  const canAddAttendance = usePermission("add_attendance");
  const canAddEntryLog = usePermission("change_subscriptiontype");

  const [foundSubscriptions, setFoundSubscriptions] = useState([]); // تغيير إلى قائمة اشتراكات
  const [selectedSubscription, setSelectedSubscription] = useState(""); // حالة للاشتراك المختار
  const [searchLoading, setSearchLoading] = useState(false);
  const [newAttendance, setNewAttendance] = useState({ club: "", identifier: "", subscription_id: "" });
  const [userClub, setUserClub] = useState(null);
  const [filters, setFilters] = useState({ attendance_date: "", member_name: "" });
  const [page, setPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEntryLogsOpen, setIsEntryLogsOpen] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [dailyAttendance, setDailyAttendance] = useState(0);
  const [weeklyAttendance, setWeeklyAttendance] = useState(0);
  const [lastHourAttendance, setLastHourAttendance] = useState(0);
  const itemsPerPage = 20;

  // جلب بيانات الملف الشخصي للنادي
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${BASE_URL}accounts/api/profile/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("فشل في جلب بيانات النادي");
        const data = await response.json();
        setUserClub({ id: data.club.id, name: data.club.name });
        setNewAttendance((prev) => ({ ...prev, club: data.club.id.toString() }));
      } catch (err) {
        toast.error("فشل في تحميل بيانات النادي");
      }
    };
    fetchProfile();
  }, []);

  // جلب إحصائيات الحضور
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [dailyResponse, weeklyResponse, lastHourResponse] = await Promise.all([
          fetch(`${BASE_URL}attendance/api/attendances/hourly/`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${BASE_URL}attendance/api/attendances/weekly/`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${BASE_URL}attendance/api/attendances/last-hour/`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        if (dailyResponse.ok) {
          const hourlyData = await dailyResponse.json();
          setDailyAttendance(hourlyData.reduce((sum, count) => sum + count, 0));
        }
        if (weeklyResponse.ok) {
          const weeklyData = await weeklyResponse.json();
          setWeeklyAttendance(weeklyData.reduce((sum, entry) => sum + entry.count, 0));
        }
        if (lastHourResponse.ok) {
          const lastHourData = await lastHourResponse.json();
          setLastHourAttendance(lastHourData.count || 0);
        }
      } catch (err) {
        toast.error("فشل في جلب إحصائيات الحضور");
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  // جلب سجلات الحضور
  const fetchAttendancesData = useCallback(() => {
    if (showTable) {
      dispatch(fetchAttendances({ page, pageSize: itemsPerPage, ...filters }));
    }
  }, [dispatch, page, filters, showTable]);

  useEffect(() => {
    fetchAttendancesData();
  }, [fetchAttendancesData]);

  const searchSubscription = useCallback(
    debounce(async (attendance) => {
      if (!attendance.identifier || !attendance.club) {
        setSearchLoading(false);
        return;
      }

      setSearchLoading(true);
      try {
        const response = await fetch(
          `${BASE_URL}subscriptions/api/subscriptions/?identifier=${attendance.identifier}&club=${attendance.club}&status=active`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
            },
          }
        );
        if (!response.ok) throw new Error("فشل في جلب الاشتراكات");
        const data = await response.json();

        const subscriptions = data.results.filter((sub) => {
          const member = sub.member_details || {};
          return (
            member.rfid_code?.toUpperCase() === attendance.identifier ||
            member.phone?.trim() === attendance.identifier
          );
        });

        if (!subscriptions.length) {
          toast.error("لم يتم العثور على اشتراكات فعالة لهذا المعرف");
          setFoundSubscriptions([]);
          setSelectedSubscription("");
        } else {
          setFoundSubscriptions(subscriptions);
          setSelectedSubscription(subscriptions[0]?.id.toString() || ""); // اختيار أول اشتراك تلقائيًا
        }
      } catch (err) {
        toast.error("فشل في البحث عن الاشتراكات: " + err.message);
        setFoundSubscriptions([]);
        setSelectedSubscription("");
      } finally {
        setSearchLoading(false);
      }
    }, 1000),
    []
  );

  // التعامل مع تغيير إدخال نموذج الحضور
  const handleAttendanceInputChange = (e) => {
    const { name, value } = e.target;
    const updatedAttendance = {
      ...newAttendance,
      [name]: name === "identifier" ? value.trim().toUpperCase() : value,
    };
    setNewAttendance(updatedAttendance);
    if (name === "identifier") {
      setFoundSubscriptions([]);
      setSelectedSubscription("");
      searchSubscription(updatedAttendance);
    } else if (name === "subscription_id") {
      setSelectedSubscription(value);
    }
  };

  // تسجيل حضور جديد
  const handleAddAttendance = async (e) => {
    e.preventDefault();
    if (!foundSubscriptions.length) {
      toast.error("الرجاء إدخال معرف صحيح");
      return;
    }
    setIsSubmitting(true);
    const attendanceData = {
      identifier: newAttendance.identifier,
      subscription_id: selectedSubscription || undefined, // إرسال subscription_id إذا تم اختياره
    };
    try {
      await dispatch(addAttendance(attendanceData)).unwrap();
      const time = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
      const selectedSub = foundSubscriptions.find(sub => sub.id.toString() === selectedSubscription) || foundSubscriptions[0];
      toast.success(`تم إضافة ${selectedSub.member_details?.name} في ${time} بنجاح!`, { icon: "✅" });
      setNewAttendance({ club: userClub?.id?.toString() || "", identifier: "", subscription_id: "" });
      setFoundSubscriptions([]);
      setSelectedSubscription("");
      fetchAttendancesData();
    } catch (err) {
      const errorMsg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.message ||
        "حدث خطأ غير متوقع أثناء تسجيل الحضور";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!canViewAttendance) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="text-right text-xl">عدم صلاحية الوصول</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-gradient-to-br from-blue-50 to-gray-100" dir="rtl">
      {/* العنوان وزر سجلات الدخول */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FiUsers className="text-blue-600 w-8 h-8" />
          إدارة الحضور
        </h1>
        {canAddEntryLog && (
          <Button
            variant="ghost"
            className="p-2 rounded-full hover:bg-blue-100"
            onClick={() => setIsEntryLogsOpen(true)}
            title="عرض سجلات الدخول"
          >
            <FiFileText className="w-6 h-6 text-blue-600" />
          </Button>
        )}
      </div>

      {/* الجزء العلوي: نموذج الحضور (70%) والإحصائيات (30%) */}
      <Card className="shadow-lg border-gray-200 bg-white">
        <CardContent className="p-6">
          <div className="flex gap-6">
          {canAddAttendance && (
                  <div className="w-[70%]">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FiPlus className="text-blue-600" />
                      إضافة حضور
                    </h3>
                    <form onSubmit={handleAddAttendance} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-right">النادي</label>
                        <select
                          name="club"
                          value={newAttendance.club}
                          onChange={handleAttendanceInputChange}
                          className="w-full border rounded-lg py-2.5 pr-10 pl-4 text-right"
                          disabled
                          required
                        >
                          {userClub ? (
                            <option value={userClub.id}>{userClub.name}</option>
                          ) : (
                            <option value="">جاري التحميل...</option>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-right">رقم الهاتف أو كود RFID</label>
                        <div className="relative">
                          <FiTag className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            type="text"
                            name="identifier"
                            value={newAttendance.identifier}
                            onChange={handleAttendanceInputChange}
                            placeholder="أدخل رقم الهاتف أو كود RFID"
                            className="w-full py-2.5 pr-10 pl-4 text-right"
                            required
                            autoFocus
                            disabled={!newAttendance.club}
                          />
                        </div>
                      </div>
                      {foundSubscriptions.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium mb-1 text-right">اختر الاشتراك</label>
                          <select
                            name="subscription_id"
                            value={selectedSubscription}
                            onChange={handleAttendanceInputChange}
                            className="w-full border rounded-lg py-2.5 pr-10 pl-4 text-right"
                          >
                            {foundSubscriptions.map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.type_details?.name} (ينتهي: {new Date(sub.end_date).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      {searchLoading && (
                        <div className="flex justify-center py-2">
                          <Loader2 className="animate-spin w-6 h-6 text-blue-600" />
                        </div>
                      )}
                      {foundSubscriptions.length > 0 && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm">
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            {(() => {
                              const selectedSub = foundSubscriptions.find(sub => sub.id.toString() === selectedSubscription) || foundSubscriptions[0];
                              return (
                                <>
                                  <p className="flex items-center gap-2">
                                    <FiUser className="text-blue-600" />
                                    {selectedSub.member_details?.name || "غير متاح"}
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <FiHash className="text-blue-600" />
                                    #{selectedSub.member_details?.rfid_code || "غير متاح"}
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <FiDollarSign className="text-blue-600" />
                                    المبلغ المتبقي: {selectedSub.remaining_amount ?? "غير متاح"}
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <FiList className="text-blue-600" />
                                    الإدخالات المتبقية:{" "}
                                    <span
                                      className={
                                        Number.isFinite(
                                          Number(selectedSub.type_details?.max_entries) - Number(selectedSub.entry_count)
                                        ) && Number(selectedSub.type_details?.max_entries) - Number(selectedSub.entry_count) <= 0
                                          ? "text-red-600"
                                          : "text-green-600"
                                      }
                                    >
                                      {Number.isFinite(
                                        Number(selectedSub.type_details?.max_entries) - Number(selectedSub.entry_count)
                                      )
                                        ? Number(selectedSub.type_details?.max_entries) - Number(selectedSub.entry_count)
                                        : "غير متاح"}
                                    </span>{" "}
                                    / {selectedSub.type_details?.max_entries ?? "غير متاح"}
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <FiTag className="text-blue-600" />
                                    اسم الاشتراك: {selectedSub.type_details?.name || "غير متاح"}
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <FiPhone className="text-blue-600" />
                                    رقم الهاتف: {selectedSub.member_details?.phone || "غير متاح"}
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <FiCalendar className="text-blue-600" />
                                    بداية الاشتراك: {new Date(selectedSub.start_date).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" }) || "غير متاح"}
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <FiCalendar className="text-blue-600" />
                                    نهاية الاشتراك: {new Date(selectedSub.end_date).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" }) || "غير متاح"}
                                  </p>
                                  {selectedSub.coach_simple && (
                                    <p className="flex items-center gap-2">
                                      <FiUser className="text-blue-600" />
                                      اسم الكابتن: {selectedSub.coach_simple?.username || "غير متاح"}
                                    </p>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                      {!searchLoading && newAttendance.identifier && !foundSubscriptions.length && (
                        <div className="bg-red-50 p-2 rounded-lg flex items-center gap-2">
                          <FiAlertTriangle className="text-red-600 w-5 h-5" />
                          <p className="text-red-600 text-sm">لا يوجد اشتراكات فعالة لهذا المعرف</p>
                        </div>
                      )}
                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-transform"
                        disabled={!foundSubscriptions.length || isSubmitting}
                      >
                        <FiPlus className="mr-2" />
                        تأكيد الحضور
                      </Button>
                    </form>
                  </div>
                )}


            {/* الإحصائيات */}
            <div className="w-[30%]">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FiUsers className="text-blue-600" />
                إحصائيات الحضور
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 text-right">الحضور اليوم</p>
                  <p className="text-xl font-bold text-blue-600 text-right">{dailyAttendance}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 text-right">الحضور هذا الأسبوع</p>
                  <p className="text-xl font-bold text-blue-600 text-right">{weeklyAttendance}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 text-right">الحضور في آخر ساعة</p>
                  <p className="text-xl font-bold text-blue-600 text-right">{lastHourAttendance}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الجزء السفلي: سجلات الحضور */}

      <Card className="shadow-lg border-gray-200 bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-right text-xl flex items-center gap-2">
          <FiUsers className="text-blue-600 w-6 h-6" />
          سجلات الحضور
        </CardTitle>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => setShowTable(!showTable)}
        >
          {showTable ? <FiEyeOff /> : <FiEye />}
          {showTable ? "إخفاء السجلات" : "إظهار السجلات"}
        </Button>
      </CardHeader>
      {showTable && (
        <CardContent className="space-y-6">
          <FilterComponent
            filters={filters}
            setFilters={setFilters}
            onReset={() => setFilters({ attendance_date: "", member_name: "" })}
          />
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-lg">خطأ: {error}</div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="px-4 py-3 text-right text-sm font-semibold">RFID</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">تاريخ الحضور</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">اسم العضو</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">نوع الاشتراك</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendances?.map((attendance) => (
                      <tr key={attendance.id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-3">{attendance.rfid_code || "غير متاح"}</td>
                        <td className="px-4 py-3">
                          {new Date(attendance.timestamp).toLocaleString("ar-EG", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Africa/Cairo"
                          })}
                        </td>
                        <td className="px-4 py-3">{attendance.member_name || "غير متاح"}</td>
                        <td className="px-4 py-3">{attendance.subscription_details?.type_details?.name || "غير متاح"}</td>
                        <td className="px-4 py-3">
                          <DropdownMenu dir="rtl">
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="p-2">
                                <MoreVertical className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() =>
                                  dispatch(deleteAttendance(attendance.id))
                                    .unwrap()
                                    .then(() => toast.success("تم الحذف"))
                                    .catch(() => toast.error("فشل في الحذف"))
                                }
                                className="text-red-600"
                              >
                                <FiTrash className="mr-2" />
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                currentPage={page}
                totalItems={attendanceCount}
                itemsPerPage={itemsPerPage}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      )}
    </Card>


      {/* نافذة سجلات الدخول */}
      {isEntryLogsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full" dir="rtl">
            <Button
              onClick={() => setIsEntryLogsOpen(false)}
              variant="ghost"
              className="absolute top-4 left-4"
            >
              ✕
            </Button>
            <EntryLogs onClose={() => setIsEntryLogsOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;