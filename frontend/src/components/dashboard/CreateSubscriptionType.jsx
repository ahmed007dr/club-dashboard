import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addSubscriptionType } from '../../redux/slices/subscriptionsSlice';
import { toast } from "react-hot-toast";

const CreateSubscriptionTypes = ({ onClose }) => {
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
  
      toast.success("تم إنشاء نوع الاشتراك بنجاح!");
  
      setFormData({
        name: '',
        price: '',
        duration_days: '',
        includes_gym: false,
        includes_pool: false,
        includes_classes: false,
      });
  
      if (onClose) onClose();  // Close modal if passed via props
  
    } catch (err) {
      console.error('Failed to create subscription:', err);
      toast.error(err.message || 'فشل في إنشاء نوع الاشتراك');
    }
  };
  

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-6 rounded shadow"  dir="rtl">
     <h2 className="text-2xl font-bold text-center mb-6">إنشاء نوع اشتراك جديد</h2>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
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
      <label className="block text-sm font-medium text-gray-700 mb-1">السعر </label>
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
      <label className="block text-sm font-medium text-gray-700 mb-1">المدة (بالأيام)</label>
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
      <label className="block text-sm font-medium text-gray-700 mb-2">المرافق المشمولة:</label>
        <div className="space-y-2">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="includes_gym"
              checked={formData.includes_gym}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600"
            />
            <span className="mr-2 text-sm text-gray-700">صالة الألعاب الرياضية</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="includes_pool"
              checked={formData.includes_pool}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600"
            />
           
        <span className="mr-2 text-sm text-gray-700">المسبح</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="includes_classes"
              checked={formData.includes_classes}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600"
            />
             <span className="mr-2 text-sm text-gray-700">الحصص التدريبية</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        className="btn"
      >
          إنشاء الاشتراك
      </button>
    </form>
  );
};

export default CreateSubscriptionTypes;
     


