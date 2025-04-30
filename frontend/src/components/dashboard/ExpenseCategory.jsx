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

  // Fetch expense categories from the backend
  const { expenseCategories, loading, error } = useSelector(
    (state) => state.finance
  );

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchExpenseCategories());
  }, [dispatch]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error on typing
  };

  // Validate form data
  const validate = () => {
    const newErrors = {};
    if (!formData.club.trim()) newErrors.club = "النادي مطلوب.";
    if (!formData.name.trim()) newErrors.name = "الاسم مطلوب.";
    if (!formData.description.trim()) newErrors.description = "الوصف مطلوب.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  // Add new expense category via API
  const handleAdd = () => {
    if (validate()) {
      dispatch(addExpenseCategory(formData))
        .unwrap()
        .then(() => {
          setFormData({ club: "", name: "", description: "" }); // Reset form
          setShowModal(false); // Close modal
        })
        .catch((err) => {
          console.error("فشل في إضافة فئة المصروف:", err);
        });
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Tabs */}
      <Tabs defaultValue="categories" dir="rtl">
        {/* Categories Tab */}
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
                  {expenseCategories.map((category, index) => (
                    <tr key={index} className="hover:bg-gray-100 transition">
                      <td className="px-4 py-3 text-sm">
                        {category.club || "غير متاح"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {category.name || "غير متاح"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {category.description || "غير متاح"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Tabs>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-40 flex justify-center items-center  bg-opacity-50"
          onClick={() => setShowModal(false)} // Close modal when clicking outside
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md overflow-y-auto max-h-[80vh]"
            onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
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
