import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FiDollarSign, FiList, FiAlertTriangle } from "react-icons/fi";
import { Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchIncomeSummary,
  fetchIncomeSources,
  fetchIncomes,
  addIncome,
  updateIncome,
  deleteIncome,
  fetchAllIncomes,
} from "../../redux/slices/financeSlice";
import BASE_URL from "../../config/api";
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
import IncomeTable from "./IncomeTable";
import IncomeCards from "./IncomeCards";
import IncomeFilters from "./IncomeFilters";
import AddEditIncomeModal from "./AddEditIncomeModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import IncomeSourcesList from "./IncomeSourcesList";
import usePermission from "@/hooks/usePermission";
import AddIncomeForm from "./AddIncomeForm";

const Incomes = () => {
  const dispatch = useDispatch();
  const canAddIncome = usePermission("add_income");
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [newItem, setNewItem] = useState({
    club: "",
    source: "",
    amount: "",
    description: "",
    date: "",
    received_by: "",
  });
  const [userClub, setUserClub] = useState(null);
  const [filters, setFilters] = useState({
    source: "",
    startDate: "",
    endDate: "",
  });
  const [incomePage, setIncomePage] = useState(1);
  const [incomeSourcesPage, setIncomeSourcesPage] = useState(1);
  const [isSummaryClicked, setIsSummaryClicked] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [errors, setErrors] = useState({});

  const maxButtons = 5;

  const {
    incomes,
    incomeSources,
    loading,
    error,
    incomesPagination,
    totalIncome,
    totalIncomeCount,
    allIncomes,
  } = useSelector((state) => state.finance);
  const { user } = useSelector((state) => state.auth);

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
        setUserClub({
          id: data.club.id,
          name: data.club.name,
        });
        setNewItem((prev) => ({ ...prev, club: data.club.id.toString() }));
      })
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
        setErrors({ general: "فشل في تحميل بيانات المستخدم" });
      });
  }, []);

  const debouncedFetchIncomes = useCallback(
    debounce((filters, page) => {
      dispatch(
        fetchIncomes({
          page,
          filters: {
            source: filters.source,
            start_date: filters.startDate,
            end_date: filters.endDate,
          },
        })
      );
    }, 300),
    [dispatch]
  );

  useEffect(() => {
    debouncedFetchIncomes(filters, incomePage);
    dispatch(fetchIncomeSources());
  }, [filters, incomePage, debouncedFetchIncomes]);

  const incomePageCount = Math.ceil((incomesPagination?.count || 0) / 20);
  const incomeSourcePageCount = Math.ceil(incomeSources.length / 20);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = name === "amount" ? parseFloat(value) || 0 : value;

    if (currentItem) {
      setCurrentItem((prev) => ({ ...prev, [name]: newValue }));
    } else {
      setNewItem((prev) => ({ ...prev, [name]: newValue }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = (data) => {
    const newErrors = {};
    if (!data.source || isNaN(parseInt(data.source))) newErrors.source = "مصدر الدخل مطلوب.";
    if (!data.amount && data.amount !== 0) newErrors.amount = "المبلغ مطلوب.";
    if (!data.date) newErrors.date = "التاريخ مطلوب.";
    return newErrors;
  };

  const handleSave = () => {
    const data = currentItem || newItem;
    const validationErrors = validateForm(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = currentItem
      ? {
          id: currentItem.id,
          club: parseInt(currentItem.club) || null,
          source: parseInt(currentItem.source) || null,
          amount: parseFloat(currentItem.amount) || 0,
          description: currentItem.description || "",
          date: currentItem.date || "",
          received_by: parseInt(currentItem.received_by) || null,
        }
      : {
          club: parseInt(newItem.club) || null,
          source: parseInt(newItem.source) || null,
          amount: parseFloat(newItem.amount) || 0,
          description: newItem.description || "",
          date: newItem.date || "",
          received_by: parseInt(newItem.received_by) || null,
        };

    const action = currentItem
      ? updateIncome({ id: currentItem.id, updatedData: payload })
      : addIncome(payload);

    dispatch(action)
      .unwrap()
      .then(() => {
        setCurrentItem(null);
        setNewItem({
          club: userClub?.id.toString() || "",
          source: "",
          amount: "",
          description: "",
          date: "",
          received_by: "",
        });
        setShowModal(false);
        setErrors({});
        dispatch(fetchIncomes({ page: 1, filters }));
      })
      .catch((err) => {
        console.error(`فشل في ${currentItem ? "تحديث" : "إضافة"} دخل`, err);
        setErrors({ general: err.message || "فشل في حفظ الإيراد" });
      });
  };

  const handleEditClick = (item) => {
    const sanitizedItem = {
      ...item,
      club: item.club?.toString() || userClub?.id.toString() || "",
      source: item.source?.toString() || "",
      amount: item.amount?.toString() || "0",
      description: item.description || "",
      date: item.date || "",
      received_by: item.received_by?.toString() || "",
    };
    setCurrentItem(sanitizedItem);
    setShowModal(true);
  };

  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setConfirmDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      dispatch(deleteIncome(itemToDelete))
        .unwrap()
        .then(() => {
          setConfirmDeleteModal(false);
          setItemToDelete(null);
          dispatch(fetchIncomes({ page: incomePage, filters }));
        })
        .catch((err) => {
          console.error("فشل في حذف الإيراد:", err);
          setErrors({ general: "فشل في حذف الإيراد" });
        });
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setIncomePage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      source: "",
      startDate: "",
      endDate: "",
    });
    setIncomePage(1);
    setIsSummaryClicked(false);
  };

  const handleCalculateTotal = async () => {
    try {
      const response = await dispatch(
        fetchIncomeSummary({
          start: filters.startDate || null,
          end: filters.endDate || null,
          details: true,
          userId: user.id,
          source: filters.source || null,
        })
      ).unwrap();
      setIsSummaryClicked(true);
      if (!response.details || response.details.length === 0) {
        setErrors({ general: "لا توجد إيرادات في هذا النطاق" });
      }
    } catch (err) {
      console.error("فشل في حساب الإجمالي:", err);
      setErrors({ general: "فشل في حساب الإجمالي" });
    }
  };

  const exportToExcel = async () => {
    try {
      await dispatch(
        fetchAllIncomes({
          startDate: filters.startDate,
          endDate: filters.endDate,
          source: filters.source,
        })
      ).unwrap();

      const data = allIncomes.map((income) => ({
        'مصدر الدخل': income.source_details?.name || "غير متاح",
        'المبلغ': income.amount ? `${income.amount} جنيه` : "غير متاح",
        'الوصف': income.description || "لا يوجد وصف",
        'التاريخ': income.date || "غير متاح",
        'المستلم': income.received_by_details?.username || "غير متاح",
      }));

      if (isSummaryClicked && totalIncomeCount > 0) {
        data.push({
          'مصدر الدخل': "الإجمالي",
          'المبلغ': `${totalIncome} جنيه`,
          'الوصف': `عدد الإيرادات: ${totalIncomeCount}`,
          'التاريخ': "",
          'المستلم': "",
        });
      }

      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [
        { wch: 20 },
        { wch: 15 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "الإيرادات");
      XLSX.writeFile(wb, `إيرادات_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error("فشل في تصدير الإيرادات:", err);
      setErrors({ general: "فشل في تصدير الإيرادات إلى إكسيل" });
    }
  };

  const PaginationControls = useCallback(({ currentPage, setPage, pageCount }) => (
    <div className="flex justify-center items-center mt-6 gap-4">
      <Button
        onClick={() => setPage(currentPage - 1)}
        disabled={currentPage === 1}
        variant="outline"
        className="px-3 py-1"
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
            className={`px-3 py-1 ${typeof page !== "number" ? "cursor-default" : ""}`}
          >
            {page}
          </Button>
        ))}
      </div>
      <Button
        onClick={() => setPage(currentPage + 1)}
        disabled={currentPage === pageCount}
        variant="outline"
        className="px-3 py-1"
      >
        التالي
      </Button>
      <span className="text-sm text-gray-600">
        صفحة {currentPage} من {pageCount || 1}
      </span>
    </div>
  ), [getPageButtons]);

  const summaryCard = useMemo(() => {
    if (!isSummaryClicked) return null;
    if (totalIncome > 0) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-right mb-4">
          <div className="flex items-center gap-2">
            <FiDollarSign className="text-green-600 w-6 h-6" />
            <p className="text-lg font-semibold text-gray-800">
              عدد الإيرادات: {totalIncomeCount}
            </p>
          </div>
          <p className="text-lg font-semibold text-gray-800">
            إجمالي الإيرادات: {totalIncome} جنيه
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
            لا توجد إيرادات
          </p>
        </div>
      </div>
    );
  }, [isSummaryClicked, totalIncome, totalIncomeCount, filters.startDate, filters.endDate]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-sans" dir="rtl">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-right flex items-center gap-3">
        <FiDollarSign className="text-green-600 w-8 h-8" />
        إدارة الدخل
      </h1>

      {errors.general && (
        <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 text-right">
          <FiAlertTriangle className="text-red-600 w-6 h-6" />
          <p className="text-red-600">{errors.general}</p>
        </div>
      )}

      <Tabs defaultValue="incomes" dir="rtl" className="bg-white rounded-lg shadow-sm">
        <TabsList className="bg-gray-100 rounded-t-lg p-2 flex justify-end">
          <TabsTrigger
            value="incomes"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium"
          >
            الإيرادات
          </TabsTrigger>
          <TabsTrigger
            value="sources"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium"
          >
            مصادر الإيرادات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="p-4">
          <Card className="border-gray-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-right flex items-center gap-2 text-xl">
                <FiList className="text-green-600 w-6 h-6" />
                مصادر الإيرادات
              </CardTitle>
              <CardDescription className="text-right text-sm text-gray-600">
                إدارة مصادر الإيرادات لنادي {userClub?.name || "جاري التحميل..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <IncomeSourcesList />
              <PaginationControls
                currentPage={incomeSourcesPage}
                setPage={setIncomeSourcesPage}
                pageCount={incomeSourcePageCount}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incomes" className="p-4">
          <Card className="border-gray-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-right flex items-center gap-2 text-xl">
                <FiDollarSign className="text-green-600 w-6 h-6" />
                جميع الإيرادات
              </CardTitle>
              <CardDescription className="text-right text-sm text-gray-600">
                إدارة جميع الإيرادات لنادي {userClub?.name || "جاري التحميل..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <IncomeFilters
                  filters={filters}
                  incomeSources={incomeSources}
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

              {canAddIncome && <AddIncomeForm />}

              {loading && (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="animate-spin w-8 h-8 text-green-600" />
                  <span className="mr-4 text-gray-600">جاري التحميل...</span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 text-right">
                  <FiAlertTriangle className="text-red-600 w-6 h-6" />
                  <p className="text-red-600">خطأ: {error}</p>
                </div>
              )}

              <IncomeTable
                incomes={incomes}
                handleEditClick={handleEditClick}
                handleDeleteClick={handleDeleteClick}
              />
              <IncomeCards
                incomes={incomes}
                handleEditClick={handleEditClick}
                handleDeleteClick={handleDeleteClick}
              />

              <PaginationControls
                currentPage={incomePage}
                setPage={setIncomePage}
                pageCount={incomePageCount}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddEditIncomeModal
        showModal={showModal}
        setShowModal={setShowModal}
        currentItem={currentItem}
        newItem={newItem}
        userClub={userClub}
        incomeSources={incomeSources}
        handleChange={handleChange}
        handleSave={handleSave}
      />

      <DeleteConfirmationModal
        confirmDeleteModal={confirmDeleteModal}
        setConfirmDeleteModal={setConfirmDeleteModal}
        handleConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
};

export default Incomes;