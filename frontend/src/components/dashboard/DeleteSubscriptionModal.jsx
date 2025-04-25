import React from 'react';
import { useDispatch } from 'react-redux';
import { deleteSubscriptionById } from '../../redux/slices/subscriptionsSlice';

const DeleteSubscriptionModal = ({ isOpen, onClose, subscription }) => {
  const dispatch = useDispatch();

  const handleDelete = async () => {
    await dispatch(deleteSubscriptionById(subscription.id));
    onClose();
  };

  if (!isOpen || !subscription) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-sm relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-lg font-semibold mb-4">Delete Subscription</h2>
        <p className="mb-4">Are you sure you want to delete <strong>{subscription.name}</strong>?</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteSubscriptionModal;
