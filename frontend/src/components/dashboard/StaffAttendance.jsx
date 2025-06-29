import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { analyzeAttendance, getStaffAttendanceReport, clearError } from '@/redux/slices/AttendanceSlice';
import { User, BarChart, AlertTriangle, Calendar, Clock, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught in AttendanceAnalysis:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 dark:bg-gray-900">
          <AlertTriangle className="text-red-600 w-8 h-8 mb-4" />
          <p className="text-red-600 font-semibold mb-4">حدث خطأ أثناء تحميل التحليل</p>
          <Button onClick={() => window.location.reload()} className="bg-blue-700 text-white hover:bg-blue-800">
            إعادة تحميل
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AttendanceAnalysis = () => {
  const { staffId } = useParams();
  const dispatch = useDispatch();
  const [yearFilter, setYearFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');

  // الحماية من state غير معرف
  const attendanceState = useSelector((state) => state.attendance || {});
  const { analysisData, reportData, loading, error, errorDetails } = attendanceState;

  // جلب البيانات وتنظيف الأخطاء
  useEffect(() => {
    if (staffId) {
      dispatch(clearError());
      dispatch(analyzeAttendance(staffId));
      dispatch(getStaffAttendanceReport(staffId));
    }
  }, [dispatch, staffId]);

  const staffData = reportData?.[0];

  // قائمة الشهور للفلترة
  const availableMonths = useMemo(() => {
    if (!staffData?.monthly_data) return [];
    return [...new Set(
      staffData.monthly_data
        .map((data) => {
          try {
            return new Date(data.month).toLocaleString('ar-EG', { month: 'long', year: 'numeric' });
          } catch {
            return null;
          }
        })
        .filter(Boolean)
    )];
  }, [staffData]);

  // تصفية البيانات
  const filteredMonthlyData = useMemo(() => {
    if (!staffData?.monthly_data) return [];
    return staffData.monthly_data.filter((data) => {
      try {
        const date = new Date(data.month);
        const year = date.getFullYear().toString();
        const month = date.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });
        return (!yearFilter || year.includes(yearFilter)) && (monthFilter === 'all' || month === monthFilter);
      } catch {
        return false;
      }
    });
  }, [staffData, yearFilter, monthFilter]);

  // حالة التحميل
  if (loading && !staffData && !analysisData) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin animate-pulse w-8 h-8 text-blue-700" />
        <span className="mr-4 text-blue-700 font-semibold">جارٍ تحميل البيانات...</span>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="max-w-6xl mx-auto p-6 space-y-8 bg-gray-50 dark:bg-gray-900" dir="rtl">
        {/* قسم التقرير الشهري */}
        <Card className="shadow-sm border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-right text-2xl flex items-center gap-3 text-gray-800 dark:text-white">
              <User className="text-blue-700 bg-blue-100 p-1.5 rounded-full w-8 h-8" />
              تقرير الموظف الشهري
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {staffData ? (
              <>
                {/* الفلاتر */}
                <div className="flex items-center justify-end gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-gray-500 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="تصفية حسب السنة (مثل 2025)"
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="w-[180px] text-right bg-white dark:bg-gray-800 text-gray-700 dark:text-white border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="text-gray-500 w-5 h-5" />
                    <Select value={monthFilter} onValueChange={setMonthFilter}>
                      <SelectTrigger className="w-[180px] text-right bg-white dark:bg-gray-800 text-gray-700 dark:text-white border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="اختر الشهر" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">كل الشهور</SelectItem>
                        {availableMonths.map((month, index) => (
                          <SelectItem key={index} value={month}>{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* جدول البيانات */}
                {filteredMonthlyData.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-right bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-100 dark:bg-gray-900">
                        <tr>
                          <th className="p-4 font-semibold text-gray-700 dark:text-gray-300 w-1/5">
                            <div className="flex items-center gap-2 justify-end">
                              <Calendar className="w-5 h-5 text-blue-500" />
                              الشهر
                            </div>
                          </th>
                          <th className="p-4 font-semibold text-gray-700 dark:text-gray-300 w-1/5">
                            <div className="flex items-center gap-2 justify-end">
                              <Calendar className="w-5 h-5 text-blue-500" />
                              أيام الحضور
                            </div>
                          </th>
                          <th className="p-4 font-semibold text-gray-700 dark:text-gray-300 w-1/5">
                            <div className="flex items-center gap-2 justify-end">
                              <Clock className="w-5 h-5 text-green-600" />
                              إجمالي الساعات
                            </div>
                          </th>
                          <th className="p-4 font-semibold text-gray-700 dark:text-gray-300 w-1/5">
                            <div className="flex items-center gap-2 justify-end">
                              <TrendingUp className="w-5 h-5 text-gray-500" />
                              التغيير في الساعات
                            </div>
                          </th>
                          <th className="p-4 font-semibold text-gray-700 dark:text-gray-300 w-1/5">
                            <div className="flex items-center gap-2 justify-end">
                              <TrendingUp className="w-5 h-5 text-gray-500" />
                              نسبة التغيير
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredMonthlyData.map((data, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">
                            <td className="p-4 text-gray-800 dark:text-white min-w-[120px] truncate">{data.month || 'غير محدد'}</td>
                            <td className="p-4 text-gray-800 dark:text-white min-w-[120px] truncate">
                              {data.attendance_days ?? 'غير محسوب'} يوم
                            </td>
                            <td className="p-4 text-gray-800 dark:text-white min-w-[120px] truncate">
                              {data.total_hours ? data.total_hours.toFixed(2) : 'غير محسوب'} ساعة
                            </td>
                            <td className="p-4 min-w-[120px] truncate">
                              <div className="flex items-center gap-2 justify-end">
                                {data.hours_change > 0 ? (
                                  <TrendingUp className="text-green-600 w-5 h-5" />
                                ) : data.hours_change < 0 ? (
                                  <TrendingDown className="text-red-600 w-5 h-5" />
                                ) : (
                                  <Clock className="text-gray-500 w-5 h-5" />
                                )}
                                <span className={data.hours_change > 0 ? 'text-green-600' : data.hours_change < 0 ? 'text-red-600' : 'text-gray-800 dark:text-white'}>
                                  {data.hours_change ? `${data.hours_change > 0 ? '+' : ''}${data.hours_change.toFixed(2)} ساعة` : 'غير محسوب'}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 min-w-[120px] truncate">
                              <div className="flex items-center gap-2 justify-end">
                                {data.percentage_change > 0 ? (
                                  <TrendingUp className="text-green-600 w-5 h-5" />
                                ) : data.percentage_change < 0 ? (
                                  <TrendingDown className="text-red-600 w-5 h-5" />
                                ) : (
                                  <Clock className="text-gray-500 w-5 h-5" />
                                )}
                                <span className={data.percentage_change > 0 ? 'text-green-600' : data.percentage_change < 0 ? 'text-red-600' : 'text-gray-800 dark:text-white'}>
                                  {data.percentage_change ? `${data.percentage_change > 0 ? '+' : ''}${data.percentage_change}%` : 'غير محسوب'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    لا توجد بيانات متاحة للشهور المحددة
                  </div>
                )}

                {/* بيانات الموظف */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium mb-3 text-right text-gray-800 dark:text-white">بيانات الموظف</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <User className="text-gray-500 w-5 h-5" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">الاسم</p>
                        <p className="font-semibold text-gray-800 dark:text-white">{staffData ? `${staffData.first_name} ${staffData.last_name}` : 'غير متوفر'}</p>                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="text-gray-500 w-5 h-5" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">رمز RFID</p>
                        <p className="font-semibold text-gray-800 dark:text-white">{staffData?.rfid_code || 'غير مسجل'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                لا توجد بيانات متاحة للموظف
              </div>
            )}
          </CardContent>
        </Card>

        {/* قسم تحليل الحضور */}
        <Card className="shadow-sm border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-right text-2xl flex items-center gap-3 text-gray-800 dark:text-white">
              <BarChart className="text-blue-700 bg-blue-100 p-1.5 rounded-full w-8 h-8" />
              تحليل الحضور
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? (
              <div className="flex flex-col items-center justify-center py-8 bg-red-50 dark:bg-red-900 rounded-lg">
                <AlertTriangle className="text-red-600 w-8 h-8 mb-4" />
                <p className="text-red-600 font-semibold mb-4">{errorDetails?.error || error || 'فشل تحميل بيانات التحليل'}</p>
                <Button
                  onClick={() => {
                    dispatch(clearError());
                    dispatch(analyzeAttendance(staffId));
                  }}
                  className="bg-blue-700 text-white hover:bg-blue-800"
                >
                  إعادة المحاولة
                </Button>
              </div>
            ) : analysisData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'الحالة', value: analysisData.status?.replace(/_/g, ' ') || 'غير محدد', icon: <User className="text-blue-700 w-6 h-6" /> },
                  { label: 'التأخير بالدقائق', value: analysisData.late_by_minutes ?? 'غير محسوب', icon: <Clock className="text-red-600 w-6 h-6" /> },
                  { label: 'المغادرة المبكرة بالدقائق', value: analysisData.left_early_by_minutes ?? 'غير محسوب', icon: <Clock className="text-red-600 w-6 h-6" /> },
                  { label: 'الساعات الفعلية', value: analysisData.actual_hours ? `${analysisData.actual_hours} ساعة` : 'غير محسوب', icon: <Clock className="text-green-600 w-6 h-6" /> },
                  { label: 'الساعات المتوقعة', value: analysisData.expected_hours ? `${analysisData.expected_hours} ساعة` : 'غير محسوب', icon: <Clock className="text-blue-700 w-6 h-6" /> },
                ].map((item, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg flex items-center gap-3 transition-all duration-200 hover:shadow-md">
                    {item.icon}
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{item.label}</p>
                      <p className="text-lg font-semibold text-gray-800 dark:text-white">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center items-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Loader2 className="animate-spin animate-pulse w-8 h-8 text-blue-700" />
                <span className="mr-4 text-gray-500 dark:text-gray-400">جارٍ تحميل بيانات التحليل...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
};

export default AttendanceAnalysis;