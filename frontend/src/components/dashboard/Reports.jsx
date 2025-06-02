import React from 'react';
import { FaCheckCircle, FaClipboardList, FaCalendarAlt, FaClock, FaCreditCard, FaUsers, FaChartPie, FaFileAlt, FaFilePdf } from 'react-icons/fa';
import DailyReportButton from './DailyReportButton';



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

    
    </div>
  );
}