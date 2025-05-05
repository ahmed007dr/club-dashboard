import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addSubscriptionType } from '../../redux/slices/subscriptionsSlice';

const CreateSubscriptionTypes = () => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration_days: '',
    includes_gym: false,
    includes_pool: false,
    includes_classes: false,
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

    // Basic validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (parseInt(formData.duration_days) <= 0) {
      setError('Duration must be positive');
      return;
    }
    if (parseFloat(formData.price) < 0) {
      setError('Price cannot be negative');
      return;
    }

    const submissionData = {
      ...formData,
      name: formData.name.trim(),
      price: parseFloat(formData.price),
      duration_days: parseInt(formData.duration_days, 10),
    };

    try {
      await dispatch(addSubscriptionType(submissionData)).unwrap();

      // Reset form on success
      setFormData({
        name: '',
        price: '',
        duration_days: '',
        includes_gym: false,
        includes_pool: false,
        includes_classes: false,
      });
    } catch (err) {
      console.error('Failed to create subscription:', err);
      setError(err.message || 'Failed to create subscription');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold text-center mb-6">Create New Subscription Type</h2>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
        <input
          type="number"
          name="price"
          min="0"
          step="0.01"
          value={formData.price}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
        <input
          type="number"
          name="duration_days"
          min="1"
          value={formData.duration_days}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Facilities Included:</label>
        <div className="space-y-2">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="includes_gym"
              checked={formData.includes_gym}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">Gym</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="includes_pool"
              checked={formData.includes_pool}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">Pool</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="includes_classes"
              checked={formData.includes_classes}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">Classes</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Create Subscription
      </button>
    </form>
  );
};

export default CreateSubscriptionTypes;
     


