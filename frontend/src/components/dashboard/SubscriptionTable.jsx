import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { MoreVertical, Loader2 } from "lucide-react";
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaRedo,
  FaSnowflake,
  FaUndo,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import {
  fetchSubscriptionById,
  makePayment,
  renewSubscription,
  updateSubscription,
  deleteSubscriptionById,
} from "@/redux/slices/subscriptionsSlice";
import usePermission from "@/hooks/usePermission";
import BASE_URL from '../../config/api';

const SubscriptionTable = ({
  subscriptions,
  isLoading,
  paymentAmounts,
  setPaymentAmounts,
  setSelectedSubscription,
  setIsUpdateModalOpen,
  setIsDeleteModalOpen,
  setIsFreezeModalOpen,
  setIsDetailModalOpen,
  setDetailSubscription,
}) => {
  const dispatch = useDispatch();
  const canUpdateSubscription = usePermission("change_subscription");
  const canDeleteSubscription = usePermission("delete_subscription");

  const normalizeStatus = useCallback((status) => {
    if (!status || status === "unknown") return "غير معروف";
    const statusMap = {
      Active: "نشط",
      Expired: "منتهي",
      Upcoming: "قادمة",
      Frozen: "مجمد",
    };
    return statusMap[status] || "غير معروف";
  }, []);

  const handleInputChange = useCallback((e, subscriptionId) => {
    const { value } = e.target;
    if (/^\d*\.?\d*$/.test(value) && !value.startsWith("-")) {
      setPaymentAmounts((prev) => ({
        ...prev,
        [subscriptionId]: value,
      }));
    }
  }, [setPaymentAmounts]);

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
        })
        .catch((err) => {
          toast.error(`فشل الدفع: ${err.message || "حدث خطأ"}`);
        });
    },
    [dispatch, paymentAmounts, setPaymentAmounts]
  );

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
    [dispatch, setDetailSubscription, setIsDetailModalOpen]
  );

  const handleRenew = useCallback(
    (subscriptionId) => {
      dispatch(renewSubscription({ subscriptionId }))
        .unwrap()
        .then(() => {
          toast.success("تم تجديد الاشتراك بنجاح!");
        })
        .catch((err) => {
          toast.error(`فشل في تجديد الاشتراك: ${err.message || "حدث خطأ"}`);
        });
    },
    [dispatch]
  );

  const handleCancelFreeze = useCallback(
    (subscription) => {
      const activeFreeze = subscription.freeze_requests.find((fr) => fr.is_active);
      if (!activeFreeze) {
        toast.error("لا يوجد تجميد نشط لهذا الاشتراك");
        return;
      }
      fetch(`${BASE_URL}/subscriptions/api/freeze-requests/${activeFreeze.id}/cancel/`, {
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
        })
        .catch((err) => {
          toast.error(`فشل في إلغاء التجميد: ${err.message || "حدث خطأ"}`);
        });
    },
    []
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <p className="text-center text-lg text-gray-500 p-6">لا توجد اشتراكات متاحة.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-right font-semibold">العضو</th>
            <th className="py-3 px-4 text-right font-semibold">تاريخ البدء</th>
            <th className="py-3 px-4 text-right font-semibold">تاريخ الانتهاء</th>
            <th className="py-3 px-4 text-right font-semibold">نوع الاشتراك</th>
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
                <td className="py-3 px-4">{subscription.type_details.name}</td>
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
                  >
                    دفع
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
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setIsUpdateModalOpen(true);
                          }}
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
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setIsFreezeModalOpen(true);
                          }}
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
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setIsDeleteModalOpen(true);
                          }}
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
  );
};

export default SubscriptionTable;