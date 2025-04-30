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
  fetchIncomeSources,
  addIncomeSource,
  fetchIncomes,
  addIncome,
  updateIncome,
  deleteIncome,
} from "../../redux/slices/financeSlice";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/DropdownMenu";
import { MoreVertical } from "lucide-react";

const labelMapping = {
  name: "الاسم",
  description: "الوصف",
  club: "النادي",
  source: "مصدر الدخل",
  amount: "المبلغ",
  date: "التاريخ",
  received_by: "المستلم",
};

const Income = () => {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null); // For editing income
  const [newItem, setNewItem] = useState({
    club: "",
    source: "",
    amount: "",
    description: "",
    date: "",
    received_by: "",
  }); // For adding new income or income source
  const [activeTab, setActiveTab] = useState("incomeSources"); // Toggle between Income Sources and Incomes

  // Fetch data from Redux state
  const { incomeSources, incomes, loading, error } = useSelector(
    (state) => state.finance
  );

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchIncomeSources());
    dispatch(fetchIncomes());
  }, [dispatch]);

  // Handle input changes in the modal (Edit or Add)
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = name === "amount" ? parseFloat(value) || 0 : value;

    if (currentItem) {
      setCurrentItem((prev) => ({ ...prev, [name]: newValue }));
    } else {
      setNewItem((prev) => ({ ...prev, [name]: newValue }));
    }
  };

  // Save the updated item via API
  const handleSave = () => {
    const isIncomeSource = activeTab === "incomeSources";
    // Prepare the payload based on the active tab
    const payload = currentItem
      ? {
          id: currentItem.id,
          club: parseInt(currentItem.club) || null,
          source: parseInt(currentItem.source) || null,
          amount: currentItem.amount || 0,
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

    // Dispatch action based on the active tab and whether editing or adding
    const action = currentItem
      ? updateIncome({ id: currentItem.id, updatedData: payload }) // Editing an income
      : isIncomeSource
      ? addIncomeSource(newItem) // Adding a new income source
      : addIncome(payload); // Adding a new income

    dispatch(action)
      .unwrap()
      .then(() => {
        setCurrentItem(null); // Reset current item
        setNewItem({
          club: "",
          source: "",
          amount: "",
          description: "",
          date: "",
          received_by: "",
        }); // Reset new item form
        setShowModal(false); // Close modal after successful operation
      })
      .catch((err) => {
        console.error(
          `فشل في ${currentItem ? "تحديث" : "إضافة"} ${
            isIncomeSource ? "مصدر دخل" : "دخل"
          }`,
          err
        );
      });
  };

  // Open the modal for editing an income
  const handleEditClick = (item) => {
    if (activeTab === "incomes") {
      const sanitizedItem = {
        ...item,
        club: item.club?.toString() || "",
        source: item.source?.toString() || "",
        amount: item.amount?.toString() || "0",
        description: item.description || "",
        date: item.date || "",
        received_by: item.received_by?.toString() || "",
      };
      setCurrentItem(sanitizedItem);
      setShowModal(true);
    }
  };

  // Open the modal for adding a new item
  const handleAddClick = () => {
    setCurrentItem(null); // Clear current item for adding a new one
    setShowModal(true);
  };

  // State for confirmation modal
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Delete an income
  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setConfirmDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      dispatch(deleteIncome(itemToDelete))
        .unwrap()
        .then(() => {
          console.log("تم حذف الدخل بنجاح");
          setConfirmDeleteModal(false); // Close modal after deletion
        })
        .catch((err) => {
          console.error("فشل في حذف الدخل:", err);
        });
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <h1 className="text-2xl font-bold tracking-tight text-right">
        إدارة الدخل
      </h1>

      {/* Tabs */}
      <Tabs defaultValue="incomeSources" dir="rtl" onValueChange={setActiveTab}>
        <TabsList dir="rtl">
          <TabsTrigger value="incomeSources">مصادر الدخل</TabsTrigger>
          <TabsTrigger value="incomes"> الدخل</TabsTrigger>
        </TabsList>

        {/* Income Sources Tab */}
        <TabsContent value="incomeSources" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-right">جميع مصادر الدخل</CardTitle>
              <CardDescription className="text-right">
                إدارة جميع مصادر الدخل
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Income Source Button */}
              <Button
                onClick={handleAddClick}
                className="flex items-center justify-start"
              >
                <Plus className="mr-2 h-4 w-4" />
                إضافة مصدر دخل
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
                        المعرف
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        اسم المصدر
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        النادي
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        الوصف
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {incomeSources.map((source) => (
                      <tr
                        key={source.id}
                        className="hover:bg-gray-100 transition"
                      >
                        <td className="px-4 py-3 text-sm">{source.id}</td>
                        <td className="px-4 py-3 text-sm">
                          {source.name || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {source.club_details?.name || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {source.description || "لا يوجد وصف"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incomes Tab */}
        <TabsContent value="incomes" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-right">جميع الدخل</CardTitle>
              <CardDescription className="text-right">
                إدارة جميع الدخل
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Income Button */}
              <Button
                onClick={handleAddClick}
                className="flex items-center justify-start"
              >
                <Plus className="mr-2 h-4 w-4" />
                إضافة دخل
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
                        المعرف
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        مصدر الدخل
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
                        المستلم
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {incomes.map((income) => (
                      <tr
                        key={income.id}
                        className="hover:bg-gray-100 transition"
                      >
                        <td className="px-4 py-3 text-sm">{income.id}</td>
                        <td className="px-4 py-3 text-sm">
                          {income.source_details?.name || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {income.amount ? `${income.amount} جنيه` : "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {income.description || "لا يوجد وصف"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {income.date || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {income.received_by_details?.username || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm flex gap-2 justify-end">
                        <DropdownMenu dir="rtl">
                            <DropdownMenuTrigger asChild>
                              <button className="bg-gray-200 text-gray-700 px-1 py-1 rounded-md hover:bg-gray-300 transition-colors">
                              <MoreVertical className="h-5 w-5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={() => handleEditClick(income)}
                                className="cursor-pointer text-yellow-600 hover:bg-yellow-50"
                              >
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(income.id)}
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
              {currentItem
                ? `تعديل ${activeTab === "incomeSources" ? "مصدر دخل" : "دخل"}`
                : `إضافة ${activeTab === "incomeSources" ? "مصدر دخل" : "دخل"}`}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {[
                ...(activeTab === "incomeSources"
                  ? ["name", "description", "club"]
                  : [
                      "club",
                      "source",
                      "amount",
                      "description",
                      "date",
                      "received_by",
                    ]),
              ].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium capitalize mb-1 text-right">
                    {labelMapping[field] || field}
                  </label>
                  <input
                    type={
                      field === "amount"
                        ? "number"
                        : field === "date"
                        ? "date"
                        : "text"
                    }
                    name={field} // هنا تبقى بالإنجليزي
                    value={
                      currentItem
                        ? currentItem[field] || ""
                        : newItem[field] || ""
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
              هل أنت متأكد من حذف هذا الدخل؟
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

export default Income;
