import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { FiDollarSign, FiAlertTriangle, FiPlus } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchExpenseSummary,
  fetchExpenses,
  updateExpense,
  addExpense,
  deleteExpense,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ExpenseTable from "./ExpenseTable";
import ExpenseCards from "./ExpenseCards";
import ExpenseFilters from "./ExpenseFilters";
import AddEditExpenseModal from "./AddEditExpenseModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import ExpenseCategory from "./ExpenseCategory";
import usePermission from "@/hooks/usePermission";

const Expenses = () => {
  const dispatch = useDispatch();
  const canViewExpense = usePermission("view_expense");
  const canAddExpense = usePermission("add_expense");
  const canEditExpense = usePermission("change_expense");
  const canDeleteExpense = usePermission("delete_expense");
  const [showModal, setShowModal] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [newExpense, setNewExpense] = useState({
    category: "",
    amount: "",
    description: "",
    related_employee: "",
    attachment: null,
  });
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [filters, setFilters] = useState({
    category: "",
    user: "",
    related_employee: "",
    amount: "",
    description: "",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [userClub, setUserClub] = useState(null);
  const [users, setUsers] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSummaryClicked, setIsSummaryClicked] = useState(false);
  const [localExpenses, setLocalExpenses] = useState([]);
  const [localTotalExpenses, setLocalTotalExpenses] = useState(0);
  const [localTotalExpensesCount, setLocalTotalExpensesCount] = useState(0);
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
        const profileData = await profileResponse.json();
        setUserClub({ id: profileData.club.id, name: profileData.club.name });

        const usersResponse = await fetch(`${BASE_URL}accounts/api/users/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        const usersData = await usersResponse.json();
        setUsers(usersData.results || []);
      } catch (err) {
        console.error("فشل في تحميل البيانات:", err);
        setErrors({ general: "فشل في تحميل بيانات المستخدم أو المستخدمين" });
      }
    };
    fetchData();
  }, [dispatch]);

  const isValidFilter = (filters) => {
    return (
      filters.start_date?.length > 0 ||
      filters.end_date?.length > 0 ||
      filters.category ||
      filters.user ||
      filters.related_employee ||
      filters.amount ||
      filters.description
    );
  };

  const debouncedFetchExpenses = useCallback(
    debounce((filters, page) => {
      if (isValidFilter(filters)) {
        dispatch(
          fetchExpenses({
            page,
            category: filters.category || null,
            user: filters.user || null,
            related_employee: filters.related_employee || null,
            amount: filters.amount || null,
            description: filters.description || null,
            start_date: filters.start_date || null,
            end_date: filters.end_date || null,
          })
        ).catch((err) => {
          setErrors({ general: err.message || "فشل في جلب المصروفات" });
        });
      } else {
        setErrors({ general: "يجب تحديد معايير البحث (تاريخ، مدة زمنية، فئة، مستخدم، موظف مرتبط، مبلغ، أو وصف)." });
      }
    }, 300),
    [dispatch]
  );

  useEffect(() => {
    debouncedFetchExpenses(filters, currentPage);
  }, [filters, currentPage, debouncedFetchExpenses]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedValue = name === "amount" ? (value === "" ? "" : parseFloat(value) || "") : value;
    if (currentExpense) {
      setCurrentExpense((prev) => ({ ...prev, [name]: updatedValue }));
    } else {
      setNewExpense((prev) => ({ ...prev, [name]: updatedValue }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = (data) => {
    const newErrors = {};
    if (!data.category || isNaN(parseInt(data.category))) newErrors.category = "الفئة مطلوبة.";
    if (!data.amount && data.amount !== 0) newErrors.amount = "المبلغ مطلوب.";
    if (data.related_employee && isNaN(parseInt(data.related_employee))) newErrors.related_employee = "الموظف المرتبط غير صالح.";
    return newErrors;
  };

  const handleSave = async () => {
    const data = currentExpense || newExpense;
    const validationErrors = validateForm(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const expenseData = {
      category: parseInt(data.category),
      amount: parseFloat(data.amount),
      description: data.description || "",
      related_employee: data.related_employee ? parseInt(data.related_employee) : null,
      attachment: data.attachment || null,
    };

    const action = currentExpense
      ? updateExpense({ id: currentExpense.id, updatedData: expenseData })
      : addExpense(expenseData);

    try {
      await dispatch(action).unwrap();
      setShowModal(false);
      setCurrentExpense(null);
      setNewExpense({
        category: "",
        amount: "",
        description: "",
        related_employee: "",
        attachment: null,
      });
      setErrors({});
      setCurrentPage(1);
      dispatch(fetchExpenses({ page: 1, ...filters }));
    } catch (err) {
      console.error("فشل في حفظ المصروف:", err);
      setErrors({ general: err.message || "فشل في حفظ المصروف. تحقق من البيانات." });
    }
  };

  const exportToExcel = async () => {
    try {
      await dispatch(
        fetchAllExpenses({
          category: filters.category,
          user: filters.user,
          related_employee: filters.related_employee,
          amount: filters.amount,
          description: filters.description,
          start_date: filters.start_date,
          end_date: filters.end_date,
        })
      ).unwrap();

      const data = allExpenses.map((expense) => ({
        'النادي': expense.club_details?.name || "غير متاح",
        'الفئة': expense.category_details?.name || "غير متاح",
        'المبلغ': expense.amount ? `${expense.amount} جنيه` : "غير متاح",
        'الوصف': expense.description || "غير متاح",
        'التاريخ': expense.date || "غير متاح",
        'رقم الفاتورة': expense.invoice_number || "غير متاح",
        'الموظف المرتبط': expense.related_employee_details?.first_name && expense.related_employee_details?.last_name
          ? `${expense.related_employee_details.first_name} ${expense.related_employee_details.last_name}`
          : expense.related_employee_details?.username || 'غير متاح',
        'الموظف المدفوع بواسطة': expense.paid_by_details?.first_name && expense.paid_by_details?.last_name
          ? `${expense.paid_by_details.first_name} ${expense.paid_by_details.last_name}`
          : expense.paid_by_details?.username || 'غير متاح',
      }));

      if (isSummaryClicked && totalExpensesCount > 0) {
        data.push({
          'النادي': "الإجمالي",
          'الفئة': "",
          'المبلغ': `${totalExpenses} جنيه`,
          'الوصف': `عدد المصروفات: ${totalExpensesCount}`,
          'التاريخ': "",
          'رقم الفاتورة': "",
          'الموظف المرتبط': "",
          'الموظف المدفوع بواسطة': "",
        });
      }

      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [
        { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
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

  const handleEditClick = (expense) => {
    const sanitizedExpense = {
      ...expense,
      category: expense.category?.toString() || "",
      amount: expense.amount?.toString() || "",
      description: expense.description || "",
      related_employee: expense.related_employee?.toString() || "",
      attachment: null,
    };
    setCurrentExpense(sanitizedExpense);
    setShowModal(true);
  };

  const handleDeleteClick = (id) => {
    setExpenseToDelete(id);
    setConfirmDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (expenseToDelete) {
      dispatch(deleteExpense(expenseToDelete))
        .unwrap()
        .then(() => {
          setConfirmDeleteModal(false);
          setExpenseToDelete(null);
          dispatch(fetchExpenses({ page: currentPage, ...filters }));
        })
        .catch((err) => {
          console.error("فشل في حذف المصروف:", err);
          setErrors({ general: "فشل في حذف المصروف" });
        });
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if ((name === "start_date" || name === "end_date") && value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      setErrors((prev) => ({ ...prev, [name]: "صيغة التاريخ غير صحيحة (YYYY-MM-DD)" }));
      return;
    }
    setFilters((prev) => ({ ...prev, [name]: value || "" }));
    setCurrentPage(1);
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value === "all" ? "" : value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    const today = new Date().toISOString().slice(0, 10);
    setFilters({
      category: "",
      user: "",
      related_employee: "",
      amount: "",
      description: "",
      start_date: today,
      end_date: today,
    });
    setCurrentPage(1);
    setIsSummaryClicked(false);
    setLocalExpenses([]);
    setLocalTotalExpenses(0);
    setLocalTotalExpensesCount(0);
  };

  const handleCalculateTotal = async () => {
    try {
      const startDate = filters.start_date || new Date().toISOString().slice(0, 10);
      const endDate = filters.end_date || new Date().toISOString().slice(0, 10);
      const response = await dispatch(
        fetchExpenseSummary({
          category: filters.category || null,
          user: filters.user || null,
          related_employee: filters.related_employee || null,
          amount: filters.amount || null,
          description: filters.description || null,
          start_date: startDate,
          end_date: endDate,
          details: true,
        })
      ).unwrap();
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
      setErrors({ general: "فشل في حساب الإجمالي: " + (err.message || "خطأ غير معروف") });
    }
  };

  const totalPages = expensesPagination?.count
    ? Math.ceil(expensesPagination.count / itemsPerPage)
    : 1;

  const PaginationControls = useCallback(
    ({ currentPage, setPage, pageCount }) => (
      <div className="flex justify-center items-center mt-6 gap-4">
        <Button
          onClick={() => setPage(currentPage - 1)}
          disabled={currentPage === 1}
          variant="outline"
          className="px-3 py-1 text-sm"
        >
          السابق
        </Button>
        <div className="flex gap-1">
          {getPageButtons(currentPage, pageCount).map((page, index) => (
            <Button
              key={index}
              onClick={() => typeof page === "number" && setPage(page)}
              variant={currentPage === page ? "default" : "outline"}
              disabled={typeof page !== "number"}
              className={`px-3 py-1 text-sm ${typeof page !== "number" ? "cursor-default" : ""}`}
            >
              {page}
            </Button>
          ))}
        </div>
        <Button
          onClick={() => setPage(currentPage + 1)}
          disabled={currentPage === pageCount || !expensesPagination?.next}
          variant="outline"
          className="px-3 py-1 text-sm"
        >
          التالي
        </Button>
        <span className="text-sm text-gray-600">
          صفحة {currentPage} من {pageCount || 1}
        </span>
      </div>
    ),
    [getPageButtons, expensesPagination]
  );

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
          {(filters.start_date || filters.end_date) && (
            <p className="text-sm text-gray-600">
              للفترة من {filters.start_date || "غير محدد"} إلى {filters.end_date || "غير محدد"}
            </p>
          )}
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
  }, [isSummaryClicked, localTotalExpenses, localTotalExpensesCount, filters.start_date, filters.end_date]);

  const summaryCardDetails = useMemo(() => {
    if (!isSummaryClicked || localTotalExpenses <= 0) return null;
    const selectedCategory = expenseCategories.find((cat) => cat.id.toString() === filters.category) || { name: "جميع الفئات" };
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-right mt-4">
        <p className="text-sm text-gray-700">عدد المصروفات: {localTotalExpensesCount}</p>
        <p className="text-sm text-gray-700">الإجمالي: {localTotalExpenses} جنيه</p>
        <p className="text-sm text-gray-700">
          التاريخ: من {filters.start_date || "غير محدد"} إلى {filters.end_date || "غير محدد"}
        </p>
        <p className="text-sm text-gray-700">الفئة: {selectedCategory.name}</p>
      </div>
    );
  }, [isSummaryClicked, localTotalExpenses, localTotalExpensesCount, filters.start_date, filters.end_date, filters.category, expenseCategories]);

  if (!canViewExpense) {
    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
        <Card className="border-gray-200 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-right text-xl">
              جميع المصروفات
            </CardTitle>
            <CardDescription className="text-right text-sm">
              ليس لديك صلاحية للوصول لهذه الصفحة
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-sans" dir="rtl">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-right flex items-center gap-3">
        <FiDollarSign className="text-teal-600 w-8 h-8" />
        إدارة المصروفات
      </h1>

      {errors.general && (
        <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 text-right">
          <FiAlertTriangle className="text-red-600 w-6 h-6" />
          <p className="text-red-600">{errors.general}</p>
        </div>
      )}

      <Tabs defaultValue="expenses" dir="rtl" className="bg-white rounded-lg shadow-sm">
        <TabsList className="bg-gray-100 rounded-t-lg p-2 flex justify-end">
          <TabsTrigger
            value="expenses"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium"
          >
            المصروفات
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium"
          >
            فئات المصروفات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="p-4">
          <ExpenseCategory />
        </TabsContent>

        <TabsContent value="expenses" className="p-4">
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
                  <ExpenseFilters
                    filters={filters}
                    expenseCategories={expenseCategories}
                    users={users}
                    handleFilterChange={handleFilterChange}
                    handleSelectChange={handleSelectChange}
                    handleReset={handleResetFilters}
                    handleCalculateTotal={handleCalculateTotal}
                    isValidFilter={isValidFilter}
                  />
                  {summaryCardDetails && <div className="mt-4">{summaryCardDetails}</div>}
                </div>
                <div className="flex flex-col gap-2">
                  {canAddExpense && (
                    <Button
                      onClick={() => {
                        setCurrentExpense(null);
                        setNewExpense({
                          category: "",
                          amount: "",
                          description: "",
                          related_employee: "",
                          attachment: null,
                        });
                        setShowModal(true);
                      }}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-sm w-full sm:w-auto"
                    >
                      <FiPlus className="ml-2 w-5 h-5" />
                      إضافة مصروف
                    </Button>
                  )}
                  <Button
                    onClick={exportToExcel}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm w-full sm:w-auto"
                  >
                    تصدير إلى إكسيل
                  </Button>
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

              <ExpenseTable
                expenses={isSummaryClicked ? localExpenses : expenses}
                handleEditClick={handleEditClick}
                handleDeleteClick={handleDeleteClick}
                canEditExpense={canEditExpense}
                canDeleteExpense={canDeleteExpense}
              />
              <ExpenseCards
                expenses={isSummaryClicked ? localExpenses : expenses}
                handleEditClick={handleEditClick}
                handleDeleteClick={handleDeleteClick}
                canEditExpense={canEditExpense}
                canDeleteExpense={canDeleteExpense}
              />

              <PaginationControls
                currentPage={currentPage}
                setPage={setCurrentPage}
                pageCount={totalPages}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddEditExpenseModal
        showModal={showModal}
        setShowModal={setShowModal}
        currentExpense={currentExpense}
        newExpense={newExpense}
        userClub={userClub}
        expenseCategories={expenseCategories}
        users={users}
        handleChange={handleChange}
        handleSave={handleSave}
        errors={errors}
        canEditExpense={canEditExpense}
        canAddExpense={canAddExpense}
      />

      <DeleteConfirmationModal
        confirmDeleteModal={confirmDeleteModal}
        setConfirmDeleteModal={setConfirmDeleteModal}
        handleConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
};

export default Expenses;