
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSubscriptions,
  fetchSubscriptionById,
  updateSubscription,
  renewSubscription,
  makePayment,
  deleteSubscriptionById, 
} from "@/redux/slices/subscriptionsSlice";
import { Link } from "react-router-dom";
import { FaEdit, FaTrash, FaEye, FaRedo, FaCalendarAlt, FaPlus, FaSnowflake, FaUndo } from "react-icons/fa";
import { CiCircleList } from "react-icons/ci";
import { FaArrowRotateLeft } from "react-icons/fa6";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { MoreVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import usePermission from "@/hooks/usePermission";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { debounce } from "lodash";
import CreateSubscription from "./CreateSubscription";
import BASE_URL from '../../config/api';
// مكون نافذة تحديث الاشتراك
const UpdateSubscriptionModal = ({ isOpen, onClose, subscription, onSubmit }) => {
  const [formData, setFormData] = useState({
    start_date: subscription?.start_date || "",
    end_date: subscription?.end_date || "",
    paid_amount: subscription?.paid_amount || "",
    remaining_amount: subscription?.remaining_amount || "",
    entry_count: subscription?.entry_count || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ البدء</label>
          <Input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="w-full text-right"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الانتهاء</label>
          <Input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className="w-full text-right"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المدفوع</label>
          <Input
            type="number"
            name="paid_amount"
            value={formData.paid_amount}
            onChange={handleChange}
            className="w-full text-right"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المتبقي</label>
          <Input
            type="number"
            name="remaining_amount"
            value={formData.remaining_amount}
            onChange={handleChange}
            className="w-full text-right"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">عدد الإدخالات</label>
          <Input
            type="number"
            name="entry_count"
            value={formData.entry_count}
            onChange={handleChange}
            className="w-full text-right"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button
          onClick={onClose}
          className="bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          إلغاء
        </Button>
        <Button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          حفظ
        </Button>
      </div>
    </div>
  );
};

// مكون نافذة تجميد الاشتراك
const FreezeSubscriptionModal = ({ isOpen, onClose, subscription, onSubmit }) => {
  const [formData, setFormData] = useState({
    requested_days: "",
    start_date: new Date().toISOString().split("T")[0],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.requested_days || formData.requested_days <= 0) {
      toast.error("الرجاء إدخال عدد أيام صالح");
      return;
    }
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">عدد أيام التجميد</label>
          <Input
            type="number"
            name="requested_days"
            value={formData.requested_days}
            onChange={handleChange}
            placeholder="أدخل عدد الأيام"
            min="1"
            className="w-full text-right"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ البدء</label>
          <Input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="w-full text-right"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button
          onClick={onClose}
          className="bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          إلغاء
        </Button>
        <Button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          تجميد
        </Button>
      </div>
    </div>
  );
};

// مكون قائمة الاشتراكات
const SubscriptionList = () => {
  const dispatch = useDispatch();
  const { subscriptions, pagination, status, error: reduxError } = useSelector(
    (state) => state.subscriptions
  );

  // الأذونات
  const canAddSubscription = usePermission("add_subscription");
  const canUpdateSubscription = usePermission("change_subscription");
  const canDeleteSubscription = usePermission("delete_subscription");

  // الحالات
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [detailSubscription, setDetailSubscription] = useState(null);
  const [paymentAmounts, setPaymentAmounts] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    memberName: "",
    startDate: "",
    endDate: "",
    entryCount: "",
    status: "",
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // إعدادات التصفح
  const itemsPerPage = 20;
  const totalItems = pagination.count || 0;
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

  // تطبيع الحالة
  const normalizeStatus = useCallback((status) => {
    if (!status || status === "unknown") return "غير معروف";
    const statusMap = {
      Active: "نشط",
      Expired: "منتهي",
      Upcoming: "قادمة",
    };
    return statusMap[status] || "غير معروف";
  }, []);

  // التعامل مع تغيير الصفحة
  const handlePageChange = useCallback((pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo(0, 0);
    }
  }, [totalPages]);

  const goToFirstPage = useCallback(() => handlePageChange(1), [handlePageChange]);
  const goToLastPage = useCallback(() => handlePageChange(totalPages), [handlePageChange, totalPages]);

  // التعامل مع تغيير الفلاتر
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
    setError(null);
  }, []);

  // إعادة تعيين الفلاتر
  const resetFilters = useCallback(() => {
    setFilters({
      memberName: "",
      startDate: "",
      endDate: "",
      entryCount: "",
      status: "",
    });
    setCurrentPage(1);
    setError(null);
  }, []);

  // التعامل مع إدخال الدفع
  const handleInputChange = useCallback((e, subscriptionId) => {
    const { value } = e.target;
    if (/^\d*\.?\d*$/.test(value) && !value.startsWith("-")) {
      setPaymentAmounts((prev) => ({
        ...prev,
        [subscriptionId]: value,
      }));
    }
  }, []);

  // إجراء دفعة
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
          dispatch(fetchSubscriptions({ page: currentPage, pageSize: itemsPerPage, ...filters }));
        })
        .catch((err) => {
          toast.error(`فشل الدفع: ${err.message || "حدث خطأ"}`);
        });
    },
    [dispatch, paymentAmounts, currentPage, filters]
  );

  // عرض تفاصيل الاشتراك
  const openDetailModal = useCallback(
    (id) => {
      dispatch(fetchSubscriptionById(id))
        .unwrap()
        .then((data) => {
          setDetailSubscription(data);
          setIsDetailModalOpen(true);
        })
        .catch(() => {
          toast.error("فشل في تحميل تفاصيل الاشتراك");
        });
    },
    [dispatch]
  );

  // فتح نافذة التعديل
  const openUpdateModal = useCallback((subscription) => {
    setSelectedSubscription(subscription);
    setIsUpdateModalOpen(true);
  }, []);

  // فتح نافذة الحذف
  const openDeleteModal = useCallback((subscription) => {
    setSelectedSubscription(subscription);
    setIsDeleteModalOpen(true);
  }, []);

  // فتح نافذة التجميد
  const openFreezeModal = useCallback((subscription) => {
    setSelectedSubscription(subscription);
    setIsFreezeModalOpen(true);
  }, []);

  // إغلاق نافذة التعديل
  const closeUpdateModal = useCallback(() => {
    setIsUpdateModalOpen(false);
    setSelectedSubscription(null);
  }, []);

  // تحديث الاشتراك
  const handleUpdateSubmit = useCallback(
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
          closeUpdateModal();
          dispatch(fetchSubscriptions({ page: currentPage, pageSize: itemsPerPage, ...filters }));
        })
        .catch((err) => {
          toast.error(`فشل في تحديث الاشتراك: ${err.message || "حدث خطأ"}`);
        });
    },
    [dispatch, selectedSubscription, currentPage, filters, closeUpdateModal]
  );

  // تجديد الاشتراك
  const handleRenew = useCallback(
    (subscriptionId) => {
      dispatch(renewSubscription({ subscriptionId }))
        .unwrap()
        .then(() => {
          toast.success("تم تجديد الاشتراك بنجاح!");
          dispatch(fetchSubscriptions({ page: currentPage, pageSize: itemsPerPage, ...filters }));
        })
        .catch((err) => {
          toast.error(`فشل في تجديد الاشتراك: ${err.message || "حدث خطأ"}`);
        });
    },
    [dispatch, currentPage, filters]
  );

  // حذف الاشتراك
  const handleDelete = useCallback(() => {
    if (!selectedSubscription) return;
    dispatch(deleteSubscription(selectedSubscription.id))
      .unwrap()
      .then(() => {
        toast.success("تم حذف الاشتراك بنجاح!");
        setIsDeleteModalOpen(false);
        dispatch(fetchSubscriptions({ page: currentPage, pageSize: itemsPerPage, ...filters }));
        if (subscriptions.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      })
      .catch((err) => {
        toast.error(`فشل في حذف الاشتراك: ${err.message || "حدث خطأ"}`);
      });
  }, [dispatch, selectedSubscription, currentPage, filters, subscriptions]);

  // طلب تجميد الاشتراك
  const handleFreezeSubmit = useCallback(
    (formData) => {
      fetch(`${BASE_URL}/subscriptions/api/subscriptions/${selectedSubscription.id}/request-freeze/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requested_days: parseInt(formData.requested_days, 10), // تحويل إلى عدد صحيح
          start_date: formData.start_date,
        }),
      })
        .then((response) => {
          if (!response.ok) throw new Error("فشل في طلب التجميد");
          return response.json();
        })
        .then(() => {
          toast.success("تم طلب التجميد بنجاح!");
          setIsFreezeModalOpen(false);
          dispatch(fetchSubscriptions({ page: currentPage, pageSize: itemsPerPage, ...filters }));
        })
        .catch((err) => {
          toast.error(`فشل في طلب التجميد: ${err.message || "حدث خطأ"}`);
        });
    },
    [selectedSubscription, currentPage, filters]
  );

  // إلغاء التجميد
  const handleCancelFreeze = useCallback(
    (subscription) => {
      const activeFreeze = subscription.freeze_requests.find((fr) => fr.is_active);
      if (!activeFreeze) {
        toast.error("لا يوجد تجميد نشط لهذا الاشتراك");
        return;
      }
      fetch(`${BASE_URL}subscriptions/api/freeze-requests/${activeFreeze.id}/cancel/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (!response.ok) throw new Error("فشل في إلغاء التجميد");
          return response.json();
        })
        .then(() => {
          toast.success("تم إلغاء التجميد بنجاح!");
          dispatch(fetchSubscriptions({ page: currentPage, pageSize: itemsPerPage, ...filters }));
        })
        .catch((err) => {
          toast.error(`فشل في إلغاء التجميد: ${err.message || "حدث خطأ"}`);
        });
    },
    [dispatch, currentPage, filters]
  );

  // البحث المؤخر
  const debouncedFetchSubscriptions = useCallback(
    debounce((filters, page, pageSize) => {
      setIsLoading(true);
      const query = {
        page,
        pageSize,
        startDate: filters.startDate,
        endDate: filters.endDate,
        entryCount: filters.entryCount,
        status: filters.status,
      };
      if (filters.memberName.trim()) {
        query.identifier = filters.memberName;
      }
      dispatch(fetchSubscriptions(query))
        .unwrap()
        .catch((err) => {
          setError("فشل في جلب الاشتراكات: " + (err.message || "حدث خطأ"));
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 500),
    [dispatch]
  );

  // جلب الاشتراكات
  useEffect(() => {
    debouncedFetchSubscriptions(filters, currentPage, itemsPerPage);
  }, [filters, currentPage, itemsPerPage, debouncedFetchSubscriptions]);

  // عرض حالة التحميل
  if (status === "loading" && !isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="mr-2 text-gray-600">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto p-4 sm:p-6 bg-gray-100 min-h-screen" dir="rtl">
      {/* العنوان وزر الإنشاء */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3 space-x-reverse">
          <CiCircleList className="text-blue-600 w-8 h-8" />
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">قائمة الاشتراكات</h2>
        </div>
        {canAddSubscription && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <FaPlus className="mr-2" /> إضافة اشتراك
          </Button>
        )}
      </div>

      {/* عرض الأخطاء */}
      {(error || reduxError) && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error || reduxError}
        </div>
      )}

      {/* الفلاتر */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم العضو</label>
            <div className="relative">
              <Input
                type="text"
                name="memberName"
                value={filters.memberName}
                onChange={handleFilterChange}
                placeholder="ابحث باسم العضو..."
                className="w-full text-right pr-10"
              />
              <svg
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ البدء</label>
            <div className="relative">
              <Input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full text-right"
              />
              <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الانتهاء</label>
            <div className="relative">
              <Input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full text-right"
              />
              <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عدد الإدخالات</label>
            <Input
              type="number"
              name="entryCount"
              value={filters.entryCount}
              onChange={handleFilterChange}
              placeholder="تصفية حسب عدد الإدخالات"
              min="0"
              className="w-full text-right"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg px-3 py-2.5 text-sm text-right"
            >
              <option value="">كل الحالات</option>
              <option value="Active">نشط</option>
              <option value="Expired">منتهي</option>
              <option value="Upcoming">قادمة</option>
            </select>
          </div>
          <div className="flex items-end gap-2 col-span-1 sm:col-span-2 lg:col-span-4">
            <Button
              onClick={resetFilters}
              className="bg-gray-300 text-gray-700 hover:bg-gray-400 flex items-center gap-2"
            >
              <FaArrowRotateLeft />
              إعادة تعيين
            </Button>
          </div>
        </div>
      </div>

      {/* جدول الاشتراكات */}
      <div className="bg-white rounded-lg shadow-sm">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : subscriptions.length === 0 ? (
          <p className="text-center text-lg text-gray-500 p-6">لا توجد اشتراكات متاحة.</p>
        ) : (
          <>
            {/* الجدول للشاشات المتوسطة وما فوق */}
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
                        <td className="py-3 px-4">{subscription.paid_amount}</td>
                        <td className="py-3 px-4">{subscription.remaining_amount}</td>
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
                          <Input
                            type="text"
                            inputMode="decimal"
                            pattern="[0-9]*\.?[0-9]*"
                            placeholder="0.00"
                            value={paymentAmounts[subscription.id] || ""}
                            onChange={(e) => handleInputChange(e, subscription.id)}
                            className="w-16 text-sm"
                          />
                          <Button
                            onClick={() => handlePayment(subscription)}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={status === "loading"}
                          >
                            {status === "loading" ? "جاري..." : "دفع"}
                          </Button>
                        </td>
                        <td className="py-3 px-4">
                          <DropdownMenu dir="rtl">
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
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
                                  onClick={() => openUpdateModal(subscription)}
                                  className="cursor-pointer text-yellow-600 hover:bg-yellow-50"
                                >
                                  <FaEdit className="mr-2" /> تعديل
                                </DropdownMenuItem>
                              )}
                              {subscription.status === "Expired" && (
                                <DropdownMenuItem
                                  onClick={() => handleRenew(subscription.id)}
                                  className="cursor-pointer text-blue-600 hover:bg-blue-50"
                                >
                                  <FaRedo className="mr-2" /> تجديد
                                </DropdownMenuItem>
                              )}
                              {canUpdateSubscription && (
                                <DropdownMenuItem
                                  onClick={() => openFreezeModal(subscription)}
                                  className="cursor-pointer text-blue-600 hover:bg-blue-50"
                                >
                                  <FaSnowflake className="mr-2" /> تجميد
                                </DropdownMenuItem>
                              )}
                              {canUpdateSubscription && subscription.freeze_requests.some(fr => fr.is_active) && (
                                <DropdownMenuItem
                                  onClick={() => handleCancelFreeze(subscription)}
                                  className="cursor-pointer text-purple-600 hover:bg-purple-50"
                                >
                                  <FaUndo className="mr-2" /> إلغاء التجميد
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
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* تخطيط البطاقات للشاشات الصغيرة */}
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
                          <Button variant="ghost">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
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
                              onClick={() => openUpdateModal(subscription)}
                              className="cursor-pointer text-yellow-600 hover:bg-yellow-50"
                            >
                              <FaEdit className="mr-2" /> تعديل
                            </DropdownMenuItem>
                          )}
                          {subscription.status === "Expired" && (
                            <DropdownMenuItem
                              onClick={() => handleRenew(subscription.id)}
                              className="cursor-pointer text-blue-600 hover:bg-blue-50"
                            >
                              <FaRedo className="mr-2" /> تجديد
                            </DropdownMenuItem>
                          )}
                          {canUpdateSubscription && (
                            <DropdownMenuItem
                              onClick={() => openFreezeModal(subscription)}
                              className="cursor-pointer text-blue-600 hover:bg-blue-50"
                            >
                              <FaSnowflake className="mr-2" /> تجميد
                            </DropdownMenuItem>
                          )}
                          {canUpdateSubscription && subscription.freeze_requests.some(fr => fr.is_active) && (
                            <DropdownMenuItem
                              onClick={() => handleCancelFreeze(subscription)}
                              className="cursor-pointer text-purple-600 hover:bg-purple-50"
                            >
                              <FaUndo className="mr-2" /> إلغاء التجميد
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
                    </div>
                    <div className="space-y-2 text-sm">
                      <p><strong>تاريخ البدء:</strong> {subscription.start_date}</p>
                      <p><strong>تاريخ الانتهاء:</strong> {subscription.end_date}</p>
                      <p><strong>عدد الإدخالات:</strong> {subscription.entry_count}</p>
                      <p>
                        <strong>الإدخالات المتبقية:</strong>{" "}
                        {subscription.type_details.max_entries - subscription.entry_count}
                      </p>
                      <p><strong>المبلغ المدفوع:</strong> {subscription.paid_amount}</p>
                      <p><strong>المبلغ المتبقي:</strong> {subscription.remaining_amount}</p>
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
                        <Input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*\.?[0-9]*"
                          placeholder="0.00"
                          value={paymentAmounts[subscription.id] || ""}
                          onChange={(e) => handleInputChange(e, subscription.id)}
                          className="w-20 text-sm"
                        />
                        <Button
                          onClick={() => handlePayment(subscription)}
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={status === "loading"}
                        >
                          {status === "loading" ? "جاري..." : "دفع"}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* التصفح */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 space-y-4 sm:space-y-0" dir="rtl">
          <span className="text-sm text-gray-600">
            صفحة {currentPage} من {totalPages} (إجمالي: {totalItems} اشتراك)
          </span>
          <div className="flex gap-2 flex-wrap justify-center">
            <Button
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              className={currentPage === 1 ? "bg-gray-300 text-gray-500" : "bg-blue-600 hover:bg-blue-700"}
            >
              الأول
            </Button>
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={currentPage === 1 ? "bg-gray-300 text-gray-500" : "bg-blue-600 hover:bg-blue-700"}
            >
              السابق
            </Button>
            {paginationRange.map((page) => (
              <Button
                key={page}
                onClick={() => handlePageChange(page)}
                className={currentPage === page ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}
              >
                {page}
              </Button>
            ))}
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={currentPage === totalPages ? "bg-gray-300 text-gray-500" : "bg-blue-600 hover:bg-blue-700"}
            >
              التالي
            </Button>
            <Button
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              className={currentPage === totalPages ? "bg-gray-300 text-gray-500" : "bg-blue-600 hover:bg-blue-700"}
            >
              الأخير
            </Button>
          </div>
        </div>
      )}

      {/* نافذة إنشاء اشتراك */}
      <AnimatePresence>
        {isCreateModalOpen && canAddSubscription && (
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
              className="bg-white p-6 rounded-lg relative max-w-3xl w-full"
            >
              <Button
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300"
              >
                ✕
              </Button>
              <h3 className="text-xl font-semibold mb-4 text-center">إضافة اشتراك</h3>
              <CreateSubscription onClose={() => setIsCreateModalOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* نافذة تحديث الاشتراك */}
      <AnimatePresence>
        {isUpdateModalOpen && canUpdateSubscription && (
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
              className="bg-white p-6 rounded-lg relative max-w-3xl w-full"
            >
              <Button
                onClick={closeUpdateModal}
                className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300"
              >
                ✕
              </Button>
              <h3 className="text-xl font-semibold mb-4 text-center">تحديث الاشتراك</h3>
              <UpdateSubscriptionModal
                isOpen={isUpdateModalOpen}
                onClose={closeUpdateModal}
                subscription={selectedSubscription}
                onSubmit={handleUpdateSubmit}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* نافذة حذف الاشتراك */}
      <AnimatePresence>
        {isDeleteModalOpen && canDeleteSubscription && (
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
              className="bg-white p-6 rounded-lg relative max-w-md w-full"
            >
              <h3 className="text-lg font-semibold mb-4 text-right">تأكيد الحذف</h3>
              <p className="text-right">
                هل أنت متأكد من حذف اشتراك <strong>{selectedSubscription?.member_details.name}</strong>؟
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleDelete}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  حذف
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* نافذة تجميد الاشتراك */}
      <AnimatePresence>
        {isFreezeModalOpen && canUpdateSubscription && (
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
              className="bg-white p-6 rounded-lg relative max-w-md w-full"
            >
              <Button
                onClick={() => setIsFreezeModalOpen(false)}
                className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300"
              >
                ✕
              </Button>
              <h3 className="text-xl font-semibold mb-4 text-center">تجميد الاشتراك</h3>
              <FreezeSubscriptionModal
                isOpen={isFreezeModalOpen}
                onClose={() => setIsFreezeModalOpen(false)}
                subscription={selectedSubscription}
                onSubmit={handleFreezeSubmit}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* نافذة تفاصيل الاشتراك */}
      <AnimatePresence>
        {isDetailModalOpen && detailSubscription && (
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
                    <p className="text-green-600 font-medium">{detailSubscription.paid_amount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">المبلغ المتبقي:</p>
                    <p className="text-red-600 font-medium">{detailSubscription.remaining_amount}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 font-medium">عدد الإدخالات:</p>
                    <p className="text-gray-800">{detailSubscription.entry_count}</p>
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
    </div>
  );
};

export default SubscriptionList;
