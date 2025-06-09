import React, { useState, useEffect, useCallback } from "react";
import { FiAlertTriangle, FiList ,FiPlus} from "react-icons/fi";
import { Loader2, RefreshCw } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchExpenseCategories, addExpenseCategory } from "../../redux/slices/financeSlice";
import BASE_URL from "@/config/api";
import { debounce } from "lodash";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CategoryTable from "./CategoryTable";
import CategoryCards from "./CategoryCards";
import CategoryFilters from "./CategoryFilters";
import AddCategoryModal from "./AddCategoryModal";
import usePermission from "@/hooks/usePermission";

const ExpenseCategory = () => {
  const dispatch = useDispatch();
  const canViewExpenseCategories = usePermission("view_expensecategory");
  const canAddExpenseCategory = usePermission("add_expensecategory");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    club: "",
    name: "",
    description: "",
  });
  const [filters, setFilters] = useState({
    name: "",
    description: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [userClub, setUserClub] = useState(null);
  const [errors, setErrors] = useState({});
  const itemsPerPage = 20;
  const maxButtons = 5;

  const {
    expenseCategories,
    expenseCategoriesPagination,
    loading,
    error,
  } = useSelector((state) => state.finance);

  const totalPages = Math.ceil(expenseCategoriesPagination.count / itemsPerPage);

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
        setFormData((prev) => ({ ...prev, club: data.club.id.toString() }));
      })
      .catch((err) => {
        console.error("Profile Fetch Error:", err);
        setErrors({ general: "فشل في تحميل بيانات المستخدم" });
      });
  }, []);

  const debouncedFetchCategories = useCallback(
    debounce((filters, page) => {
      dispatch(fetchExpenseCategories({ page, filters }));
    }, 300),
    [dispatch]
  );

  useEffect(() => {
    if (userClub) {
      debouncedFetchCategories(filters, currentPage);
    }
  }, [filters, currentPage, userClub, debouncedFetchCategories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = (data) => {
    const newErrors = {};
    if (!data.club || isNaN(parseInt(data.club))) newErrors.club = "النادي مطلوب.";
    if (!data.name) newErrors.name = "الاسم مطلوب.";
    return newErrors;
  };

  const handleAdd = () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      ...formData,
      club: parseInt(formData.club) || null,
    };
    dispatch(addExpenseCategory(payload))
      .unwrap()
      .then(() => {
        setFormData({ club: userClub?.id.toString() || "", name: "", description: "" });
        setShowModal(false);
        setErrors({});
        dispatch(fetchExpenseCategories({ page: currentPage, filters }));
      })
      .catch((err) => {
        console.error("Add Category Error:", err);
        setErrors({ general: err.message || "فشل في إضافة الفئة" });
      });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      name: "",
      description: "",
    });
    setCurrentPage(1);
  };

  const handleRetry = () => {
    dispatch(fetchExpenseCategories({ page: currentPage, filters }));
  };

  const getPageButtons = useCallback(() => {
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

    for (let page = startPage; page <= endPage; page++) {
      buttons.push(page);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) buttons.push("...");
      buttons.push(totalPages);
    }

    return buttons;
  }, [currentPage, totalPages]);

  const PaginationControls = useCallback(({ currentPage, setPage, pageCount }) => (
    <div className="flex justify-center items-center mt-6 gap-4">
      <Button
        onClick={() => setPage(currentPage - 1)}
        disabled={currentPage === 1 || loading}
        variant="outline"
        className="px-3 py-1 text-sm"
      >
        السابق
      </Button>
      <div className="flex gap-1">
        {getPageButtons().map((page, index) => (
          <Button
            key={index}
            onClick={() => typeof page === "number" && setPage(page)}
            variant={currentPage === page ? "default" : "outline"}
            disabled={typeof page !== "number" || loading}
            className={`px-3 py-1 text-sm ${typeof page !== "number" ? "cursor-default" : ""}`}
          >
            {page}
          </Button>
        ))}
      </div>
      <Button
        onClick={() => setPage(currentPage + 1)}
        disabled={currentPage === pageCount || loading}
        variant="outline"
        className="px-3 py-1 text-sm"
      >
        التالي
      </Button>
      <span className="text-sm text-gray-600">
        صفحة {currentPage} من {pageCount || 1}
      </span>
    </div>
  ), [getPageButtons, currentPage, totalPages, loading]);

  if (!canViewExpenseCategories) {
    return (
      <Card className="border-gray-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-right flex items-center gap-2 text-xl">
            <FiList className="text-teal-600 w-6 h-6" />
            فئات المصروفات
          </CardTitle>
          <CardDescription className="text-right text-sm">
            ليس لديك صلاحية للوصول لهذه الصفحة
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-right flex items-center gap-2 text-xl">
          <FiList className="text-teal-600 w-6 h-6" />
          فئات المصروفات
        </CardTitle>
        <CardDescription className="text-right text-sm text-gray-600">
          إدارة فئات المصروفات لنادي {userClub?.name || "جاري التحميل..."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 text-right">
            <FiAlertTriangle className="text-red-600 w-6 h-6" />
            <p className="text-red-600">{errors.general}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <CategoryFilters
            filters={filters}
            handleFilterChange={handleFilterChange}
            handleReset={handleResetFilters}
          />
          <Button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-sm"
            disabled={!canAddExpenseCategory}
          >
            <FiPlus className="h-4 w-4" />
            إضافة فئة مصروف
          </Button>
        </div>

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
            <Button
              onClick={handleRetry}
              className="mr-4 flex items-center gap-2 text-sm"
            >
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </Button>
          </div>
        )}

        {!loading && !error && (
          <>
            <CategoryTable categories={expenseCategories} />
            <CategoryCards categories={expenseCategories} />
            <PaginationControls
              currentPage={currentPage}
              setPage={setCurrentPage}
              pageCount={totalPages}
            />
          </>
        )}
      </CardContent>

      <AddCategoryModal
        showModal={showModal}
        setShowModal={setShowModal}
        formData={formData}
        userClub={userClub}
        handleChange={handleChange}
        handleAdd={handleAdd}
        errors={errors}
      />
    </Card>
  );
};

export default ExpenseCategory;