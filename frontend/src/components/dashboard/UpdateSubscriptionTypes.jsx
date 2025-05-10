import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { putSubscriptionType } from '../../redux/slices/subscriptionsSlice';
import { toast } from 'react-hot-toast';


const UpdateSubscriptionTypes = ({ subscriptionId, subscriptionData, closeModal }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration_days: '',
    includes_gym: false,
    includes_pool: false,
    includes_classes: false,
    club: '',
    is_active: true,
    max_entries: ''
  });

  useEffect(() => {
    if (subscriptionData) {
      setFormData({
        name: subscriptionData.name || '',
        price: subscriptionData.price || '',
        duration_days: subscriptionData.duration_days || '',
        includes_gym: subscriptionData.includes_gym || false,
        includes_pool: subscriptionData.includes_pool || false,
        includes_classes: subscriptionData.includes_classes || false,
        club: subscriptionData.club || '',
        is_active: subscriptionData.is_active !== undefined ? subscriptionData.is_active : true,
        max_entries: subscriptionData.max_entries || ''
      });
    }
  }, [subscriptionData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await dispatch(putSubscriptionType({ 
        id: subscriptionId, 
        subscriptionData: formData 
      })).unwrap();
      toast.success("تم تحديث نوع الاشتراك بنجاح!");
      closeModal();
    } catch (err) {
      console.error("Update failed:", err);
      toast.error(err.message || "فشل في تحديث نوع الاشتراك");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 mb-4">
        <div>
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

        <div>
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

        <div>
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

        <div>
          <label htmlFor="max_entries" className="block text-gray-700">أقصى عدد للدخول</label>
          <input
            type="number"
            id="max_entries"
            name="max_entries"
            value={formData.max_entries}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="club" className="block text-gray-700">النادي</label>
          <input
            type="text"
            id="club"
            name="club"
            value={formData.club}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="includes_gym"
            name="includes_gym"
            checked={formData.includes_gym}
            onChange={handleChange}
            className="mr-2"
          />
          <label htmlFor="includes_gym" className="text-gray-700">يشمل الجيم</label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="includes_pool"
            name="includes_pool"
            checked={formData.includes_pool}
            onChange={handleChange}
            className="mr-2"
          />
          <label htmlFor="includes_pool" className="text-gray-700">يشمل المسبح</label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="includes_classes"
            name="includes_classes"
            checked={formData.includes_classes}
            onChange={handleChange}
            className="mr-2"
          />
          <label htmlFor="includes_classes" className="text-gray-700">يشمل الحصص</label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="mr-2"
          />
          <label htmlFor="is_active" className="text-gray-700">نشط</label>
        </div>
      </div>

      <button type="submit" className="w-full btn bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">
        تحديث نوع الاشتراك
      </button>
    </form>
  );
};

export default UpdateSubscriptionTypes;


