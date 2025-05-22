import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchIncomeSummary,
  fetchIncomeSources,
  fetchIncomes,
  addIncome,
  updateIncome,
  deleteIncome,
} from "../../redux/slices/financeSlice";
import BASE_URL from "../../config/api";
import AddIncomeForm from "./AddIncomeForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import IncomeSourcesList from "./IncomeSourcesList";
import usePermission from "@/hooks/usePermission";

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
  const canAddIncome = usePermission("add_income");
  const [showModal, setShowModal] = useState(false);
  // Remove sortOrder state
  const [currentItem, setCurrentItem] = useState(null);
  const [newItem, setNewItem] = useState({
    club: "",
    source: "",
    amount: "",
    description: "",
    date: "",
    received_by: "",
  });
  const [userClub, setUserClub] = useState(null);
  const [incomeFilters, setIncomeFilters] = useState({
    source: "",
    amount: "",
    description: "",
  });
  const [incomePage, setIncomePage] = useState(1);
  const [incomeSourcesPage, setIncomeSourcesPage] = useState(1);
  const [summaryFilters, setSummaryFilters] = useState({
    startDate: "",
    endDate: "",
    sourceId: "",
  });
  const [isSummaryClicked, setIsSummaryClicked] = useState(false);

  const maxButtons = 5;

  const {
    incomes,
    incomeSources,
    loading,
    error,
    incomesPagination,
    totalIncome,
    totalIncomeCount,
  } = useSelector((state) => state.finance);
  const { user } = useSelector((state) => state.auth);

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

  useEffect(() => {
    dispatch(
      fetchIncomes({
        page: incomePage,
        filters: {
          source: incomeFilters.source,
          amount: incomeFilters.amount,
          description: incomeFilters.description,
        },
      })
    );
    dispatch(fetchIncomeSources());
  }, [dispatch, incomeFilters, incomePage, summaryFilters, user.id]);

  const incomePageCount = Math.ceil(incomesPagination.count / 20);
  const incomeSourcePageCount = Math.ceil(incomeSources.length / 20);

  const getPageButtons = (currentPage, totalPages) => {
    const buttons = [];
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
        console.error(`فشل في ${currentItem ? "تحديث" : "إضافة"} دخل`, err);
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
    setIncomePage(1);
  };

  // filter handler
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSummaryFilters((prev) => ({ ...prev, [name]: value }));
  };

  // total calculation handler
  const handleTotalCalculation = async () => {
    await dispatch(
      fetchIncomeSummary({
        start:
          summaryFilters.startDate !== "" ? summaryFilters.startDate : null,
        end: summaryFilters.endDate !== "" ? summaryFilters.endDate : null,
        details: true,
        userId: user.id,
        source: summaryFilters.sourceId !== "" ? summaryFilters.sourceId : null,
      })
    );
    setIsSummaryClicked(true);
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

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-right">مصادر الايرادات</CardTitle>
              <CardDescription className="text-right">
                إدارة مصادر الايرادات لنادي{" "}
                {userClub?.name || "جاري التحميل..."}
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

        <TabsContent value="incomes" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-right">جميع الدخل</CardTitle>
              <CardDescription className="text-right">
                إدارة جميع الدخل لنادي {userClub?.name || "جاري التحميل..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {["source", "amount", "description"].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium mb-1 text-right">
                      {labelMapping[field] || field}
                    </label>
                    <input
                      type={field === "amount" ? "number" : "text"}
                      name={field}
                      value={incomeFilters[field]}
                      onChange={handleIncomeFilterChange}
                      className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right"
                      placeholder={`ابحث بـ ${labelMapping[field] || field}`}
                    />
                  </div>
                ))}
              </div>

              {canAddIncome && <AddIncomeForm />}

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
                    {incomes?.map((income) => (
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
              <div className="flex justify-end gap-4 items-center border-t pt-4">
                {(user.role === "admin" || user.role === "owner") && (
                  <div className="flex gap-2 items-center">
                    <label className="text-sm font-medium">من:</label>
                    <input
                      type="date"
                      name="startDate"
                      value={summaryFilters.startDate}
                      onChange={handleFilterChange}
                      className="border rounded-md px-2 py-1"
                      pattern="\d{4}-\d{2}-\d{2}"
                    />
                    <label className="text-sm font-medium">الى:</label>
                    <input
                      type="date"
                      name="endDate"
                      value={summaryFilters.endDate}
                      onChange={handleFilterChange}
                      className="border rounded-md px-2 py-1"
                      pattern="\d{4}-\d{2}-\d{2}"
                    />
                    <select
                      name="sourceId"
                      value={summaryFilters.sourceId}
                      onChange={handleFilterChange}
                      className="border rounded-md px-2 py-1"
                    >
                      <option value="">الكل</option>
                      {incomeSources.map((source) => (
                        <option key={source.id} value={source.id}>
                          {source.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <Button
                  onClick={handleTotalCalculation}
                  className="bg-primary text-white px-6"
                >
                  حساب الإجمالي
                </Button>
              </div>

              {totalIncome > 0 ? (
                <div className="mt-4 bg-gray-50 border rounded-md p-4 text-right space-y-1">
                  <p className="text-sm font-semibold text-gray-700">
                    عدد الدخل: {totalIncomeCount}
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    إجمالي الدخل: {totalIncome} جنيه
                  </p>
                  {summaryFilters.startDate && summaryFilters.endDate && (
                    <p className="text-xs text-gray-500">
                      للفترة من {summaryFilters.startDate} إلى{" "}
                      {summaryFilters.endDate}
                    </p>
                  )}
                </div>
              ) : (
                isSummaryClicked && (
                  <p className="text-sm font-semibold text-red-700">
                    لا يوجد دخل
                  </p>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                  {incomeSources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-right">
                  المبلغ
                </label>
                <input
                  type="number"
                  name="amount"
                  value={
                    currentItem
                      ? currentItem.amount || ""
                      : newItem.amount || ""
                  }
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-right">
                  الوصف
                </label>
                <textarea
                  name="description"
                  value={
                    currentItem
                      ? currentItem.description || ""
                      : newItem.description || ""
                  }
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-right">
                  التاريخ
                </label>
                <input
                  type="date"
                  name="date"
                  value={
                    currentItem
                      ? currentItem.date
                        ? new Date(currentItem.date).toISOString().split("T")[0]
                        : ""
                      : newItem.date || ""
                  }
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-right">
                  المستلم
                </label>
                <input
                  type="text"
                  name="received_by"
                  value={
                    currentItem
                      ? currentItem.received_by || ""
                      : newItem.received_by || ""
                  }
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
