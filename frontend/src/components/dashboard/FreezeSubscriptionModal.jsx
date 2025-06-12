import React, { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchSubscriptions } from "@/redux/slices/subscriptionsSlice";
import { toast } from "react-hot-toast";
import BASE_URL from '../../config/api';

const FreezeSubscriptionModal = ({
  isOpen,
  onClose,
  subscription,
  filters,
  itemsPerPage,
  currentPage,
}) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    requested_days: "",
    start_date: new Date().toISOString().split("T")[0],
  });

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!formData.requested_days || formData.requested_days <= 0) {
      toast.error("الرجاء إدخال عدد أيام صالح");
      return;
    }
    fetch(`${BASE_URL}/subscriptions/api/subscriptions/${subscription.id}/request-freeze/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requested_days: parseInt(formData.requested_days, 10),
        start_date: formData.start_date,
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("فشل في طلب التجميد");
        return response.json();
      })
      .then(() => {
        toast.success("تم طلب التجميد بنجاح!");
        onClose();
        dispatch(fetchSubscriptions({ page: currentPage, pageSize: itemsPerPage, ...filters }));
      })
      .catch((err) => {
        toast.error(`فشل في طلب التجميد: ${err.message || "حدث خطأ"}`);
      });
  }, [dispatch, subscription, formData, onClose, filters, itemsPerPage, currentPage]);

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
        <Button
          onClick={onClose}
          className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300"
        >
          ✕
        </Button>
        <h3 className="text-xl font-semibold mb-4 text-center">تجميد الاشتراك</h3>
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
      </motion.div>
    </motion.div>
  );
};

export default FreezeSubscriptionModal;