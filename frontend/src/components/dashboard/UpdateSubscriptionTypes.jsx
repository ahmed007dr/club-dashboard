import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { putSubscriptionType } from '../../redux/slices/subscriptionsSlice';
import { toast } from 'react-hot-toast';


const UpdateSubscriptionTypes = ({ subscriptionId, subscriptionData, closeModal })  => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await dispatch(putSubscriptionType({ id: subscriptionId, subscriptionData: formData })).unwrap();
      toast.success("تم تحديث نوع الاشتراك بنجاح!");

      // Close the modal after successful update
      closeModal();
    } catch (err) {
      console.error("Update failed:", err);
      toast.error(err.message || "فشل في تحديث نوع الاشتراك");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
      <label htmlFor="name" className="block text-gray-700">الاسم</label>
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
      <label htmlFor="duration_days" className="block text-gray-700">المدة (أيام)</label>
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
      <label htmlFor="price" className="block text-gray-700">السعر</label>
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
      <button type="submit" className="w-full btn">تحديث نوع الاشتراك</button>
    </form>
  );
};

export default UpdateSubscriptionTypes;


