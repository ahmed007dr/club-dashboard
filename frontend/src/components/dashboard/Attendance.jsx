import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addAttendance,
  deleteAttendance,
  fetchAttendances,
} from "@/redux/slices/AttendanceSlice";
import { addEntryLog, fetchEntryLogs } from "@/redux/slices/EntryLogsSlice";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/DropdownMenu";
import { MoreVertical } from "lucide-react";

const Attendance = () => {
  const dispatch = useDispatch();

  // Select attendance data from Redux store
  const {
    attendances,
    loading: attendanceLoading,
    error: attendanceError,
  } = useSelector((state) => state.attendance);

  // Select entry logs data from Redux store
  const {
    entryLogs,
    loading: entryLogsLoading,
    error: entryLogsError,
  } = useSelector((state) => state.entryLogs);

  // State for new attendance form
  const [newAttendance, setNewAttendance] = useState({
    subscription: "",
    attendance_date: "",
  });

  // State for new entry log form
  const [newEntryLog, setNewEntryLog] = useState({
    club: "",
    member: "",
  });

  // Dialog Open/Closed State
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [isEntryLogDialogOpen, setIsEntryLogDialogOpen] = useState(false);

  // Fetch attendances and entry logs on component mount
  useEffect(() => {
    dispatch(fetchAttendances());
    dispatch(fetchEntryLogs());
  }, [dispatch]);

  // Handle input changes for attendance form
  const handleAttendanceInputChange = (e) => {
    const { name, value } = e.target;
    setNewAttendance({ ...newAttendance, [name]: value });
  };

  // Handle input changes for entry log form
  const handleEntryLogInputChange = (e) => {
    const { name, value } = e.target;
    setNewEntryLog({ ...newEntryLog, [name]: value });
  };

  // Handle adding new attendance
  const handleAddAttendance = (e) => {
    e.preventDefault();
    if (!newAttendance.subscription || !newAttendance.attendance_date) {
      alert("الرجاء ملء جميع الحقول الخاصة بالحضور.");
      return;
    }
    dispatch(addAttendance(newAttendance));
    setNewAttendance({ subscription: "", attendance_date: "" }); // Clear form
    setIsAttendanceDialogOpen(false); // Close dialog
  };

  // Handle adding new entry log
  const handleAddEntryLog = (e) => {
    e.preventDefault();
    if (!newEntryLog.club || !newEntryLog.member) {
      alert("الرجاء ملء جميع الحقول الخاصة بسجل الدخول.");
      return;
    }
    dispatch(addEntryLog(newEntryLog));
    setNewEntryLog({ club: "", member: "" }); // Clear form
    setIsEntryLogDialogOpen(false); // Close dialog
  };

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
              {/* Add Attendance Dialog Trigger */}
              <Button variant="default" onClick={() => setIsAttendanceDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                إضافة حضور
              </Button>

              {/* Attendance Dialog */}
              {isAttendanceDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-50">
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
                    <button
                      onClick={() => setIsAttendanceDialogOpen(false)}
                      className="absolute top-2 left-2 text-gray-500 hover:text-gray-700"
                    >
                      &times;
                    </button>
                    <h3 className="text-lg font-semibold mb-4">إضافة حضور</h3>
                    <form onSubmit={handleAddAttendance} className="space-y-4">
                      <div>
                        <label className="block text-sm mb-1">
                          رقم الاشتراك
                        </label>
                        <input
                          type="text"
                          name="subscription"
                          value={newAttendance.subscription}
                          onChange={handleAttendanceInputChange}
                          className="border px-3 py-2 rounded w-full"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">
                          تاريخ الحضور
                        </label>
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
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3 text-right text-sm font-medium">
                          المعرف
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium">
                          الاشتراك
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
                      {attendances.map((attendance) => (
                        <tr
                          key={attendance.id}
                          className="hover:bg-gray-100 transition"
                        >
                          <td className="px-4 py-3 text-sm">{attendance.id}</td>
                          <td className="px-4 py-3 text-sm">
                            {attendance.subscription}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {attendance.attendance_date}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {attendance.member_details?.name || "غير متاح"}
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
              {/* Add Entry Log Dialog Trigger */}
              <Button onClick={() => setIsEntryLogDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                إضافة سجل دخول
              </Button>

              {/* Entry Log Dialog */}
              {isEntryLogDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-50">
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
                    <button
                      onClick={() => setIsEntryLogDialogOpen(false)}
                      className="absolute top-2 left-2 text-gray-500 hover:text-gray-700"
                    >
                      &times;
                    </button>
                    <h3 className="text-lg font-semibold mb-4">
                      إضافة سجل دخول
                    </h3>
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
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3 text-right text-sm font-medium">
                          المعرف
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
                      {entryLogs.map((log) => (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Attendance;
