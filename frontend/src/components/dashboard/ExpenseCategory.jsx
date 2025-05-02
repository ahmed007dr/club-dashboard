import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchExpenseCategories,
  addExpenseCategory,
} from "../../redux/slices/financeSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import BASE_URL from "@/config/api";

// Custom CSS for table overflow and modal responsiveness
const customStyles = `
  @media (max-width: 640px) {
    .responsive-table {
      display: block;
      overflow-x: auto;
      white-space: nowrap;
    }
    .modal-content {
      width: 90%;
      max-height: 90vh;
      padding: 1rem;
    }
  }
`;

const ExpenseCategory = () => {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    club: "",
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [filters, setFilters] = useState({
    club: "",
    name: "",
    description: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [userClub, setUserClub] = useState(null);

  const { expenseCategories, loading, error } = useSelector(
    (state) => state.finance
  );

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
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
      });
  }, []);

  // Fetch expense categories
  useEffect(() => {
    dispatch(fetchExpenseCategories());
  }, [dispatch]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // Form validation
  const validate = () => {
    const newErrors = {};
    if (!formData.club) newErrors.club = "النادي مطلوب.";
    if (!formData.name.trim()) newErrors.name = "الاسم مطلوب.";
    if (!formData.description.trim()) newErrors.description = "الوصف مطلوب.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add expense category
  const handleAdd = () => {
    if (validate()) {
      const payload = {
        ...formData,
        club: parseInt(formData.club) || null,
      };
      dispatch(addExpenseCategory(payload))
        .unwrap()
        .then(() => {
          setFormData({ club: userClub?.id.toString() || "", name: "", description: "" });
          setShowModal(false);
        })
        .catch((err) => {
          console.error("فشل في إضافة فئة المصروف:", err);
        });
    }
  };

  // Filter and paginate categories
  const filteredCategories = useMemo(() => {
    return expenseCategories.filter((category) => {
      const safeToString = (value) => (value ?? "").toString().toLowerCase();
      const club = category.club_details?.name ? safeToString(category.club_details.name) : "";
      const name = safeToString(category.name);
      const description = safeToString(category.description);

      return (
        category.club_details?.id === userClub?.id &&
        club.includes(filters.club.toLowerCase()) &&
        name.includes(filters.name.toLowerCase()) &&
        description.includes(filters.description.toLowerCase())
      );
    });
  }, [expenseCategories, filters, userClub]);

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      <style>{customStyles}</style>
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
        <Tabs defaultValue="categories" dir="rtl">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-right text-lg sm:text-xl">
                جميع فئات المصروفات
              </CardTitle>
              <CardDescription className="text-right text-sm sm:text-base">
                إدارة جميع فئات المصروفات لنادي {userClub?.name || "جاري التحميل..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Category Button */}
              <Button
                onClick={() => setShowModal(true)}
                className="flex items-center justify-start w-full sm:w-auto text-sm sm:text-base"
              >
                <Plus className="mr-2 h-4 w-4" />
                إضافة فئة مصروف
              </Button>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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
                <p className="text-lg text-red-600 text-right">خطأ: {error}</p>
              )}

              {/* Table */}
              <div className="rounded-md border responsive-table">
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
                    {paginatedCategories.length > 0 ? (
                      paginatedCategories.map((category, index) => (
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

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                <div className="text-xs sm:text-sm text-gray-600">
                  عرض {paginatedCategories.length} من {filteredCategories.length}{" "}
                  فئة
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm"
                  >
                    السابق
                  </Button>
                  <span className="px-4 py-2 text-sm">
                    صفحة {currentPage} من {totalPages}
                  </span>
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm"
                  >
                    التالي
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Tabs>

        {/* Add/Edit Modal */}
        {showModal && (
          <div
            className="fixed inset-0 z-40 flex justify-center items-center bg-black bg-opacity-50"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg sm:text-xl font-semibold mb-4 text-right">
                إضافة فئة مصروف
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {/* Club Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">
                    النادي
                  </label>
                  <select
                    name="club"
                    value={formData.club}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right text-sm sm:text-base"
                    disabled
                  >
                    {userClub ? (
                      <option value={userClub.id}>{userClub.name}</option>
                    ) : (
                      <option value="">جاري التحميل...</option>
                    )}
                  </select>
                  {errors.club && (
                    <p className="text-red-500 text-xs sm:text-sm text-right">
                      {errors.club}
                    </p>
                  )}
                </div>

                {/* Name and Description Inputs */}
                {[
                  { label: "الاسم", name: "name" },
                  { label: "الوصف", name: "description" },
                ].map(({ label, name }) => (
                  <div key={name}>
                    <label className="block text-sm font-medium mb-1 text-right">
                      {label}
                    </label>
                    <input
                      type="text"
                      name={name}
                      value={formData[name] || ""}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right text-sm sm:text-base"
                    />
                    {errors[name] && (
                      <p className="text-red-500 text-xs sm:text-sm text-right">
                        {errors[name]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-3 sm:px-4 py-1 sm:py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm sm:text-base"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleAdd}
                  className="px-3 sm:px-4 py-1 sm:py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm sm:text-base"
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ExpenseCategory;