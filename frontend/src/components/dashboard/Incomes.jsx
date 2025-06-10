
import { FiDollarSign, FiFilter, FiDownload, FiList } from 'react-icons/fi';
import {  Card,  CardContent,  CardDescription,  CardHeader,  CardTitle,} from '@/components/ui/card';
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as XLSX from 'xlsx';
import { debounce } from 'lodash';
import { fetchIncomes, fetchIncomeSources, fetchIncomeSummary, fetchAllIncomes } from '../../redux/slices/financeSlice';
import { fetchStockItems } from '../../redux/slices/stockSlice';
import StockTransactionForm from './StockTransactionForm';
import IncomeTable from './IncomeTable';
import IncomeSourcesList from './IncomeSourcesList';
import usePermission from '@/hooks/usePermission';
import BASE_URL from '../../config/api';

const Incomes = () => {
  const dispatch = useDispatch();
  const canAddIncome = usePermission('add_income');
  const { incomes, incomeSources, loading, error, incomesPagination, totalIncome, totalIncomeCount, allIncomes } = useSelector((state) => state.finance || {});
  const { stockItems = [] } = useSelector((state) => state.stock || {});
  const { user } = useSelector((state) => state.auth || {});
  const [filters, setFilters] = useState({
    source: '',
    stockItem: '',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [isSummaryClicked, setIsSummaryClicked] = useState(false);
  const [userClub, setUserClub] = useState(null);

  useEffect(() => {
    fetch(`${BASE_URL}/accounts/api/profile/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => setUserClub({ id: data.club.id, name: data.club.name }))
      .catch((err) => console.error('Failed to fetch user profile:', err));
  }, []);

  const debouncedFetchIncomes = useCallback(
    debounce((filters, page) => {
      dispatch(fetchIncomes({
        page,
        filters: {
          source: filters.source,
          stock_item: filters.stockItem,
          start_date: filters.startDate,
          end_date: filters.endDate,
        },
      }));
    }, 300),
    [dispatch]
  );

  useEffect(() => {
    debouncedFetchIncomes(filters, page);
    dispatch(fetchIncomeSources());
    dispatch(fetchStockItems());
  }, [dispatch, filters, page, debouncedFetchIncomes]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleSelectChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value === 'all' ? '' : value }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ source: '', stockItem: '', startDate: '', endDate: '' });
    setPage(1);
    setIsSummaryClicked(false);
  };

  const handleCalculateTotal = () => {
    dispatch(fetchIncomeSummary({
      start: filters.startDate || null,
      end: filters.endDate || null,
      source: filters.source || null,
      stock_item: filters.stockItem || null,
    }))
      .unwrap()
      .then(() => setIsSummaryClicked(true))
      .catch((err) => console.error('Failed to calculate total:', err));
  };

  const exportToExcel = () => {
    dispatch(fetchAllIncomes({
      startDate: filters.startDate,
      endDate: filters.endDate,
      source: filters.source,
      stock_item: filters.stockItem,
    }))
      .unwrap()
      .then(() => {
        const data = allIncomes.map((income) => ({
          'مصدر المبيعات': income.source_details?.name || 'غير متاح',
          'عنصر المخزون': income.stock_transaction_details?.stock_item_details?.name || 'غير متاح',
          'الكمية': income.stock_transaction_details?.quantity || 'غير متاح',
          'المبلغ': income.amount ? `${income.amount} جنيه` : 'غير متاح',
          'الوصف': income.description || 'لا يوجد وصف',
          'التاريخ': income.date || 'غير متاح',
        }));
        if (isSummaryClicked && totalIncomeCount > 0) {
          data.push({
            'مصدر المبيعات': 'الإجمالي',
            'عنصر المخزون': '',
            'الكمية': '',
            'المبلغ': `${totalIncome} جنيه`,
            'الوصف': `عدد المبيعات: ${totalIncomeCount}`,
            'التاريخ': '',
          });
        }
        const ws = XLSX.utils.json_to_sheet(data);
        ws['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 30 }, { wch: 15 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'المبيعات');
        XLSX.writeFile(wb, `مبيعات_${new Date().toISOString().slice(0, 10)}.xlsx`);
      })
      .catch((err) => console.error('Failed to export incomes:', err));
  };

  const pageCount = Math.ceil((incomesPagination?.count || 0) / 20);

  const summaryCard = isSummaryClicked && (
    <div className={`bg-${totalIncome > 0 ? 'green' : 'red'}-50 border border-${totalIncome > 0 ? 'green' : 'red'}-200 rounded-lg p-4 text-right mb-4`}>
      <div className="flex items-center gap-2">
        <FiDollarSign className={`text-${totalIncome > 0 ? 'green' : 'red'}-600 w-6 h-6`} />
        <p className="text-lg font-semibold text-gray-800">
          عدد المبيعات: {totalIncomeCount}
        </p>
      </div>
      {totalIncome > 0 ? (
        <p className="text-lg font-semibold text-gray-800">إجمالي المبيعات: {totalIncome} جنيه</p>
      ) : (
        <p className="text-lg font-semibold text-red-700">لا توجد مبيعات</p>
      )}
      {(filters.startDate || filters.endDate) && (
        <p className="text-sm text-gray-600">
          للفترة من {filters.startDate || 'غير محدد'} إلى {filters.endDate || 'غير محدد'}
        </p>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans" dir="rtl">
      <h1 className="text-3xl font-bold text-right flex items-center gap-3">
        <FiDollarSign className="text-green-600 w-8 h-8" />
        إدارة المبيعات
      </h1>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 text-right">
          <FiAlertTriangle className="text-red-600 w-6 h-6" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <Tabs defaultValue="incomes" className="bg-white rounded-lg shadow-sm">
        <TabsList className="bg-gray-100 rounded-t-lg p-2 flex justify-end">
          <TabsTrigger value="incomes" className="data-[state=active]:bg-white rounded-md px-4 py-2 text-sm font-medium">
            المبيعات
          </TabsTrigger>
          <TabsTrigger value="sources" className="data-[state=active]:bg-white rounded-md px-4 py-2 text-sm font-medium">
            مصادر المبيعات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2 text-xl">
                <FiList className="text-green-600 w-6 h-6" />
                مصادر المبيعات
              </CardTitle>
              <CardDescription className="text-right text-sm text-gray-600">
                إدارة مصادر المبيعات لنادي {userClub?.name || 'جاري التحميل...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IncomeSourcesList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incomes" className="p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2 text-xl">
                <FiDollarSign className="text-green-600 w-6 h-6" />
                جميع المبيعات
              </CardTitle>
              <CardDescription className="text-right text-sm text-gray-600">
                إدارة جميع المبيعات لنادي {userClub?.name || 'جاري التحميل...'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Select onValueChange={(value) => handleSelectChange('source', value)} value={filters.source}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="مصدر المبيعات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المصادر</SelectItem>
                    {incomeSources.map((source) => (
                      <SelectItem key={source.id} value={source.id.toString()}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select onValueChange={(value) => handleSelectChange('stockItem', value)} value={filters.stockItem}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="عنصر المخزون" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع العناصر</SelectItem>
                    {stockItems.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  name="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full sm:w-48"
                />
                <Input
                  name="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full sm:w-48"
                />
                <Button onClick={handleResetFilters} variant="outline">
                  إعادة تعيين
                </Button>
                <Button onClick={handleCalculateTotal} className="bg-blue-600 hover:bg-blue-700">
                  حساب الإجمالي
                </Button>
                <Button onClick={exportToExcel} className="bg-blue-600 hover:bg-blue-700">
                  <FiDownload className="mr-2" /> تصدير
                </Button>
                {canAddIncome && (
                  <Button onClick={() => setShowModal(true)} className="bg-green-600 hover:bg-green-700">
                    إضافة مبيعات
                  </Button>
                )}
              </div>

              {summaryCard}

              {loading && (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin w-8 h-8 text-green-600" />
                </div>
              )}

              <IncomeTable
                incomes={incomes}
                handleEditClick={(item) => { setCurrentItem(item); setShowModal(true); }}
                handleDeleteClick={() => {}}
              />

              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    onClick={() => setPage(p)}
                    variant={page === p ? 'default' : 'outline'}
                    className="px-3 py-1"
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showModal && (
        <StockTransactionForm
          type="income"
          currentItem={currentItem}
          setShowModal={setShowModal}
        />
      )}
    </div>
  );
};

export default Incomes;
