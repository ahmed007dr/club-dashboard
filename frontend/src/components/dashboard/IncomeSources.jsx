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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import BASE_URL from "@/config/api";

// Choices for the name field
const INCOME_SOURCE_CHOICES = [
  { value: "Renewal", label: "Renewal" },
  { value: "Subscription", label: "Subscription" },
  { value: "ticket_sales", label: "Ticket_sales" },
  { value: "SPONSORSHIPS", label: "Sponsorships" },
  { value: "EVENTS", label: "Events" },
];

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
    name: "",
  });
  const [activeTab, setActiveTab] = useState("incomeSources");
  const [totalInfo, setTotalInfo] = useState({ total: 0, count: 0 });
  const [userClub, setUserClub] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [sourceFilters, setSourceFilters] = useState({
    name: "",
    description: "",
    club: "",
  });
  const [incomeFilters, setIncomeFilters] = useState({
    source: "",
    amountMin: "",
    amountMax: "",
    dateFrom: "",
    dateTo: "",
    received_by: "",
    club: "",
  });
  const [sourcePage, setSourcePage] = useState(1);
  const [incomePage, setIncomePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { incomeSources, incomes, loading, error } = useSelector(
    (state) => state.finance
  );

  // Fetch user profile
  useEffect(() => {
    setIsProfileLoading(true);
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
        setSourceFilters((prev) => ({ ...prev, club: data.club.id.toString() }));
        setIncomeFilters((prev) => ({ ...prev, club: data.club.id.toString() }));
        setIsProfileLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
        setErrors({ general: "فشل في تحميل بيانات المستخدم" });
        setIsProfileLoading(false);
      });
  }, []);

  // Fetch data
  useEffect(() => {
    dispatch(fetchIncomeSources());
    dispatch(fetchIncomes());
  }, [dispatch]);

  // Filter and pagination logic
  const filteredSources = useMemo(() => {
    return incomeSources.filter((source) => {
      return (
        source.club_details?.id === userClub?.id &&
        (!sourceFilters.club ||
          source.club_details?.id.toString() === sourceFilters.club) &&
        (!sourceFilters.name ||
          source.name
            ?.toLowerCase()
            .includes(sourceFilters.name.toLowerCase())) &&
        (!sourceFilters.description ||
          source.description
            ?.toLowerCase()
            .includes(sourceFilters.description.toLowerCase()))
      );
    });
  }, [incomeSources, sourceFilters, userClub]);

  const filteredIncomes = useMemo(() => {
    return incomes.filter((income) => {
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
    });
  }, [incomes, incomeFilters, userClub]);

  const sourcePageCount = Math.ceil(filteredSources.length / pageSize);
  const incomePageCount = Math.ceil(filteredIncomes.length / pageSize);

  const paginatedSources = filteredSources.slice(
    (sourcePage - 1) * pageSize,
    sourcePage * pageSize
  );
  const paginatedIncomes = filteredIncomes.slice(
    (incomePage - 1) * pageSize,
    incomePage * pageSize
  );

  // Validate form data
  const validateForm = (data, isIncomeSource) => {
    const newErrors = {};
    if (isIncomeSource) {
      if (
        !data.name ||
        !INCOME_SOURCE_CHOICES.some((choice) => choice.value === data.name)
      ) {
        newErrors.name = "يرجى اختيار اسم مصدر صالح.";
      }
      if (!data.club || isNaN(parseInt(data.club))) {
        newErrors.club = "النادي مطلوب.";
      }
    } else {
      if (!data.club || isNaN(parseInt(data.club))) {
        newErrors.club = "النادي مطلوب.";
      }
      if (!data.source || isNaN(parseInt(data.source))) {
        newErrors.source = "مصدر الدخل مطلوب.";
      }
      if (!data.amount && data.amount !== 0) {
        newErrors.amount = "المبلغ مطلوب.";
      }
      if (!data.date) {
        newErrors.date = "التاريخ مطلوب.";
      }
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue =
      name === "amount "
        ? value === ""
          ? ""
          : parseFloat(value) || ""
        : value;

    if (currentItem) {
      setCurrentItem((prev) => ({ ...prev, [name]: newValue }));
    } else {
      setNewItem((prev) => ({ ...prev, [name]: newValue }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSave = () => {
    const isIncomeSource = activeTab === "incomeSources";
    const data = currentItem || newItem;

    if (isProfileLoading) {
      setErrors({ general: "جاري تحميل بيانات المستخدم، الرجاء الانتظار." });
      return;
    }

    const validationErrors = validateForm(data, isIncomeSource);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    let action;
    let formData;

    if (isIncomeSource && !currentItem) {
      formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("club", parseInt(data.club));
      action = addIncomeSource(formData);
    } else if (currentItem) {
      const payload = {
        id: currentItem.id,
        club: parseInt(currentItem.club) || null,
        source: parseInt(currentItem.source) || null,
        amount: parseFloat(currentItem.amount) || 0,
        description: currentItem.description || "",
        date: currentItem.date || "",
        received_by: parseInt(currentItem.received_by) || null,
      };
      action = updateIncome({ id: currentItem.id, updatedData: payload });
    } else {
      const payload = {
        club: parseInt(data.club) || null,
        source: parseInt(data.source) || null,
        amount: parseFloat(data.amount) || 0,
        description: data.description || "",
        date: data.date || "",
        received_by: parseInt(data.received_by) || null,
      };
      action = addIncome(payload);
    }

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
          name: "",
        });
        setErrors({});
        setShowModal(false);
      })
      .catch((err) => {
        console.error(
          `فشل في ${currentItem ? "تحديث" : "إضافة"} ${
            isIncomeSource ? "مصدر دخل" : "دخل"
          }`,
          err
        );
        if (err && typeof err === "object") {
          const formattedErrors = {};
          Object.keys(err).forEach((key) => {
            formattedErrors[key] = Array.isArray(err[key])
              ? err[key][0]
              : err[key];
          });
          setErrors(formattedErrors);
        } else {
          setErrors({ general: err || "فشل في حفظ البيانات" });
        }
      });
  };

  const handleEditClick = (item) => {
    if (activeTab === "incomes") {
      const sanitizedItem = {
        ...item,
        club: item.club?.toString() || userClub?.id.toString() || "",
        source: item.source?.toString() || "",
        amount: item.amount?.toString() || "",
        description: item.description || "",
        date: item.date || "",
        received_by: item.received_by?.toString() || "",
      };
      setCurrentItem(sanitizedItem);
      setShowModal(true);
    }
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
          setItemToDelete(null);
        })
        .catch((err) => {
          console.error("فشل في حذف الدخل:", err);
        });
    }
  };

  const handleSourceFilterChange = (e) => {
    const { name, value } = e.target;
    setSourceFilters((prev) => ({ ...prev, [name]: value }));
    setSourcePage(1);
  };

  const handleIncomeFilterChange = (e) => {
    const { name, value } = e.target;
    setIncomeFilters((prev) => ({ ...prev, [name]: value }));
    setIncomePage(1);
  };

  const PaginationControls = ({ currentPage, setPage, pageCount }) => (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 space-y-2 sm:space-y-0">
      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(parseInt(e.target.value));
            setPage(1);
          }}
          className="border rounded px-2 py-1 text-sm"
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size} لكل صفحة
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm"
        >
          السابق
        </Button>
        <span className="text-sm">
          صفحة {currentPage} من {pageCount}
        </span>
        <Button
          onClick={() => setPage((prev) => Math.min(prev + 1, pageCount))}
          disabled={currentPage === pageCount}
          className="px-3 py-1 text-sm"
        >
          التالي
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6" dir="rtl">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-right">
        إدارة الدخل
      </h1>

      <Tabs defaultValue="incomeSources" dir="rtl" onValueChange={setActiveTab}>
        <TabsList className="flex justify-start">
          <TabsTrigger value="incomeSources" className="px-4 py-2 text-sm sm:text-base">
            مصادر الدخل
          </TabsTrigger>
          <TabsTrigger value="incomes" className="px-4 py-2 text-sm sm:text-base">
            الدخل
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incomeSources" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-right text-lg sm:text-xl">
                جميع مصادر الدخل
              </CardTitle>
              <CardDescription className="text-right text-sm sm:text-base">
                إدارة جميع مصادر الدخل لنادي{" "}
                {userClub?.name || "جاري التحميل..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {["club", "name", "description"].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium mb-1 text-right">
                      {labelMapping[field]}
                    </label>
                    {field === "club" ? (
                      <select
                        name="club"
                        value={sourceFilters.club}
                        onChange={handleSourceFilterChange}
                        className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right text-sm"
                        
                      >
                        {userClub ? (
                          <option value={userClub.id}>{userClub.name}</option>
                        ) : (
                          <option value="">جاري التحميل...</option>
                        )}
                      </select>
                    ) : (
                      <input
                        type="text"
                        name={field}
                        value={sourceFilters[field]}
                        onChange={handleSourceFilterChange}
                        className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right text-sm"
                        placeholder={`ابحث بـ ${labelMapping[field]}`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <Button
                onClick={handleAddClick}
                className="flex items-center justify-center w-full sm:w-auto text-sm"
                disabled={isProfileLoading}
              >
                <Plus className="mr-2 h-4 w-4" />
                إضافة مصدر دخل
              </Button>

              {loading && (
                <p className="text-sm text-gray-600 text-right">
                  جاري التحميل...
                </p>
              )}

              {error && (
                <p className="text-sm text-red-600 text-right">خطأ: {error}</p>
              )}

              {/* Responsive Table for Income Sources */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border hidden sm:table">
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
                    {paginatedSources.map((source) => (
                      <tr
                        key={source.id}
                        className="hover:bg-gray-100 transition"
                      >
                        <td className="px-4 py-3 text-sm">{source.id}</td>
                        <td className="px-4 py-3 text-sm">
                          {INCOME_SOURCE_CHOICES.find(
                            (choice) => choice.value === source.name
                          )?.label || source.name || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {source.club_details?.name || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {source.description || "لا يوجد وصف"}
                        </td>
                      </tr>
                    ))}
                    {paginatedSources.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-3 text-center text-sm"
                        >
                          لا توجد مصادر دخل متاحة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Card Layout for Mobile */}
                <div className="sm:hidden space-y-4">
                  {paginatedSources.map((source) => (
                    <div
                      key={source.id}
                      className="border rounded-md p-4 bg-background"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold">
                          المعرف: {source.id}
                        </span>
                      </div>
                      <p className="text-sm">
                        <strong>اسم المصدر:</strong>{" "}
                        {INCOME_SOURCE_CHOICES.find(
                          (choice) => choice.value === source.name
                        )?.label || source.name || "غير متاح"}
                      </p>
                      <p className="text-sm">
                        <strong>النادي:</strong>{" "}
                        {source.club_details?.name || "غير متاح"}
                      </p>
                      <p className="text-sm">
                        <strong>الوصف:</strong>{" "}
                        {source.description || "لا يوجد وصف"}
                      </p>
                    </div>
                  ))}
                  {paginatedSources.length === 0 && (
                    <p className="text-sm text-center">
                      لا توجد مصادر دخل متاحة
                    </p>
                  )}
                </div>
              </div>

              <PaginationControls
                currentPage={sourcePage}
                setPage={setSourcePage}
                pageCount={sourcePageCount}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incomes" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-right text-lg sm:text-xl">
                جميع الدخل
              </CardTitle>
              <CardDescription className="text-right text-sm sm:text-base">
                إدارة جميع الدخل لنادي {userClub?.name || "جاري التحميل..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {[
                  "club",
                  "source",
                  "amountMin",
                  "amountMax",
                  "dateFrom",
                  "dateTo",
                  "received_by",
                ].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium mb-1 text-right">
                      {labelMapping[field] || field.replace(/([A-Z])/g, " $1")}
                    </label>
                    {field === "club" ? (
                      <select
                        name="club"
                        value={incomeFilters.club}
                        onChange={handleIncomeFilterChange}
                        className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right text-sm"
                        
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
                        className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right text-sm"
                        placeholder={`ابحث بـ ${
                          labelMapping[field] || field.replace(/([A-Z])/g, " $1")
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <Button
                onClick={handleAddClick}
                className="flex items-center justify-center w-full sm:w-auto text-sm"
                disabled={isProfileLoading}
              >
                <Plus className="mr-2 h-4 w-4" />
                إضافة دخل
              </Button>

              {loading && (
                <p className="text-sm text-gray-600 text-right">
                  جاري التحميل...
                </p>
              )}

              {error && (
                <p className="text-sm text-red-600 text-right">خطأ: {error}</p>
              )}

              {/* Responsive Table for Incomes */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border hidden sm:table">
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
                    {paginatedIncomes.map((income) => (
                      <tr
                        key={income.id}
                        className="hover:bg-gray-100 transition"
                      >
                        <td className="px-4 py-3 text-sm">{income.id}</td>
                        <td className="px-4 py-3 text-sm">
                          {INCOME_SOURCE_CHOICES.find(
                            (choice) => choice.value === income.source_details?.name
                          )?.label || income.source_details?.name || "غير متاح"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {income.amount
                            ? `${income.amount} جنيه`
                            : "غير متاح"}
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
                    {paginatedIncomes.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-3 text-center text-sm"
                        >
                          لا توجد دخل متاح
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Card Layout for Mobile */}
                <div className="sm:hidden space-y-4">
                  {paginatedIncomes.map((income) => (
                    <div
                      key={income.id}
                      className="border rounded-md p-4 bg-background"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold">
                          المعرف: {income.id}
                        </span>
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
                      </div>
                      <p className="text-sm">
                        <strong>مصدر الدخل:</strong>{" "}
                        {INCOME_SOURCE_CHOICES.find(
                          (choice) => choice.value === income.source_details?.name
                        )?.label || income.source_details?.name || "غير متاح"}
                      </p>
                      <p className="text-sm">
                        <strong>المبلغ:</strong>{" "}
                        {income.amount ? `${income.amount} جنيه` : "غير متاح"}
                      </p>
                      <p className="text-sm">
                        <strong>الوصف:</strong>{" "}
                        {income.description || "لا يوجد وصف"}
                      </p>
                      <p className="text-sm">
                        <strong>التاريخ:</strong> {income.date || "غير متاح"}
                      </p>
                      <p className="text-sm">
                        <strong>المستلم:</strong>{" "}
                        {income.received_by_details?.username || "غير متاح"}
                      </p>
                    </div>
                  ))}
                  {paginatedIncomes.length === 0 && (
                    <p className="text-sm text-center">لا توجد دخل متاح</p>
                  )}
                </div>
              </div>

              <PaginationControls
                currentPage={incomePage}
                setPage={setIncomePage}
                pageCount={incomePageCount}
              />

              <div className="flex justify-end mt-4">
                <Button
                  onClick={() =>
                    setTotalInfo({
                      count: filteredIncomes.length,
                      total: filteredIncomes.reduce(
                        (acc, income) =>
                          acc + (parseFloat(income.amount) || 0),
                        0
                      ),
                    })
                  }
                  className="w-full sm:w-auto text-sm"
                >
                  حساب الإجمالي
                </Button>
              </div>

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

      {showModal && (
        <div
          className="fixed inset-0 z-40 flex justify-center items-center bg-black bg-opacity-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md sm:max-w-lg overflow-y-auto max-h-[80vh]"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-right">
              {currentItem
                ? `تعديل ${activeTab === "incomeSources" ? "مصدر دخل" : "دخل"}`
                : `إضافة ${activeTab === "incomeSources" ? "مصدر دخل" : "دخل"}`}
            </h3>
            {errors.general && (
              <p className="text-red-500 text-sm text-right mb-4">
                {errors.general}
              </p>
            )}
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
                  <label className="block text-sm font-medium mb-1 text-right">
                    {labelMapping[field] || field}
                  </label>
                  {field === "club" ? (
                    <select
                      name="club"
                      value={currentItem ? currentItem.club : newItem.club}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right text-sm"
                      
                    >
                      {userClub ? (
                        <option value={userClub.id}>{userClub.name}</option>
                      ) : (
                        <option value="">جاري التحميل...</option>
                      )}
                    </select>
                  ) : field === "source" ? (
                    <select
                      name="source"
                      value={currentItem ? currentItem.source : newItem.source}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right text-sm"
                    >
                      <option value="">اختر مصدر الدخل</option>
                      {filteredSources.map((source) => (
                        <option key={source.id} value={source.id}>
                          {INCOME_SOURCE_CHOICES.find(
                            (choice) => choice.value === source.name
                          )?.label || source.name}
                        </option>
                      ))}
                    </select>
                  ) : field === "name" ? (
                    <select
                      name="name"
                      value={currentItem ? currentItem.name : newItem.name}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-left text-sm"
                    >
                      <option value="">اختر اسم المصدر</option>
                      {INCOME_SOURCE_CHOICES.map((choice) => (
                        <option key={choice.value} value={choice.value}>
                          {choice.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={
                        field === "amount"
                          ? "number"
                          : field === "date"
                          ? "date"
                          : "text"
                      }
                      name={field}
                      value={
                        currentItem
                          ? currentItem[field] || ""
                          : newItem[field] || ""
                      }
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right text-sm"
                    />
                  )}
                  {errors[field] && (
                    <p className="text-red-500 text-xs text-right mt-1">
                      {errors[field]}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setErrors({});
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                disabled={isProfileLoading}
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50 p-4"
          onClick={() => setConfirmDeleteModal(false)}
        >
          <div
            className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md"
            dir="rtl"
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
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
              >
                لا
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
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