import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { FiDollarSign, FiAlertTriangle, FiPlus, FiFilter, FiDownload, FiLogOut } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchExpenseSummary,
  fetchExpenses,
  addExpense,
  fetchExpenseCategories,
  fetchAllExpenses,
} from "../../redux/slices/financeSlice";
import BASE_URL from "@/config/api";
import * as XLSX from "xlsx";
import { debounce } from "lodash";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StaffExpenseTable from "./StaffExpenseTable";
import AddEditExpenseModal from "../dashboard/AddEditExpenseModal";
import { Link } from "react-router-dom";
import toast from 'react-hot-toast';

const StaffExpenses = () => {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: "",
    amount: "",
    description: "",
    related_employee: "",
    attachment: null,
  });
  const [filters, setFilters] = useState({
    category: "",
    related_employee: "",
    amount: "",
    description: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [userClub, setUserClub] = useState(null);
  const [relatedEmployeeUsers, setRelatedEmployeeUsers] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSummaryClicked, setIsSummaryClicked] = useState(false);
  const [localExpenses, setLocalExpenses] = useState([]);
  const [localTotalExpenses, setLocalTotalExpenses] = useState(0);
  const [localTotalExpensesCount, setLocalTotalExpensesCount] = useState(0);
  const [shiftStart, setShiftStart] = useState(null);
  const [shiftEnd, setShiftEnd] = useState(null);
  const [currentShiftId, setCurrentShiftId] = useState(null);
  const itemsPerPage = 20;
  const maxButtons = 5;

  const {
    expenses,
    expenseCategories,
    loading,
    error,
    expensesPagination,
    totalExpenses,
    totalExpensesCount,
    allExpenses,
  } = useSelector((state) => state.finance);
  const { user } = useSelector((state) => state.auth);

  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  };

  useEffect(() => {
    dispatch(fetchExpenseCategories());
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

        const relatedEmployeeResponse = await fetch(`${BASE_URL}accounts/api/users_with_related_expenses/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        if (!relatedEmployeeResponse.ok) throw new Error("فشل في جلب الموظفين المرتبطين");
        const relatedEmployeeData = await relatedEmployeeResponse.json();
        setRelatedEmployeeUsers(relatedEmployeeData || []);

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

  const isValidFilter = (filters) => {
    return (
      filters.category ||
      filters.related_employee ||
      filters.amount ||
      filters.description
    );
  };

  const debouncedFetchExpenses = useCallback(
    debounce((filters, page) => {
      const filterParams = {
        page,
        category: filters.category || null,
        related_employee: filters.related_employee ? parseInt(filters.related_employee) : null,
        amount: filters.amount ? parseFloat(filters.amount) : null,
        description: filters.description || null,
        shift_id: currentShiftId || null,
      };
      console.log("Fetching expenses with filters:", filterParams);
      dispatch(fetchExpenses(filterParams))
        .unwrap()
        .catch((err) => {
          console.error("فشل في جلب المصروفات:", err);
          setErrors({ general: err.message || "فشل في جلب المصروفات" });
        });
    }, 300),
    [dispatch, currentShiftId]
  );

  useEffect(() => {
    if (currentShiftId) {
      debouncedFetchExpenses(filters, currentPage);
    }
  }, [filters, currentPage, debouncedFetchExpenses, currentShiftId]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const updatedValue = name === "amount" ? (value === "" ? "" : parseFloat(value) || "") : value;
    setFilters((prev) => ({ ...prev, [name]: updatedValue }));
    setCurrentPage(1);
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const updatedValue = name === "amount" ? (value === "" ? "" : parseFloat(value) || "") : value;
    setNewExpense((prev) => ({ ...prev, [name]: updatedValue }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value === "all" ? "" : value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      category: "",
      related_employee: "",
      amount: "",
      description: "",
    });
    setCurrentPage(1);
    setIsSummaryClicked(false);
    setLocalExpenses([]);
    setLocalTotalExpenses(0);
    setLocalTotalExpensesCount(0);
  };

  const handleCalculateTotal = async () => {
    try {
      const filterParams = {
        category: filters.category || null,
        related_employee: filters.related_employee ? parseInt(filters.related_employee) : null,
        amount: filters.amount ? parseFloat(filters.amount) : null,
        description: filters.description || null,
        shift_id: currentShiftId || null,
        details: true,
      };
      console.log("Fetching expense summary with filters:", filterParams);
      const response = await dispatch(fetchExpenseSummary(filterParams)).unwrap();
      if (response && response.details) {
        setLocalExpenses(response.details);
        setLocalTotalExpenses(response.total_expense || 0);
        setLocalTotalExpensesCount(response.details.length || 0);
        setIsSummaryClicked(true);
      } else {
        setLocalExpenses([]);
        setLocalTotalExpenses(0);
        setLocalTotalExpensesCount(0);
        setErrors({ general: "لا توجد مصروفات في هذا النطاق" });
      }
    } catch (err) {
      console.error("فشل في حساب الإجمالي:", err);
      setErrors({ general: err.message || "فشل في حساب الإجمالي" });
    }
  };

  const exportToExcel = async () => {
    try {
      const filterParams = {
        category: filters.category || null,
        related_employee: filters.related_employee ? parseInt(filters.related_employee) : null,
        amount: filters.amount ? parseFloat(filters.amount) : null,
        description: filters.description || null,
        shift_id: currentShiftId || null,
      };
      console.log("Exporting expenses with filters:", filterParams);
      await dispatch(fetchAllExpenses(filterParams)).unwrap();
      const data = allExpenses.map((expense) => ({
        'الفئة': expense.category_details?.name || expense.category_name || "غير متاح",
        'المبلغ': expense.amount ? `${expense.amount} جنيه` : "غير متاح",
        'الوصف': expense.description || "غير متاح",
        'التاريخ': expense.date || "غير متاح",
        'موظف الشيفت': expense.paid_by_details?.first_name && expense.paid_by_details?.last_name
          ? `${expense.paid_by_details.first_name} ${expense.paid_by_details.last_name}`
          : expense.paid_by_details?.username || expense.paid_by_username || 'غير متاح',
        'الموظف المرتبط': expense.related_employee_username ||
          (expense.related_employee_details?.first_name && expense.related_employee_details?.last_name
            ? `${expense.related_employee_details.first_name} ${expense.related_employee_details.last_name}`
            : expense.related_employee_details?.username || 'غير محدد'),
      }));
      if (isSummaryClicked && totalExpensesCount > 0) {
        data.push({
          'الفئة': "",
          'المبلغ': `${totalExpenses} جنيه`,
          'الوصف': `عدد المصروفات: ${totalExpensesCount}`,
          'التاريخ': "",
          'موظف الشيفت': "",
          'الموظف المرتبط': "",
        });
      }
      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [
        { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "المصروفات");
      XLSX.writeFile(wb, `مصروفات_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error("فشل في تصدير المصروفات:", err);
      setErrors({ general: "فشل في تصدير المصروفات إلى إكسل" });
    }
  };

  const getPageButtons = useCallback((currentPage, totalPages) => {
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
  }, [maxButtons]);

  const summaryCard = useMemo(() => {
    if (!isSummaryClicked) return null;
    if (localTotalExpenses > 0) {
      return (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 text-right mb-4">
          <div className="flex items-center gap-2">
            <FiDollarSign className="text-teal-600 w-6 h-6" />
            <p className="text-lg font-semibold text-gray-800">
              عدد المصروفات: {localTotalExpensesCount}
            </p>
          </div>
          <p className="text-lg font-semibold text-gray-800">
            إجمالي المصروفات: {localTotalExpenses} جنيه
          </p>
        </div>
      );
    }
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-right mb-4">
        <div className="flex items-center gap-2">
          <FiAlertTriangle className="text-red-600 w-6 h-6" />
          <p className="text-lg font-semibold text-red-700">
            لا توجد مصروفات
          </p>
        </div>
      </div>
    );
  }, [isSummaryClicked, localTotalExpenses, localTotalExpensesCount]);

  const summaryCardDetails = useMemo(() => {
    if (!isSummaryClicked || localTotalExpenses <= 0) return null;
    const selectedCategory = expenseCategories.find((cat) => cat.id.toString() === filters.category) || { name: "جميع الفئات" };
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-right mt-4">
        <p className="text-sm text-gray-700">عدد المصروفات: {localTotalExpensesCount}</p>
        <p className="text-sm text-gray-700">الإجمالي: {localTotalExpenses} جنيه</p>
        <p className="text-sm text-gray-700">الفئة: {selectedCategory.name}</p>
      </div>
    );
  }, [isSummaryClicked, localTotalExpenses, localTotalExpensesCount, filters.category, expenseCategories]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-sans" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-right flex items-center gap-3">
          <FiDollarSign className="text-teal-600 w-8 h-8" />
          إدارة المصروفات
        </h1>
        <div className="flex gap-2">
          <Link to="/dashboard/staff-incomes">
            <Button className="bg-green-600 hover:bg-green-700 text-white text-sm">
              عرض المبيعات
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
      <Card className="border-gray-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-right flex items-center gap-2 text-xl">
            <FiDollarSign className="text-teal-600 w-6 h-6" />
            جميع المصروفات
          </CardTitle>
          <CardDescription className="text-right text-sm text-gray-600">
            إدارة جميع المصروفات لنادي {userClub?.name || "جاري التحميل..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="w-full">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-right">الفئة</label>
                    <Select
                      onValueChange={(value) => handleSelectChange("category", value)}
                      value={filters.category || ""}
                    >
                      <SelectTrigger className="w-full text-right">
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الفئات</SelectItem>
                        {expenseCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-right">الموظف المرتبط</label>
                    <Select
                      onValueChange={(value) => handleSelectChange("related_employee", value)}
                      value={filters.related_employee || ""}
                    >
                      <SelectTrigger className="w-full text-right">
                        <SelectValue placeholder="اختر الموظف المرتبط" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الموظفين</SelectItem>
                        {relatedEmployeeUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-right">المبلغ</label>
                    <Input
                      type="number"
                      name="amount"
                      value={filters.amount}
                      onChange={handleFilterChange}
                      className="w-full text-right"
                      placeholder="أدخل المبلغ"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-right">الوصف</label>
                    <Input
                      type="text"
                      name="description"
                      value={filters.description}
                      onChange={handleFilterChange}
                      className="w-full text-right"
                      placeholder="أدخل الوصف"
                    />
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
                    onClick={() => {
                      setNewExpense({
                        category: "",
                        amount: "",
                        description: "",
                        related_employee: "",
                        attachment: null,
                      });
                      setShowModal(true);
                    }}
                    className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white text-sm"
                  >
                    <FiPlus className="mr-2" /> إضافة مصروف
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {summaryCard}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="animate-spin w-8 h-8 text-teal-600" />
              <span className="mr-4 text-gray-600">جاري التحميل...</span>
            </div>
          )}
          {error && (
            <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 text-right">
              <FiAlertTriangle className="text-red-600 w-6 h-6" />
              <p className="text-red-600">خطأ: {error}</p>
            </div>
          )}
          <StaffExpenseTable expenses={isSummaryClicked ? localExpenses : expenses} />
          {summaryCardDetails}
          <div className="flex justify-center items-center mt-6 gap-4">
            <Button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              variant="outline"
              className="px-3 py-1 text-sm"
            >
              السابق
            </Button>
            <div className="flex gap-1">
              {getPageButtons(currentPage, expensesPagination?.count ? Math.ceil(expensesPagination.count / itemsPerPage) : 1).map((page, index) => (
                <Button
                  key={index}
                  onClick={() => typeof page === "number" && setCurrentPage(page)}
                  variant={currentPage === page ? "default" : "outline"}
                  disabled={typeof page !== "number"}
                  className={`px-3 py-1 text-sm ${typeof page !== "number" ? "cursor-default" : ""}`}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === (expensesPagination?.count ? Math.ceil(expensesPagination.count / itemsPerPage) : 1) || !expensesPagination?.next}
              variant="outline"
              className="px-3 py-1 text-sm"
            >
              التالي
            </Button>
            <span className="text-sm text-gray-600">
              صفحة {currentPage} من {(expensesPagination?.count ? Math.ceil(expensesPagination.count / itemsPerPage) : 1) || 1}
            </span>
          </div>
        </CardContent>
      </Card>
      <AddEditExpenseModal
        showModal={showModal}
        setShowModal={setShowModal}
        newExpense={newExpense}
        userClub={userClub}
        expenseCategories={expenseCategories}
        users={relatedEmployeeUsers}
        handleChange={handleFormChange}
        handleSave={() => {
          const validationErrors = {
            category: !newExpense.category || isNaN(parseInt(newExpense.category)) ? "الفئة مطلوبة." : "",
            amount: !newExpense.amount && newExpense.amount !== 0 ? "المبلغ مطلوب." : "",
            related_employee: newExpense.related_employee && isNaN(parseInt(newExpense.related_employee)) ? "الموظف المرتبط غير صالح." : "",
          };
          if (Object.values(validationErrors).some((err) => err)) {
            setErrors(validationErrors);
            return;
          }
          const expenseData = {
            category: parseInt(newExpense.category),
            amount: parseFloat(newExpense.amount),
            description: newExpense.description || "",
            related_employee: newExpense.related_employee ? parseInt(newExpense.related_employee) : null,
            attachment: newExpense.attachment || null,
          };
          dispatch(addExpense(expenseData))
            .unwrap()
            .then(() => {
              setShowModal(false);
              setNewExpense({
                category: "",
                amount: "",
                description: "",
                related_employee: "",
                attachment: null,
              });
              setErrors({});
              setCurrentPage(1);
              dispatch(fetchExpenses({
                page: 1,
                category: filters.category || null,
                related_employee: filters.related_employee ? parseInt(filters.related_employee) : null,
                amount: filters.amount ? parseFloat(filters.amount) : null,
                description: filters.description || null,
                shift_id: currentShiftId || null,
              }));
              fetch(`${BASE_URL}accounts/api/users_with_related_expenses/`, {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                  "Content-Type": "application/json",
                },
              })
                .then((res) => res.json())
                .then((data) => setRelatedEmployeeUsers(data || []))
                .catch((err) => console.error("Failed to reload relatedEmployeeUsers:", err));
            })
            .catch((err) => {
              console.error("فشل في حفظ المصروف:", err);
              setErrors({ general: err.message || "فشل في حفظ المصروف" });
            });
        }}
        errors={errors}
      />
    </div>
  );
};

export default StaffExpenses;