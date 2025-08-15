import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiDollarSign, FiFilter, FiAlertTriangle, FiDownload, FiPlus, FiLogOut } from "react-icons/fi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from "xlsx";
import { debounce } from "lodash";
import { fetchIncomes, fetchIncomeSources, fetchIncomeSummary, fetchAllIncomes } from "../../redux/slices/financeSlice";
import { fetchStockItems } from "../../redux/slices/stockSlice";
import StockTransactionForm from "../dashboard/StockTransactionForm";
import StaffIncomeTable from "./StaffIncomeTable";
import BASE_URL from "../../config/api";
import toast from 'react-hot-toast';
import { selectFinance, selectStockItems } from '../../selectors/financeSelectors';
import { Link } from "react-router-dom";

const StaffIncomes = () => {
  const dispatch = useDispatch();
  const { incomes, incomeSources, loading, error, incomesPagination, totalIncome, totalIncomeCount, allIncomes } = useSelector(selectFinance);
  const stockItems = useSelector(selectStockItems);
  const { user } = useSelector((state) => state.auth);
  const [filters, setFilters] = useState({
    source: "",
    stockItem: "",
  });
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [isSummaryClicked, setIsSummaryClicked] = useState(false);
  const [userClub, setUserClub] = useState(null);
  const [shiftStart, setShiftStart] = useState(null);
  const [shiftEnd, setShiftEnd] = useState(null);
  const [currentShiftId, setCurrentShiftId] = useState(null);
  const [errors, setErrors] = useState({});

  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileResponse = await fetch(`${BASE_URL}accounts/api/profile/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        if (!profileResponse.ok) throw new Error("فشل في جلب بيانات الملف الشخصي");
        const profileData = await profileResponse.json();
        setUserClub({ id: profileData.club.id, name: profileData.club.name });

        const shiftResponse = await fetch(`${BASE_URL}accounts/api/shift-reports/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        if (!shiftResponse.ok) throw new Error("فشل في جلب تقارير الشيفت");
        const shiftData = await shiftResponse.json();
        console.log("Shift reports response:", shiftData);
        const userShifts = shiftData.find((report) => report.user_id === user.id);
        const latestShift = userShifts?.shifts?.find((shift) => !shift.check_out);
        if (!latestShift) {
          setErrors({ general: "لا يوجد شيفت مفتوح لهذا الموظف" });
          setShiftStart(null);
          setShiftEnd(null);
          setCurrentShiftId(null);
        } else {
          setShiftStart(formatDate(latestShift.check_in));
          setShiftEnd(formatDate(latestShift.check_out || new Date()));
          setCurrentShiftId(latestShift.shift_id);
        }

        const incomeSourcesResponse = await fetch(`${BASE_URL}finance/api/income-sources/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        if (!incomeSourcesResponse.ok) throw new Error("فشل في جلب مصادر الإيرادات");
        const incomeSourcesData = await incomeSourcesResponse.json();
        console.log("Income sources response:", incomeSourcesData);
        if (incomeSourcesData.length === 0) {
          setErrors({ general: "لا توجد مصادر إيرادات متاحة" });
        }
        dispatch(fetchIncomeSources());
        dispatch(fetchStockItems());
      } catch (err) {
        console.error("فشل في تحميل البيانات:", err);
        setErrors({ general: err.message || "فشل في تحميل بيانات المستخدم أو الشيفت" });
      }
    };
    fetchData();
  }, [dispatch, user.id]);

  const handleCheckOut = async () => {
    try {
      const response = await fetch(`${BASE_URL}accounts/api/staff_check_out_by_code/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rfid_code: user.rfid_code }),
      });
      if (!response.ok) throw new Error("فشل في تسجيل الخروج");
      toast.success('تم تسجيل الخروج بنجاح');
      const shiftResponse = await fetch(`${BASE_URL}accounts/api/shift-reports/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      if (!shiftResponse.ok) throw new Error("فشل في جلب تقارير الشيفت");
      const shiftData = await shiftResponse.json();
      console.log("Shift reports after checkout:", shiftData);
      const userShifts = shiftData.find((report) => report.user_id === user.id);
      const latestShift = userShifts?.shifts?.find((shift) => !shift.check_out);
      if (!latestShift) {
        setErrors({ general: "لا يوجد شيفت مفتوح بعد تسجيل الخروج" });
        setShiftStart(null);
        setShiftEnd(null);
        setCurrentShiftId(null);
      } else {
        setShiftStart(formatDate(latestShift.check_in));
        setShiftEnd(formatDate(latestShift.check_out || new Date()));
        setCurrentShiftId(latestShift.shift_id);
      }
    } catch (err) {
      console.error("فشل في تسجيل الخروج:", err);
      setErrors({ general: err.message || "فشل في تسجيل الخروج" });
    }
  };

  const debouncedFetchIncomes = useCallback(
    debounce((filters, page) => {
      const filterParams = {
        page,
        source: filters.source || null,
        stock_item: filters.stockItem || null,
        shift_id: currentShiftId || null,
      };
      console.log("Fetching incomes with filters:", filterParams);
      dispatch(fetchIncomes(filterParams))
        .unwrap()
        .catch((err) => {
          console.error("فشل في جلب الإيرادات:", err);
          setErrors({ general: err.message || "فشل في جلب الإيرادات" });
        });
    }, 300),
    [dispatch, currentShiftId]
  );

  useEffect(() => {
    if (currentShiftId) {
      debouncedFetchIncomes(filters, page);
    }
  }, [filters, page, debouncedFetchIncomes, currentShiftId]);

  const handleSelectChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value === "all" ? "" : value }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      source: "",
      stockItem: "",
    });
    setPage(1);
    setIsSummaryClicked(false);
  };

  const handleCalculateTotal = () => {
    const filterParams = {
      source: filters.source || null,
      stock_item: filters.stockItem || null,
      shift_id: currentShiftId || null,
    };
    console.log("Fetching income summary with filters:", filterParams);
    dispatch(fetchIncomeSummary(filterParams))
      .unwrap()
      .then(() => setIsSummaryClicked(true))
      .catch((err) => {
        console.error("فشل في حساب الإجمالي:", err);
        setErrors({ general: err.message || "فشل في حساب الإجمالي" });
      });
  };

  const exportToExcel = () => {
    const filterParams = {
      source: filters.source || null,
      stock_item: filters.stockItem || null,
      shift_id: currentShiftId || null,
    };
    console.log("Exporting incomes with filters:", filterParams);
    dispatch(fetchAllIncomes(filterParams))
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
      .catch((err) => {
        console.error("فشل في تصدير الإيرادات:", err);
        setErrors({ general: "فشل في تصدير الإيرادات إلى إكسل" });
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-right flex items-center gap-3">
          <FiDollarSign className="text-green-600 w-8 h-8" />
          إدارة المبيعات
        </h1>
        <div className="flex gap-2">
          <Link to="/dashboard/staff-expenses">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white text-sm">
              عرض المصروفات
            </Button>
          </Link>
          {shiftStart && (
            <Button
              onClick={handleCheckOut}
              className="bg-red-600 hover:bg-red-700 text-white text-sm"
            >
              <FiLogOut className="mr-2" /> تسجيل الخروج
            </Button>
          )}
        </div>
      </div>
      {shiftStart ? (
        <Card className="border-gray-200 shadow-none">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">
              بداية الشيفت: {new Date(shiftStart).toLocaleString('ar-EG', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-gray-200 shadow-none">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">لا يوجد شيفت مفتوح</p>
          </CardContent>
        </Card>
      )}
      {errors.general && (
        <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 text-right">
          <FiAlertTriangle className="text-red-600 w-6 h-6" />
          <p className="text-red-600">{errors.general}</p>
        </div>
      )}
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
                      <FiDollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Select
                        onValueChange={(value) => handleSelectChange("source", value)}
                        value={filters.source || ""}
                      >
                        <SelectTrigger className="w-full text-right">
                          <SelectValue placeholder="مصدر المبيعات" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع المصادر</SelectItem>
                          {incomeSources.length > 0 ? (
                            incomeSources.map((source) => (
                              <SelectItem key={source.id} value={source.id.toString()}>
                                {source.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>لا توجد مصادر متاحة</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-right">عنصر المخزون</label>
                    <div className="relative">
                      <FiDollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Select
                        onValueChange={(value) => handleSelectChange("stockItem", value)}
                        value={filters.stockItem || ""}
                      >
                        <SelectTrigger className="w-full text-right">
                          <SelectValue placeholder="عنصر المخزون" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع العناصر</SelectItem>
                          {stockItems.length > 0 ? (
                            stockItems.map((item) => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>لا توجد عناصر مخزون متاحة</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
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
                  <Button
                    onClick={() => setShowModal(true)}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white text-sm"
                  >
                    <FiPlus className="mr-2" /> إضافة مبيعات
                  </Button>
                </div>
              </div>
            </div>
            <div className="w-full">
              {isSummaryClicked && (
                <div
                  className={`bg-${totalIncome > 0 ? "green" : "red"}-50 border border-${
                    totalIncome > 0 ? "green" : "red"}-200 rounded-lg p-4 text-right mb-4 mt-4`}
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
                </div>
              )}
            </div>
          </div>
          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin w-8 h-8 text-green-600" />
            </div>
          )}
          <StaffIncomeTable incomes={incomes} />
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
      {showModal && (
        <StockTransactionForm
          type="income"
          setShowModal={setShowModal}
          onSuccess={() => dispatch(fetchIncomes({
            page: 1,
            source: filters.source || null,
            stock_item: filters.stockItem || null,
            shift_id: currentShiftId || null,
          }))}
        />
      )}
    </div>
  );
};

export default StaffIncomes;