import React, { useState, useEffect } from "react";
import { CiEdit, CiTrash } from "react-icons/ci"; // Icons for Edit and Delete
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
import { useDispatch, useSelector } from "react-redux";
import {
  fetchExpenses,
  updateExpense,
  addExpense,
  deleteExpense,
} from "../../redux/slices/financeSlice";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/DropdownMenu";
import { MoreVertical } from "lucide-react";

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

  // State for confirmation modal
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  // Fetch expenses from the backend
  const { expenses, loading, error } = useSelector((state) => state.finance);

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchExpenses());
  }, [dispatch]);

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
      // Prepare the payload to match the backend schema
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
      // Dispatch the update action
      dispatch(updateExpense({ id: currentExpense.id, updatedData: payload }))
        .unwrap()
        .then(() => {
          setShowModal(false); // Close modal after successful update
        })
        .catch((err) => {
          console.error("فشل في تحديث المصروف:", err);
        });
    } else {
      // Dispatch the add action
      dispatch(addExpense(newExpense))
        .unwrap()
        .then(() => {
          setNewExpense({
            club: "",
            category: "",
            amount: "",
            description: "",
            date: "",
            paid_by: "",
            invoice_number: "",
            attachment: null,
          }); // Reset form
          setShowModal(false); // Close modal after successful addition
        })
        .catch((err) => {
          console.error("فشل في إضافة المصروف:", err);
        });
    }
  };

  // Open the modal for editing an expense
  const handleEditClick = (expense) => {
    const sanitizedExpense = {
      ...expense,
      club: expense.club?.toString() || "",
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
    setCurrentExpense(null); // Clear current expense for adding a new one
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
          setConfirmDeleteModal(false); // Close modal after deletion
        })
        .catch((err) => {
          console.error("فشل في حذف المصروف:", err);
        });
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Tabs */}
      <Tabs defaultValue="expenses" dir="rtl">
        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-right">جميع المصروفات</CardTitle>
              <CardDescription className="text-right">
                إدارة جميع المصروفات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Expense Button */}
              <Button
                onClick={handleAddClick}
                className="flex items-center justify-start"
              >
                <Plus className="mr-2 h-4 w-4" />
                إضافة مصروف
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
              <div className="rounded-md border" dir="rtl">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        النادي
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        الفئة
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        المبلغ
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        الوصف
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        التاريخ
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        المدفوع من قبل
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        رقم الفاتورة
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        المرفق
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {expenses.map((expense, index) => (
                      <tr key={index} className="hover:bg-gray-100 transition">
                        <td className="px-4 py-3 text-sm">
                          {expense.club || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {expense.category || "غير متاح"}
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
                          {expense.paid_by || "غير متاح"}
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
            </CardContent>
          </Card>
        </TabsContent>
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
              {currentExpense ? "تعديل المصروف" : "إضافة مصروف"}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: "النادي", name: "club" },
                { label: "الفئة", name: "category" },
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
          className="fixed inset-0 z-50 flex justify-center items-center  bg-opacity-50"
          onClick={() => setConfirmDeleteModal(false)} // Close modal when clicking outside
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
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
