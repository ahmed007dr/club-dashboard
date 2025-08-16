import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import CreateSubscription from "./CreateSubscription";

const CreateSubscriptionModal = ({ isOpen, onClose }) => {
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
        className="bg-white p-6 rounded-lg relative max-w-3xl w-full"
      >
        <Button
          onClick={onClose}
          className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300"
        >
          ✕
        </Button>
        <h3 className="text-xl font-semibold mb-4 text-center">إضافة اشتراك</h3>
        <CreateSubscription onClose={onClose} />
      </motion.div>
    </motion.div>
  );
};

export default CreateSubscriptionModal;