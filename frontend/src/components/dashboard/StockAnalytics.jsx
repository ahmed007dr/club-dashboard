
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiBarChart2, FiFilter, FiDownload } from 'react-icons/fi';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchStockItems, createStockItem, updateStockItem, fetchStockInventory, fetchStockProfit, fetchStockSalesAnalysis } from "../../redux/slices/stockSlice";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as XLSX from 'xlsx';

const StockAnalytics = () => {
  const dispatch = useDispatch();
  const { stockItems, inventory, profit, salesAnalysis, loading, error } = useSelector((state) => state.stock);
  const [filters, setFilters] = useState({
    itemName: '',
    startDate: '',
    endDate: '',
    periodType: 'monthly',
  });
  const [activeTab, setActiveTab] = useState('inventory');

  useEffect(() => {
    dispatch(fetchStockItems({ name: filters.itemName }));
    dispatch(fetchStockInventory());
    dispatch(fetchStockProfit({ start_date: filters.startDate, end_date: filters.endDate }));
    dispatch(fetchStockSalesAnalysis({ period_type: filters.periodType, start_date: filters.startDate, end_date: filters.endDate }));
  }, [dispatch, filters]);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handlePeriodChange = useCallback((value) => {
    setFilters((prev) => ({ ...prev, periodType: value }));
  }, []);

  const exportToExcel = useCallback(() => {
    let data = [];
    if (activeTab === 'inventory') {
      data = inventory.map(item => ({
        'اسم العنصر': item.name,
        'الوحدة': item.unit,
        'الكمية الحالية': item.current_quantity,
        'إجمالي المضاف': item.total_added,
        'إجمالي المستهلك': item.total_consumed,
      }));
    } else if (activeTab === 'profit') {
      data = profit.map(item => ({
        'اسم العنصر': item.stock_item_name,
        'إجمالي الشراء': item.total_purchase_quantity,
        'تكلفة الشراء': item.total_purchase_cost,
        'إجمالي المبيعات': item.total_sale_quantity,
        'إيرادات المبيعات': item.total_sale_revenue,
        'الربح': item.profit,
      }));
    } else if (activeTab === 'sales') {
      data = salesAnalysis.flatMap(item => item.sales_by_period.map(period => ({
        'اسم العنصر': item.stock_item_name,
        'الفترة': period.period,
        'الكمية المباعة': period.total_quantity,
        'الإيرادات': period.total_revenue,
      })));
    }

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير المخزون');
    XLSX.writeFile(wb, `تقرير_المخزون_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [activeTab, inventory, profit, salesAnalysis]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans" dir="rtl">
      <h1 className="text-3xl font-bold text-right flex items-center gap-3">
        <FiBarChart2 className="text-blue-600 w-8 h-8" />
        تحليل المخزون
      </h1>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 text-right">
          <FiAlertTriangle className="text-red-600 w-6 h-6" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

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
            <FiDownload className="mr-2" /> تصدير
          </Button>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white rounded-lg shadow-sm">
        <TabsList className="bg-gray-100 rounded-t-lg p-2 flex justify-end">
          <TabsTrigger value="inventory">الجرد</TabsTrigger>
          <TabsTrigger value="profit">الأرباح</TabsTrigger>
          <TabsTrigger value="sales">المبيعات</TabsTrigger>
        </TabsList>

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
                        <td className="p-2">{item.sales_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockAnalytics;
