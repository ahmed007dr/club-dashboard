import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addAttendance,
  deleteAttendance,
  fetchAttendances,
} from "@/redux/slices/AttendanceSlice";
import { fetchEntryLogs } from "@/redux/slices/EntryLogsSlice";
import { fetchSubscriptions } from "../../redux/slices/subscriptionsSlice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FiUsers, FiPlus, FiTrash, FiCalendar, FiSearch, FiTag, FiHome, FiShield, FiAlertTriangle, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import { Loader2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import EntryForm from "./EntryForm";
import { toast } from "react-hot-toast";
import usePermission from "@/hooks/usePermission";
import BASE_URL from "@/config/api";
import { FiUser } from 'react-icons/fi';

const Attendance = () => {
  const dispatch = useDispatch();

  const {
    data: attendances,
    count: attendanceCount,
    loading: attendanceLoading,
    error: attendanceError,
  } = useSelector((state) => state.attendance);
  const {
    data: entryLogs,
    count: entryLogCount,
    loading: entryLogsLoading,
    error: entryLogsError,
  } = useSelector((state) => state.entryLogs);

  const canViewAttendance = usePermission("view_attendance");
  const canAddAttendance = usePermission("add_attendance");
  const canAddEntryLog = usePermission("change_subscriptiontype");

  const [foundSubscription, setFoundSubscription] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [newAttendance, setNewAttendance] = useState({ club: '', identifier: '' });
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [isEntryLogDialogOpen, setIsEntryLogDialogOpen] = useState(false);
  const [allSubscriptions, setAllSubscriptions] = useState({ results: [] });
  const [userClub, setUserClub] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [attendanceFilters, setAttendanceFilters] = useState({
    attendance_date: "",
    entry_time_start: "",
    entry_time_end: "",
    rfid_code: "",
    member_name: "",
  });
  const [entryLogFilters, setEntryLogFilters] = useState({
    club: "",
    rfid: "",
    member: "",
    timestamp: "",
  });
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendanceItemsPerPage] = useState(20);
  const [entryLogPage, setEntryLogPage] = useState(1);
  const [entryLogItemsPerPage] = useState(20);

  useEffect(() => {
    fetch(`${BASE_URL}accounts/api/profile/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setUserClub({
          id: data.club.id,
          name: data.club.name,
        });
        setNewAttendance((prev) => ({ ...prev, club: data.club.id.toString() }));
      })
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
        toast.error("فشل في تحميل بيانات النادي", { icon: "❌" });
      });
  }, []);

  const fetchAllSubscriptions = async () => {
    try {
      let allResults = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await dispatch(fetchSubscriptions({ page: currentPage, pageSize: 20 })).unwrap();
        const results = response.subscriptions || [];
        allResults = [...allResults, ...results];
        hasMore = !!response.next;
        currentPage += 1;
      }

      return { results: allResults };
    } catch (error) {
      console.error('Failed to fetch all subscriptions:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const subscriptionsResponse = await fetchAllSubscriptions();
        setAllSubscriptions(subscriptionsResponse);

        await Promise.all([
          dispatch(
            fetchAttendances({
              page: attendancePage,
              pageSize: attendanceItemsPerPage,
              ...attendanceFilters,
            })
          ),
          dispatch(
            fetchEntryLogs({
              page: entryLogPage,
              pageSize: entryLogItemsPerPage,
              ...entryLogFilters,
            })
          ),
        ]);
      } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
        toast.error('فشل في جلب بيانات الاشتراكات أو الحضور', { icon: "❌" });
      } finally {
        setIsInitialLoad(false);
      }
    };

    fetchInitialData();
  }, [dispatch, attendancePage, attendanceFilters, entryLogPage, entryLogFilters, attendanceItemsPerPage, entryLogItemsPerPage]);

  const handleAttendanceInputChange = (e) => {
    const { name, value } = e.target;
    const updatedAttendance = { ...newAttendance, [name]: name === 'identifier' ? value.trim().toUpperCase() : value };
    setNewAttendance(updatedAttendance);
    setFoundSubscription(null);

    if (!updatedAttendance.identifier || !updatedAttendance.club) {
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    const subscription = allSubscriptions.results.find((sub) => {
      const member = sub.member_details || {};
      return (
        sub.club_details?.id.toString() === updatedAttendance.club.toString() &&
        (member.phone?.trim() === updatedAttendance.identifier || member.rfid_code?.toUpperCase() === updatedAttendance.identifier)
      );
    });

    setFoundSubscription(subscription || null);
    setSearchLoading(false);
  };

  const handleResetAttendanceFilters = () => {
    setAttendanceFilters({
      attendance_date: "",
      entry_time_start: "",
      entry_time_end: "",
      rfid_code: "",
      member_name: "",
    });
    setAttendancePage(1);
  };

  const handleResetEntryLogFilters = () => {
    setEntryLogFilters({
      club: "",
      rfid: "",
      member: "",
      timestamp: "",
    });
    setEntryLogPage(1);
  };

  const handleAddAttendance = (e) => {
    e.preventDefault();
    if (!foundSubscription) {
      toast.error("الرجاء إدخال رقم هاتف أو كود RFID صحيح", { icon: "❌" });
      return;
    }
    if (foundSubscription.status !== "Active") {
      toast.error("لا يمكن تسجيل الحضور لاشتراك غير نشط", { icon: "❌" });
      return;
    }
    if (
      foundSubscription.type_details.max_entries -
        foundSubscription.entry_count <=
      0
    ) {
      toast.error("لا توجد إدخالات متبقية في هذا الاشتراك", { icon: "❌" });
      return;
    }

    const attendanceData = {
      identifier: newAttendance.identifier,
      subscription_id: foundSubscription.id,
      member_id: foundSubscription.member_details.id,
      member_name: foundSubscription.member_details.name,
      club_id: foundSubscription.club_details.id,
    };

    dispatch(addAttendance(attendanceData))
      .unwrap()
      .then(() => {
        toast.success("تم إضافة الحضور بنجاح!", { icon: "✅" });
        setNewAttendance({ club: userClub?.id?.toString() || '', identifier: '' });
        setFoundSubscription(null);
        setIsAttendanceDialogOpen(false);
        dispatch(
          fetchAttendances({
            page: attendancePage,
            pageSize: attendanceItemsPerPage,
            ...attendanceFilters,
          })
        );
      })
      .catch((err) => {
        toast.error("فشل في إضافة الحضور: " + (err.message || "حدث خطأ"), { icon: "❌" });
      });
  };

  const PaginationControls = ({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    type,
  }) => {
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
          <div className="text-sm text-gray-600">
            {type === "attendance"
              ? "لا توجد سجلات حضور لعرضها"
              : "لا توجد سجلات دخول لعرضها"}
          </div>
        ) : (
          <>
            <Button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="outline"
              className="px-3 py-1"
            >
              <FiChevronRight className="w-4 h-4 mr-2" />
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
              <FiChevronLeft className="w-4 h-4 ml-2" />
            </Button>
            <span className="text-sm text-gray-600">
              صفحة {currentPage} من {totalPages || 1}
            </span>
          </>
        )}
      </div>
    );
  };

  if (!canViewAttendance) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-right text-xl flex items-center gap-2">
              <FiAlertTriangle className="text-red-600 w-6 h-6" />
              عدم صلاحية الوصول
            </CardTitle>
            <CardDescription className="text-right text-base">
              ليس لديك صلاحية لعرض سجلات الحضور
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
        <FiUsers className="text-blue-600 w-8 h-8" />
        إدارة الحضور والدخول
      </h1>
      <Tabs defaultValue="attendance" dir="rtl">
        <TabsList className="bg-gray-100 rounded-lg p-1">
          <TabsTrigger
            value="attendance"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2"
          >
            سجلات الحضور
          </TabsTrigger>
          <TabsTrigger
            value="entry-logs"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2"
          >
            سجلات الدخول
          </TabsTrigger>
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-right text-xl flex items-center gap-2">
                <FiUsers className="text-blue-600 w-6 h-6" />
                سجلات الحضور
              </CardTitle>
              <CardDescription className="text-right text-base">
                إدارة سجلات حضور الأعضاء
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "تاريخ الحضور", name: "attendance_date", type: "date", icon: FiCalendar },
                  { label: "اسم العضو", name: "member_name", type: "text", icon: FiSearch },
                  { label: "وقت الدخول (من)", name: "entry_time_start", type: "time", icon: FiSearch },
                  { label: "وقت الدخول (إلى)", name: "entry_time_end", type: "time", icon: FiSearch },
                ].map(({ label, name, type, icon: Icon }) => (
                  <div key={name} className="relative">
                    <label className="block text-sm font-medium mb-1 text-right">
                      {label}
                    </label>
                    <div className="relative">
                      <Icon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={type}
                        name={name}
                        value={attendanceFilters[name]}
                        onChange={(e) => {
                          setAttendanceFilters((prev) => ({
                            ...prev,
                            [name]: e.target.value,
                          }));
                          setAttendancePage(1);
                        }}
                        className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
                        placeholder={type === "text" ? `ابحث ب${label}` : undefined}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex items-end">
                  <Button
                    onClick={handleResetAttendanceFilters}
                    variant="outline"
                    className="w-full"
                  >
                    إعادة تعيين
                  </Button>
                </div>
              </div>

              {canAddAttendance && (
                <Button
                  onClick={() => setIsAttendanceDialogOpen(true)}
                  disabled={isInitialLoad || !userClub}
                  className="btn"
                >
                  <FiPlus className="mr-2 h-5 w-5" />
                  إضافة حضور
                </Button>
              )}

              {attendanceLoading && (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="animate-spin w-8 h-8 text-green-600" />
                  <span className="mr-4 text-gray-600">جاري تحميل بيانات الحضور...</span>
                </div>
              )}

              {attendanceError && (
                <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 text-right">
                  <FiAlertTriangle className="text-red-600 w-6 h-6" />
                  <p className="text-red-600">خطأ: {attendanceError}</p>
                </div>
              )}

              {!attendanceLoading && !attendanceError && (
                <>
                  <div className="rounded-md border border-gray-200 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="bg-gray-100 text-gray-700">
                          <th className="px-4 py-3 text-right text-sm font-semibold"></th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">RFID</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">تاريخ الحضور</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">اسم العضو</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {attendances?.map((attendance) => (
                          <tr
                            key={attendance.id}
                            className="hover:bg-gray-50 transition-all duration-200"
                          >
                            <td className="px-4 py-3">
                              <FiUser className="text-blue-600 w-5 h-5" />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">
                              {attendance.rfid_code || "غير متاح"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">
                              {new Date(
                                attendance.attendance_date + "T" + attendance.entry_time
                              ).toLocaleString("ar-EG", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">
                              {attendance.member_name || "غير متاح"}
                            </td>
                            <td className="px-4 py-3 text-sm flex justify-end gap-2">
                              <DropdownMenu dir="rtl">
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="p-2 rounded-full hover:bg-gray-200"
                                  >
                                    <MoreVertical className="h-5 w-5 text-gray-700" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      dispatch(deleteAttendance(attendance.id))
                                        .unwrap()
                                        .then(() => toast.success("تم حذف الحضور بنجاح!", { icon: "✅" }))
                                        .catch(() => toast.error("فشل في حذف الحضور", { icon: "❌" }))
                                    }
                                    className="cursor-pointer text-red-600 hover:bg-red-50"
                                  >
                                    <FiTrash className="mr-2 h-4 w-4" />
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
                    currentPage={attendancePage}
                    totalItems={attendanceCount}
                    itemsPerPage={attendanceItemsPerPage}
                    onPageChange={setAttendancePage}
                    type="attendance"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Entry Logs Tab */}
        <TabsContent value="entry-logs" className="space-y-4">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-right text-xl flex items-center gap-2">
                <FiUsers className="text-blue-600 w-6 h-6" />
                سجلات الدخول
              </CardTitle>
              <CardDescription className="text-right text-base">
                إدارة سجلات دخول الأعضاء
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "كود RFID", name: "rfid", type: "text", icon: FiTag },
                  { label: "اسم النادي", name: "club", type: "text", icon: FiHome },
                  { label: "اسم العضو", name: "member", type: "text", icon: FiSearch },
                  { label: "الوقت والتاريخ", name: "timestamp", type: "date", icon: FiCalendar },
                ].map(({ label, name, type, icon: Icon }) => (
                  <div key={name} className="relative">
                    <label className="block text-sm font-medium mb-1 text-right">
                      {label}
                    </label>
                    <div className="relative">
                      <Icon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={type}
                        name={name}
                        value={entryLogFilters[name]}
                        onChange={(e) => {
                          setEntryLogFilters((prev) => ({
                            ...prev,
                            [name]: name === "rfid" ? e.target.value.toUpperCase() : e.target.value,
                          }));
                          setEntryLogPage(1);
                        }}
                        className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
                        placeholder={type === "text" ? `ابحث ب${label}` : undefined}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex items-end">
                  <Button
                    onClick={handleResetEntryLogFilters}
                    variant="outline"
                    className="w-full"
                  >
                    إعادة تعيين
                  </Button>
                </div>
              </div>

              {canAddEntryLog && (
                <Button
                  onClick={() => setIsEntryLogDialogOpen(true)}
                  disabled={isInitialLoad}
                  className="btn"
                >
                  <FiPlus className="mr-2 h-5 w-5" />
                  إضافة سجل دخول
                </Button>
              )}

              {entryLogsLoading && (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="animate-spin w-8 h-8 text-green-600" />
                  <span className="mr-4 text-gray-600">جاري تحميل سجلات الدخول...</span>
                </div>
              )}

              {entryLogsError && (
                <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 text-right">
                  <FiAlertTriangle className="text-red-600 w-6 h-6" />
                  <p className="text-red-600">خطأ: {entryLogsError}</p>
                </div>
              )}

              {!entryLogsLoading && !entryLogsError && (
                <>
                  <div className="rounded-md border border-gray-200 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="bg-gray-100 text-gray-700">
                          <th className="px-4 py-3 text-right text-sm font-semibold"></th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">RFID</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">النادي</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">العضو</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">الوقت والتاريخ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {entryLogs?.map((log) => (
                          <tr
                            key={log.id}
                            className="hover:bg-gray-50 transition-all duration-200"
                          >
                            <td className="px-4 py-3">
                              <FiUser className="text-blue-600 w-5 h-5" />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">
                              {log.rfid_code}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">
                              {log.club_details?.name || "غير متاح"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">
                              {log.member_name || "غير متاح"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">
                              {new Date(log.timestamp).toLocaleString("ar-EG", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls
                    currentPage={entryLogPage}
                    totalItems={entryLogCount}
                    itemsPerPage={entryLogItemsPerPage}
                    onPageChange={setEntryLogPage}
                    type="entry-logs"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Attendance Dialog */}
      {isAttendanceDialogOpen && canAddAttendance && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={() => {
            setIsAttendanceDialogOpen(false);
            setFoundSubscription(null);
            setNewAttendance({ club: userClub?.id?.toString() || '', identifier: '' });
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              onClick={() => {
                setIsAttendanceDialogOpen(false);
                setFoundSubscription(null);
                setNewAttendance({ club: userClub?.id?.toString() || '', identifier: '' });
              }}
              variant="ghost"
              className="absolute top-4 left-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
            <div className="flex items-center gap-3 mb-6">
              <FiPlus className="text-green-600 w-6 h-6" />
              <h3 className="text-xl font-bold text-gray-800">إضافة حضور</h3>
            </div>
            <form onSubmit={handleAddAttendance} className="space-y-5">
              <div className="relative">
                <label className="block text-sm font-medium mb-1 text-right">
                  النادي
                </label>
                <div className="relative">
                  <FiHome className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    name="club"
                    value={newAttendance.club}
                    onChange={handleAttendanceInputChange}
                    className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
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
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-1 text-right">
                  رقم الهاتف أو كود RFID
                </label>
                <div className="relative">
                  <FiTag className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="identifier"
                    value={newAttendance.identifier}
                    onChange={handleAttendanceInputChange}
                    className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
                    placeholder="أدخل رقم الهاتف أو كود RFID"
                    required
                    autoFocus
                    disabled={!newAttendance.club || isInitialLoad}
                  />
                </div>
              </div>

              {isInitialLoad && (
                <div className="flex justify-center items-center py-2">
                  <Loader2 className="animate-spin w-6 h-6 text-green-600" />
                  <span className="mr-2 text-gray-600">جاري تحميل بيانات الاشتراكات...</span>
                </div>
              )}

              {searchLoading && (
                <div className="flex justify-center items-center py-2">
                  <Loader2 className="animate-spin w-6 h-6 text-green-600" />
                  <span className="mr-2 text-gray-600">جاري البحث...</span>
                </div>
              )}

              {foundSubscription && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                  <h4 className="font-semibold text-gray-700 text-right">بيانات الاشتراك</h4>
                  <div className="flex items-start gap-4">
                    {foundSubscription.member_details?.photo ? (
                      <img
                        src={foundSubscription.member_details.photo}
                        alt="Member"
                        className="w-14 h-14 rounded-full object-cover border border-gray-200 hover:shadow-sm transition-all duration-200"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl border border-gray-200">
                        <FiUser />
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-gray-800">
                        {foundSubscription.member_details?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        #{foundSubscription.member_details?.membership_number}
                      </p>
                      <p className="text-sm text-red-600">
                        <span className="font-medium">المبلغ المتبقي: </span>
                        {foundSubscription.remaining_amount}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <FiHome className="text-gray-500 w-5 h-5" />
                      <p>
                        <span className="font-medium">النادي: </span>
                        {foundSubscription.club_details?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiShield className="text-gray-500 w-5 h-5" />
                      <p>
                        <span className="font-medium">الحالة: </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            foundSubscription.status === "Active"
                              ? "bg-green-100 text-green-600"
                              : foundSubscription.status === "Expired"
                              ? "bg-red-100 text-red-600"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {foundSubscription.status}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiTag className="text-gray-500 w-5 h-5" />
                      <p>
                        <span className="font-medium">الهاتف: </span>
                        {foundSubscription.member_details?.phone}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiTag className="text-gray-500 w-5 h-5" />
                      <p>
                        <span className="font-medium">RFID: </span>
                        {foundSubscription.member_details?.rfid_code || "غير مسجل"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiCalendar className="text-gray-500 w-5 h-5" />
                      <p>
                        <span className="font-medium">تاريخ البدء: </span>
                        {new Date(foundSubscription.start_date).toLocaleDateString("ar-EG")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiCalendar className="text-gray-500 w-5 h-5" />
                      <p>
                        <span className="font-medium">تاريخ الانتهاء: </span>
                        {new Date(foundSubscription.end_date).toLocaleDateString("ar-EG")}
                      </p>
                    </div>
                    <div className="col-span-1 sm:col-span-2 flex items-center gap-2">
                      <FiTag className="text-gray-500 w-5 h-5" />
                      <p>
                        <span className="font-medium">الإدخالات المتبقية: </span>
                        <span
                          className={`font-bold ${
                            foundSubscription.type_details.max_entries -
                              foundSubscription.entry_count <=
                            0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {foundSubscription.type_details.max_entries -
                            foundSubscription.entry_count}
                        </span>
                        <span className="text-xs text-gray-500">
                          / {foundSubscription.type_details.max_entries}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!searchLoading &&
                newAttendance.identifier &&
                !foundSubscription &&
                !isInitialLoad && (
                  <div className="bg-red-50 p-3 rounded-lg flex items-center gap-2 text-right">
                    <FiAlertTriangle className="text-red-600 w-5 h-5" />
                    <p className="text-red-600 text-sm">
                      {newAttendance.identifier.match(/[a-zA-Z]/)
                        ? "لا يوجد اشتراك مسجل بهذا الكود RFID"
                        : "لا يوجد اشتراك مسجل بهذا الرقم"}
                    </p>
                  </div>
                )}

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => {
                    setIsAttendanceDialogOpen(false);
                    setFoundSubscription(null);
                    setNewAttendance({ club: userClub?.id?.toString() || '', identifier: '' });
                  }}
                  variant="outline"
                  className="px-6 py-2"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white"
                  disabled={!foundSubscription || isInitialLoad}
                >
                  <FiPlus className="mr-2 h-5 w-5" />
                  تأكيد الحضور
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Entry Log Dialog */}
      {isEntryLogDialogOpen && canAddEntryLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={() => setIsEntryLogDialogOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              onClick={() => setIsEntryLogDialogOpen(false)}
              variant="ghost"
              className="absolute top-4 left-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
            <div className="flex items-center gap-3 mb-6">
              <FiPlus className="text-green-600 w-6 h-6" />
              <h3 className="text-xl font-bold text-gray-800">إضافة سجل دخول</h3>
            </div>
            <EntryForm
              onSuccess={() => {
                setIsEntryLogDialogOpen(false);
                dispatch(
                  fetchEntryLogs({
                    page: entryLogPage,
                    pageSize: entryLogItemsPerPage,
                    ...entryLogFilters,
                  })
                );
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;