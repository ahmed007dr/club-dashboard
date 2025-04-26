import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { putSubscriptionType } from '../../redux/slices/subscriptionsSlice';

const UpdateSubscriptionTypes = ({ subscriptionId, subscriptionData }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    duration_days: '',
    price: '',
  });

  useEffect(() => {
    if (subscriptionData) {
      setFormData({
        name: subscriptionData.name || '',
        duration_days: subscriptionData.duration_days || '',
        price: subscriptionData.price || '',
      });
    }
  }, [subscriptionData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(putSubscriptionType({ id: subscriptionId, subscriptionData: formData }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="name" className="block text-gray-700">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="duration_days" className="block text-gray-700">Duration (days)</label>
        <input
          type="number"
          id="duration_days"
          name="duration_days"
          value={formData.duration_days}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="price" className="block text-gray-700">Price</label>
        <input
          type="number"
          id="price"
          name="price"
          value={formData.price}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      <button type="submit" className="w-full py-2 bg-blue-500 text-white rounded-lg">Update Subscription</button>
    </form>
  );
};

export default UpdateSubscriptionTypes;


