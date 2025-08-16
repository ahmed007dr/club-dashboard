import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const SubscriptionDetailsModal = ({ isOpen, onClose, subscription }) => {
  if (!isOpen) return null;

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

  return (
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
              <p className="text-gray-800">{subscription.member_details.name}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">رقم العضوية:</p>
              <p className="text-gray-800">
                {subscription.member_details.membership_number || "غير متوفر"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 font-medium">تاريخ البدء:</p>
              <p className="text-gray-800">{subscription.start_date}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">تاريخ الانتهاء:</p>
              <p className="text-gray-800">{subscription.end_date}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 font-medium">المبلغ المدفوع:</p>
              <p className="text-green-600 font-medium">{subscription.paid_amount}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">المبلغ المتبقي:</p>
              <p className="text-red-600 font-medium">{subscription.remaining_amount}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 font-medium">عدد الإدخالات:</p>
              <p className="text-gray-800">{subscription.entry_count}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">الحالة:</p>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${statusStyles[subscription.status] || statusStyles["غير معروف"]}`}
              >
                {subscription.status}
              </span>
            </div>
          </div>
        </div>
        <Button
          onClick={onClose}
          className="w-full bg-red-500 hover:bg-red-600 text-white"
        >
          إغلاق
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default SubscriptionDetailsModal;
