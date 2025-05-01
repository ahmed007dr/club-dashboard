// UpdateSubscriptionModal.jsx
import React, { useState, useEffect } from 'react';

const UpdateSubscriptionModal = ({ isOpen, onClose, subscription, onSubmit }) => {
  const [formData, setFormData] = useState({
    club: '',
    member: '',
    type: '',
    start_date: '',
    end_date: '',
    paid_amount: '',
  });

  // Populate the form data when the subscription prop changes
  useEffect(() => {
    if (subscription) {
      setFormData({
        club: subscription.club || '',
        member: subscription.member || '',
        type: subscription.type || '',
        start_date: subscription.start_date || '',
        end_date: subscription.end_date || '',
        paid_amount: subscription.paid_amount || '',
      });
    }
  }, [subscription]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({
        ...formData,
        id: subscription.id, // Include the subscription ID for the update
      });
    }
    onClose(); // Close modal after submission
  };

  // Don't render the modal if it's closed
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          X
        </button>
        <h2 className="text-xl font-bold mb-4">تعديل الاشتراك</h2>
        <form onSubmit={handleSubmit}>
          {/* Club */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">النادي</label>
            <input
              type="text"
              name="club"
              value={formData.club || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          {/* Member */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">العضو</label>
            <input
              type="text"
              name="member"
              value={formData.member || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          {/* Type */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">النوع</label>
            <input
              type="text"
              name="type"
              value={formData.type || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          {/* Start Date */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">تاريخ البداية</label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          {/* End Date */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">تاريخ النهاية</label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          {/* Paid Amount */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">المبلغ المدفوع</label>
            <input
              type="number"
              name="paid_amount"
              value={formData.paid_amount || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
            className="btn"
            >
              تحديث الاشتراك
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateSubscriptionModal;
