import { FiDollarSign, FiFilter, FiAlertTriangle, FiDownload, FiList, FiCalendar, FiPlus } from "react-icons/fi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from "xlsx";
import { debounce } from "lodash";
import { fetchIncomes, fetchIncomeSources, fetchIncomeSummary, fetchAllIncomes, deleteIncome } from "../../redux/slices/financeSlice";
import { fetchStockItems } from "../../redux/slices/stockSlice";
import StockTransactionForm from "./StockTransactionForm";
import IncomeTable from "./IncomeTable";
import IncomeSourcesList from "./IncomeSourcesList";
import usePermission from "@/hooks/usePermission";
import BASE_URL from "../../config/api";
import toast from 'react-hot-toast';
import { selectFinance, selectStockItems, selectUser } from '../../selectors/financeSelectors';

const Incomes = () => {
  const dispatch = useDispatch();
  const canAddIncome = usePermission("add_income");
  const { incomes, incomeSources, loading, error, incomesPagination, totalIncome, totalIncomeCount, totalQuantity, allIncomes } = useSelector(selectFinance);
  const stockItems = useSelector(selectStockItems);
  const user = useSelector(selectUser);
  const [filters, setFilters] = useState({
    source: "",
    stockItem: "",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
  });
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [isSummaryClicked, setIsSummaryClicked] = useState(false);
  const [userClub, setUserClub] = useState(null);

  useEffect(() => {
    fetch(`${BASE_URL}accounts/api/profile/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => setUserClub({ id: data.club.id, name: data.club.name }))
      .catch((err) => console.error("Failed to fetch user profile:", err));
  }, []);

  const debouncedFetchIncomes = useCallback(
    debounce((filters, page) => {
      dispatch(
        fetchIncomes({
          page,
          filters: {
            source: filters.source || "",
            stock_item: filters.stockItem || "",
            start_date: filters.start_date || "",
            end_date: filters.end_date || "",
          },
        })
      );
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
    setFilters((prev) => ({ ...prev, [name]: value === "all" ? "" : value }));
    setPage(1);
  };

  const handleResetFilters = () => {
    const today = new Date().toISOString().slice(0, 10);
    setFilters({
      source: "",
      stockItem: "",
      start_date: today,
      end_date: today,
    });
    setPage(1);
    setIsSummaryClicked(false);
  };

  const handleCalculateTotal = () => {
    dispatch(fetchIncomeSummary({
      start_date: filters.start_date || null,
      end_date: filters.end_date || null,
      source: filters.source || null,
      stock_item: filters.stockItem || null,
    }))
      .unwrap()
      .then(() => setIsSummaryClicked(true))
      .catch((err) => console.error("Failed to calculate total:", err));
  };
  
  const exportToExcel = () => {
    dispatch(
      fetchAllIncomes({
        startDate: filters.start_date || "",
        endDate: filters.end_date || "",
        source: filters.source || "",
        stock_item: filters.stockItem || "",
      })
    )
      .unwrap()
      .then(() => {
        const data = allIncomes.map((income) => ({
          "مصدر المبيعات": income.source_details?.name || "غير متاح",
          "عنصر المخزون": income.stock_transaction_details?.stock_item_details?.name || "غير متاح",
          "الكمية": income.stock_transaction_details?.quantity || "1",
          "المبلغ": income.amount ? `${income.amount} جنيه` : "غير متاح",
          "الوصف": income.description || "لا يوجد وصف",
          "التاريخ": income.date || "غير متاح",
          "تم التسجيل بواسطة": income.received_by_details?.first_name && income.received_by_details?.last_name
            ? `${income.received_by_details.first_name} ${income.received_by_details.last_name}`
            : income.received_by_details?.username || "غير متوفر",
        }));
        if (isSummaryClicked && totalIncomeCount > 0) {
          data.push({
            "مصدر المبيعات": "الإجمالي",
            "عنصر المخزون": "",
            "الكمية": "",
            "المبلغ": `${totalIncome} جنيه`,
            "الوصف": `عدد المبيعات: ${totalIncomeCount}`,
            "التاريخ": "",
            "تم التسجيل بواسطة": "",
          });
        }
        const ws = XLSX.utils.json_to_sheet(data);
        ws["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 20 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "المبيعات");
        XLSX.writeFile(wb, `مبيعات_${new Date().toISOString().slice(0, 10)}.xlsx`);
      })
      .catch((err) => console.error("Failed to export incomes:", err));
  };

  const handleDeleteClick = (incomeId) => {
    dispatch(deleteIncome(incomeId))
      .unwrap()
      .then(() => {
        toast.success('تم حذف الدخل بنجاح');
      })
      .catch((err) => {
        toast.error('فشل في حذف الدخل: ' + err);
      });
  };

  const pageCount = Math.ceil((incomesPagination?.count || 0) / 20);
  const getPageButtons = useCallback((currentPage, totalPages) => {
    const maxButtons = 5;
    const buttons = [];
    const half = Math.floor(maxButtons / 2);
    let startPage = Math.max(1, currentPage - half);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    if (startPage > 1) {
      buttons.push(1);
      if (startPage > 2) buttons.push("...");
    }
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(i);
    }
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) buttons.push("...");
      buttons.push(totalPages);
    }
    return buttons;
  }, []);

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
                إدارة مصادر المبيعات لنادي {userClub?.name || "جاري التحميل..."}
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
                إدارة جميع المبيعات لنادي {userClub?.name || "جاري التحميل..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="w-full">
                  <div className="space-y-4 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="block text-sm font-medium mb-1 text-right">مصدر المبيعات</label>
                        <div className="relative">
                          <FiList className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Select
                            onValueChange={(value) => handleSelectChange("source", value)}
                            value={filters.source || ""}
                          >
                            <SelectTrigger className="w-full text-right">
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
                        </div>
                      </div>
                      <div className="relative">
                        <label className="block text-sm font-medium mb-1 text-right">عنصر المخزون</label>
                        <div className="relative">
                          <FiList className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Select
                            onValueChange={(value) => handleSelectChange("stockItem", value)}
                            value={filters.stockItem || ""}
                          >
                            <SelectTrigger className="w-full text-right">
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
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      

                    <div className="relative">
                        <label className="block text-sm font-medium mb-1 text-right">إلى</label>
                        <div className="relative">
                          <Input
                            type="date"
                            name="end_date"
                            value={filters.end_date}
                            onChange={handleFilterChange}
                            className="w-full text-right"
                          />
                        </div>
                      </div>
                      
                      
                      <div className="relative">
                        <label className="block text-sm font-medium mb-1 text-right">من</label>
                        <div className="relative">
                          <Input
                            type="date"
                            name="start_date"
                            value={filters.start_date}
                            onChange={handleFilterChange}
                            className="w-full text-right"
                          />
                        </div>
                      </div>

                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                      <div className="flex gap-2 flex-wrap">
                        <Button onClick={handleResetFilters} variant="outline" className="w-full sm:w-auto text-sm">
                          <FiFilter className="mr-2" /> إعادة تعيين
                        </Button>
                        <Button
                          onClick={handleCalculateTotal}
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm"
                        >
                          <FiDollarSign className="mr-2" /> حساب الإجمالي
                        </Button>
                        <Button
                          onClick={exportToExcel}
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm"
                        >
                          <FiDownload className="mr-2" /> تصدير
                        </Button>
                      </div>
                      {canAddIncome && (
                        <Button
                          onClick={() => setShowModal(true)}
                          className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white text-sm"
                        >
                          <FiPlus className="mr-2" /> إضافة مبيعات
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-full">
                  {isSummaryClicked && (
                    <div
                      className={`bg-${totalIncome > 0 ? "green" : "red"}-50 border border-${
                        totalIncome > 0 ? "green" : "red"
                      }-200 rounded-lg p-4 text-right mb-4 mt-4`}
                    >
                      <div className="flex items-center gap-2">
                        <FiDollarSign
                          className={`text-${totalIncome > 0 ? "green" : "red"}-600 w-6 h-6`}
                        />
                        <p className="text-lg font-semibold text-gray-800">
                          عدد المبيعات: {totalIncomeCount || 0}
                        </p>
                      </div>
                      {totalIncome > 0 ? (
                        <p className="text-lg font-semibold text-gray-800">
                          إجمالي المبيعات: {totalIncome} جنيه
                        </p>
                      ) : (
                        <p className="text-lg font-semibold text-red-700">لا توجد مبيعات</p>
                      )}
                      {(filters.start_date || filters.end_date) && (
                        <p className="text-sm text-gray-600">
                          للفترة من {filters.start_date || "غير محدد"} إلى {filters.end_date || "غير محدد"}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {loading && (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin w-8 h-8 text-green-600" />
                </div>
              )}
              <IncomeTable
                incomes={incomes}
                handleEditClick={(item) => {
                  setCurrentItem(item);
                  setShowModal(true);
                }}
                handleDeleteClick={handleDeleteClick}
              />
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  variant="outline"
                  className="px-3 py-1 text-sm"
                >
                  السابق
                </Button>
                <div className="flex gap-1">
                  {getPageButtons(page, pageCount).map((p, index) => (
                    <Button
                      key={index}
                      onClick={() => typeof p === "number" && setPage(p)}
                      variant={page === p ? "default" : "outline"}
                      disabled={typeof p !== "number"}
                      className={`px-3 py-1 text-sm ${typeof p !== "number" ? "cursor-default" : ""}`}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pageCount || pageCount === 0}
                  variant="outline"
                  className="px-3 py-1 text-sm"
                >
                  التالي
                </Button>
                <span className="text-sm text-gray-600">
                  صفحة {page} من {pageCount || 1}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {showModal && (
        <StockTransactionForm type="income" currentItem={currentItem} setShowModal={setShowModal} />
      )}
    </div>
  );
};
export default Incomes;