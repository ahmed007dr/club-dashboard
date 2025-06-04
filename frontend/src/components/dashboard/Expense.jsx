import React, { useState, useEffect } from "react";
import { CiEdit, CiTrash } from "react-icons/ci";
import { Plus, MoreVertical } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchExpenseSummary,
  fetchExpenses,
  updateExpense,
  addExpense,
  deleteExpense,
  fetchExpenseCategories,
} from "../../redux/slices/financeSlice";
import BASE_URL from "@/config/api";
import usePermission from "@/hooks/usePermission";

const Expense = () => {
  const dispatch = useDispatch();
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [userClub, setUserClub] = useState(null);
  const [errors, setErrors] = useState({});
  const [summaryFilters, setSummaryFilters] = useState({
    startDate: "",
    endDate: "",
    categoryId: "",
  });
  const [isSummaryClicked, setIsSummaryClicked] = useState(false);
  const itemsPerPage = 20;

  const { expenses, loading, error, expensesPagination } = useSelector(
    (state) => state.finance
  );
  const { expenseCategories, totalExpenses, totalExpensesCount } = useSelector(
    (state) => state.finance
  );
  const { user } = useSelector((state) => state.auth);

  const canViewExpense = usePermission("view_expense");
  const canAddExpense = usePermission("add_expense");
  const canEditExpense = usePermission("change_expense");
  const canDeleteExpense = usePermission("delete_expense");

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
      .catch((err) => console.error("Failed to fetch user profile:", err));
  }, []);

  useEffect(() => {
    dispatch(fetchExpenses({ page: currentPage, startDate, endDate }));
  }, [currentPage, dispatch, endDate, startDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedValue =
      name === "amount" ? (value === "" ? "" : parseFloat(value) || "") : value;
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
          club: userClub?.id?.toString() || "",
          category: "",
          amount: "",
          description: "",
          date: "",
          invoice_number: "",
          attachment: null,
        });
        setErrors({});
        setCurrentPage(1);
        dispatch(fetchExpenses({ page: 1, startDate, endDate }));
      })
      .catch((err) => {
        console.error("فشل في حفظ المصروف:", err);
        if (err && typeof err === "object") {
          const formattedErrors = {};
          Object.keys(err).forEach((key) => {
            formattedErrors[key] = Array.isArray(err[key]) ? err[key][0] : err[key];
          });
          setErrors(formattedErrors);
        } else {
          setErrors({ general: err || "فشل في حفظ المصروف" });
        }
      });
  };

  const getPageButtons = (currentPage, totalPages) => {
    const buttons = [];
    const maxButtons = 5;
    const half = Math.floor(maxButtons / 2);
    let startPage = Math.max(1, currentPage - half);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(i);
    }
    return buttons;
  };

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
          dispatch(fetchExpenses({ page: currentPage, startDate, endDate }));
        })
        .catch((err) => console.error("فشل في حذف المصروف:", err));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSummaryFilters((prev) => ({ ...prev, [name]: value }));
  };

  const totalPages = expensesPagination?.count
    ? Math.ceil(expensesPagination.count / itemsPerPage)
    : 1;

  const handleTotalCalculation = async () => {
    await dispatch(
      fetchExpenseSummary({
        start: summaryFilters.startDate !== "" ? summaryFilters.startDate : null,
        end: summaryFilters.endDate !== "" ? summaryFilters.endDate : null,
        details: true,
        userId: user.id,
        category: summaryFilters.categoryId !== "" ? summaryFilters.categoryId : null,
      })
    );
    setIsSummaryClicked(true);
  };

  if (!canViewExpense) {
    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
        <div className="flex items-center justify-center h-full">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            ليست لديك صلاحية للوصول لهذه الصفحة
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-sans" dir="rtl">
      <div className="bg-white shadow-md rounded-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl sm:text-2xl font-bold text-teal-700 text-right">
            جميع المصروفات
          </h2>
          <p className="text-sm text-gray-600 text-right">
            إدارة جميع المصروفات لنادي {userClub?.name || "جاري التحميل..."}
          </p>
        </div>
        <div className="p-6 space-y-6">
          {errors.general && (
            <p className="text-red-500 text-sm text-right">{errors.general}</p>
          )}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">من:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">إلى:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm"
                />
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition w-full sm:w-auto text-sm disabled:bg-gray-400"
              disabled={!canAddExpense}
            >
              <Plus className="h-4 w-4" />
              إضافة مصروف
            </button>
          </div>

          {loading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-teal-600"></div>
            </div>
          )}

          {error && (
            <p className="text-red-600 text-sm text-right">خطأ: {error}</p>
          )}

          <div dir="rtl">
            {/* Table view (lg screens and above) */}
            <div className="hidden lg:block rounded-md border overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-teal-50">
                    {["النادي", "الفئة", "المبلغ", "الوصف", "التاريخ", "رقم الفاتورة", "الإجراءات"].map((header, idx) => (
                      <th
                        key={idx}
                        className="px-4 py-3 text-right text-sm font-semibold text-gray-700"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {expenses?.length > 0 ? (
                    expenses.map((expense, index) => (
                      <tr key={index} className="hover:bg-teal-50 transition">
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {expense.club_details?.name || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {expense.category_details?.name || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {expense.amount ? `${expense.amount} جنيه` : "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {expense.description || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {expense.date || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {expense.invoice_number || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm flex justify-end gap-2">
                          {canEditExpense && (
                            <button
                              onClick={() => handleEditClick(expense)}
                              className="p-1 text-yellow-600 hover:text-yellow-700 tooltip"
                              data-tooltip="تعديل"
                            >
                              <CiEdit className="h-5 w-5" />
                            </button>
                          )}
                          {canDeleteExpense && (
                            <button
                              onClick={() => handleDeleteClick(expense.id)}
                              className="p-1 text-red-600 hover:text-red-700 tooltip"
                              data-tooltip="حذف"
                            >
                              <CiTrash className="h-5 w-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-3 text-center text-sm text-gray-500">
                        لا توجد مصروفات متاحة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Card view (md and sm screens) */}
            <div className="lg:hidden space-y-4">
              {expenses?.length > 0 ? (
                expenses.map((expense, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition"
                  >
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">النادي</p>
                        <p>{expense.club_details?.name || "غير متاح"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">الفئة</p>
                        <p>{expense.category_details?.name || "غير متاح"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">المبلغ</p>
                        <p>{expense.amount ? `${expense.amount} جنيه` : "غير متاح"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">التاريخ</p>
                        <p>{expense.date || "غير متاح"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">الوصف</p>
                        <p>{expense.description || "غير متاح"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">رقم الفاتورة</p>
                        <p>{expense.invoice_number || "غير متاح"}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-start gap-2">
                      {canEditExpense && (
                        <button
                          onClick={() => handleEditClick(expense)}
                          className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 text-sm tooltip"
                          data-tooltip="تعديل"
                        >
                          <CiEdit className="h-4 w-4" /> تعديل
                        </button>
                      )}
                      {canDeleteExpense && (
                        <button
                          onClick={() => handleDeleteClick(expense.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm tooltip"
                          data-tooltip="حذف"
                        >
                          <CiTrash className="h-4 w-4" /> حذف
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="border rounded-lg p-4 text-center text-sm text-gray-500 bg-white">
                  لا توجد مصروفات متاحة
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-gray-300 text-sm"
            >
              السابق
            </button>
            <div className="flex gap-1">
              {getPageButtons(currentPage, totalPages).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    currentPage === page
                      ? "bg-teal-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage === totalPages || !expensesPagination?.next}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-gray-300 text-sm"
            >
              التالي
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4 items-center border-t pt-4">
            {(user.role === "admin" || user.role === "owner") && (
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <label className="text-sm font-medium text-gray-700">من:</label>
                <input
                  type="date"
                  name="startDate"
                  value={summaryFilters.startDate}
                  onChange={handleFilterChange}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm"
                />
                <label className="text-sm font-medium text-gray-700">إلى:</label>
                <input
                  type="date"
                  name="endDate"
                  value={summaryFilters.endDate}
                  onChange={handleFilterChange}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm"
                />
                <select
                  name="categoryId"
                  value={summaryFilters.categoryId}
                  onChange={handleFilterChange}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm"
                >
                  <option value="">الكل</option>
                  {expenseCategories.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={handleTotalCalculation}
              className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 text-sm"
            >
              حساب الإجمالي
            </button>
          </div>

          {totalExpensesCount > 0 && isSummaryClicked && (
            <div className="mt-4 bg-teal-50 border border-teal-200 rounded-md p-4 text-right space-y-1">
              <p className="text-sm font-semibold text-teal-700">
                عدد المصروفات: {totalExpensesCount}
              </p>
              <p className="text-sm font-semibold text-teal-700">
                إجمالي المصروفات: {totalExpenses} جنيه
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Expense Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-lg shadow-xl max-h-[90vh] overflow-y-auto animate-fadeIn"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold text-teal-700 mb-4 text-right">
                {currentExpense ? "تعديل المصروف" : "إضافة مصروف"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
                    النادي
                  </label>
                  <select
                    name="club"
                    value={currentExpense ? currentExpense.club : newExpense.club}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-300 text-right text-sm"
                    disabled
                  >
                    {userClub ? (
                      <option value={userClub.id}>{userClub.name}</option>
                    ) : (
                      <option value="">جاري التحميل...</option>
                    )}
                  </select>
                  {errors.club && (
                    <p className="text-red-500 text-xs text-right mt-1">{errors.club}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
                    الفئة
                  </label>
                  <select
                    name="category"
                    value={currentExpense ? currentExpense.category : newExpense.category}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-300 text-right text-sm"
                    disabled={currentExpense ? !canEditExpense : !canAddExpense}
                  >
                    <option value="">اختر الفئة</option>
                    {loading && <option disabled>جاري التحميل...</option>}
                    {error && <option disabled>خطأ في تحميل الفئات</option>}
                    {expenseCategories?.map((category) => (
                      <option key={category.id} value={category.id.toString()}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-xs text-right mt-1">{errors.category}</p>
                  )}
                </div>

                {[
                  { label: "المبلغ", name: "amount", type: "number", step: "0.01", placeholder: "أدخل المبلغ" },
                  { label: "الوصف", name: "description", type: "text", placeholder: "أدخل الوصف" },
                  { label: "التاريخ", name: "date", type: "date", placeholder: "اختر التاريخ" },
                ].map(({ label, name, type, step, placeholder }) => (
                  <div key={name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
                      {label}
                    </label>
                    <input
                      type={type}
                      name={name}
                      value={currentExpense ? currentExpense[name] || "" : newExpense[name] || ""}
                      onChange={handleChange}
                      step={step}
                      placeholder={placeholder}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-300 text-right text-sm"
                      disabled={currentExpense ? !canEditExpense : !canAddExpense}
                    />
                    {errors[name] && (
                      <p className="text-red-500 text-xs text-right mt-1">{errors[name]}</p>
                    )}
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
                    رقم الفاتورة
                  </label>
                  <input
                    type="text"
                    name="invoice_number"
                    value={
                      currentExpense ? currentExpense.invoice_number || "" : newExpense.invoice_number || ""
                    }
                    onChange={handleChange}
                    placeholder="أدخل رقم الفاتورة (اختياري)"
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-300 text-right text-sm"
                    disabled={currentExpense ? !canEditExpense : !canAddExpense}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
                    المرفق
                  </label>
                  <input
                    type="file"
                    name="attachment"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (currentExpense) {
                        setCurrentExpense((prev) => ({ ...prev, attachment: file }));
                      } else {
                        setNewExpense((prev) => ({ ...prev, attachment: file }));
                      }
                    }}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md text-right text-sm"
                    disabled={currentExpense ? !canEditExpense : !canAddExpense}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setErrors({});
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSave}
                  className={`px-4 py-2 rounded-md text-sm text-white ${
                    currentExpense
                      ? canEditExpense
                        ? "bg-teal-600 hover:bg-teal-700"
                        : "bg-gray-400 cursor-not-allowed"
                      : canAddExpense
                      ? "bg-teal-600 hover:bg-teal-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                  disabled={currentExpense ? !canEditExpense : !canAddExpense}
                >
                  {currentExpense ? "حفظ التعديلات" : "إضافة"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteModal && canDeleteExpense && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setConfirmDeleteModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-teal-700 mb-4 text-right">
              تأكيد الحذف
            </h3>
            <p className="text-sm text-gray-600 text-right mb-4">
              هل أنت متأكد من حذف هذا المصروف؟
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
              >
                لا
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                نعم
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .tooltip {
          position: relative;
        }
        .tooltip:hover::after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: #333;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 10;
        }
      `}</style>
    </div>
  );
};

export default Expense;