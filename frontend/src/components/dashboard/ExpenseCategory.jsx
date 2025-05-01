import React, { useState, useEffect } from "react";
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

  // Fetch expense categories from the backend
  const { expenseCategories, loading, error } = useSelector(
    (state) => state.finance
  );

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchExpenseCategories());
  }, [dispatch]);

  // Handle input changes for form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Validate form data
  const validate = () => {
    const newErrors = {};
    if (!formData.club.trim()) newErrors.club = "النادي مطلوب.";
    if (!formData.name.trim()) newErrors.name = "الاسم مطلوب.";
    if (!formData.description.trim()) newErrors.description = "الوصف مطلوب.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add new expense category via API
  const handleAdd = () => {
    if (validate()) {
      dispatch(addExpenseCategory(formData))
        .unwrap()
        .then(() => {
          setFormData({ club: "", name: "", description: "" });
          setShowModal(false);
        })
        .catch((err) => {
          console.error("فشل في إضافة فئة المصروف:", err);
        });
    }
  };

  // Debug: Log expenseCategories to inspect data
  useEffect(() => {
    console.log("expenseCategories:", expenseCategories);
    expenseCategories.forEach((category, index) => {
      console.log(`Category ${index}:`, {
        club: category.club,
        clubType: typeof category.club,
        name: category.name,
        nameType: typeof category.name,
        description: category.description,
        descriptionType: typeof category.description,
      });
    });
  }, [expenseCategories]);

  // Filter and paginate categories
  const filteredCategories = expenseCategories.filter((category) => {
    // Safely convert values to strings, handling all edge cases
    const safeToString = (value) => {
      if (value === null || value === undefined) return "";
      return String(value).toLowerCase();
    };

    const club = safeToString(category.club);
    const name = safeToString(category.name);
    const description = safeToString(category.description);

    return (
      club.includes(filters.club.toLowerCase()) &&
      name.includes(filters.name.toLowerCase()) &&
      description.includes(filters.description.toLowerCase())
    );
  });

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
    <div className="p-6 space-y-6" dir="rtl">
      <Tabs defaultValue="categories" dir="rtl">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-right">جميع فئات المصروفات</CardTitle>
            <CardDescription className="text-right">
              إدارة جميع فئات المصروفات
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Category Button */}
            <Button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-start"
            >
              <Plus className="mr-2 h-4 w-4" />
              إضافة فئة مصروف
            </Button>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[
                { label: "النادي", name: "club" },
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
                    className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right"
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
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      النادي
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      الاسم
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      الوصف
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {paginatedCategories.map((category, index) => (
                    <tr key={index} className="hover:bg-gray-100 transition">
                      <td className="px-4 py-3 text-sm">
                        {category.club ? String(category.club) : "غير متاح"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {category.name ? String(category.name) : "غير متاح"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {category.description
                          ? String(category.description)
                          : "غير متاح"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                عرض {paginatedCategories.length} من {filteredCategories.length}{" "}
                فئة
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2"
                >
                  السابق
                </Button>
                <span className="px-4 py-2">
                  صفحة {currentPage} من {totalPages}
                </span>
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2"
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
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md overflow-y-auto max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4 text-right">
              إضافة فئة مصروف
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: "النادي", name: "club" },
                { label: "الاسم", name: "name" },
                { label: "الوصف", name: "description" },
              ].map(({ label, name }) => (
                <div key={name}>
                  <label className="block text-sm font-medium capitalize mb-1 text-right">
                    {label}
                  </label>
                  <input
                    type="text"
                    name={name}
                    value={formData[name] || ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right"
                  />
                  {errors[name] && (
                    <p className="text-red-500 text-sm text-right">
                      {errors[name]}
                    </p>
                  )}
                </div>
              ))}
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
