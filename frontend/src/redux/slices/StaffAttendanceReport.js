import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import BASE_URL from '../../config/api';
import moment from 'moment';
import 'moment/locale/ar';

moment.locale('ar');
import StaffAttendanceReport from "./components/reports/StaffAttendanceReport";
function StaffAttendanceReport() {
  const { staffId } = useParams(); // Get staffId from URL
  const [reportData, setReportData] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM'));
  const [selectedStaff, setSelectedStaff] = useState(staffId || 'all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch staff list for dropdown
  useEffect(() => {
    const fetchStaffList = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BASE_URL}staff/api/staff-list/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStaffList(response.data);
      } catch (err) {
        setError('حدث خطأ أثناء جلب قائمة الموظفين.');
      }
    };
    fetchStaffList();
  }, []);

  // Fetch report data
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const url = selectedStaff === 'all'
          ? `${BASE_URL}staff/api/attendance-report/?month=${selectedMonth}`
          : `${BASE_URL}staff/api/attendance-report/${selectedStaff}/?month=${selectedMonth}`;
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReportData(response.data);
        setLoading(false);
      } catch (err) {
        setError('حدث خطأ أثناء جلب تقرير الحضور.');
        setLoading(false);
      }
    };
    fetchReport();
  }, [selectedMonth, selectedStaff]);

  // Handle month navigation
  const handleNextMonth = () => {
    const nextMonth = moment(selectedMonth, 'YYYY-MM').add(1, 'month').format('YYYY-MM');
    setSelectedMonth(nextMonth);
  };

  const handlePreviousMonth = () => {
    const prevMonth = moment(selectedMonth, 'YYYY-MM').subtract(1, 'month').format('YYYY-MM');
    setSelectedMonth(prevMonth);
  };

  // Handle staff selection
  const handleStaffChange = (e) => {
    setSelectedStaff(e.target.value);
  };

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 text-center">
        تقرير حضور الموظفين
      </h1>

      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-600">الشهر:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
          />
          <button
            onClick={handlePreviousMonth}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 transition-colors"
          >
            الشهر السابق
          </button>
          <button
            onClick={handleNextMonth}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 transition-colors"
          >
            الشهر التالي
          </button>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-600">الموظف:</label>
          <select
            value={selectedStaff}
            onChange={handleStaffChange}
            className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
          >
            <option value="all">الكل</option>
            {staffList.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.username}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="p-6 bg-blue-50 text-blue-700 rounded-xl shadow-sm mb-6 flex items-center justify-center animate-pulse">
          <svg className="animate-spin mr-2 h-5 w-5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          جاري التحميل...
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-50 text-red-700 rounded-xl shadow-sm mb-6 flex items-center justify-between">
          <span className="font-medium">{error}</span>
          <button
            onClick={() => fetchReport()}
            className="flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm transition-colors"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 4a8 8 0 00-8 8h2a6 6 0 016-6v2l4-4-4-4v2zm0 16a8 8 0 008-8h-2a6 6 0 01-6 6v-2l-4 4 4 4v-2z" />
            </svg>
            إعادة المحاولة
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm mb-6">
          <table className="min-w-full divide-y divide-gray-100 bg-white text-right">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">اسم الموظف</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">كود RFID</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ساعات العمل</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">أيام العمل</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">الشهر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {reportData.length > 0 ? (
                reportData.map((staff) =>
                  staff.monthly_data.map((entry) => (
                    <tr key={`${staff.staff_id}-${entry.month}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm">{staff.staff_name}</td>
                      <td className="px-6 py-4 text-sm">{staff.rfid_code || '—'}</td>
                      <td className="px-6 py-4 text-sm">{entry.total_hours}</td>
                      <td className="px-6 py-4 text-sm">{entry.attendance_days}</td>
                      <td className="px-6 py-4 text-sm">
                        {moment(entry.month, 'YYYY-MM').format('MMMM YYYY')}
                      </td>
                    </tr>
                  ))
                )
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-6 text-center text-gray-500">
                    لا توجد بيانات حضور متاحة لهذا الشهر
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default StaffAttendanceReport;