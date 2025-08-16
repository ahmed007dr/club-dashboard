import React from 'react';
import { useDispatch } from 'react-redux';
import { deleteSubscriptionType } from '../../redux/slices/subscriptionsSlice';
import { toast } from 'react-hot-toast';

const DeleteSubscriptionTypesModal = ({ isOpen, onClose, subscription }) => {
  const dispatch = useDispatch();

  const handleDelete = async () => {
    try {
      // Dispatch delete action
      await dispatch(deleteSubscriptionType(subscription.id)).unwrap();
      
      // Show success notification
      toast.success("تم حذف الاشتراك بنجاح!");

      // Close the modal after successful deletion
      onClose();
    } catch (err) {
  console.error("Deletion failed:", err);
  if (err.response) {
    console.error("Error response data:", err.response.data);
    console.error("Error status:", err.response.status);
    console.error("Error headers:", err.response.headers);
  } else if (err.request) {
    console.error("No response received:", err.request);
  } else {
    console.error("Error message:", err.message);
  }

  toast.error("فشل في حذف الاشتراك");
}

  };


  if (!isOpen || !subscription) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="modal relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h2 className="text-xl font-semibold mb-4 text-red-600">حذف الاشتراك</h2>
        <p className="mb-6 text-gray-700">
        هل أنت متأكد أنك تريد حذف <strong>{subscription.name}</strong>؟
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md"
          >
            إلغاء
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md"
          >
            حذف
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteSubscriptionTypesModal;
