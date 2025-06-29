import React, { useState } from 'react';
import { FiUsers, FiEye } from 'react-icons/fi';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import SubscriptionReportTable from './SubscriptionReportTable';
import ErrorModal from '../common/ErrorModal';
import SubscriptionReportSummary from './SubscriptionReportSummary';
import { fetchSubscriptionReport } from '../../config/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const MemberSubscriptionReport = () => {
  const [days, setDays] = useState(7);
  const [inactiveDays, setInactiveDays] = useState(7);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const handlePreviewReport = async () => {
    setLoading(true);
    setError('');
    setIsErrorModalOpen(false);
    try {
      console.log('Fetching report with params:', { days, inactive_days: inactiveDays });
      const data = await fetchSubscriptionReport({ days, inactive_days: inactiveDays });
      console.log('Received report data:', data);
      setReportData(data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.response?.data?.error || 'فشل في جلب بيانات التقرير');
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDaysChange = (e) => {
    const value = e.target.value;
    setDays(value === '' ? 7 : Math.max(1, parseInt(value, 10) || 7));
  };

  const handleInactiveDaysChange = (e) => {
    const value = e.target.value;
    setInactiveDays(value === '' ? 7 : Math.max(1, parseInt(value, 10) || 7));
  };

  return (
    <div className="max-w-5xl mx-auto p-6" dir="rtl">
      {isErrorModalOpen && (
        <ErrorModal
          error={error}
          onClose={() => setIsErrorModalOpen(false)}
        />
      )}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-6">
          <FiUsers className="text-blue-600 bg-blue-100 p-1.5 rounded-full w-8 h-8" />
          تقرير حالة اشتراكات الأعضاء
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-2">
              أيام الانتهاء القريب
            </Label>
            <Input
              id="days"
              type="number"
              value={days}
              onChange={handleDaysChange}
              className="w-full"
              disabled={loading}
              min="1"
            />
          </div>
          <div>
            <Label htmlFor="inactiveDays" className="block text-sm font-medium text-gray-700 mb-2">
              أيام عدم الحضور
            </Label>
            <Input
              id="inactiveDays"
              type="number"
              value={inactiveDays}
              onChange={handleInactiveDaysChange}
              className="w-full"
              disabled={loading}
              min="1"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handlePreviewReport}
            disabled={loading}
            className={cn("flex items-center gap-2 bg-blue-600 hover:bg-blue-700")}
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <FiEye className="w-5 h-5" />
            )}
            معاينة التقرير
          </Button>
        </div>
      </div>
      {reportData && (
        <>
          <SubscriptionReportSummary reportData={reportData} />
          <Tabs className="mt-6">
            <TabList className="flex border-b border-gray-200 mb-4">
              <Tab className="px-4 py-2 text-sm font-medium text-gray-600 cursor-pointer hover:text-blue-600 focus:outline-none focus:text-blue-600 border-b-2 border-transparent focus:border-blue-600">
                الأعضاء بدون اشتراكات
              </Tab>
              <Tab className="px-4 py-2 text-sm font-medium text-gray-600 cursor-pointer hover:text-blue-600 focus:outline-none focus:text-blue-600 border-b-2 border-transparent focus:border-blue-600">
                الاشتراكات المنتهية
              </Tab>
              <Tab className="px-4 py-2 text-sm font-medium text-gray-600 cursor-pointer hover:text-blue-600 focus:outline-none focus:text-blue-600 border-b-2 border-transparent focus:border-blue-600">
                الاشتراكات القريبة من الانتهاء
              </Tab>
              <Tab className="px-4 py-2 text-sm font-medium text-gray-600 cursor-pointer hover:text-blue-600 focus:outline-none focus:text-blue-600 border-b-2 border-transparent focus:border-blue-600">
                الأعضاء الغير مترددين
              </Tab>
            </TabList>
            <TabPanel>
              <SubscriptionReportTable
                title="الأعضاء بدون اشتراكات"
                dataKey="without_subscriptions"
                initialData={reportData.without_subscriptions}
                columns={[
                  { header: 'الاسم', accessor: 'name' },
                  { header: 'RFID', accessor: 'rfid_code' },
                  { header: 'الهاتف', accessor: 'phone' },
                ]}
                params={{ days, inactive_days: inactiveDays }}
              />
            </TabPanel>
            <TabPanel>
              <SubscriptionReportTable
                title="الأعضاء باشتراكات منتهية"
                dataKey="expired_subscriptions"
                initialData={reportData.expired_subscriptions}
                columns={[
                  { header: 'الاسم', accessor: 'name' },
                  { header: 'RFID', accessor: 'rfid_code' },
                  { header: 'الهاتف', accessor: 'phone' },
                ]}
                params={{ days, inactive_days: inactiveDays }}
              />
            </TabPanel>
            <TabPanel>
              <SubscriptionReportTable
                title="الأعضاء باشتراكات قاربة على الانتهاء"
                dataKey="near_expiry_subscriptions"
                initialData={reportData.near_expiry_subscriptions}
                columns={[
                  { header: 'الاسم', accessor: 'name' },
                  { header: 'RFID', accessor: 'rfid_code' },
                  { header: 'الهاتف', accessor: 'phone' },
                  { header: 'تاريخ الانتهاء', accessor: 'near_expiry_date' },
                ]}
                params={{ days, inactive_days: inactiveDays }}
              />
            </TabPanel>
            <TabPanel>
              <SubscriptionReportTable
                title="الأعضاء النشطين الغير مترددين"
                dataKey="inactive_members"
                initialData={reportData.inactive_members}
                columns={[
                  { header: 'الاسم', accessor: 'name' },
                  { header: 'RFID', accessor: 'rfid_code' },
                  { header: 'الهاتف', accessor: 'phone' },
                  { header: 'آخر حضور', accessor: 'last_attendance_date' },
                  { header: 'تاريخ الانتهاء', accessor: 'near_expiry_date' },
                ]}
                params={{ days, inactive_days: inactiveDays }}
              />
            </TabPanel>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default MemberSubscriptionReport;