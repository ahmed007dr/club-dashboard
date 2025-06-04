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
import { FiDollarSign, FiList, FiPlus, FiTrash, FiAlertTriangle, FiSearch, FiCalendar, FiUser } from "react-icons/fi";
import { MoreVertical, Loader2 } from "lucide-react";
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

    if (startPage > 1) {
      buttons.push(1);
      if (startPage > 2) buttons.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) buttons.push("...");
      buttons.push(totalPages);
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

  const handleResetFilters = () => {
    setIncomeFilters({
      source: "",
      amount: "",
      description: "",
    });
    setIncomePage(1);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSummaryFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleTotalCalculation = async () => {
    await dispatch(
      fetchIncomeSummary({
        start: summaryFilters.startDate !== "" ? summaryFilters.startDate : null,
        end: summaryFilters.endDate !== "" ? summaryFilters.endDate : null,
        details: true,
        userId: user.id,
        source: summaryFilters.sourceId !== "" ? summaryFilters.sourceId : null,
      })
    );
    setIsSummaryClicked(true);
  };

  const PaginationControls = ({ currentPage, setPage, pageCount }) => (
    <div className="flex justify-center items-center mt-6 gap-4">
      <Button
        onClick={() => setPage(currentPage - 1)}
        disabled={currentPage === 1}
        variant="outline"
        className="px-3 py-1"
      >
        <FiCalendar className="w-4 h-4 mr-2" />
        السابق
      </Button>
      <div className="flex gap-1">
        {getPageButtons(currentPage, pageCount).map((page, index) => (
          <Button
            key={index}
            onClick={() => typeof page === "number" && setPage(page)}
            variant={currentPage === page ? "default" : "outline"}
            disabled={typeof page !== "number"}
            className={`px-3 py-1 ${typeof page !== "number" ? "cursor-default" : ""}`}
          >
            {page}
          </Button>
        ))}
      </div>
      <Button
        onClick={() => setPage(currentPage + 1)}
        disabled={currentPage === pageCount}
        variant="outline"
        className="px-3 py-1"
      >
        التالي
        <FiCalendar className="w-4 h-4 ml-2" />
      </Button>
      <span className="text-sm text-gray-600">
        صفحة {currentPage} من {pageCount || 1}
      </span>
    </div>
  );

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h1 className="text-3xl font-bold tracking-tight text-right flex items-center gap-3">
        <FiDollarSign className="text-green-600 w-8 h-8" />
        إدارة الدخل
      </h1>

      <Tabs defaultValue="sources" dir="rtl">
        <TabsList className="bg-gray-100 rounded-lg p-1">
          <TabsTrigger
            value="sources"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2"
          >
            مصادر الإيرادات
          </TabsTrigger>
          <TabsTrigger
            value="incomes"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2"
          >
            الإيرادات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4">
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-right flex items-center gap-2">
                <FiList className="text-green-600 w-6 h-6" />
                مصادر الإيرادات
              </CardTitle>
              <CardDescription className="text-right">
                إدارة مصادر الإيرادات لنادي{" "}
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
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-right flex items-center gap-2">
                <FiDollarSign className="text-green-600 w-6 h-6" />
                جميع الإيرادات
              </CardTitle>
              <CardDescription className="text-right">
                إدارة جميع الإيرادات لنادي {userClub?.name || "جاري التحميل..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                {["source", "amount", "description"].map((field) => (
                  <div key={field} className="relative">
                    <label className="block text-sm font-medium mb-1 text-right">
                      {labelMapping[field] || field}
                    </label>
                    <div className="relative">
                      <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={field === "amount" ? "number" : "text"}
                        name={field}
                        value={incomeFilters[field]}
                        onChange={handleIncomeFilterChange}
                        className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
                        placeholder={`ابحث بـ ${labelMapping[field] || field}`}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex items-end">
                  <Button
                    onClick={handleResetFilters}
                    variant="outline"
                    className="w-full"
                  >
                    إعادة تعيين
                  </Button>
                </div>
              </div>

              {canAddIncome && <AddIncomeForm />}

              {loading && (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="animate-spin w-8 h-8 text-green-600" />
                  <span className="mr-4 text-gray-600">جاري التحميل...</span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 text-right">
                  <FiAlertTriangle className="text-red-600 w-6 h-6" />
                  <p className="text-red-600">خطأ: {error}</p>
                </div>
              )}

              {/* Table View (lg screens and above) */}
              <div className="hidden lg:block rounded-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="px-4 py-3 text-right text-sm font-semibold"></th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">المعرف</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">مصدر الدخل</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">المبلغ</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">الوصف</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">التاريخ</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">المستلم</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {incomes?.map((income) => (
                      <tr key={income.id} className="hover:bg-gray-50 transition-all duration-200">
                        <td className="px-4 py-3">
                          <FiDollarSign className="text-green-600 w-5 h-5" />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">{income.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {income.source_details?.name || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {income.amount ? `${income.amount} جنيه` : "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {income.description || "لا يوجد وصف"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {income.date || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {income.received_by_details?.username || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm flex gap-2 justify-end">
                          <DropdownMenu dir="rtl">
                            <DropdownMenuTrigger asChild>
                              <button className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full hover:bg-gray-300 transition-all duration-200">
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

              {/* Card View (md and sm screens) */}
              <div className="lg:hidden space-y-4">
                {incomes?.map((income) => (
                  <div
                    key={income.id}
                    className="border border-gray-200 rounded-lg p-4 shadow-sm hover:bg-gray-50 transition-all duration-200"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <FiDollarSign className="text-green-600 w-5 h-5" />
                          <div>
                            <p className="text-xs text-gray-500">المعرف</p>
                            <p className="text-sm text-gray-800">{income.id}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">مصدر الدخل</p>
                          <p className="text-sm text-gray-800">
                            {income.source_details?.name || "غير متاح"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">المبلغ</p>
                          <p className="text-sm text-gray-800">
                            {income.amount ? `${income.amount} جنيه` : "غير متاح"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">الوصف</p>
                          <p className="text-sm text-gray-800">
                            {income.description || "لا يوجد وصف"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiCalendar className="text-gray-500 w-5 h-5" />
                          <div>
                            <p className="text-xs text-gray-500">التاريخ</p>
                            <p className="text-sm text-gray-800">
                              {income.date || "غير متاح"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiUser className="text-gray-500 w-5 h-5" />
                          <div>
                            <p className="text-xs text-gray-500">المستلم</p>
                            <p className="text-sm text-gray-800">
                              {income.received_by_details?.username || "غير متاح"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <DropdownMenu dir="rtl">
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            الإجراءات
                            <MoreVertical className="h-4 w-4" />
                          </Button>
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
                    </div>
                  </div>
                ))}
              </div>

              <PaginationControls
                currentPage={incomePage}
                setPage={setIncomePage}
                pageCount={incomePageCount}
              />

              {/* Summary Filters */}
              {(user.role === "admin" || user.role === "owner") && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="relative">
                      <label className="block text-sm font-medium mb-1 text-right">
                        من
                      </label>
                      <div className="relative">
                        <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="date"
                          name="startDate"
                          value={summaryFilters.startDate}
                          onChange={handleFilterChange}
                          className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
                          pattern="\d{4}-\d{2}-\d{2}"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium mb-1 text-right">
                        إلى
                      </label>
                      <div className="relative">
                        <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="date"
                          name="endDate"
                          value={summaryFilters.endDate}
                          onChange={handleFilterChange}
                          className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
                          pattern="\d{4}-\d{2}-\d{2}"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium mb-1 text-right">
                        مصدر الدخل
                      </label>
                      <div className="relative">
                        <FiList className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                          name="sourceId"
                          value={summaryFilters.sourceId}
                          onChange={handleFilterChange}
                          className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
                        >
                          <option value="">الكل</option>
                          {incomeSources.map((source) => (
                            <option key={source.id} value={source.id}>
                              {source.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleTotalCalculation}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <FiSearch className="w-5 h-5 mr-2" />
                        حساب الإجمالي
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Card */}
              {totalIncome > 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-right space-y-2">
                  <div className="flex items-center gap-2">
                    <FiDollarSign className="text-green-600 w-6 h-6" />
                    <p className="text-lg font-semibold text-gray-800">
                      عدد الإيرادات: {totalIncomeCount}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">
                    إجمالي الإيرادات: {totalIncome} جنيه
                  </p>
                  {summaryFilters.startDate && summaryFilters.endDate && (
                    <p className="text-sm text-gray-600">
                      للفترة من {summaryFilters.startDate} إلى {summaryFilters.endDate}
                    </p>
                  )}
                </div>
              ) : (
                isSummaryClicked && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-right">
                    <div className="flex items-center gap-2">
                      <FiAlertTriangle className="text-red-600 w-6 h-6" />
                      <p className="text-lg font-semibold text-red-700">
                        لا يوجد إيرادات
                      </p>
                    </div>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Income Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md overflow-y-auto max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <FiPlus className="text-green-600 w-6 h-6" />
              <h3 className="text-xl font-semibold text-right">
                {currentItem ? "تعديل إيراد" : "إضافة إيراد"}
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-right">
                  النادي
                </label>
                <div className="relative">
                  <FiUser className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    name="club"
                    value={currentItem ? currentItem.club : newItem.club}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
                    disabled
                  >
                    {userClub ? (
                      <option value={userClub.id}>{userClub.name}</option>
                    ) : (
                      <option value="">جاري التحميل...</option>
                    )}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-right">
                  مصدر الدخل
                </label>
                <div className="relative">
                  <FiList className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    name="source"
                    value={currentItem ? currentItem.source : newItem.source}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
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
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-right">
                  المبلغ
                </label>
                <div className="relative">
                  <FiDollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    name="amount"
                    value={currentItem ? currentItem.amount || "" : newItem.amount || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-right">
                  الوصف
                </label>
                <textarea
                  name="description"
                  value={
                    currentItem ? currentItem.description || "" : newItem.description || ""
                  }
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-right">
                  التاريخ
                </label>
                <div className="relative">
                  <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
                    className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-right">
                  المستلم
                </label>
                <div className="relative">
                  <FiUser className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="received_by"
                    value={
                      currentItem ? currentItem.received_by || "" : newItem.received_by || ""
                    }
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
                    placeholder="اسم المستلم"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                onClick={() => setShowModal(false)}
                variant="outline"
                className="px-6 py-2"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleSave}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white"
              >
                حفظ
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={() => setConfirmDeleteModal(false)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <FiTrash className="text-red-600 w-6 h-6" />
              <h3 className="text-lg font-semibold text-right">تأكيد الحذف</h3>
            </div>
            <p className="text-sm text-right mb-6">
              هل أنت متأكد من حذف هذا الإيراد؟
            </p>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setConfirmDeleteModal(false)}
                variant="outline"
                className="px-6 py-2"
              >
                لا
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
              >
                نعم
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Income;