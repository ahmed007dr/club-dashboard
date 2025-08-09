import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ar } from 'date-fns/locale';
import { useSelector } from 'react-redux';  // Assuming Redux for state

const ReportFilters = ({ userRole, employeeId, setEmployeeId, startDate, setStartDate, endDate, setEndDate, employees, employeeLoading, loading, previewLoading }) => {
  const cashJournal = useSelector((state) => state.finance.activeCashJournal);  // From Redux

  // Auto-set dates from active journal if employee
  React.useEffect(() => {
    if (userRole !== 'admin' && userRole !== 'owner' && cashJournal) {
      setStartDate(new Date(cashJournal.start_time));
      setEndDate(new Date(cashJournal.end_time || new Date()));
      setEmployeeId(cashJournal.user.id.toString());
    }
  }, [cashJournal, userRole]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <div>
        <label htmlFor="employeeSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          اختيار الموظف
        </label>
        <div className="relative">
          <Select
            value={employeeId}
            onValueChange={setEmployeeId}
            disabled={employeeLoading || loading || previewLoading || (userRole !== 'admin' && userRole !== 'owner')}  // Disable for employees
          >
            <SelectTrigger className="w-full text-right bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md py-2 text-sm">
              <SelectValue placeholder={employeeLoading ? 'جارٍ تحميل الموظفين...' : 'اختر موظفًا'} />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(employees) && employees.length > 0 ? (
                employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {employee.first_name || employee.last_name
                      ? `${employee.first_name} ${employee.last_name}`
                      : employee.username} (RFID: {employee.rfid_code || 'غير متوفر'})
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  لا يوجد موظفين متاحين
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
      </div>
      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          تاريخ البداية
        </label>
        <div className="relative">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            dateFormat="d MMMM yyyy, h:mm aa"
            locale={ar}
            className="w-full text-right bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-600"
            disabled={loading || previewLoading || (userRole !== 'admin' && userRole !== 'owner')}  // Disable for employees
          />
        </div>
      </div>
      <div>
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          تاريخ النهاية
        </label>
        <div className="relative">
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            dateFormat="d MMMM yyyy, h:mm aa"
            locale={ar}
            className="w-full text-right bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-600"
            disabled={loading || previewLoading || (userRole !== 'admin' && userRole !== 'owner')}  // Disable for employees
          />
        </div>
      </div>
    </div>
  );
};
export default ReportFilters;