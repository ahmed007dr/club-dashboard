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
  fetchIncomeSources,
  addIncomeSource,
  fetchIncomes,
  addIncome,
  updateIncome,
  deleteIncome,
} from "../../redux/slices/financeSlice";
import BASE_URL from '../../config/api';
import AddIncomeForm from "./AddIncomeForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import IncomeSourcesList from './IncomeSourcesList';

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
  const [currentItem, setCurrentItem] = useState(null);
  const [newItem, setNewItem] = useState({
    club: "",
    source: "",
    amount: "",
    description: "",
    date: "",
    received_by: "",
  });
  const [totalInfo, setTotalInfo] = useState({ total: 0, count: 0 });
  const [userClub, setUserClub] = useState(null);
  const [sortOrder, setSortOrder] = useState("desc"); // "desc" for newest first, "asc" for oldest first

  // Filter states
  const [incomeFilters, setIncomeFilters] = useState({
    source: "",
    amountMin: "",
    amountMax: "",
    dateFrom: "",
    dateTo: "",
    received_by: "",
    club: "",
  });

  // Pagination states
  const [incomePage, setIncomePage] = useState(1);
  const [incomeSourcesPage, setIncomeSourcesPage] = useState(1);
  const maxButtons = 5; // Maximum number of page buttons to display

  const { incomes, incomeSources, loading, error } = useSelector((state) => state.finance);

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
        setNewItem((prev) => ({ ...prev, club: data.club.id.toString() }));
      })
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
      });
  }, []);

  // Fetch data on page change or component mount
  useEffect(() => {
    dispatch(fetchIncomes({ page: incomePage }));
    dispatch(fetchIncomeSources({ page: incomeSourcesPage }));
  }, [dispatch, incomePage, incomeSourcesPage]);

  const filteredIncomes = useMemo(() => {
    return incomes.results?.filter((income) => {
        return (
          income.club_details?.id === userClub?.id &&
          (!incomeFilters.club ||
            income.club_details?.id.toString() === incomeFilters.club) &&
          (!incomeFilters.source ||
            income.source_details?.name
              ?.toLowerCase()
              .includes(incomeFilters.source.toLowerCase())) &&
          (!incomeFilters.amountMin ||
            income.amount >= parseFloat(incomeFilters.amountMin)) &&
          (!incomeFilters.amountMax ||
            income.amount <= parseFloat(incomeFilters.amountMax)) &&
          (!incomeFilters.dateFrom ||
            new Date(income.date) >= new Date(incomeFilters.dateFrom)) &&
          (!incomeFilters.dateTo ||
            new Date(income.date) <= new Date(incomeFilters.dateTo)) &&
          (!incomeFilters.received_by ||
            income.received_by_details?.username
              ?.toLowerCase()
              .includes(incomeFilters.received_by.toLowerCase()))
        );
      })
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [incomes.results, incomeFilters, userClub, sortOrder]);

  // Pagination calculations
  const incomePageCount = Math.ceil(incomes.count / 20); // 20 items per page
  const incomeSourcePageCount = Math.ceil(incomeSources.count / 20);

  // Generate page buttons (max 5)
  const getPageButtons = (currentPage, totalPages) => {
    const buttons = [];
    const half = Math.floor(maxButtons / 2);
    let startPage = Math.max(1, currentPage - half);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    // Adjust startPage if endPage is at the max
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(i);
    }
    return buttons;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = name === "amount" ? parseFloat(value) || 0 : value;

    if (currentItem) {
      setCurrentItem((prev) => ({ ...prev, [name]: newValue }));
    } else {
      setNewItem((prev) => ({ ...prev, [name]: newValue }));
    }
  };

  const handleSave = () => {
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

    const action = currentItem
      ? updateIncome({ id: currentItem.id, updatedData: payload })
      : addIncome(payload);

    dispatch(action)
      .unwrap()
      .then(() => {
        setCurrentItem(null);
        setNewItem({
          club: userClub?.id.toString() || "",
          source: "",
          amount: "",
          description: "",
          date: "",
          received_by: "",
        });
        setShowModal(false);
      })
      .catch((err) => {
        console.error(
          `فشل في ${currentItem ? "تحديث" : "إضافة"} دخل`,
          err
        );
      });
  };

  const handleEditClick = (item) => {
    const sanitizedItem = {
      ...item,
      club: item.club?.toString() || userClub?.id.toString() || "",
      source: item.source?.toString() || "",
      amount: item.amount?.toString() || "0",
      description: item.description || "",
      date: item.date || "",
      received_by: item.received_by?.toString() || "",
    };
    setCurrentItem(sanitizedItem);
    setShowModal(true);
  };

  const handleAddClick = () => {
    setCurrentItem(null);
    setShowModal(true);
  };

  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

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
          setConfirmDeleteModal(false);
        })
        .catch((err) => {
          console.error("فشل في حذف الدخل:", err);
        });
    }
  };

  const handleIncomeFilterChange = (e) => {
    const { name, value } = e.target;
    setIncomeFilters((prev) => ({ ...prev, [name]: value }));
    setIncomePage(1); // Reset to first page on filter change
  };

  const PaginationControls = ({ currentPage, setPage, pageCount }) => (
    <div className="flex items-center justify-between mt-4">
      <Button
        onClick={() => setPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        السابق
      </Button>
      <div className="flex gap-2">
        {getPageButtons(currentPage, pageCount).map((page) => (
          <Button
            key={page}
            onClick={() => setPage(page)}
            variant={currentPage === page ? "default" : "outline"}
          >
            {page}
          </Button>
        ))}
      </div>
      <Button
        onClick={() => setPage(currentPage + 1)}
        disabled={currentPage === pageCount}
      >
        التالي
      </Button>
    </div>
  );

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold tracking-tight text-right">
        إدارة الدخل
      </h1>

      <Tabs defaultValue="sources" dir="rtl">
        <TabsList dir="rtl">
          <TabsTrigger value="sources">مصادر الايرادات</TabsTrigger>
          <TabsTrigger value="incomes">الايرادات</TabsTrigger>
        </TabsList>

        {/* Revenue Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-right">مصادر الايرادات</CardTitle>
              <CardDescription className="text-right">
                إدارة مصادر الايرادات لنادي {userClub?.name || "جاري التحميل..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <IncomeSourcesList />
              <PaginationControls
                currentPage={incomeSourcesPage}
                setPage={setIncomeSourcesPage}
                pageCount={incomeSourcePageCount}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incomes Tab */}
        <TabsContent value="incomes" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-right">جميع الدخل</CardTitle>
              <CardDescription className="text-right">
                إدارة جميع الدخل لنادي {userClub?.name || "جاري التحميل..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sort Toggle Button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                  className="mb-4 bg-primary text-white"
                >
                  {sortOrder === "desc" ? "فرز من الأقدم إلى الأحدث" : "فرز من الأحدث إلى الأقدم"}
                </Button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {["club", "source", "amountMin", "amountMax", "dateFrom", "dateTo", "received_by"].map(
                  (field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium mb-1 text-right">
                        {labelMapping[field] || field.replace(/([A-Z])/g, " $1")}
                      </label>
                      {field === "club" ? (
                        <select
                          name="club"
                          value={incomeFilters.club}
                          onChange={handleIncomeFilterChange}
                          className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right"
                        >
                          {userClub ? (
                            <option value={userClub.id}>{userClub.name}</option>
                          ) : (
                            <option value="">جاري التحميل...</option>
                          )}
                        </select>
                      ) : (
                        <input
                          type={
                            field.includes("date")
                              ? "date"
                              : field.includes("amount")
                              ? "number"
                              : "text"
                          }
                          name={field}
                          value={incomeFilters[field]}
                          onChange={handleIncomeFilterChange}
                          className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right"
                          placeholder={`ابحث بـ ${
                            labelMapping[field] || field.replace(/([A-Z])/g, " $1")
                          }`}
                        />
                      )}
                    </div>
                  )
                )}
              </div>

              <AddIncomeForm />

              {loading && (
                <p className="text-lg text-gray-600 text-right">
                  جاري التحميل...
                </p>
              )}

              {error && (
                <p className="text-lg text-red-600 text-right">خطأ: {error}</p>
              )}

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
                    {filteredIncomes?.map((income) => (
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
              <PaginationControls
                currentPage={incomePage}
                setPage={setIncomePage}
                pageCount={incomePageCount}
              />
              {/* Compute Total Button */}
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() =>
                    setTotalInfo({
                      count: filteredIncomes.length,
                      total: filteredIncomes.reduce(
                        (acc, income) => acc + (parseFloat(income.amount) || 0),
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
                    عدد الدخل: {totalInfo.count}
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    إجمالي الدخل: {totalInfo.total} جنيه
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal for adding/editing income */}
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
              {currentItem ? "تعديل دخل" : "إضافة دخل"}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {/* Club Field */}
              <div>
                <label className="block text-sm font-medium mb-1 text-right">
                  النادي
                </label>
                <select
                  name="club"
                  value={currentItem ? currentItem.club : newItem.club}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right"
                  disabled
                >
                  {userClub ? (
                    <option value={userClub.id}>{userClub.name}</option>
                  ) : (
                    <option value="">جاري التحميل...</option>
                  )}
                </select>
              </div>

              {/* Source Field */}
              <div>
                <label className="block text-sm font-medium mb-1 text-right">
                  مصدر الدخل
                </label>
                <select
                  name="source"
                  value={currentItem ? currentItem.source : newItem.source}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right"
                  required
                >
                  <option value="">اختر مصدر الدخل</option>
                  {incomeSources.results.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Field */}
              <div>
                <label className="block text-sm font-medium mb-1 text-right">
                  المبلغ
                </label>
                <input
                  type="number"
                  name="amount"
                  value={currentItem ? currentItem.amount || "" : newItem.amount || ""}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-sm font-medium mb-1 text-right">
                  الوصف
                </label>
                <textarea
                  name="description"
                  value={currentItem ? currentItem.description || "" : newItem.description || ""}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right"
                  rows={3}
                />
              </div>

              {/* Date Field */}
              <div>
                <label className="block text-sm font-medium mb-1 text-right">
                  التاريخ
                </label>
                <input
                  type="date"
                  name="date"
                  value={currentItem
                    ? currentItem.date
                      ? new Date(currentItem.date).toISOString().split('T')[0]
                      : ""
                    : newItem.date || ""}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right"
                />
              </div>

              {/* Received By Field */}
              <div>
                <label className="block text-sm font-medium mb-1 text-right">
                  المستلم
                </label>
                <input
                  type="text"
                  name="received_by"
                  value={currentItem ? currentItem.received_by || "" : newItem.received_by || ""}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right"
                  placeholder="اسم المستلم"
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
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
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