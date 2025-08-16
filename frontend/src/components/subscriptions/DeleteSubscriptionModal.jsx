
import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cancelSubscription, fetchSubscriptions } from "@/redux/slices/subscriptionsSlice";
import { toast } from "react-hot-toast";

const CancelSubscriptionModal = ({
  isOpen,
  onClose,
  subscription,
  setCurrentPage,
  filters,
  itemsPerPage,
  subscriptionsLength,
}) => {
  const dispatch = useDispatch();
  const { cancelStatus, cancelError } = useSelector((state) => state.subscriptions);
  const [cancelReason, setCancelReason] = useState("");

  const handleCancel = useCallback(() => {
    if (!subscription) return;
    dispatch(cancelSubscription({ subscriptionId: subscription.id, reason: cancelReason }))
      .unwrap()
      .then((response) => {
        toast.success(`تم إلغاء الاشتراك بنجاح! المبلغ المسترد: ${response.refund_amount || "0.00"} ج.م`);
        onClose();
        dispatch(fetchSubscriptions({ page: 1, pageSize: itemsPerPage, ...filters }));
        if (subscriptionsLength === 1 && setCurrentPage > 1) {
          setCurrentPage((prev) => prev - 1);
        }
      })
      .catch((err) => {
        toast.error(`فشل في إلغاء الاشتراك: ${err?.error || err?.message || "حدث خطأ"}`);
      });
  }, [dispatch, subscription, onClose, cancelReason, filters, itemsPerPage, subscriptionsLength, setCurrentPage]);

  if (!isOpen) return null;

  return (
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
        <h3 className="text-lg font-semibold mb-4 text-right">تأكيد إلغاء الاشتراك</h3>
        <p className="text-right">
          هل أنت متأكد من إلغاء اشتراك <strong>{subscription?.member_details.name}</strong>؟
        </p>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 text-right">سبب الإلغاء (اختياري)</label>
          <Input
            type="text"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="أدخل سبب الإلغاء"
            className="text-right"
            disabled={cancelStatus[subscription?.id] === "loading"}
          />
        </div>
        {cancelError[subscription?.id] && (
          <p className="text-red-500 text-sm mt-2">{cancelError[subscription.id]?.error || "حدث خطأ"}</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            onClick={() => {
              onClose();
              setCancelReason("");
            }}
            className="bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleCancel}
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={cancelStatus[subscription?.id] === "loading"}
          >
            {cancelStatus[subscription?.id] === "loading" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "تأكيد الإلغاء"
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CancelSubscriptionModal;
