import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MoreVertical } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addAttendance,
  deleteAttendance,
  fetchAttendances,
} from "@/redux/slices/AttendanceSlice";
import { fetchEntryLogs } from "@/redux/slices/EntryLogsSlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { fetchSubscriptions } from "../../redux/slices/subscriptionsSlice";
import EntryForm from "./EntryForm";
import { toast } from "react-hot-toast";
import { FaUser } from "react-icons/fa";
import usePermission from "@/hooks/usePermission";

const Attendance = () => {
  const dispatch = useDispatch();

  // Redux state
  const {
    data: attendances,
    count: attendanceCount,
    loading: attendanceLoading,
    error: attendanceError,
  } = useSelector((state) => state.attendance);
  const { subscriptions } = useSelector((state) => state.subscriptions);
  const {
    data: entryLogs,
    count: entryLogCount,
    loading: entryLogsLoading,
    error: entryLogsError,
  } = useSelector((state) => state.entryLogs);

  const canViewAttendance = usePermission("view_attendance");
  const canAddAttendance = usePermission("add_attendance");
  const canAddEntryLog = usePermission("change_subscriptiontype");

  // State variables
  const [foundSubscription, setFoundSubscription] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [newAttendance, setNewAttendance] = useState({ identifier: "" });
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [isEntryLogDialogOpen, setIsEntryLogDialogOpen] = useState(false);

  // Filters and Pagination
  const [attendanceFilters, setAttendanceFilters] = useState({
    subscription: "",
    rfid: "",
    attendance_date: "",
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
    dispatch(
      fetchAttendances({
        page: attendancePage,
        pageSize: attendanceItemsPerPage,
        ...attendanceFilters,
      })
    );
    dispatch(
      fetchEntryLogs({
        page: entryLogPage,
        pageSize: entryLogItemsPerPage,
        ...entryLogFilters,
      })
    );
    dispatch(fetchSubscriptions());
  }, [dispatch, attendancePage, attendanceFilters, entryLogPage, entryLogFilters, attendanceItemsPerPage, entryLogItemsPerPage]);

  useEffect(() => {
    console.log("Filters changed:", entryLogs, attendances);
  }, [entryLogs, attendances]);

  const handleAttendanceInputChange = (e) => {
    const { name, value } = e.target;
    const searchValue = value.trim().toUpperCase();
    setNewAttendance({ ...newAttendance, [name]: searchValue });
    setFoundSubscription(null);

    if (!searchValue) return;

    setSearchLoading(true);

    const subscription = subscriptions.find((sub) => {
      const member = sub.member_details || {};
      return (
        member.phone?.trim() === searchValue ||
        member.rfid_code?.trim().toUpperCase() === searchValue
      );
    });

    setFoundSubscription(subscription || null);
    setSearchLoading(false);
  };

  const handleAddAttendance = (e) => {
    e.preventDefault();
    if (!foundSubscription) {
      toast.error("الرجاء إدخال رقم هاتف أو كود RFID صحيح");
      return;
    }
    if (foundSubscription.status !== "Active") {
      toast.error("لا يمكن تسجيل الحضور لاشتراك غير نشط");
      return;
    }
    if (
      foundSubscription.type_details.max_entries -
        foundSubscription.entry_count <=
      0
    ) {
      toast.error("لا توجد إدخالات متبقية في هذا الاشتراك");
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
        toast.success("تم إضافة الحضور بنجاح!");
        setNewAttendance({ identifier: "" });
        setFoundSubscription(null);
        setIsAttendanceDialogOpen(false);
        dispatch(
          fetchAttendances({
            page: attendancePage,
            pageSize: attendanceItemsPerPage,
            ...attendanceFilters,
          })
        );
        dispatch(fetchSubscriptions());
      })
      .catch((err) => {
        toast.error("فشل في إضافة الحضور: " + (err.message || "حدث خطأ"));
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
    const sideButtons = Math.floor(maxButtons / 2);
    let start = Math.max(1, currentPage - sideButtons);
    let end = Math.min(totalPages, currentPage + sideButtons);

    if (end - start + 1 < maxButtons) {
      if (currentPage <= sideButtons) {
        end = Math.min(totalPages, maxButtons);
      } else {
        start = Math.max(1, totalPages - maxButtons + 1);
      }
    }

    return (
      <div className="flex justify-between items-center mt-4" dir="rtl">
        {totalItems === 0 ? (
          <div className="text-sm text-gray-600">
            {type === "attendance"
              ? "لا توجد سجلات حضور لعرضها"
              : "لا توجد سجلات دخول لعرضها"}
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600">
              عرض {(currentPage - 1) * itemsPerPage + 1} إلى{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} من {totalItems}{" "}
              سجل
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${
                  currentPage === 1
                    ? "bg-gray-200 opacity-50 cursor-not-allowed"
                    : "bg-blue-700 text-white hover:bg-blue-800"
                }`}
              >
                الأول
              </button>
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${
                  currentPage === 1
                    ? "bg-gray-200 opacity-50 cursor-not-allowed"
                    : "bg-blue-700 text-white hover:bg-blue-800"
                }`}
              >
                السابق
              </button>

              {Array.from({ length: end - start + 1 }, (_, i) => start + i).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? "bg-blue-700 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages
                    ? "bg-gray-200 opacity-50 cursor-not-allowed"
                    : "bg-blue-700 text-white hover:bg-blue-800"
                }`}
              >
                التالي
              </button>
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages
                    ? "bg-gray-200 opacity-50 cursor-not-allowed"
                    : "bg-blue-700 text-white hover:bg-blue-800"
                }`}
              >
                الأخير
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  if (!canViewAttendance) {
    return (
      <div className="space-y-6" dir="rtl">
        <h1 className="text-2xl font-bold tracking-tight">
          ليس لديك صلاحية عرض سجلات الحضور
        </h1>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold tracking-tight">
        إدارة الحضور و الدخول
      </h1>
      <Tabs defaultValue="attendance" dir="rtl">
        <TabsList dir="rtl">
          <TabsTrigger value="attendance">سجلات الحضور</TabsTrigger>
          <TabsTrigger value="entry-logs">سجلات الدخول</TabsTrigger>
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>سجلات الحضور</CardTitle>
              <CardDescription>إدارة سجلات الحضور</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1">كود RFID</label>
                  <input
                    type="text"
                    name="rfid"
                    value={attendanceFilters.rfid}
                    onChange={(e) => {
                      setAttendanceFilters((prev) => ({
                        ...prev,
                        rfid: e.target.value.toUpperCase(),
                      }));
                      setAttendancePage(1);
                    }}
                    className="border px-3 py-2 rounded w-full uppercase"
                    placeholder="ابحث بكود RFID"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">تاريخ الحضور</label>
                  <input
                    type="date"
                    name="attendance_date"
                    value={attendanceFilters.attendance_date}
                    onChange={(e) => {
                      setAttendanceFilters((prev) => ({
                        ...prev,
                        attendance_date: e.target.value,
                      }));
                      setAttendancePage(1);
                    }}
                    className="border px-3 py-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">اسم العضو</label>
                  <input
                    type="text"
                    name="member_name"
                    value={attendanceFilters.member_name}
                    onChange={(e) => {
                      setAttendanceFilters((prev) => ({
                        ...prev,
                        member_name: e.target.value,
                      }));
                      setAttendancePage(1);
                    }}
                    className="border px-3 py-2 rounded w-full"
                    placeholder="ابحث باسم العضو"
                  />
                </div>
              </div>

              <Button onClick={() => setIsAttendanceDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                إضافة حضور
              </Button>

              {attendanceLoading && <p>جاري تحميل بيانات الحضور...</p>}
              {attendanceError && (
                <p className="text-red-500">خطأ: {attendanceError}</p>
              )}

              {!attendanceLoading && !attendanceError && (
                <>
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-3 text-right text-sm font-medium">
                            RFID
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium">
                            تاريخ الحضور
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium">
                            اسم العضو
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium">
                            الإجراءات
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-background">
                        {attendances?.map((attendance) => (
                          <tr
                            key={attendance.id}
                            className="hover:bg-gray-100 transition"
                          >
                            <td className="px-4 py-3 text-sm">
                              {attendance.rfid_code || "غير متاح"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {new Date(
                                attendance.attendance_date +
                                  "T" +
                                  attendance.entry_time
                              ).toLocaleString("en-US", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {attendance.member_name || "غير متاح"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <DropdownMenu dir="rtl">
                                <DropdownMenuTrigger asChild>
                                  <button className="bg-gray-200 text-gray-700 px-1 py-1 rounded-md hover:bg-gray-300 transition-colors">
                                    <MoreVertical className="h-5 w-5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-40"
                                >
                                  <DropdownMenuItem
                                    onClick={() =>
                                      dispatch(deleteAttendance(attendance.id))
                                    }
                                    className="cursor-pointer text-red-600 hover:bg-red-50"
                                  >
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>سجلات الدخول</CardTitle>
              <CardDescription>إدارة سجلات الدخول</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm mb-1">كود RFID</label>
                  <input
                    type="text"
                    name="rfid"
                    value={entryLogFilters.rfid}
                    onChange={(e) => {
                      setEntryLogFilters((prev) => ({
                        ...prev,
                        rfid: e.target.value.toUpperCase(),
                      }));
                      setEntryLogPage(1);
                    }}
                    className="border px-3 py-2 rounded w-full uppercase"
                    placeholder="ابحث بكود RFID"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">اسم النادي</label>
                  <input
                    type="text"
                    name="club"
                    value={entryLogFilters.club}
                    onChange={(e) => {
                      setEntryLogFilters((prev) => ({
                        ...prev,
                        club: e.target.value,
                      }));
                      setEntryLogPage(1);
                    }}
                    className="border px-3 py-2 rounded w-full"
                    placeholder="ابحث باسم النادي"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">اسم العضو</label>
                  <input
                    type="text"
                    name="member"
                    value={entryLogFilters.member}
                    onChange={(e) => {
                      setEntryLogFilters((prev) => ({
                        ...prev,
                        member: e.target.value,
                      }));
                      setEntryLogPage(1);
                    }}
                    className="border px-3 py-2 rounded w-full"
                    placeholder="ابحث باسم العضو"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">الوقت والتاريخ</label>
                  <input
                    type="date"
                    name="timestamp"
                    value={entryLogFilters.timestamp}
                    onChange={(e) => {
                      setEntryLogFilters((prev) => ({
                        ...prev,
                        timestamp: e.target.value,
                      }));
                      setEntryLogPage(1);
                    }}
                    className="border px-3 py-2 rounded w-full"
                    placeholder="اختر تاريخ"
                  />
                </div>
              </div>

              <Button onClick={() => setIsEntryLogDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                إضافة سجل دخول
              </Button>

              {entryLogsLoading && <p>جاري تحميل سجلات الدخول...</p>}
              {entryLogsError && (
                <p className="text-red-500">خطأ: {entryLogsError}</p>
              )}

              {!entryLogsLoading && !entryLogsError && (
                <>
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-3 text-right text-sm font-medium">
                            RFID
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium">
                            النادي
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium">
                            العضو
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium">
                            الوقت والتاريخ
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-background">
                        {entryLogs?.map((log) => (
                          <tr
                            key={log.id}
                            className="hover:bg-gray-100 transition"
                          >
                            <td className="px-4 py-3 text-sm">
                              {log.rfid_code}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {log.club_details?.name || "غير متاح"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {log.member_name || "غير متاح"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {new Intl.DateTimeFormat("en-US", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              }).format(new Date(log.timestamp))}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full relative"
            dir="rtl"
          >
            <button
              onClick={() => {
                setIsAttendanceDialogOpen(false);
                setFoundSubscription(null);
                setNewAttendance({ identifier: "" });
              }}
              className="absolute top-3 left-3 text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
            <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">
              إضافة حضور
            </h3>
            <form onSubmit={handleAddAttendance} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم الهاتف أو كود RFID
                </label>
                <input
                  type="text"
                  name="identifier"
                  value={newAttendance.identifier}
                  onChange={handleAttendanceInputChange}
                  className="border border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-4 py-2 rounded-md w-full transition duration-150"
                  placeholder="أدخل رقم الهاتف أو كود RFID"
                  required
                  autoFocus
                />
              </div>

              {searchLoading && (
                <div className="text-center text-sm text-gray-600">
                  جاري البحث...
                </div>
              )}

              {foundSubscription && (
                <div className="border-t pt-5 mt-5 space-y-4">
                  <h4 className="font-semibold text-gray-700">
                    بيانات الاشتراك:
                  </h4>
                  <div className="flex items-start gap-4">
                    {foundSubscription.member_details?.photo ? (
                      <img
                        src={foundSubscription.member_details.photo}
                        alt="Member"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl">
                        <FaUser />
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-gray-800">
                        {foundSubscription.member_details?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        #{foundSubscription.member_details?.membership_number}
                      </p>
                      <p className="text-sm text-red-500">
                        <span className="font-medium text-gray-700">
                          المبلغ المتبقي:{" "}
                        </span>
                        {foundSubscription.remaining_amount}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">النادي: </span>
                      {foundSubscription.club_details?.name}
                    </p>
                    <p>
                      <span className="font-medium">الحالة: </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
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
                    <p>
                      <span className="font-medium">الهاتف: </span>
                      {foundSubscription.member_details?.phone}
                    </p>
                    <p>
                      <span className="font-medium">RFID: </span>
                      {foundSubscription.member_details?.rfid_code ||
                        "غير مسجل"}
                    </p>
                    <p>
                      <span className="font-medium">تاريخ البدء: </span>
                      {new Date(
                        foundSubscription.start_date
                      ).toLocaleDateString("ar-EG")}
                    </p>
                    <p>
                      <span className="font-medium">تاريخ الانتهاء: </span>
                      {new Date(foundSubscription.end_date).toLocaleDateString(
                        "ar-EG"
                      )}
                    </p>
                    <p className="col-span-2">
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
              )}

              {!searchLoading &&
                newAttendance.identifier &&
                !foundSubscription && (
                  <p className="text-red-500 text-sm">
                    {newAttendance.identifier.match(/[a-zA-Z]/)
                      ? "لا يوجد اشتراك مسجل بهذا الكود RFID"
                      : "لا يوجد اشتراك مسجل بهذا الرقم"}
                  </p>
                )}

              <button
                type="submit"
                className={`w-full py-2 rounded-md text-white font-semibold transition duration-150 ${
                  foundSubscription
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
                disabled={!foundSubscription}
              >
                تأكيد الحضور
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Entry Log Dialog */}
      {isEntryLogDialogOpen && canAddEntryLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
            <button
              onClick={() => setIsEntryLogDialogOpen(false)}
              className="absolute top-2 left-2 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-4">إضافة سجل دخول</h3>
            <EntryForm onSuccess={() => setIsEntryLogDialogOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;