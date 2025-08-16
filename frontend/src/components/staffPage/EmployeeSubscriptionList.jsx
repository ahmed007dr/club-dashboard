import React, { useCallback, useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSubscriptions, fetchSubscriptionById } from "@/redux/slices/subscriptionsSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaCalendarAlt, FaSearch } from "react-icons/fa";
import { Loader2, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import usePermission from "@/hooks/usePermission";
import { toast } from "react-hot-toast";

// دالة تنسيق المبلغ
const formatAmount = (amount) => {
  if (amount === null || amount === undefined) return 'غير متاح';
  const parsedAmount = parseFloat(amount);
  return isNaN(parsedAmount) ? 'غير متاح' : `${parsedAmount.toFixed(2)} جنيه`;
};

// مكون فلاتر البحث (مبسط)
const EmployeeSubscriptionFilters = ({
  filters,
  setFilters,
  setCurrentPage,
  setError,
  isLoading,
  itemsPerPage,
}) => {
  const dispatch = useDispatch();

  const handleFilterChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFilters((prev) => ({ ...prev, [name]: value }));
      setError(null);
    },
    [setFilters, setError]
  );

  const handleSearch = useCallback(() => {
    if (
      !filters.memberName.trim() &&
      !filters.startDate &&
      !filters.endDate &&
      !filters.status
    ) {
      setError("يرجى تحديد فلتر واحد على الأقل للبحث");
      return;
    }
    setCurrentPage(1);
    setError(null);
    const queryParams = new URLSearchParams();
    if (filters.memberName.trim()) queryParams.append("searchTerm", filters.memberName.trim());
    if (filters.startDate) queryParams.append("startDate", filters.startDate);
    if (filters.endDate) queryParams.append("endDate", filters.endDate);
    if (filters.status) queryParams.append("status", filters.status);
    queryParams.append("page", "1");
    queryParams.append("pageSize", itemsPerPage.toString());
    dispatch(fetchSubscriptions(Object.fromEntries(queryParams)))
      .unwrap()
      .catch((err) => {
        console.error("AxiosError details:", err.response?.data, err.message);
        setError(err.response?.data?.error || `فشل في البحث: ${err.message || "حدث خطأ"}`);
      });
  }, [dispatch, filters, itemsPerPage, setCurrentPage, setError]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6" dir="rtl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            اسم العضو / RFID / رقم الهاتف
          </label>
          <div className="relative flex items-center gap-2">
            <Input
              type="text"
              name="memberName"
              value={filters.memberName}
              onChange={handleFilterChange}
              placeholder="أدخل الاسم، RFID، أو رقم الهاتف..."
              className="w-full text-right pr-10"
              disabled={isLoading}
            />
            <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ابحث"}
            </Button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            تاريخ البدء
          </label>
          <div className="relative">
            <Input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full text-right"
              disabled={isLoading}
            />
            <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            تاريخ الانتهاء
          </label>
          <div className="relative">
            <Input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full text-right"
              disabled={isLoading}
            />
            <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            الحالة
          </label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="w-full border border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg px-3 py-2.5 text-sm text-right"
            disabled={isLoading}
          >
            <option value="">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="expired">منتهي</option>
            <option value="upcoming">قادم</option>
            <option value="frozen">مجمد</option>
            <option value="cancelled">ملغي</option>
            <option value="remaining">متبقي</option>
            <option value="nearing_expiry">قريب من الانتهاء</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// مكون جدول الاشتراكات (مبسط للموظف)
const EmployeeSubscriptionTable = ({ subscriptions, isLoading, setIsDetailModalOpen, setDetailSubscription }) => {
  const dispatch = useDispatch();
  const statusStyles = {
    نشط: "bg-green-100 text-green-600",
    منتهي: "bg-red-100 text-red-600",
    قادم: "bg-blue-100 text-blue-600",
    مجمد: "bg-yellow-100 text-yellow-600",
    ملغي: "bg-gray-100 text-gray-600",
    متبقي: "bg-orange-100 text-orange-600",
    "قريب من الانتهاء": "bg-purple-100 text-purple-600",
    "غير معروف": "bg-gray-100 text-gray-600",
  };

  const handleViewDetails = useCallback(
    (id) => {
      dispatch(fetchSubscriptionById(id))
        .unwrap()
        .then((data) => {
          setDetailSubscription(data);
          setIsDetailModalOpen(true);
        })
        .catch(() => {
          toast.error("فشل تحميل تفاصيل الاشتراك");
        });
    },
    [dispatch, setDetailSubscription, setIsDetailModalOpen]
  );

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center py-10"
      >
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </motion.div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-lg text-gray-500 p-6"
      >
        لا توجد اشتراكات متاحة.
      </motion.p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="overflow-x-auto bg-white rounded-lg shadow-sm"
      dir="rtl"
    >
      <table className="w-full text-sm text-right">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 font-semibold">العضو</th>
            <th className="py-3 px-4 font-semibold">تاريخ البدء</th>
            <th className="py-3 px-4 font-semibold">تاريخ الانتهاء</th>
            <th className="py-3 px-4 font-semibold">نوع الاشتراك</th>
            <th className="py-3 px-4 font-semibold">المبلغ المتبقي</th>
            <th className="py-3 px-4 font-semibold">الحالة</th>
            <th className="py-3 px-4 font-semibold">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {subscriptions.map((subscription) => (
            <motion.tr
              key={subscription.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="hover:bg-gray-50"
            >
              <td className="py-3 px-4">{subscription.member_details.name}</td>
              <td className="py-3 px-4">{subscription.start_date}</td>
              <td className="py-3 px-4">{subscription.end_date}</td>
              <td className="py-3 px-4">{subscription.type_details.name}</td>
              <td className="py-3 px-4">{formatAmount(subscription.remaining_amount)}</td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${statusStyles[subscription.status] || statusStyles["غير معروف"]}`}
                >
                  {subscription.status}
                </span>
              </td>
              <td className="py-3 px-4">
                <Button
                  onClick={() => handleViewDetails(subscription.id)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Eye className="w-4 h-4 mr-2" /> عرض
                </Button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
};

// مكون رئيسي لعرض قائمة الاشتراكات للموظف
const EmployeeSubscriptionList = () => {
  const dispatch = useDispatch();
  const { subscriptions, pagination, status, error: reduxError } = useSelector(
    (state) => state.subscriptions
  );
  const canViewSubscription = usePermission("view_subscription");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailSubscription, setDetailSubscription] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    memberName: "",
    startDate: "",
    endDate: "",
    status: "",
  });
  const [error, setError] = useState(null);
  const itemsPerPage = 20;
  const totalItems = pagination.count || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // تعريف statusStyles هنا لاستخدامه في الجدول والمودال
  const statusStyles = {
    نشط: "bg-green-100 text-green-600",
    منتهي: "bg-red-100 text-red-600",
    قادم: "bg-blue-100 text-blue-600",
    مجمد: "bg-yellow-100 text-yellow-600",
    ملغي: "bg-gray-100 text-gray-600",
    متبقي: "bg-orange-100 text-orange-600",
    "قريب من الانتهاء": "bg-purple-100 text-purple-600",
    "غير معروف": "bg-gray-100 text-gray-600",
  };

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

  const handlePageChange = useCallback((pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo(0, 0);
    }
  }, [totalPages]);

  useEffect(() => {
    const query = {
      page: currentPage,
      pageSize: itemsPerPage,
      searchTerm: filters.memberName.trim(),
      startDate: filters.startDate,
      endDate: filters.endDate,
      status: filters.status.toLowerCase(),
    };
    dispatch(fetchSubscriptions(query))
      .unwrap()
      .then((data) => {
        if (data.subscriptions.length === 0 && (filters.memberName.trim() || filters.status || filters.startDate || filters.endDate)) {
          setError("لا توجد اشتراكات مطابقة للبحث.");
        } else {
          setError(null);
        }
      })
      .catch((err) => {
        console.error("AxiosError details:", err.response?.data, err.message);
        setError(err.response?.data?.error || "فشل في جلب الاشتراكات: " + (err.message || "حدث خطأ"));
      });
  }, [dispatch, currentPage, filters, itemsPerPage]);

  if (!canViewSubscription) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-screen text-center p-4"
        dir="rtl"
      >
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">لا يوجد صلاحية</h2>
        <p className="text-gray-500 max-w-md">
          ليس لديك الصلاحيات اللازمة لعرض الاشتراكات. يرجى التواصل مع المسؤول.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto p-4 sm:p-6 bg-gray-100 min-h-screen"
      dir="rtl"
    >
      <div className="flex items-center space-x-3 space-x-reverse mb-6">
        <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17 3H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16H8v-1h8v1zm0-2H8v-1h8v1zm-3-5H8v-1h5v1zm3-3H8V8h8v1zm0-3H8V5h8v1z"/>
        </svg>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">قائمة الاشتراكات</h2>
      </div>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      <EmployeeSubscriptionFilters
        filters={filters}
        setFilters={setFilters}
        setCurrentPage={setCurrentPage}
        setError={setError}
        isLoading={status === "loading"}
        itemsPerPage={itemsPerPage}
      />
      <EmployeeSubscriptionTable
        subscriptions={subscriptions}
        isLoading={status === "loading"}
        setIsDetailModalOpen={setIsDetailModalOpen}
        setDetailSubscription={setDetailSubscription}
      />
      <div className="flex justify-between items-center mt-6" dir="rtl">
        <Button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || status === "loading"}
          className={`px-4 py-2 rounded-md ${
            currentPage === 1 || status === "loading"
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          السابق
        </Button>
        <div className="flex gap-2">
          {paginationRange.map((pageNum) => (
            <Button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`px-4 py-2 rounded-md ${
                currentPage === pageNum
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              disabled={status === "loading"}
            >
              {pageNum}
            </Button>
          ))}
        </div>
        <Button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || totalPages === 0 || status === "loading"}
          className={`px-4 py-2 rounded-md ${
            currentPage >= totalPages || totalPages === 0 || status === "loading"
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          التالي
        </Button>
      </div>
      <AnimatePresence>
        {isDetailModalOpen && detailSubscription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full"
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-800">تفاصيل الاشتراك</h3>
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
                    <p className="text-green-600 font-medium">{formatAmount(detailSubscription.paid_amount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">المبلغ المتبقي:</p>
                    <p className="text-red-600 font-medium">{formatAmount(detailSubscription.remaining_amount)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 font-medium">عدد الإدخالات:</p>
                    <p className="text-gray-800">{detailSubscription.entry_count}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">الحالة:</p>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${statusStyles[detailSubscription.status] || statusStyles["غير معروف"]}`}
                    >
                      {detailSubscription.status}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setIsDetailModalOpen(false)}
                className="w-full bg-red-500 hover:bg-red-600 text-white"
              >
                إغلاق
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EmployeeSubscriptionList;