import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addSubscriptionType } from '../../redux/slices/subscriptionsSlice';

const CreateSubscription = () => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    durationDays: '',
    include_gym: false,
    include_pool: false,
    include_classes: false,
  });

  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Prepare data in the format expected by the backend
    const submissionData = {
      name: formData.name.trim(),
      price: formData.price ? parseFloat(formData.price) : 0,
      duration_days: formData.durationDays ? parseInt(formData.durationDays, 10) : 0,
      include_gym: formData.include_gym,
      include_pool: formData.include_pool,
      include_classes: formData.include_classes,
    };

    // Basic validation
    if (!submissionData.name) {
      setError('Name is required');
      return;
    }
    if (submissionData.duration_days <= 0) {
      setError('Duration must be positive');
      return;
    }
    if (submissionData.price < 0) {
      setError('Price cannot be negative');
      return;
    }

    try {
      await dispatch(addSubscriptionType(submissionData)).unwrap();
      // Reset form on success
      setFormData({
        name: '',
        price: '',
        durationDays: '',
        include_gym: false,
        include_pool: false,
        include_classes: false,
      });
    } catch (err) {
      console.error('Failed to create subscription:', err);
      setError(err.message || 'Failed to create subscription');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Create New Subscription Type</h2>
      
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded mb-4">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
        <input
          type="number"
          name="price"
          min="0"
          step="0.01"
          value={formData.price}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
        <input
          type="number"
          name="durationDays"
          min="1"
          value={formData.durationDays}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Facilities Included:</label>
        <div className="flex items-center space-x-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="include_gym"
              checked={formData.include_gym}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Gym</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="include_pool"
              checked={formData.include_pool}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Pool</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="include_classes"
              checked={formData.include_classes}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Classes</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Create Subscription
      </button>
    </form>
  );
};

export default CreateSubscription;


