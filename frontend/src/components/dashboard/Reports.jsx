import React from 'react';
import { FaCheckCircle, FaClipboardList, FaCalendarAlt, FaClock, FaCreditCard, FaUsers, FaChartPie, FaFileAlt, FaFilePdf } from 'react-icons/fa';
import DailyReportButton from './DailyReportButton';

const reports = [
  { text: 'تقرير إيصالات القبض', icon: <FaCheckCircle />, color: 'text-red-500' },
  { text: 'تقرير المناوبات', icon: <FaClipboardList />, color: 'text-yellow-500' },
  { text: 'تقرير الفترات', icon: <FaCalendarAlt />, color: 'text-blue-500' },
  { text: 'تقرير مرات الدخول', icon: <FaClock />, color: 'text-blue-500' },
  { text: 'الدعوات', icon: <FaCreditCard />, color: 'text-orange-500' },
  { text: 'العملاء المحتملون', icon: <FaUsers />, color: 'text-teal-500' },
];

const summaryReports = [
  { text: 'تقرير اجمالى الاشتراكات', icon: <FaChartPie />, color: 'text-cyan-500' },
  { text: 'تقرير اجمالى التذاكر', icon: <FaFileAlt />, color: 'text-red-500' },
  { text: 'تقرير اجمالى الايصالات', icon: <FaFileAlt />, color: 'text-red-500' },
];

export default function ReportsPage() {
  return (
    <div className="p-4 max-w-3xl mx-auto bg-white min-h-screen" dir="rtl">
      <h1 className="text-2xl font-bold mb-6 text-right">التقارير</h1>

      {/* تقرير يومي للموظف */}
      <div className="mb-8">
        <div className="flex flex-row-reverse items-center gap-2 mb-4">
          <FaFilePdf className="text-red-500 text-lg" />
          <h2 className="text-xl font-semibold text-right">تقرير يومي للموظف</h2>
        </div>
        <DailyReportButton />
      </div>

      {/* التقارير الأخرى */}
      {reports.map((report, idx) => (
        <div key={idx} className="flex flex-row-reverse justify-between items-center py-3">
          <div className="flex flex-row-reverse items-center gap-2">
            <span className={`${report.color} text-lg`}>{report.icon}</span>
            <span className="text-sky-600 font-medium">{report.text}</span>
          </div>
          <span className="text-green-600 font-bold">##</span>
        </div>
      ))}

      <div className="text-right mt-6 mb-2">
        <span className="bg-blue-400 text-white px-3 py-1 rounded-full text-sm">التقارير الاجمالية</span>
      </div>

      {summaryReports.map((report, idx) => (
        <div key={idx} className="flex flex-row-reverse justify-between items-center py-3">
          <div className="flex flex-row-reverse items-center gap-2">
            <span className={`${report.color} text-lg`}>{report.icon}</span>
            <span className="text-sky-600 font-medium">{report.text}</span>
          </div>
          <span className="text-green-600 font-bold">##</span>
        </div>
      ))}
    </div>
  );
}