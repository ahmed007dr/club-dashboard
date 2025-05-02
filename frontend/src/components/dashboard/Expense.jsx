import React, { useState, useEffect, useMemo } from "react";
import { CiEdit, CiTrash } from "react-icons/ci";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchExpenses,
  updateExpense,
  addExpense,
  deleteExpense,
} from "../../redux/slices/financeSlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import BASE_URL from "@/config/api";

// Custom CSS for table and modal responsiveness
const customStyles = `
  @media (max-width: 640px) {
    .responsive-table {
      display: block;
      overflow-x: auto;
      white-space: nowrap;
    }
    .modal-content {
      width: 100%;
      height: 100%;
      padding: 1rem;
      border-radius: 0;
    }
  }
  @media (min-width: 641px) {
    .modal-content {
      width: 100%;
      max-width: 48rem; /* max-w-3xl */
      height: auto;
      max-height: 90vh;
      padding: 1.5rem;
      border-radius: 0.5rem;
    }
  }
`;

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
  const [totalInfo, setTotalInfo] = useState({ total: 0, count: 0 });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [userClub, setUserClub] = useState(null);
  const [errors, setErrors] = useState({});
  const itemsPerPage = 5;

  const { expenses, loading, error } = useSelector((state) => state.finance);

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
        setNewExpense((prev) => ({ ...prev, club: data.club.id.toString() }));
      })
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
      });
  }, []);

  // Fetch expenses
  useEffect(() => {
    dispatch(fetchExpenses());
  }, [dispatch]);

  // Extract unique categories
  const uniqueCategories = useMemo(() => {
    const categoriesMap = new Map();
    expenses.forEach((expense) => {
      if (expense.category_details && expense.club_details?.id === userClub?.id) {
        categoriesMap.set(expense.category_details.id, {
          id: expense.category_details.id,
          name: expense.category_details.name,
        });
      }
    });
    return Array.from(categoriesMap.values());
  }, [expenses, userClub]);

  // Handle text input changes
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

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (currentExpense) {
      setCurrentExpense((prev) => ({ ...prev, attachment: file }));
    } else {
      setNewExpense((prev) => ({ ...prev, attachment: file }));
    }
    setErrors((prev) => ({ ...prev, attachment: "" }));
  };

  // Validate form data based on Postman input
  const validateForm = (data) => {
    const newErrors = {};
    if (!data.club || isNaN(parseInt(data.club))) newErrors.club = "النادي مطلوب.";
    if (!data.category || isNaN(parseInt(data.category))) newErrors.category = "الفئة مطلوبة.";
    if (!data.amount && data.amount !== 0) newErrors.amount = "المبلغ مطلوب.";
    if (!data.date) newErrors.date = "التاريخ مطلوب.";
    return newErrors;
  };

  // Save expense (add or update)
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
    if (data.attachment) {
      formData.append("attachment", data.attachment);
    }

    // Log FormData for debugging
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

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

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      const from = startDate ? new Date(startDate) : null;
      const to = endDate ? new Date(endDate) : null;

      return (
        expense.club_details?.id === userClub?.id &&
        (!from || expenseDate >= from) &&
        (!to || expenseDate <= to)
      );
    });
  }, [expenses, startDate, endDate, userClub]);

  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredExpenses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredExpenses, currentPage]);

  // Edit expense
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

  // Delete expense
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
        })
        .catch((err) => {
          console.error("فشل في حذف المصروف:", err);
        });
    }
  };

  return (
    <>
      <style>{customStyles}</style>
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
        <Tabs defaultValue="expenses" dir="rtl">
          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-right text-lg sm:text-xl">
                  جميع المصروفات
                </CardTitle>
                <CardDescription className="text-right text-sm sm:text-base">
                  إدارة جميع المصروفات لنادي {userClub?.name || "جاري التحميل..."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* General Error Display */}
                {errors.general && (
                  <p className="text-red-500 text-sm text-right">
                    {errors.general}
                  </p>
                )}
                {/* Add Expense Button and Date Filters */}
                <div className="flex flex-col sm:flex-row justify-between mb-4 gap-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-end">
                    <div className="flex items-center gap-2">
                      <label className="text-sm">من:</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border px-2 py-1 rounded text-sm sm:text-base"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm">إلى:</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border px-2 py-1 rounded text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowModal(true)}
                    className="flex items-center justify-start w-full sm:w-auto text-sm sm:text-base"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    إضافة مصروف
                  </Button>
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

<<<<<<< HEAD
                {/* Table */}
                <div className="rounded-md border responsive-table">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr className="bg-muted/50">
                        {[
                          "النادي",
                          "الفئة",
                          "المبلغ",
                          "الوصف",
                          "التاريخ",
                          "رقم الفاتورة",
                          "المرفق",
                          "الإجراءات",
                        ].map((header, idx) => (
                          <th
                            key={idx}
                            className="px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium whitespace-nowrap"
                          >
                            {header}
                          </th>
                        ))}
=======
              {/* Table */}
              <div className="rounded-md border overflow-x-auto" dir="rtl">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="bg-muted/50">
                      {[
                        "النادي",
                        "الفئة",
                        "المبلغ",
                        "الوصف",
                        "التاريخ",
                        "المدفوع من قبل",
                        "رقم الفاتورة",
                        "الإجراءات",
                      ].map((header, idx) => (
                        <th
                          key={idx}
                          className="px-4 py-3 text-right text-sm font-medium whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {paginatedExpenses.map((expense, index) => (
                      <tr key={index} className="hover:bg-gray-100 transition">
                        <td className="px-4 py-3 text-sm">
                          {expense.club_details?.name || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {expense.category_details?.name || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {expense.amount
                            ? `${expense.amount} جنيه`
                            : "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {expense.description || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {expense.date || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {expense.paid_by_details?.username || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {expense.invoice_number || "غير متاح"}
                        </td>
                       
                        <td className="px-4 py-3 text-sm flex justify-end">
                          <DropdownMenu dir="rtl">
                            <DropdownMenuTrigger asChild>
                              <button className="bg-gray-200 text-gray-700 px-1 py-1 rounded-md hover:bg-gray-300 transition-colors">
                                <MoreVertical className="h-5 w-5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={() => handleEditClick(expense)}
                                className="cursor-pointer text-yellow-600 hover:bg-yellow-50"
                              >
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(expense.id)}
                                className="cursor-pointer text-red-600 hover:bg-red-50"
                              >
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
>>>>>>> b6817cb28908498734d0fee74c19a39f9cdd7c66
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                      {paginatedExpenses.length > 0 ? (
                        paginatedExpenses.map((expense, index) => (
                          <tr key={index} className="hover:bg-gray-100 transition">
                            <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm">
                              {expense.club_details?.name || "غير متاح"}
                            </td>
                            <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm">
                              {expense.category_details?.name || "غير متاح"}
                            </td>
                            <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm">
                              {expense.amount ? `${expense.amount} جنيه` : "غير متاح"}
                            </td>
                            <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm">
                              {expense.description || "غير متاح"}
                            </td>
                            <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm">
                              {expense.date || "غير متاح"}
                            </td>
                            <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm">
                              {expense.invoice_number || "غير متاح"}
                            </td>
                            <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm">
                              {expense.attachment ? (
                                <a
                                  href={expense.attachment}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 underline"
                                >
                                  عرض المرفق
                                </a>
                              ) : (
                                "لا يوجد مرفق"
                              )}
                            </td>
                            <td className="px-2 sm:px-4 py-3 text-sm flex justify-end">
                              <DropdownMenu dir="rtl">
                                <DropdownMenuTrigger asChild>
                                  <button className="bg-gray-200 text-gray-700 px-1 py-1 rounded-md hover:bg-gray-300 transition-colors">
                                    <MoreVertical className="h-5 w-5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem
                                    onClick={() => handleEditClick(expense)}
                                    className="cursor-pointer text-yellow-600 hover:bg-yellow-50"
                                  >
                                    تعديل
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClick(expense.id)}
                                    className="cursor-pointer text-red-600 hover:bg-red-50"
                                  >
                                    حذف
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-3 text-center text-sm">
                            لا توجد مصروفات متاحة
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

<<<<<<< HEAD
                {/* Pagination */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                  >
                    السابق
                  </button>
                  <span className="px-3 py-1 text-sm">
                    الصفحة {currentPage} من{" "}
                    {Math.ceil(filteredExpenses.length / itemsPerPage)}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        prev < Math.ceil(filteredExpenses.length / itemsPerPage)
                          ? prev + 1
                          : prev
                      )
=======
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
              {currentExpense ? "تعديل المصروف" : "إضافة مصروف"}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {/* Club Dropdown */}
              <div>
                <label className="block text-sm font-medium capitalize mb-1 text-right">
                  النادي
                </label>
                <select
                  name="club"
                  value={
                    currentExpense ? currentExpense.club : newExpense.club
                  }
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right"
                  // Disable to prevent changes, as only one club is available
                >
                  {userClub ? (
                    <option value={userClub.id}>{userClub.name}</option>
                  ) : (
                    <option value="">جاري التحميل...</option>
                  )}
                </select>
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-sm font-medium capitalize mb-1 text-right">
                  الفئة
                </label>
                <select
                  name="category"
                  value={
                    currentExpense ? currentExpense.category : newExpense.category
                  }
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right"
                >
                  <option value="">اختر الفئة</option>
                  {uniqueCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Other Fields */}
              {[
                { label: "المبلغ", name: "amount", type: "number" },
                { label: "الوصف", name: "description" },
                { label: "التاريخ", name: "date", type: "date" },
                { label: "المدفوع من قبل", name: "paid_by" },
             
              ].map(({ label, name, type = "text" }) => (
                <div key={name}>
                  <label className="block text-sm font-medium capitalize mb-1 text-right">
                    {label}
                  </label>
                  <input
                    type={type}
                    name={name}
                    value={
                      currentExpense
                        ? currentExpense[name] || ""
                        : newExpense[name] || ""
>>>>>>> b6817cb28908498734d0fee74c19a39f9cdd7c66
                    }
                    disabled={
                      currentPage === Math.ceil(filteredExpenses.length / itemsPerPage)
                    }
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                  >
                    التالي
                  </button>
                </div>

                {/* Compute Total Button */}
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={() =>
                      setTotalInfo({
                        count: filteredExpenses.length,
                        total: filteredExpenses.reduce(
                          (acc, expense) => acc + (parseFloat(expense.amount) || 0),
                          0
                        ),
                      })
                    }
                    className="bg-primary text-white px-4 sm:px-6 text-sm sm:text-base"
                  >
                    حساب الإجمالي
                  </Button>
                </div>

                {/* Total Info Display */}
                {totalInfo.count > 0 && (
                  <div className="mt-4 bg-gray-50 border rounded-md p-4 text-right space-y-1">
                    <p className="text-sm font-semibold text-gray-700">
                      عدد المصروفات: {totalInfo.count}
                    </p>
                    <p className="text-sm font-semibold text-gray-700">
                      إجمالي المصروفات: {totalInfo.total} جنيه
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Modal */}
        {showModal && (
          <div
            className="fixed inset-0 z-40 flex justify-center items-start sm:items-center bg-black bg-opacity-50 overflow-y-auto"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-white w-full h-full sm:h-auto overflow-y-auto modal-content shadow-lg"
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-6 lg:p-8">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-right">
                  {currentExpense ? "تعديل المصروف" : "إضافة مصروف"}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {/* Club Dropdown */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">
                      النادي
                    </label>
                    <select
                      name="club"
                      value={currentExpense ? currentExpense.club : newExpense.club}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right text-sm sm:text-base"
                      
                    >
                      {userClub ? (
                        <option value={userClub.id}>{userClub.name}</option>
                      ) : (
                        <option value="">جاري التحميل...</option>
                      )}
                    </select>
                    {errors.club && (
                      <p className="text-red-500 text-xs sm:text-sm text-right mt-1">
                        {errors.club}
                      </p>
                    )}
                  </div>

                  {/* Category Dropdown */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">
                      الفئة
                    </label>
                    <select
                      name="category"
                      value={
                        currentExpense ? currentExpense.category : newExpense.category
                      }
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right text-sm sm:text-base"
                    >
                      <option value="">اختر الفئة</option>
                      {uniqueCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-xs sm:text-sm text-right mt-1">
                        {errors.category}
                      </p>
                    )}
                  </div>

                  {/* Other Fields */}
                  {[
                    { label: "المبلغ", name: "amount", type: "number", step: "0.01" },
                    { label: "الوصف", name: "description", type: "text" },
                    { label: "التاريخ", name: "date", type: "date" },
                    { label: "رقم الفاتورة", name: "invoice_number", type: "text" },
                  ].map(({ label, name, type, step }) => (
                    <div key={name}>
                      <label className="block text-sm font-medium mb-1 text-right">
                        {label}
                      </label>
                      <input
                        type={type}
                        name={name}
                        value={
                          currentExpense ? currentExpense[name] || "" : newExpense[name] || ""
                        }
                        onChange={handleChange}
                        step={step}
                        className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right text-sm sm:text-base"
                      />
                      {errors[name] && (
                        <p className="text-red-500 text-xs sm:text-sm text-right mt-1">
                          {errors[name]}
                        </p>
                      )}
                    </div>
                  ))}
                  {/* File Input for Attachment */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">
                      المرفق
                    </label>
                    <input
                      type="file"
                      name="attachment"
                      onChange={handleFileChange}
                      className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right text-sm sm:text-base"
                    />
                    {errors.attachment && (
                      <p className="text-red-500 text-xs sm:text-sm text-right mt-1">
                        {errors.attachment}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setErrors({});
                    }}
                    className="px-3 sm:px-4 py-1 sm:py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm sm:text-base"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-3 sm:px-4 py-1 sm:py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm sm:text-base"
                  >
                    حفظ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Delete Modal */}
        {confirmDeleteModal && (
          <div
            className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50"
            onClick={() => setConfirmDeleteModal(false)}
          >
            <div
              className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-sm modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg sm:text-xl font-semibold mb-4 text-right">
                تأكيد الحذف
              </h3>
              <p className="text-sm text-right mb-4">
                هل أنت متأكد من حذف هذا المصروف؟
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmDeleteModal(false)}
                  className="px-3 sm:px-4 py-1 sm:py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm sm:text-base"
                >
                  لا
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-3 sm:px-4 py-1 sm:py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm sm:text-base"
                >
                  نعم
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Expense;