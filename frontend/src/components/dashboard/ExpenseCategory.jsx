import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchExpenseCategories, addExpenseCategory } from "../../redux/slices/financeSlice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import BASE_URL from "@/config/api";
import usePermission from "@/hooks/usePermission";

const ExpenseCategory = () => {
  const dispatch = useDispatch();
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
  const [itemsPerPage] = useState(20); // Fixed at 20 items per page
  const [userClub, setUserClub] = useState(null);

  const { expenseCategories, expenseCategoriesPagination, loading, error } = useSelector(
    (state) => state.finance
  );

  const canViewExpenseCategories = usePermission("view_expensecategory");
  const canAddExpenseCategory = usePermission("add_expensecategory");

  // Calculate total pages from backend count
  const totalPages = Math.ceil(expenseCategoriesPagination.count / itemsPerPage);

  // Fetch user profile
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
      .catch((error) => {
        console.error('Profile Fetch Error:', error);
      });
  }, []);

  // Fetch expense categories with pagination and filters
  useEffect(() => {
    if (userClub) {
      dispatch(fetchExpenseCategories({ page: currentPage, filters }));
    }
  }, [dispatch, currentPage, filters, userClub]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Add expense category
  const handleAdd = () => {
    const payload = {
      ...formData,
      club: parseInt(formData.club) || null,
    };
    dispatch(addExpenseCategory(payload))
      .unwrap()
      .then(() => {
        setFormData({ club: userClub?.id.toString() || "", name: "", description: "" });
        setShowModal(false);
        dispatch(fetchExpenseCategories({ page: currentPage, filters }));
      })
      .catch((error) => {
        console.error('Add Category Error:', error);
      });
  };

  // Retry fetching categories
  const handleRetry = () => {
    dispatch(fetchExpenseCategories({ page: currentPage, filters }));
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate pagination buttons (max 5)
  const getPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let page = startPage; page <= endPage; page++) {
      buttons.push(
        <Button
          key={page}
          onClick={() => handlePageChange(page)}
          disabled={page === currentPage || loading}
          className={`px-3 py-1 text-sm ${page === currentPage ? 'bg-green-500 text-white' : ''}`}
        >
          {page}
        </Button>
      );
    }
    return buttons;
  };

  if (!canViewExpenseCategories) {
    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-right text-lg sm:text-xl">
              جميع فئات المصروفات
            </CardTitle>
            <CardDescription className="text-right text-sm sm:text-base">
              ليس لديك صلاحية للوصول لهذه الصفحة
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-right text-lg sm:text-xl">
            جميع فئات المصروفات
          </CardTitle>
          <CardDescription className="text-right text-sm sm:text-base">
            إدارة جميع فئات المصروفات لنادي{" "}
            {userClub?.name || "جاري التحميل..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Category Button */}
          <Button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-start w-full sm:w-auto text-sm sm:text-base"
            disabled={!canAddExpenseCategory}
          >
            <Plus className="mr-2 h-4 w-4" />
            إضافة فئة مصروف
          </Button>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {[
              { label: "الاسم", name: "name" },
              { label: "الوصف", name: "description" },
            ].map(({ label, name }) => (
              <div key={name}>
                <label className="block text-sm font-medium mb-1 text-right">
                  تصفية حسب {label}
                </label>
                <input
                  type="text"
                  name={name}
                  value={filters[name]}
                  onChange={handleFilterChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right text-sm sm:text-base"
                  placeholder={`ابحث عن ${label}`}
                />
              </div>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <p className="text-lg text-gray-600 text-right">
              جاري التحميل...
            </p>
          )}

          {/* Error State */}
          {error && (
            <div className="text-lg text-red-600 text-right">
              <p>خطأ: {error}</p>
              <Button
                onClick={handleRetry}
                className="mt-2 flex items-center text-sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                إعادة المحاولة
              </Button>
            </div>
          )}

          {/* Table */}
          {!loading && !error && (
            <div className="rounded-md border overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-right text-xs sm:text-sm font-medium">
                      النادي
                    </th>
                    <th className="px-4 py-3 text-right text-xs sm:text-sm font-medium">
                      الاسم
                    </th>
                    <th className="px-4 py-3 text-right text-xs sm:text-sm font-medium">
                      الوصف
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {expenseCategories.length > 0 ? (
                    expenseCategories.map((category, index) => (
                      <tr key={index} className="hover:bg-gray-100 transition">
                        <td className="px-4 py-3 text-xs sm:text-sm">
                          {category.club_details?.name || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-xs sm:text-sm">
                          {category.name || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-xs sm:text-sm">
                          {category.description || "غير متاح"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-center text-sm">
                        لا توجد فئات مصروفات متاحة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
              <div className="text-xs sm:text-sm text-gray-600">
                عرض {Math.min(itemsPerPage, expenseCategories.length)} من{" "}
                {expenseCategoriesPagination.count} فئة
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="px-3 py-1 text-sm"
                >
                  السابق
                </Button>
                {getPaginationButtons()}
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="px-3 py-1 text-sm"
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      {showModal && canAddExpenseCategory && (
        <div className="fixed inset-0 z-40 flex justify-center items-center bg-black bg-opacity-50">
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4 text-right">
              إضافة فئة مصروف
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-right">
                  النادي
                </label>
                <select
                  name="club"
                  value={formData.club}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md text-right"
                  disabled
                >
                  {userClub && (
                    <option value={userClub.id}>{userClub.name}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-right">
                  الاسم
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-right">
                  الوصف
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md text-right"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                إلغاء
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseCategory;