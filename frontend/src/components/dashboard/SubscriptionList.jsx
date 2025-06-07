import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSubscriptions,
  fetchSubscriptionById,
  updateSubscription,
  renewSubscription,
  makePayment,
} from "../../redux/slices/subscriptionsSlice";
import DeleteSubscriptionModal from "./DeleteSubscriptionModal";
import UpdateSubscriptionModal from "./UpdateSubscriptionModal";
import { Link } from "react-router-dom";
import { FaEdit, FaTrash, FaEye, FaRedo, FaCalendarAlt } from "react-icons/fa";
import { CiCircleList } from "react-icons/ci";
import CreateSubscription from "./CreateSubscription";
import { FaArrowRotateLeft } from "react-icons/fa6";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { MoreVertical } from "lucide-react";
import usePermission from "@/hooks/usePermission";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "react-tooltip";
import { toast } from "react-hot-toast";
import { debounce } from "lodash";

const SubscriptionList = () => {
  const dispatch = useDispatch();
  const { subscriptions, pagination, status, error, updateStatus } = useSelector(
    (state) => state.subscriptions
  );

  const canAddSubscription = usePermission("add_subscription");
  const canUpdateSubscription = usePermission("change_subscription");
  const canDeleteSubscription = usePermission("delete_subscription");

  // State management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailSubscriptionId, setDetailSubscriptionId] = useState(null);
  const [paymentAmounts, setPaymentAmounts] = useState({});
  const [detailSubscription, setDetailSubscription] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    memberName: "",
    startDate: "",
    endDate: "",
    entryCount: "",
    status: "",
  });

  // Normalize status values
  const normalizeStatus = useCallback((status) => {
    if (!status || status === "unknown") return "غير معروف";
    const statusMap = {
      active: "نشط",
      expired: "منتهي",
      upcoming: "قادمة",
    };
    return statusMap[status.toLowerCase()] || "غير معروف";
  }, []);

  // Pagination configuration
  const totalItems = pagination.count || 0;
  const itemsPerPage = pagination.page_size || 20;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const paginationRange = useMemo(() => {
    const maxButtons = 5;
    const sideButtons = Math.floor(maxButtons / 2);
    let start = Math.max(1, currentPage - sideButtons);
    let end = Math.min(totalPages, currentPage + sideButtons);
  
    if (end - start + 1 < maxButtons) {
      if (currentPage <= sideButtons) {
        end = Math.min(totalPages, maxButtons);
      } else {
        start = Math.max(1, totalPages - maxButtons + 1);
      }
    }
  
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);
  // Handlers
  const handlePageChange = useCallback((pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo(0, 0);
    }
  }, [totalPages]);

  const goToFirstPage = useCallback(() => handlePageChange(1), [handlePageChange]);
  const goToLastPage = useCallback(() => handlePageChange(totalPages), [handlePageChange, totalPages]);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      memberName: "",
      startDate: "",
      endDate: "",
      entryCount: "",
      status: "",
    });
    setCurrentPage(1);
  }, []);

  const handleInputChange = useCallback((e, subscriptionId) => {
    const { value } = e.target;
    if (/^\d*\.?\d*$/.test(value) && !value.startsWith("-")) {
      setPaymentAmounts((prev) => ({
        ...prev,
        [subscriptionId]: value,
      }));
    }
  }, []);

  const handlePayment = useCallback(
    (subscription) => {
      const amountStr = paymentAmounts[subscription.id] || "";
      const remainingAmount = parseFloat(subscription.remaining_amount);

      if (!amountStr || amountStr === "0" || amountStr === "0.00") {
        toast.error("الرجاء إدخال مبلغ صالح للدفع");
        return;
      }

      const amount = parseFloat(amountStr);

      if (isNaN(amount)) {
        toast.error("المبلغ المدخل غير صالح");
        return;
      }

      if (amount <= 0) {
        toast.error("يجب أن يكون المبلغ أكبر من الصفر");
        return;
      }

      if (amount > remainingAmount) {
        toast.error("المبلغ المدخل أكبر من المبلغ المتبقي");
        return;
      }

      dispatch(
        makePayment({
          subscriptionId: subscription.id,
          amount: amount.toFixed(2),
        })
      )
        .unwrap()
        .then(() => {
          toast.success("تم الدفع بنجاح!");
          setPaymentAmounts((prev) => ({
            ...prev,
            [subscription.id]: "",
          }));
          dispatch(
            fetchSubscriptions({
              page: currentPage,
              pageSize: itemsPerPage,
              ...filters,
            })
          );
        })
        .catch((error) => {
          toast.error(`فشل الدفع: ${error.message}`);
        });
    },
    [dispatch, paymentAmounts, currentPage, filters]
  );

  const openDetailModal = useCallback(
    (id) => {
      dispatch(fetchSubscriptionById(id))
        .unwrap()
        .then((data) => {
          setDetailSubscription(data);
          setDetailSubscriptionId(id);
          setDetailModalOpen(true);
        })
        .catch((error) => {
          toast.error("فشل في تحميل تفاصيل الاشتراك");
        });
    },
    [dispatch]
  );

  const openModal = useCallback((subscription) => {
    setSelectedSubscription(subscription);
    setIsModalOpen(true);
  }, []);

  const openDeleteModal = useCallback((subscription) => {
    setSelectedSubscription(subscription);
    setDeleteModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedSubscription(null);
  }, []);

  const handleSubmit = useCallback(
    (formData) => {
      dispatch(
        updateSubscription({
          id: selectedSubscription.id,
          subscriptionData: formData,
        })
      )
        .unwrap()
        .then(() => {
          toast.success("تم تحديث الاشتراك بنجاح!");
          closeModal();
          dispatch(
            fetchSubscriptions({
              page: currentPage,
              pageSize: itemsPerPage,
              ...filters,
            })
          );
        })
        .catch((error) => {
          toast.error(`فشل في تحديث الاشتراك: ${error.message}`);
        });
    },
    [dispatch, selectedSubscription, currentPage, filters, closeModal]
  );

  const handleRenew = useCallback(
    (subscriptionId) => {
      dispatch(renewSubscription({ subscriptionId }))
        .unwrap()
        .then(() => {
          toast.success("تم تجديد الاشتراك بنجاح!");
          dispatch(
            fetchSubscriptions({
              page: currentPage,
              pageSize: itemsPerPage,
              ...filters,
            })
          );
        })
        .catch((error) => {
          toast.error(`فشل في تجديد الاشتراك: ${error.message}`);
        });
    },
    [dispatch, currentPage, filters]
  );

  // Debounced fetch subscriptions
  const debouncedFetchSubscriptions = useCallback(
    debounce((filters, page, pageSize) => {
      dispatch(
        fetchSubscriptions({
          page,
          pageSize,
          searchTerm: filters.memberName,
          startDate: filters.startDate,
          endDate: filters.endDate,
          entryCount: filters.entryCount,
          status: filters.status,
        })
      );
    }, 500),
    [dispatch]
  );

  // Fetch subscriptions
  useEffect(() => {
    debouncedFetchSubscriptions(filters, currentPage, itemsPerPage);
  }, [filters, currentPage, itemsPerPage, debouncedFetchSubscriptions]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="mr-2 text-gray-600">جاري التحميل...</span>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 text-red-500 text-lg">
        خطأ: {error}
      </div>
    );
  }

  return (
    <div className="mx-auto p-4 sm:p-6 bg-gray-100 min-h-screen" dir="rtl">
      {/* Header and Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3 space-x-reverse">
          <CiCircleList className="text-blue-600 w-8 h-8" />
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">
            قائمة الاشتراكات
          </h2>
        </div>
        {canAddSubscription && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCreateModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            data-tooltip-id="create-tooltip"
            data-tooltip-content="إضافة اشتراك جديد"
          >
            إضافة اشتراك
          </motion.button>
        )}
        <Tooltip id="create-tooltip" />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              اسم العضو
            </label>
            <div className="relative">
              <input
                type="text"
                name="memberName"
                value={filters.memberName}
                onChange={handleFilterChange}
                placeholder="ابحث باسم العضو..."
                className="w-full border border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg px-3 py-2.5 text-sm text-right shadow-sm placeholder-gray-400 pr-10"
              />
              <svg
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تاريخ البدء
            </label>
            <div className="relative">
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg px-3 py-2.5 text-sm text-right shadow-sm appearance-none"
              />
              <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تاريخ الانتهاء
            </label>
            <div className="relative">
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg px-3 py-2.5 text-sm text-right shadow-sm appearance-none"
              />
              <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              عدد الإدخالات
            </label>
            <input
              type="number"
              name="entryCount"
              value={filters.entryCount}
              onChange={handleFilterChange}
              placeholder="تصفية حسب عدد الإدخالات"
              min="0"
              className="w-full border border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg px-3 py-2.5 text-sm text-right shadow-sm placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الحالة
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg px-3 py-2.5 text-sm text-right shadow-sm"
            >
              <option value="">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="expired">منتهي</option>
              <option value="upcoming">قادمة</option>
            </select>
          </div>
          <div className="flex items-end gap-2 col-span-1 sm:col-span-2 lg:col-span-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetFilters}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 flex items-center gap-2"
            >
              <FaArrowRotateLeft />
              إعادة تعيين
            </motion.button>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg shadow-sm">
        {subscriptions.length === 0 ? (
          <p className="text-center text-lg text-gray-500 p-6">
            لا توجد اشتراكات متاحة.
          </p>
        ) : (
          <>
            {/* Table for Medium Screens and Above */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-right font-semibold">العضو</th>
                    <th className="py-3 px-4 text-right font-semibold">تاريخ البدء</th>
                    <th className="py-3 px-4 text-right font-semibold">تاريخ الانتهاء</th>
                    <th className="py-3 px-4 text-right font-semibold">عدد الإدخالات</th>
                    <th className="py-3 px-4 text-right font-semibold">الإدخالات المتبقية</th>
                    <th className="py-3 px-4 text-right font-semibold">المبلغ المدفوع</th>
                    <th className="py-3 px-4 text-right font-semibold">المبلغ المتبقي</th>
                    <th className="py-3 px-4 text-right font-semibold">الحالة</th>
                    <th className="py-3 px-4 text-center font-semibold">الدفع</th>
                    <th className="py-3 px-4 text-right font-semibold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {subscriptions.map((subscription) => {
                    const displayStatus = normalizeStatus(subscription.status);
                    return (
                      <motion.tr
                        key={subscription.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <Link
                            to={`/member-subscriptions/${subscription.member_details.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {subscription.member_details.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4">{subscription.start_date}</td>
                        <td className="py-3 px-4">{subscription.end_date}</td>
                        <td className="py-3 px-4">{subscription.entry_count}</td>
                        <td className="py-3 px-4">
                          {subscription.type_details.max_entries - subscription.entry_count}
                        </td>
                        <td className="py-3 px-4">${subscription.paid_amount}</td>
                        <td className="py-3 px-4">${subscription.remaining_amount}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              displayStatus === "نشط"
                                ? "bg-green-100 text-green-600"
                                : displayStatus === "منتهي"
                                ? "bg-red-100 text-red-600"
                                : displayStatus === "قادمة"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {displayStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 flex items-center justify-center gap-2">
                          <input
                            type="text"
                            inputMode="decimal"
                            pattern="[0-9]*\.?[0-9]*"
                            placeholder="0.00"
                            value={paymentAmounts[subscription.id] || ""}
                            onChange={(e) => handleInputChange(e, subscription.id)}
                            className="border p-1 rounded w-16 text-sm focus:outline-none focus:ring focus:ring-blue-200"
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handlePayment(subscription)}
                            className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            disabled={updateStatus === "loading"}
                          >
                            {updateStatus === "loading" ? "جاري..." : "دفع"}
                          </motion.button>
                        </td>
                        <td className="py-3 px-4">
                          <DropdownMenu dir="rtl">
                            <DropdownMenuTrigger asChild>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                className="bg-gray-200 text-gray-700 px-1 py-1 rounded-md hover:bg-gray-300"
                                data-tooltip-id={`actions-${subscription.id}`}
                                data-tooltip-content="الإجراءات"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </motion.button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32 text-sm">
                              <DropdownMenuItem
                                onClick={() => openDetailModal(subscription.id)}
                                className="cursor-pointer text-green-600 hover:bg-green-50"
                              >
                                <FaEye className="mr-2" /> عرض
                              </DropdownMenuItem>
                              {canUpdateSubscription && (
                                <DropdownMenuItem
                                  onClick={() => openModal(subscription)}
                                  className="cursor-pointer text-yellow-600 hover:bg-yellow-50"
                                >
                                  <FaEdit className="mr-2" /> تعديل
                                </DropdownMenuItem>
                              )}
                              {subscription.status === "expired" && (
                                <DropdownMenuItem
                                  onClick={() => handleRenew(subscription.id)}
                                  className="cursor-pointer text-blue-600 hover:bg-blue-50"
                                >
                                  <FaRedo className="mr-2" /> تجديد
                                </DropdownMenuItem>
                              )}
                              {canDeleteSubscription && (
                                <DropdownMenuItem
                                  onClick={() => openDeleteModal(subscription)}
                                  className="cursor-pointer text-red-600 hover:bg-red-50"
                                >
                                  <FaTrash className="mr-2" /> حذف
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Tooltip id={`actions-${subscription.id}`} />
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Card Layout for Mobile and Small Screens */}
            <div className="md:hidden space-y-4 p-4">
              {subscriptions.map((subscription) => {
                const displayStatus = normalizeStatus(subscription.status);
                return (
                  <motion.div
                    key={subscription.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-semibold">
                        <Link
                          to={`/member-subscriptions/${subscription.member_details.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {subscription.member_details.name}
                        </Link>
                      </span>
                      <DropdownMenu dir="rtl">
                        <DropdownMenuTrigger asChild>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            className="bg-gray-200 text-gray-700 px-1 py-1 rounded-md hover:bg-gray-300"
                            data-tooltip-id={`actions-mobile-${subscription.id}`}
                            data-tooltip-content="الإجراءات"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </motion.button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32 text-sm">
                          <DropdownMenuItem
                            onClick={() => openDetailModal(subscription.id)}
                            className="cursor-pointer text-green-600 hover:bg-green-50"
                          >
                            <FaEye className="mr-2" /> عرض
                          </DropdownMenuItem>
                          {canUpdateSubscription && (
                            <DropdownMenuItem
                              onClick={() => openModal(subscription)}
                              className="cursor-pointer text-yellow-600 hover:bg-yellow-50"
                            >
                              <FaEdit className="mr-2" /> تعديل
                            </DropdownMenuItem>
                          )}
                          {subscription.status === "expired" && (
                            <DropdownMenuItem
                              onClick={() => handleRenew(subscription.id)}
                              className="cursor-pointer text-blue-600 hover:bg-blue-50"
                            >
                              <FaRedo className="mr-2" /> تجديد
                            </DropdownMenuItem>
                          )}
                          {canDeleteSubscription && (
                            <DropdownMenuItem
                              onClick={() => openDeleteModal(subscription)}
                              className="cursor-pointer text-red-600 hover:bg-red-50"
                            >
                              <FaTrash className="mr-2" /> حذف
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Tooltip id={`actions-mobile-${subscription.id}`} />
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>تاريخ البدء:</strong> {subscription.start_date}
                      </p>
                      <p>
                        <strong>تاريخ الانتهاء:</strong> {subscription.end_date}
                      </p>
                      <p>
                        <strong>عدد الإدخالات:</strong> {subscription.entry_count}
                      </p>
                      <p>
                        <strong>الإدخالات المتبقية:</strong>{" "}
                        {subscription.type_details.max_entries - subscription.entry_count}
                      </p>
                      <p>
                        <strong>المبلغ المدفوع:</strong> ${subscription.paid_amount}
                      </p>
                      <p>
                        <strong>المبلغ المتبقي:</strong> ${subscription.remaining_amount}
                      </p>
                      <p>
                        <strong>الحالة:</strong>{" "}
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            displayStatus === "نشط"
                              ? "bg-green-100 text-green-600"
                              : displayStatus === "منتهي"
                              ? "bg-red-100 text-red-600"
                              : displayStatus === "قادمة"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {displayStatus}
                        </span>
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*\.?[0-9]*"
                          placeholder="0.00"
                          value={paymentAmounts[subscription.id] || ""}
                          onChange={(e) => handleInputChange(e, subscription.id)}
                          className="border p-1 rounded w-20 text-sm focus:outline-none focus:ring focus:ring-blue-200"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handlePayment(subscription)}
                          className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          disabled={updateStatus === "loading"}
                        >
                          {updateStatus === "loading" ? "جاري..." : "دفع"}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 space-y-4 sm:space-y-0" dir="rtl">
          <span className="text-sm text-gray-600">
            صفحة {currentPage} من {totalPages} (إجمالي: {totalItems} اشتراك)
          </span>
          <div className="flex gap-2 flex-wrap justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg ${
                currentPage === 1
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              الأول
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg ${
                currentPage === 1
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              السابق
            </motion.button>
            {paginationRange.map((page) => (
              <motion.button
                key={page}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 rounded-lg ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {page}
              </motion.button>
            ))}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-lg ${
                currentPage === totalPages
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              التالي
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-lg ${
                currentPage === totalPages
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              الأخير
            </motion.button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {createModalOpen && canAddSubscription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-40"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white p-6 rounded-lg relative max-w-lg w-full"
            >
              <button
                onClick={() => setCreateModalOpen(false)}
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
              >
                ✕
              </button>
              <h3 className="text-xl font-semibold mb-4 text-center">
                إضافة اشتراك
              </h3>
              <CreateSubscription onClose={() => setCreateModalOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && canUpdateSubscription && (
          <UpdateSubscriptionModal
            isOpen={isModalOpen}
            onClose={closeModal}
            subscription={selectedSubscription}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteModalOpen && canDeleteSubscription && (
          <DeleteSubscriptionModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            subscription={selectedSubscription}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailModalOpen && detailSubscription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full"
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                تفاصيل الاشتراك
              </h3>
              <div className="space-y-3 mb-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 font-medium">اسم العضو:</p>
                    <p className="text-gray-800">{detailSubscription.member_details.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">رقم العضوية:</p>
                    <p className="text-gray-800">
                      {detailSubscription.member_details.membership_number || "غير متوفر"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 font-medium">تاريخ البدء:</p>
                    <p className="text-gray-800">{detailSubscription.start_date}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">تاريخ الانتهاء:</p>
                    <p className="text-gray-800">{detailSubscription.end_date}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 font-medium">المبلغ المدفوع:</p>
                    <p className="text-green-600 font-medium">${detailSubscription.paid_amount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">المبلغ المتبقي:</p>
                    <p className="text-red-600 font-medium">${detailSubscription.remaining_amount}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 font-medium">عدد الإدخالات:</p>
                    <p className="text-gray-800">{detailSubscription.entry_count}</p>
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDetailModalOpen(false)}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                إغلاق
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubscriptionList;