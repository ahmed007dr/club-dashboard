import React from 'react';
import { FiUsers } from 'react-icons/fi';
import { cn } from '../../lib/utils';

const SubscriptionReportSummary = ({ reportData }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3 mb-6">
        <FiUsers className="text-blue-600 bg-blue-100 p-1.5 rounded-full w-8 h-8" />
        ملخص التقرير
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className={cn("bg-blue-50 p-4 rounded-lg flex items-center gap-3")}>
          <FiUsers className="text-blue-600 w-6 h-6" />
          <div>
            <p className="text-sm text-gray-600">بدون اشتراكات</p>
            <p className="text-lg font-semibold text-gray-800">{reportData.without_subscriptions.count}</p>
          </div>
        </div>
        <div className={cn("bg-red-50 p-4 rounded-lg flex items-center gap-3")}>
          <FiUsers className="text-red-600 w-6 h-6" />
          <div>
            <p className="text-sm text-gray-600">اشتراكات منتهية</p>
            <p className="text-lg font-semibold text-gray-800">{reportData.expired_subscriptions.count}</p>
          </div>
        </div>
        <div className={cn("bg-yellow-50 p-4 rounded-lg flex items-center gap-3")}>
          <FiUsers className="text-yellow-600 w-6 h-6" />
          <div>
            <p className="text-sm text-gray-600">قارب على الانتهاء</p>
            <p className="text-lg font-semibold text-gray-800">{reportData.near_expiry_subscriptions.count}</p>
          </div>
        </div>
        <div className={cn("bg-orange-50 p-4 rounded-lg flex items-center gap-3")}>
          <FiUsers className="text-orange-600 w-6 h-6" />
          <div>
            <p className="text-sm text-gray-600">غير مترددين</p>
            <p className="text-lg font-semibold text-gray-800">{reportData.inactive_members.count}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionReportSummary;