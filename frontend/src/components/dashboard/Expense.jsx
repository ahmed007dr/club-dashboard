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
    paid_by: "",
    invoice_number: "",
    attachment: null,
  });
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [totalInfo, setTotalInfo] = useState({ total: 0, count: 0 });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [userClub, setUserClub] = useState(null); // Store logged-in user's club
  const itemsPerPage = 5;

  // Fetch expenses from the backend
  const { expenses, loading, error } = useSelector((state) => state.finance);

  // Fetch user profile to get club details
  useEffect(() => {
    fetch("http://127.0.0.1:8000/accounts/api/profile/", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, // Adjust based on your auth setup
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setUserClub({
          id: data.club.id,
          name: data.club.name,
        });
        setNewExpense((prev) => ({ ...prev, club: data.club.id.toString() })); // Pre-fill club in new expense
      })
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
      });
  }, []);

  // Fetch expenses on component mount
  useEffect(() => {
    dispatch(fetchExpenses());
  }, [dispatch]);

  // Extract unique categories from expenses
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

  // Handle input changes in the modal (Edit or Add)
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (currentExpense) {
      setCurrentExpense((prev) => ({
        ...prev,
        [name]: name === "amount" ? parseFloat(value) || 0 : value,
      }));
    } else {
      setNewExpense((prev) => ({
        ...prev,
        [name]: name === "amount" ? parseFloat(value) || 0 : value,
      }));
    }
  };

  // Save the updated expense via API
  const handleSave = () => {
    if (currentExpense) {
      const payload = {
        club: parseInt(currentExpense.club) || null,
        category: parseInt(currentExpense.category) || null,
        amount: currentExpense.amount || 0,
        description: currentExpense.description || "",
        date: currentExpense.date || "",
        paid_by: parseInt(currentExpense.paid_by) || null,
        invoice_number: currentExpense.invoice_number || "",
        attachment: currentExpense.attachment || null,
      };
      dispatch(updateExpense({ id: currentExpense.id, updatedData: payload }))
        .unwrap()
        .then(() => {
          setShowModal(false);
        })
        .catch((err) => {
          console.error("فشل في تحديث المصروف:", err);
        });
    } else {
      const payload = {
        ...newExpense,
        club: parseInt(newExpense.club) || null,
        category: parseInt(newExpense.category) || null,
        amount: parseFloat(newExpense.amount) || 0,
        paid_by: parseInt(newExpense.paid_by) || null,
      };
      dispatch(addExpense(payload))
        .unwrap()
        .then(() => {
          setNewExpense({
            club: userClub?.id.toString() || "",
            category: "",
            amount: "",
            description: "",
            date: "",
            paid_by: "",
            invoice_number: "",
            attachment: null,
          });
          setShowModal(false);
        })
        .catch((err) => {
          console.error("فشل في إضافة المصروف:", err);
        });
    }
  };

  // Filter expenses by date and user's club
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      const from = startDate ? new Date(startDate) : null;
      const to = endDate ? new Date(endDate) : null;

      return (
        expense.club_details?.id === userClub?.id && // Filter by user's club
        (!from || expenseDate >= from) &&
        (!to || expenseDate <= to)
      );
    });
  }, [expenses, startDate, endDate, userClub]);

  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredExpenses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredExpenses, currentPage]);

  // Open the modal for editing an expense
  const handleEditClick = (expense) => {
    const sanitizedExpense = {
      ...expense,
      club: expense.club?.toString() || userClub?.id.toString() || "",
      category: expense.category?.toString() || "",
      amount: expense.amount?.toString() || "0",
      description: expense.description || "",
      date: expense.date || "",
      paid_by: expense.paid_by?.toString() || "",
      invoice_number: expense.invoice_number || "",
      attachment: expense.attachment || null,
    };
    setCurrentExpense(sanitizedExpense);
    setShowModal(true);
  };

  // Open the modal for adding a new expense
  const handleAddClick = () => {
    setCurrentExpense(null);
    setShowModal(true);
  };

  // Confirm delete modal logic
  const handleDeleteClick = (id) => {
    setExpenseToDelete(id);
    setConfirmDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (expenseToDelete) {
      dispatch(deleteExpense(expenseToDelete))
        .unwrap()
        .then(() => {
          console.log("تم حذف المصروف بنجاح");
          setConfirmDeleteModal(false);
        })
        .catch((err) => {
          console.error("فشل في حذف المصروف:", err);
        });
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <Tabs defaultValue="expenses" dir="rtl">
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-right">جميع المصروفات</CardTitle>
              <CardDescription className="text-right">
                إدارة جميع المصروفات لنادي {userClub?.name || "جاري التحميل..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Expense Button and Date Filters */}
              <div className="flex justify-between mb-4">
                <div className="flex gap-4 items-center justify-end">
                  <label className="text-sm">من:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border px-2 py-1 rounded"
                  />
                  <label className="text-sm">إلى:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border px-2 py-1 rounded"
                  />
                </div>
                <Button
                  onClick={handleAddClick}
                  className="flex items-center justify-start"
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
                        "المرفق",
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
                        <td className="px-4 py-3 text-sm text-blue-500 underline cursor-pointer">
                          {expense.attachment || "لا يوجد مرفق"}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  السابق
                </button>
                <span className="px-3 py-1">
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
                  }
                  disabled={
                    currentPage ===
                    Math.ceil(filteredExpenses.length / itemsPerPage)
                  }
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
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
                        (acc, expense) =>
                          acc + (parseFloat(expense.amount) || 0),
                        0
                      ),
                    })
                  }
                  className="bg-primary text-white px-6"
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
                { label: "رقم الفاتورة", name: "invoice_number" },
                { label: "المرفق", name: "attachment" },
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
                    }
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right"
                  />
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
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                حفظ
              </button>
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
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-right">
              تأكيد الحذف
            </h3>
            <p className="text-sm text-right mb-4">
              هل أنت متأكد من حذف هذا المصروف؟
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                لا
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                نعم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expense;