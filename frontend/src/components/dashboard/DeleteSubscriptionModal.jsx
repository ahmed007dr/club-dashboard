import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { deleteSubscriptionById, fetchSubscriptions } from "@/redux/slices/subscriptionsSlice";
import { toast } from "react-hot-toast";

const DeleteSubscriptionModal = ({
  isOpen,
  onClose,
  subscription,
  setCurrentPage,
  filters,
  itemsPerPage,
  subscriptionsLength,
}) => {
  const dispatch = useDispatch();

  const handleDelete = useCallback(() => {
    if (!subscription) return;
    dispatch(deleteSubscriptionById(subscription.id))
      .unwrap()
      .then(() => {
        toast.success("تم حذف الاشتراك بنجاح!");
        onClose();
        dispatch(fetchSubscriptions({ page: 1, pageSize: itemsPerPage, ...filters }));
        if (subscriptionsLength === 1 && setCurrentPage > 1) {
          setCurrentPage((prev) => prev - 1);
        }
      })
      .catch((err) => {
        toast.error(`فشل في حذف الاشتراك: ${err.message || "حدث خطأ"}`);
      });
  }, [dispatch, subscription, onClose, filters, itemsPerPage, subscriptionsLength, setCurrentPage]);

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
        <h3 className="text-lg font-semibold mb-4 text-right">تأكيد الحذف</h3>
        <p className="text-right">
          هل أنت متأكد من حذف اشتراك <strong>{subscription?.member_details.name}</strong>؟
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            onClick={onClose}
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
  );
};

export default DeleteSubscriptionModal;