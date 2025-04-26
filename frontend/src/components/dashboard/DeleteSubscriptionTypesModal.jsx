import React from 'react';
import { useDispatch } from 'react-redux';
import { deleteSubscriptionType } from '../../redux/slices/subscriptionsSlice';

const DeleteSubscriptionTypesModal = ({ isOpen, onClose, subscription }) => {
  const dispatch = useDispatch();

  const handleDelete = () => {
    dispatch(deleteSubscriptionType(subscription.id));
    onClose(); // Close the modal after dispatch
  };

  if (!isOpen || !subscription) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h2 className="text-xl font-semibold mb-4 text-red-600">Delete Subscription</h2>
        <p className="mb-6 text-gray-700">
          Are you sure you want to delete <strong>{subscription.name}</strong>?
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteSubscriptionTypesModal;
