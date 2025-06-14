
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiBarChart2, FiFilter, FiDownload, FiAlertTriangle, FiCalendar, FiPrinter } from 'react-icons/fi';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import moment from 'moment';
import 'moment/locale/ar';
import {
  fetchStockItems, createStockItem, updateStockItem, fetchStockInventory, performStockInventory,
  fetchStockProfit, fetchStockSalesAnalysis, createSchedule, fetchSchedules
} from '../../redux/slices/stockSlice';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);
moment.locale('ar');

const StockDashboard = () => {
  const dispatch = useDispatch();
  const { stockItems, inventory, profit, salesAnalysis, schedules, loading, error } = useSelector((state) => state.stock);
  const [filters, setFilters] = useState({
    itemName: '',
    startDate: '',
    endDate: '',
    periodType: 'monthly',
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newItem, setNewItem] = useState({ name: '', description: '', unit: '', initial_quantity: 0, is_sellable: true });
  const [inventoryCheck, setInventoryCheck] = useState([]);
  const [schedule, setSchedule] = useState({ title: '', start: '', end: '', type: 'inventory_check' });
  const [alerts, setAlerts] = useState([]);

  // Fetch data on mount and when filters change
  useEffect(() => {
    dispatch(fetchStockItems({ name: filters.itemName }));
    dispatch(fetchStockInventory());
    dispatch(fetchStockProfit({ start_date: filters.startDate, end_date: filters.endDate }));
    dispatch(fetchStockSalesAnalysis({ period_type: filters.periodType, start_date: filters.startDate, end_date: filters.endDate }));
    dispatch(fetchSchedules());
  }, [dispatch, filters]);

  // Generate alerts based on inventory and sales
  useEffect(() => {
    const newAlerts = [];
    inventory.forEach(item => {
      if (item.current_quantity < 10) {
        newAlerts.push(`تحذير: الكمية منخفضة لـ ${item.name} (${item.current_quantity} ${item.unit})`);
      }
    });
    salesAnalysis.forEach(item => {
      if (item.sales_status === 'لا مبيعات' || item.sales_status.includes('ضعيف')) {
        newAlerts.push(`تنبيه: مبيعات ${item.stock_item_name} ${item.sales_status}`);
      }
    });
    setAlerts(newAlerts);
  }, [inventory, salesAnalysis]);

  // Handle filter changes
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Handle period type change
  const handlePeriodChange = useCallback((value) => {
    setFilters((prev) => ({ ...prev, periodType: value }));
  }, []);

  // Export data to Excel
  const exportToExcel = useCallback(() => {
    let data = [];
    let sheetName = '';
    if (activeTab === 'inventory') {
      sheetName = 'الجرد';
      data = inventory.map(item => ({
        'اسم العنصر': item.name,
        'الوحدة': item.unit,
        'الكمية الحالية': item.current_quantity,
        'إجمالي المضاف': item.total_added,
        'إجمالي المستهلك': item.total_consumed,
      }));
    } else if (activeTab === 'profit') {
      sheetName = 'الأرباح';
      data = profit.map(item => ({
        'اسم العنصر': item.stock_item_name,
        'إجمالي الشراء': item.total_purchase_quantity,
        'تكلفة الشراء': item.total_purchase_cost,
        'إجمالي المبيعات': item.total_sale_quantity,
        'إيرادات المبيعات': item.total_sale_revenue,
        'الربح': item.profit,
      }));
    } else if (activeTab === 'sales') {
      sheetName = 'المبيعات';
      data = salesAnalysis.flatMap(item => item.sales_by_period.map(period => ({
        'اسم العنصر': item.stock_item_name,
        'الفترة': period.period,
        'الكمية المباعة': period.total_quantity,
        'الإيرادات': period.total_revenue,
      })));
    } else if (activeTab === 'inventory_check') {
      sheetName = 'نتائج الجرد';
      data = inventoryCheck.map(item => ({
        'اسم العنصر': stockItems.find(i => i.id === item.stock_item_id)?.name || 'غير معروف',
        'الكمية المتوقعة': item.expected_quantity,
        'الكمية الفعلية': item.actual_quantity,
        'الفرق': item.difference,
      }));
    }

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Array(data[0] ? Object.keys(data[0]).length : 5).fill({ wch: 20 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `تقرير_${sheetName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [activeTab, inventory, profit, salesAnalysis, inventoryCheck, stockItems]);

  // Handle new stock item creation
  const handleCreateItem = useCallback(() => {
    dispatch(createStockItem(newItem)).then(() => {
      setNewItem({ name: '', description: '', unit: '', initial_quantity: 0, is_sellable: true });
    });
  }, [dispatch, newItem]);

  // Handle inventory check submission
  const handleInventoryCheck = useCallback(() => {
    dispatch(performStockInventory({ inventory: inventoryCheck })).then((response) => {
      if (response.payload.discrepancies) {
        setInventoryCheck(response.payload.discrepancies);
      }
    });
  }, [dispatch, inventoryCheck]);

  // Handle schedule creation
  const handleCreateSchedule = useCallback(() => {
    dispatch(createSchedule(schedule)).then(() => {
      setSchedule({ title: '', start: '', end: '', type: 'inventory_check' });
    });
  }, [dispatch, schedule]);

  // Generate PDF report (call backend endpoint)
  const generatePDF = useCallback(() => {
    const params = {
      stock_item_id: filters.itemName ? stockItems.find(i => i.name.includes(filters.itemName))?.id : undefined,
      start_date: filters.startDate,
      end_date: filters.endDate,
    };
    // Assuming a new endpoint `/api/stock/generate_inventory_pdf/` is added to the backend
    window.open(`/api/stock/generate_inventory_pdf/?${new URLSearchParams(params).toString()}`, '_blank');
  }, [filters, stockItems]);

  // Chart data for dashboard
  const inventoryChartData = {
    labels: inventory.map(item => item.name),
    datasets: [{
      label: 'الكمية الحالية',
      data: inventory.map(item => item.current_quantity),
      backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
    }],
  };

  const salesChartData = {
    labels: salesAnalysis.flatMap(item => item.sales_by_period.map(p => p.period)),
    datasets: [{
      label: 'الإيرادات',
      data: salesAnalysis.flatMap(item => item.sales_by_period.map(p => p.total_revenue)),
      backgroundColor: '#3b82f6',
    }],
  };

  // Calendar events
  const calendarEvents = schedules.map(s => ({
    title: s.title,
    start: new Date(s.start),
    end: new Date(s.end),
    type: s.type,
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans" dir="rtl">
      <h1 className="text-3xl font-bold text-right flex items-center gap-3">
        <FiBarChart2 className="text-blue-600 w-8 h-8" />
        لوحة تحكم المخزون
      </h1>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="bg-red-50">
          <CardContent className="flex flex-col gap-2 pt-4">
            {alerts.map((alert, idx) => (
              <div key={idx} className="flex items-center gap-3 text-red-600">
                <FiAlertTriangle className="w-6 h-6" />
                <p>{alert}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">فلاتر</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Input
            name="itemName"
            placeholder="ابحث باسم العنصر"
            value={filters.itemName}
            onChange={handleFilterChange}
            className="max-w-xs"
          />
          <Input
            name="startDate"
            type="date"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="max-w-xs"
          />
          <Input
            name="endDate"
            type="date"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="max-w-xs"
          />
          <Select onValueChange={handlePeriodChange} value={filters.periodType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="نوع الفترة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">يومي</SelectItem>
              <SelectItem value="weekly">أسبوعي</SelectItem>
              <SelectItem value="monthly">شهري</SelectItem>
              <SelectItem value="yearly">سنوي</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportToExcel} className="bg-blue-600 hover:bg-blue-700">
            <FiDownload className="mr-2" /> تصدير Excel
          </Button>
          <Button onClick={generatePDF} className="bg-green-600 hover:bg-green-700">
            <FiPrinter className="mr-2" /> طباعة PDF
          </Button>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white rounded-lg shadow-sm">
        <TabsList className="bg-gray-100 rounded-t-lg p-2 flex justify-end">
          <TabsTrigger value="dashboard">لوحة التحكم</TabsTrigger>
          <TabsTrigger value="items">عناصر المخزون</TabsTrigger>
          <TabsTrigger value="inventory">الجرد</TabsTrigger>
          <TabsTrigger value="inventory_check">فحص الجرد</TabsTrigger>
          <TabsTrigger value="profit">الأرباح</TabsTrigger>
          <TabsTrigger value="sales">المبيعات</TabsTrigger>
          <TabsTrigger value="schedules">المواعيد والدوريات</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">توزيع المخزون</CardTitle>
              </CardHeader>
              <CardContent>
                <Pie data={inventoryChartData} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-right">إيرادات المبيعات</CardTitle>
              </CardHeader>
              <CardContent>
                <Bar data={salesChartData} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-right">إحصائيات سريعة</CardTitle>
              </CardHeader>
              <CardContent>
                <p>إجمالي العناصر: {stockItems.length}</p>
                <p>إجمالي الأرباح: {profit.reduce((sum, item) => sum + item.profit, 0).toFixed(2)}</p>
                <p>إجمالي المبيعات: {salesAnalysis.reduce((sum, item) => sum + item.total_quantity_sold, 0)}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Stock Items Tab */}
        <TabsContent value="items" className="p-4">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-right">عناصر المخزون</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">إضافة عنصر</Button>
                </DialogTrigger>
                <DialogContent className="text-right">
                  <DialogHeader>
                    <DialogTitle>إضافة عنصر مخزون جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="اسم العنصر"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                    <Input
                      placeholder="الوصف"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    />
                    <Input
                      placeholder="الوحدة (مثل: زجاجة)"
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="الكمية الابتدائية"
                      value={newItem.initial_quantity}
                      onChange={(e) => setNewItem({ ...newItem, initial_quantity: parseInt(e.target.value) })}
                    />
                    <Select
                      value={newItem.is_sellable ? 'true' : 'false'}
                      onValueChange={(value) => setNewItem({ ...newItem, is_sellable: value === 'true' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="قابل للبيع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">نعم</SelectItem>
                        <SelectItem value="false">لا</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleCreateItem}>إنشاء</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
                </div>
              ) : (
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2">اسم العنصر</th>
                      <th className="p-2">الوحدة</th>
                      <th className="p-2">الكمية الحالية</th>
                      <th className="p-2">قابل للبيع</th>
                      <th className="p-2">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockItems.map(item => (
                      <tr key={item.id} className="border-b">
                        <td className="p-2">{item.name}</td>
                        <td className="p-2">{item.unit}</td>
                        <td className="p-2">{item.current_quantity}</td>
                        <td className="p-2">{item.is_sellable ? 'نعم' : 'لا'}</td>
                        <td className="p-2">
                          <Button variant="outline" size="sm">تعديل</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">تقرير الجرد</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
                </div>
              ) : (
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2">اسم العنصر</th>
                      <th className="p-2">الوحدة</th>
                      <th className="p-2">الكمية الحالية</th>
                      <th className="p-2">إجمالي المضاف</th>
                      <th className="p-2">إجمالي المستهلك</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map(item => (
                      <tr key={item.id} className="border-b">
                        <td className="p-2">{item.name}</td>
                        <td className="p-2">{item.unit}</td>
                        <td className="p-2">{item.current_quantity}</td>
                        <td className="p-2">{item.total_added}</td>
                        <td className="p-2">{item.total_consumed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Check Tab */}
        <TabsContent value="inventory_check" className="p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">فحص الجرد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4">
                    <span className="w-40">{item.name}</span>
                    <Input
                      type="number"
                      placeholder="الكمية الفعلية"
                      onChange={(e) => setInventoryCheck(prev => [
                        ...prev.filter(i => i.stock_item_id !== item.id),
                        { stock_item_id: item.id, actual_quantity: parseInt(e.target.value) }
                      ])}
                      className="w-32"
                    />
                    <span>الكمية المتوقعة: {item.current_quantity}</span>
                  </div>
                ))}
                <Button onClick={handleInventoryCheck} className="bg-blue-600 hover:bg-blue-700">
                  تسجيل الفحص
                </Button>
              </div>
              {inventoryCheck.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold">نتائج الفحص</h3>
                  <table className="w-full text-right">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2">اسم العنصر</th>
                        <th className="p-2">الكمية المتوقعة</th>
                        <th className="p-2">الكمية الفعلية</th>
                        <th className="p-2">الفرق</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryCheck.map(item => (
                        <tr key={item.stock_item} className="border-b">
                          <td className="p-2">{item.stock_item}</td>
                          <td className="p-2">{item.expected_quantity}</td>
                          <td className="p-2">{item.actual_quantity}</td>
                          <td className="p-2">{item.difference}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit Tab */}
        <TabsContent value="profit" className="p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">تحليل الأرباح</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
                </div>
              ) : (
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2">اسم العنصر</th>
                      <th className="p-2">إجمالي الشراء</th>
                      <th className="p-2">تكلفة الشراء</th>
                      <th className="p-2">إجمالي المبيعات</th>
                      <th className="p-2">إيرادات المبيعات</th>
                      <th className="p-2">الربح</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profit.map(item => (
                      <tr key={item.stock_item_id} className="border-b">
                        <td className="p-2">{item.stock_item_name}</td>
                        <td className="p-2">{item.total_purchase_quantity}</td>
                        <td className="p-2">{item.total_purchase_cost}</td>
                        <td className="p-2">{item.total_sale_quantity}</td>
                        <td className="p-2">{item.total_sale_revenue}</td>
                        <td className="p-2">{item.profit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">تحليل المبيعات</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
                </div>
              ) : (
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2">اسم العنصر</th>
                      <th className="p-2">الكمية المباعة</th>
                      <th className="p-2">الإيرادات</th>
                      <th className="p-2">حالة المبيعات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesAnalysis.map(item => (
                      <tr key={item.stock_item_id} className="border-b">
                        <td className="p-2">{item.stock_item_name}</td>
                        <td className="p-2">{item.total_quantity_sold}</td>
                        <td className="p-2">{item.total_revenue}</td>
                        <td className="p-2" style={{ color: item.sales_status.includes('قوي') ? 'green' : item.sales_status.includes('ضعيف') ? 'red' : 'orange' }}>
                          {item.sales_status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedules & Patrols Tab */}
        <TabsContent value="schedules" className="p-4">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-right">المواعيد والدوريات</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">إضافة موعد</Button>
                </DialogTrigger>
                <DialogContent className="text-right">
                  <DialogHeader>
                    <DialogTitle>إضافة موعد جرد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="عنوان الموعد (مثل: فحص أسبوعي)"
                      value={schedule.title}
                      onChange={(e) => setSchedule({ ...schedule, title: e.target.value })}
                    />
                    <Input
                      type="datetime-local"
                      value={schedule.start}
                      onChange={(e) => setSchedule({ ...schedule, start: e.target.value })}
                    />
                    <Input
                      type="datetime-local"
                      value={schedule.end}
                      onChange={(e) => setSchedule({ ...schedule, end: e.target.value })}
                    />
                    <Select
                      value={schedule.type}
                      onValueChange={(value) => setSchedule({ ...schedule, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="نوع الموعد" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inventory_check">فحص جرد</SelectItem>
                        <SelectItem value="patrol">دورية</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleCreateSchedule}>إنشاء</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Calendar
                localizer={momentLocalizer(moment)}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                messages={{
                  next: 'التالي',
                  previous: 'السابق',
                  today: 'اليوم',
                  month: 'شهر',
                  week: 'أسبوع',
                  day: 'يوم',
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockDashboard;
