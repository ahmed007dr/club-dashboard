import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { FiDollarSign, FiAlertTriangle } from "react-icons/fi";
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
    club: "",
    category: "",
    amount: "",
    description: "",
    date: "",
    invoice_number: "",
    attachment: null,
  });
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [filters, setFilters] = useState({
    category: "",
    startDate: "",
    endDate: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [userClub, setUserClub] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSummaryClicked, setIsSummaryClicked] = useState(false);
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
  }, [dispatch]);

  useEffect(() => {
    fetch(`${BASE_URL}/accounts/api/profile/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setUserClub({ id: data.club.id, name: data.club.name });
        setNewExpense((prev) => ({ ...prev, club: data.club.id.toString() }));
      })
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
        setErrors({ general: "فشل في تحميل بيانات المستخدم" });
      });
  }, []);

  const debouncedFetchExpenses = useCallback(
    debounce((filters, page) => {
      dispatch(
        fetchExpenses({
          page,
          start_date: filters.startDate,
          end_date: filters.endDate,
          category: filters.category,
        })
      );
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
    if (!data.club || isNaN(parseInt(data.club))) newErrors.club = "النادي مطلوب.";
    if (!data.category || isNaN(parseInt(data.category))) newErrors.category = "الفئة مطلوبة.";
    if (!data.amount && data.amount !== 0) newErrors.amount = "المبلغ مطلوب.";
    if (!data.date) newErrors.date = "التاريخ مطلوب.";
    return newErrors;
  };

  const handleSave = () => {
    const data = currentExpense || newExpense;
    const validationErrors = validateForm(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const formData = new FormData();
    formData.append("club", parseInt(data.club));
    formData.append("category", parseInt(data.category));
    formData.append("amount", parseFloat(data.amount));
    formData.append("description", data.description || "");
    formData.append("date", data.date);
    formData.append("invoice_number", data.invoice_number || "");
    if (data.attachment) formData.append("attachment", data.attachment);

    const action = currentExpense
      ? updateExpense({ id: currentExpense.id, updatedData: formData })
      : addExpense(formData);

    dispatch(action)
      .unwrap()
      .then(() => {
        setShowModal(false);
        setCurrentExpense(null);
        setNewExpense({
          club: userClub?.id.toString() || "",
          category: "",
          amount: "",
          description: "",
          date: "",
          invoice_number: "",
          attachment: null,
        });
        setErrors({});
        setCurrentPage(1);
        dispatch(fetchExpenses({ page: 1, filters }));
      })
      .catch((err) => {
        console.error("فشل في حفظ المصروف:", err);
        setErrors({ general: err.message || "فشل في حفظ المصروف" });
      });
  };

  const exportToExcel = async () => {
    try {
      await dispatch(
        fetchAllExpenses({
          startDate: filters.startDate,
          endDate: filters.endDate,
          categoryId: filters.category,
        })
      ).unwrap();

      const data = allExpenses.map((expense) => ({
        'النادي': expense.club_details?.name || "غير متاح",
        'الفئة': expense.category_details?.name || "غير متاح",
        'المبلغ': expense.amount ? `${expense.amount} جنيه` : "غير متاح",
        'الوصف': expense.description || "غير متاح",
        'التاريخ': expense.date || "غير متاح",
        'رقم الفاتورة': expense.invoice_number || "غير متاح",
      }));

      if (isSummaryClicked && totalExpensesCount > 0) {
        data.push({
          'النادي': "الإجمالي",
          'الفئة': "",
          'المبلغ': `${totalExpenses} جنيه`,
          'الوصف': `عدد المصروفات: ${totalExpensesCount}`,
          'التاريخ': "",
          'رقم الفاتورة': "",
        });
      }

      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "المصروفات");
      XLSX.writeFile(wb, `مصروفات_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error("فشل في تصدير المصروفات:", err);
      setErrors({ general: "فشل في تصدير المصروفات إلى إكسيل" });
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
  }, []);

  const handleEditClick = (expense) => {
    const sanitizedExpense = {
      ...expense,
      club: expense.club?.toString() || userClub?.id.toString() || "",
      category: expense.category?.toString() || "",
      amount: expense.amount?.toString() || "",
      description: expense.description || "",
      date: expense.date || "",
      invoice_number: expense.invoice_number || "",
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
          dispatch(fetchExpenses({ page: currentPage, filters }));
        })
        .catch((err) => {
          console.error("فشل في حذف المصروف:", err);
          setErrors({ general: "فشل في حذف المصروف" });
        });
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      category: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
    setIsSummaryClicked(false);
  };

  const handleCalculateTotal = async () => {
    try {
      const response = await dispatch(
        fetchExpenseSummary({
          start: filters.startDate || null,
          end: filters.endDate || null,
          details: true,
          userId: user.id,
          category: filters.category || null,
        })
      ).unwrap();
      setIsSummaryClicked(true);
      if (!response.details || response.details.length === 0) {
        setErrors({ general: "لا توجد مصروفات في هذا النطاق" });
      }
    } catch (err) {
      console.error("فشل في حساب الإجمالي:", err);
      setErrors({ general: "فشل في حساب الإجمالي" });
    }
  };

  const totalPages = expensesPagination?.count
    ? Math.ceil(expensesPagination.count / itemsPerPage)
    : 1;

  const PaginationControls = useCallback(({ currentPage, setPage, pageCount }) => (
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
  ), [getPageButtons, expensesPagination]);

  const summaryCard = useMemo(() => {
    if (!isSummaryClicked) return null;
    if (totalExpenses > 0) {
      return (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 text-right mb-4">
          <div className="flex items-center gap-2">
            <FiDollarSign className="text-teal-600 w-6 h-6" />
            <p className="text-lg font-semibold text-gray-800">
              عدد المصروفات: {totalExpensesCount}
            </p>
          </div>
          <p className="text-lg font-semibold text-gray-800">
            إجمالي المصروفات: {totalExpenses} جنيه
          </p>
          {(filters.startDate || filters.endDate) && (
            <p className="text-sm text-gray-600">
              للفترة من {filters.startDate || "غير محدد"} إلى {filters.endDate || "غير محدد"}
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
  }, [isSummaryClicked, totalExpenses, totalExpensesCount, filters.startDate, filters.endDate]);

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
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <ExpenseFilters
                  filters={filters}
                  expenseCategories={expenseCategories}
                  handleFilterChange={handleFilterChange}
                  handleReset={handleResetFilters}
                  handleCalculateTotal={handleCalculateTotal}
                />
                <Button
                  onClick={exportToExcel}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm"
                >
                  تصدير إلى إكسيل
                </Button>
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
                expenses={expenses}
                handleEditClick={handleEditClick}
                handleDeleteClick={handleDeleteClick}
                canEditExpense={canEditExpense}
                canDeleteExpense={canDeleteExpense}
              />
              <ExpenseCards
                expenses={expenses}
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