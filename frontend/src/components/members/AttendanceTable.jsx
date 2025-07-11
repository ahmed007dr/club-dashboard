import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAttendances } from "@/redux/slices/AttendanceSlice";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaCalendarAlt, FaBoxOpen, FaExclamation } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const AttendanceTable = ({ selectedMember, selectedSubscriptionAttendance }) => {
  const dispatch = useDispatch();
  const { data: attendances, loading: attendanceLoading, error: attendanceError, count: attendanceCount } = useSelector((state) => state.attendance);
  const [attendancePage, setAttendancePage] = useState(1);
  const [showAttendance, setShowAttendance] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterSubscriptionType, setFilterSubscriptionType] = useState("");
  const itemsPerPage = 20;

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return dateString ? new Date(dateString).toLocaleDateString("ar-EG", options) : "غير متوفر";
  };

  const formatTime = (timeString) => {
    return timeString ? new Date(`1970-01-01T${timeString}`).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) : "غير متوفر";
  };

  const handleFilter = () => {
    dispatch(fetchAttendances({ 
      page: 1, 
      pageSize: itemsPerPage, 
      member_name: selectedMember.name,
      rfid_code: selectedMember.rfid_code,
      subscription: selectedSubscriptionAttendance,
      attendance_date: filterDate,
      subscription_type: filterSubscriptionType
    }));
    setAttendancePage(1);
  };

  const paginateAttendance = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= Math.ceil((attendanceCount || 0) / itemsPerPage)) {
      setAttendancePage(pageNumber);
      dispatch(fetchAttendances({ 
        page: pageNumber, 
        pageSize: itemsPerPage, 
        member_name: selectedMember.name,
        rfid_code: selectedMember.rfid_code,
        subscription: selectedSubscriptionAttendance,
        attendance_date: filterDate,
        subscription_type: filterSubscriptionType
      }));
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <FaCalendarAlt className="text-blue-600" />
          سجل الحضور
        </CardTitle>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => {
              setShowAttendance(!showAttendance);
              if (!showAttendance) {
                dispatch(fetchAttendances({ 
                  page: 1, 
                  pageSize: itemsPerPage, 
                  member_name: selectedMember.name,
                  rfid_code: selectedMember.rfid_code,
                  subscription: selectedSubscriptionAttendance 
                }));
              }
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {showAttendance ? "إخفاء الحضور" : "إظهار الحضور"}
          </Button>
          {showAttendance && (
            <div className="flex gap-2">
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="text-right"
              />
              <Input
                type="text"
                value={filterSubscriptionType}
                onChange={(e) => setFilterSubscriptionType(e.target.value)}
                placeholder="نوع الاشتراك"
                className="text-right"
              />
              <Button onClick={handleFilter} className="bg-blue-600 hover:bg-blue-700">
                تصفية
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showAttendance && (
          <>
            {attendanceLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
              </div>
            ) : attendanceError ? (
              <div className="bg-red-50 p-4 rounded-lg text-red-600 flex items-center gap-2">
                <FaExclamation />
                خطأ: {attendanceError}
              </div>
            ) : attendances?.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          نوع الاشتراك
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          تاريخ الحضور
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ساعة الحضور
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          اسم الكابتن
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendances.slice((attendancePage - 1) * itemsPerPage, attendancePage * itemsPerPage).map((attendance) => (
                        <tr key={attendance.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {attendance.subscription_details?.type_details?.name || "غير متوفر"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(attendance.attendance_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatTime(attendance.entry_time)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {attendance.subscription_details?.coach_details?.username || "غير متوفر"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {Math.ceil((attendanceCount || 0) / itemsPerPage) > 1 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                    <div className="text-sm text-gray-600">
                      عرض {(attendancePage - 1) * itemsPerPage + 1} إلى{" "}
                      {Math.min(attendancePage * itemsPerPage, attendanceCount)} من {attendanceCount}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => paginateAttendance(attendancePage - 1)}
                        disabled={attendancePage === 1}
                        variant="outline"
                      >
                        السابق
                      </Button>
                      {Array.from({ length: Math.ceil((attendanceCount || 0) / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          onClick={() => paginateAttendance(page)}
                          variant={attendancePage === page ? "default" : "outline"}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        onClick={() => paginateAttendance(attendancePage + 1)}
                        disabled={attendancePage === Math.ceil((attendanceCount || 0) / itemsPerPage)}
                        variant="outline"
                      >
                        التالي
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center py-6">
                <FaBoxOpen className="text-gray-300 text-6xl mb-4" />
                <p className="text-gray-500">لم يتم العثور على سجلات حضور لهذا العضو</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceTable;