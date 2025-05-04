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
import { addEntryLog, fetchEntryLogs } from "@/redux/slices/EntryLogsSlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import {
  fetchSubscriptions,
  
} from "../../redux/slices/subscriptionsSlice";

const Attendance = () => {
  const dispatch = useDispatch();

  // Select attendance and entry logs data from Redux store
  const {
    attendances,
    loading: attendanceLoading,
    error: attendanceError,
  } = useSelector((state) => state.attendance);
  
    const { subscriptions, status, error, updateStatus } = useSelector(
      (state) => state.subscriptions
    );
  const {
    entryLogs,
    loading: entryLogsLoading,
    error: entryLogsError,
  } = useSelector((state) => state.entryLogs);

  // Form states
  const [newAttendance, setNewAttendance] = useState({
    subscription: "",
    attendance_date: "",
  });
  const [newEntryLog, setNewEntryLog] = useState({
    club: "",
    member: "",
  });

  // Dialog states
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [isEntryLogDialogOpen, setIsEntryLogDialogOpen] = useState(false);

  // Filter states for Attendance
  const [attendanceFilters, setAttendanceFilters] = useState({
    subscription: "",
    attendance_date: "",
    member_name: "",
  });

  // Filter states for Entry Logs
  const [entryLogFilters, setEntryLogFilters] = useState({
    club: "",
    member: "",
    timestamp: "",
  });

  // Pagination states for Attendance
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendanceItemsPerPage] = useState(5);

  // Pagination states for Entry Logs
  const [entryLogPage, setEntryLogPage] = useState(1);
  const [entryLogItemsPerPage] = useState(5);

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchAttendances());
    dispatch(fetchEntryLogs());
  }, [dispatch]);

  // Handle input changes
  const handleAttendanceInputChange = (e) => {
    const { name, value } = e.target;
    setNewAttendance({ ...newAttendance, [name]: value });
  };

  const handleEntryLogInputChange = (e) => {
    const { name, value } = e.target;
    setNewEntryLog({ ...newEntryLog, [name]: value });
  };

  // Handle filter changes for Attendance
  const handleAttendanceFilterChange = (e) => {
    const { name, value } = e.target;
    setAttendanceFilters({ ...attendanceFilters, [name]: value });
    setAttendancePage(1); // Reset to first page on filter change
  };

  // Handle filter changes for Entry Logs
  const handleEntryLogFilterChange = (e) => {
    const { name, value } = e.target;
    setEntryLogFilters({ ...entryLogFilters, [name]: value });
    setEntryLogPage(1); // Reset to first page on filter change
  };

  // Filter and paginate Attendance data
  const filteredAttendances = attendances.filter((attendance) => {
    const subscriptionText =
      typeof attendance.subscription === "string"
        ? attendance.subscription
        : attendance.subscription?.name || "";
  
    const matchesSubscription = subscriptionText
      .toLowerCase()
      .includes(attendanceFilters.subscription.toLowerCase());
  
    const matchesDate = attendance.attendance_date.includes(
      attendanceFilters.attendance_date
    );
  
    const matchesMemberName =
      attendance.member_details?.name
        ?.toLowerCase()
        .includes(attendanceFilters.member_name.toLowerCase()) ||
      !attendanceFilters.member_name;
  
    return matchesSubscription && matchesDate && matchesMemberName;
  });
  

  const totalAttendancePages = Math.ceil(filteredAttendances.length / attendanceItemsPerPage);
  const paginatedAttendances = filteredAttendances.slice(
    (attendancePage - 1) * attendanceItemsPerPage,
    attendancePage * attendanceItemsPerPage
  );

  // Filter and paginate Entry Logs data
  const filteredEntryLogs = entryLogs.filter((log) => {
    const matchesClub = log.club_details?.name
      ?.toLowerCase()
      .includes(entryLogFilters.club.toLowerCase()) || !entryLogFilters.club;
    const matchesMember = log.member_details?.name
      ?.toLowerCase()
      .includes(entryLogFilters.member.toLowerCase()) || !entryLogFilters.member;
    const matchesTimestamp = log.timestamp.includes(entryLogFilters.timestamp);
    return matchesClub && matchesMember && matchesTimestamp;
  });

  const totalEntryLogPages = Math.ceil(filteredEntryLogs.length / entryLogItemsPerPage);
  const paginatedEntryLogs = filteredEntryLogs.slice(
    (entryLogPage - 1) * entryLogItemsPerPage,
    entryLogPage * entryLogItemsPerPage
  );

  // Handle adding new attendance
  const handleAddAttendance = (e) => {
    e.preventDefault();
    if (!newAttendance.subscription || !newAttendance.attendance_date) {
      alert("الرجاء ملء جميع الحقول الخاصة بالحضور.");
      return;
    }
    dispatch(addAttendance(newAttendance));
    setNewAttendance({ subscription: "", attendance_date: "" });
    setIsAttendanceDialogOpen(false);
  };

  // Handle adding new entry log
  const handleAddEntryLog = (e) => {
    e.preventDefault();
    if (!newEntryLog.club || !newEntryLog.member) {
      alert("الرجاء ملء جميع الحقول الخاصة بسجل الدخول.");
      return;
    }
    dispatch(addEntryLog(newEntryLog));
    setNewEntryLog({ club: "", member: "" });
    setIsEntryLogDialogOpen(false);
  };

  // Pagination navigation for Attendance
  const handleAttendancePageChange = (page) => {
    if (page >= 1 && page <= totalAttendancePages) {
      setAttendancePage(page);
    }
  };

  // Pagination navigation for Entry Logs
  const handleEntryLogPageChange = (page) => {
    if (page >= 1 && page <= totalEntryLogPages) {
      setEntryLogPage(page);
    }
  };

  useEffect(() => {
    dispatch(fetchSubscriptions());
  }, [dispatch]);

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold tracking-tight">إدارة الحضور و الدخول</h1>
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
              {/* Attendance Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1">رقم الاشتراك</label>
                  <input
                    type="text"
                    name="subscription"
                    value={attendanceFilters.subscription}
                    onChange={handleAttendanceFilterChange}
                    className="border px-3 py-2 rounded w-full"
                    placeholder="ابحث برقم الاشتراك"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">تاريخ الحضور</label>
                  <input
                    type="date"
                    name="attendance_date"
                    value={attendanceFilters.attendance_date}
                    onChange={handleAttendanceFilterChange}
                    className="border px-3 py-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">اسم العضو</label>
                  <input
                    type="text"
                    name="member_name"
                    value={attendanceFilters.member_name}
                    onChange={handleAttendanceFilterChange}
                    className="border px-3 py-2 rounded w-full"
                    placeholder="ابحث باسم العضو"
                  />
                </div>
              </div>

              {/* Add Attendance Button */}
              <Button
                variant="default"
                onClick={() => setIsAttendanceDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                إضافة حضور
              </Button>

              {/* Attendance Dialog */}
              {isAttendanceDialogOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
      <button
        onClick={() => setIsAttendanceDialogOpen(false)}
        className="absolute top-2 left-2 text-gray-500 hover:text-gray-700"
      >
        ×
      </button>
      <h3 className="text-lg font-semibold mb-4">إضافة حضور</h3>
      <form onSubmit={handleAddAttendance} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">اسم العضو</label>
          <select
            name="subscription"
            value={newAttendance.subscription}
            onChange={handleAttendanceInputChange}
            className="border px-3 py-2 rounded w-full"
            required
          >
            <option value="">اختر العضو</option>
            {subscriptions.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.member_name} (النادي: {sub.club_name})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">تاريخ الحضور</label>
          <input
            type="date"
            name="attendance_date"
            value={newAttendance.attendance_date}
            onChange={handleAttendanceInputChange}
            className="border px-3 py-2 rounded w-full"
            required
          />
        </div>
        <Button type="submit" className="w-full bg-blue-500">
          إضافة الحضور
        </Button>
      </form>
    </div>
  </div>
)}

              {/* Attendance Table */}
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
                          <th className="px-4 py-3 text-right text-sm font-medium">المعرف</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">الاشتراك</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">تاريخ الحضور</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">اسم العضو</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-background">
                        {paginatedAttendances.map((attendance) => (
                          <tr
                            key={attendance.id}
                            className="hover:bg-gray-100 transition"
                          >
                            <td className="px-4 py-3 text-sm">{attendance.id}</td>
                            <td className="px-4 py-3 text-sm">{attendance.subscription}</td>
                            <td className="px-4 py-3 text-sm">{attendance.attendance_date}</td>
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
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem
                                    onClick={() => dispatch(deleteAttendance(attendance.id))}
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

                  {/* Attendance Pagination */}
                  <div className="flex justify-between items-center mt-4">
                    <Button
                      onClick={() => handleAttendancePageChange(attendancePage - 1)}
                      disabled={attendancePage === 1}
                    >
                      السابق
                    </Button>
                    <span>
                      صفحة {attendancePage} من {totalAttendancePages}
                    </span>
                    <Button
                      onClick={() => handleAttendancePageChange(attendancePage + 1)}
                      disabled={attendancePage === totalAttendancePages}
                    >
                      التالي
                    </Button>
                  </div>
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
              {/* Entry Log Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1">اسم النادي</label>
                  <input
                    type="text"
                    name="club"
                    value={entryLogFilters.club}
                    onChange={handleEntryLogFilterChange}
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
                    onChange={handleEntryLogFilterChange}
                    className="border px-3 py-2 rounded w-full"
                    placeholder="ابحث باسم العضو"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">الوقت والتاريخ</label>
                  <input
                    type="text"
                    name="timestamp"
                    value={entryLogFilters.timestamp}
                    onChange={handleEntryLogFilterChange}
                    className="border px-3 py-2 rounded w-full"
                    placeholder="ابحث بالتاريخ"
                  />
                </div>
              </div>

              {/* Add Entry Log Button */}
              <Button onClick={() => setIsEntryLogDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                إضافة سجل دخول
              </Button>

              {/* Entry Log Dialog */}
              {isEntryLogDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
                    <button
                      onClick={() => setIsEntryLogDialogOpen(false)}
                      className="absolute top-2 left-2 text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                    <h3 className="text-lg font-semibold mb-4">إضافة سجل دخول</h3>
                    <form onSubmit={handleAddEntryLog} className="space-y-4">
                      <div>
                        <label className="block text-sm mb-1">رقم النادي</label>
                        <input
                          type="text"
                          name="club"
                          value={newEntryLog.club}
                          onChange={handleEntryLogInputChange}
                          className="border px-3 py-2 rounded w-full"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">رقم العضو</label>
                        <input
                          type="text"
                          name="member"
                          value={newEntryLog.member}
                          onChange={handleEntryLogInputChange}
                          className="border px-3 py-2 rounded w-full"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full bg-green-500">
                        إضافة سجل الدخول
                      </Button>
                    </form>
                  </div>
                </div>
              )}

              {/* Entry Logs Table */}
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
                          <th className="px-4 py-3 text-right text-sm font-medium">المعرف</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">النادي</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">العضو</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">الوقت والتاريخ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-background">
                        {paginatedEntryLogs.map((log) => (
                          <tr
                            key={log.id}
                            className="hover:bg-gray-100 transition"
                          >
                            <td className="px-4 py-3 text-sm">{log.id}</td>
                            <td className="px-4 py-3 text-sm">
                              {log.club_details?.name || "غير متاح"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {log.member_details?.name || "غير متاح"}
                            </td>
                            <td className="px-4 py-3 text-sm">{log.timestamp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Entry Logs Pagination */}
                  <div className="flex justify-between items-center mt-4">
                    <Button
                      onClick={() => handleEntryLogPageChange(entryLogPage - 1)}
                      disabled={entryLogPage === 1}
                    >
                      السابق
                    </Button>
                    <span>
                      صفحة {entryLogPage} من {totalEntryLogPages}
                    </span>
                    <Button
                      onClick={() => handleEntryLogPageChange(entryLogPage + 1)}
                      disabled={entryLogPage === totalEntryLogPages}
                    >
                      التالي
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Attendance;
