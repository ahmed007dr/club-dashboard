
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MoreVertical, Loader2 } from "lucide-react";
import {
  FaEye,
  FaEdit,
  FaSnowflake,
  FaUndo,
  FaRedo,
  FaBan,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import {
  fetchSubscriptionById,
  makePayment,
  renewSubscription,
  cancelSubscription,
  fetchPaymentMethods,
  fetchSubscriptions,
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
  setIsFreezeModalOpen,
  setIsDetailModalOpen,
  setDetailSubscription,
}) => {
  const dispatch = useDispatch();
  const { paymentMethods, paymentMethodsLoading, paymentMethodsError, cancelStatus, cancelError } = useSelector((state) => state.subscriptions);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const canUpdateSubscription = usePermission("change_subscription");
  const canCancelSubscription = usePermission("change_subscription");

  useEffect(() => {
    dispatch(fetchPaymentMethods());
  }, [dispatch]);

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

  const handleInputChange = useCallback(
    (e, subscriptionId) => {
      const { value } = e.target;
      if (/^\d*\.?\d*$/.test(value) && !value.startsWith("-")) {
        setPaymentAmounts((prev) => ({ ...prev, [subscriptionId]: value }));
      }
    },
    [setPaymentAmounts]
  );

  const openPaymentModal = useCallback((subscriptionId) => {
    setSelectedSubscriptionId(subscriptionId);
    setPaymentMethodId("");
    setIsPaymentModalOpen(true);
  }, []);

  const handlePayment = useCallback(
    () => {
      const amountStr = paymentAmounts[selectedSubscriptionId] || "";
      const amount = parseFloat(amountStr);
      const subscription = subscriptions.find((sub) => sub.id === selectedSubscriptionId);
      const remainingAmount = parseFloat(subscription?.remaining_amount);

      if (!amountStr || amount <= 0 || isNaN(amount)) {
        toast.error("الرجاء إدخال مبلغ صالح أكبر من الصفر");
        return;
      }

      if (amount > remainingAmount) {
        toast.error("المبلغ المدخل أكبر من المبلغ المتبقي");
        return;
      }

      if (!paymentMethodId) {
        toast.error("الرجاء اختيار طريقة دفع");
        return;
      }

      dispatch(
        makePayment({
          subscriptionId: selectedSubscriptionId,
          amount: amount.toFixed(2),
          paymentMethodId: parseInt(paymentMethodId),
        })
      )
        .unwrap()
        .then(() => {
          toast.success("تم الدفع بنجاح!");
          setPaymentAmounts((prev) => ({ ...prev, [selectedSubscriptionId]: "" }));
          setIsPaymentModalOpen(false);
          setPaymentMethodId("");
          setSelectedSubscriptionId(null);
          dispatch(fetchSubscriptions({ page: 1 }));
        })
        .catch((err) => {
          toast.error(
            err?.payment_method_id?.[0] || err?.message || "فشل الدفع: حدث خطأ"
          );
        });
    },
    [dispatch, paymentAmounts, paymentMethodId, selectedSubscriptionId, subscriptions, setPaymentAmounts]
  );

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

  const handleRenew = useCallback(
    (subscriptionId) => {
      dispatch(renewSubscription({ subscriptionId }))
        .unwrap()
        .then(() => {
          toast.success("تم تجديد الاشتراك بنجاح!");
          dispatch(fetchSubscriptions({ page: 1 }));
        })
        .catch((err) => {
          toast.error(`فشل التجديد: ${err?.message || "حدث خطأ"}`);
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

      fetch(`${BASE_URL}subscriptions/api/freeze-requests/${activeFreeze.id}/cancel/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (!response.ok) throw new Error("فشل إلغاء التجميد");
          return response.json();
        })
        .then(() => {
          toast.success("تم إلغاء التجميد بنجاح!");
          dispatch(fetchSubscriptions({ page: 1 }));
        })
        .catch((err) => {
          toast.error(`فشل إلغاء التجميد: ${err.message || "حدث خطأ"}`);
        });
    },
    [dispatch]
  );

  const openCancelModal = useCallback((subscription) => {
    setSelectedSubscription(subscription);
    setIsCancelModalOpen(true);
  }, [setSelectedSubscription]);

  const handleCancelSubscription = useCallback(
    () => {
      const subscription = subscriptions.find((sub) => sub.id === selectedSubscriptionId);
      if (!subscription) {
        toast.error("الاشتراك غير موجود");
        return;
      }

      dispatch(cancelSubscription({ subscriptionId: subscription.id, reason: cancelReason }))
        .unwrap()
        .then((response) => {
          toast.success(`تم إلغاء الاشتراك بنجاح! المبلغ المسترد: ${response.refund_amount || "0.00"} ج.م`);
          setIsCancelModalOpen(false);
          setCancelReason("");
          setSelectedSubscriptionId(null);
          dispatch(fetchSubscriptions({ page: 1 }));
        })
        .catch((err) => {
          toast.error(err?.error || err?.message || "فشل إلغاء الاشتراك: حدث خطأ");
        });
    },
    [dispatch, cancelReason, selectedSubscriptionId, subscriptions]
  );

  if (isLoading || paymentMethodsLoading) {
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

  if (paymentMethodsError) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-red-500 py-6"
      >
        خطأ في جلب طرق الدفع: {paymentMethodsError}
      </motion.p>
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
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="overflow-x-auto"
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
              <th className="py-3 px-4 font-semibold text-center">الدفع</th>
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
                    className={`px-2 py-1 rounded text-xs font-medium ${statusStyles[subscription.status] || statusStyles["غير معروف"]}`}
                  >
                    {subscription.status}
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
                    disabled={subscription.status === "ملغي" || subscription.status === "مجمد"}
                  />
                  <Button
                    onClick={() => openPaymentModal(subscription.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={subscription.status === "ملغي" || subscription.status === "مجمد"}
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
                        onClick={() => handleViewDetails(subscription.id)}
                        className="cursor-pointer text-green-600 hover:bg-green-50"
                      >
                        <FaEye className="mr-2" /> عرض
                      </DropdownMenuItem>
                      {canUpdateSubscription && subscription.status !== "ملغي" && (
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
                      {canUpdateSubscription && subscription.status === "منتهي" && (
                        <DropdownMenuItem
                          onClick={() => handleRenew(subscription.id)}
                          className="cursor-pointer text-blue-600 hover:bg-blue-50"
                        >
                          <FaRedo className="mr-2" /> تجديد
                        </DropdownMenuItem>
                      )}
                      {canUpdateSubscription && subscription.status !== "مجمد" && subscription.status !== "ملغي" && (
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
                      {canUpdateSubscription && subscription.freeze_requests.some((fr) => fr.is_active) && (
                        <DropdownMenuItem
                          onClick={() => handleCancelFreeze(subscription)}
                          className="cursor-pointer text-purple-600 hover:bg-purple-50"
                        >
                          <FaUndo className="mr-2" /> إلغاء التجميد
                        </DropdownMenuItem>
                      )}
                      {canCancelSubscription && subscription.status !== "ملغي" && (
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedSubscriptionId(subscription.id);
                            openCancelModal(subscription);
                          }}
                          className="cursor-pointer text-red-600 hover:bg-red-50"
                        >
                          <FaBan className="mr-2" /> إلغاء
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-right">اختيار طريقة الدفع</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={paymentMethodId}
              onValueChange={setPaymentMethodId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id.toString()}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handlePayment}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!paymentMethodId || cancelStatus[selectedSubscriptionId] === "loading"}
            >
              {cancelStatus[selectedSubscriptionId] === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "تأكيد الدفع"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-right">تأكيد إلغاء الاشتراك</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              هل أنت متأكد من إلغاء الاشتراك "{subscriptions.find((sub) => sub.id === selectedSubscriptionId)?.type_details?.name}"؟
            </p>
            <Input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="سبب الإلغاء (اختياري)"
              className="text-right"
            />
          </div>
          {cancelError[selectedSubscriptionId] && (
            <p className="text-red-500 text-sm">{cancelError[selectedSubscriptionId]?.error || "حدث خطأ"}</p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCancelModalOpen(false);
                setCancelReason("");
                setSelectedSubscriptionId(null);
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleCancelSubscription}
              className="bg-red-600 hover:bg-red-700"
              disabled={cancelStatus[selectedSubscriptionId] === "loading"}
            >
              {cancelStatus[selectedSubscriptionId] === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "تأكيد الإلغاء"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SubscriptionTable;
