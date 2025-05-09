import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addSubscriptionType } from '../../redux/slices/subscriptionsSlice';
import { fetchClubs } from '../../redux/slices/clubSlice';
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
    club: '', // new field for club selection
    is_active: true, // new field for active status
    max_entries: '', // new field for max entries
  });

  const [clubs, setClubs] = useState([]);
  const [error, setError] = useState(null);

  // Fetch clubs on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dispatch(fetchClubs()).unwrap();
        setClubs(res);
      } catch (error) {
        console.error('Error fetching clubs:', error);
      }
    };

    fetchData();
  }, [dispatch]);

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

    if (!formData.name.trim()) {
      setError('الاسم مطلوب');
      return;
    }
    if (parseInt(formData.duration_days) <= 0) {
      setError('المدة يجب أن تكون إيجابية');
      return;
    }
    if (parseFloat(formData.price) < 0) {
      setError('السعر لا يمكن أن يكون سالبًا');
      return;
    }
    if (!formData.club) {
      setError('النادي مطلوب');
      return;
    }
    if (parseInt(formData.max_entries) <= 0) {
      setError('عدد المشاركين يجب أن يكون إيجابيًا');
      return;
    }

    const submissionData = {
      ...formData,
      name: formData.name.trim(),
      price: parseFloat(formData.price),
      duration_days: parseInt(formData.duration_days, 10),
      max_entries: parseInt(formData.max_entries, 10),
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
        club: '',
        is_active: true,
        max_entries: '',
      });

      if (onClose) onClose();
    } catch (err) {
      console.error('فشل في إنشاء نوع الاشتراك:', err);
      toast.error(err.message || 'فشل في إنشاء نوع الاشتراك');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-6 rounded shadow" dir="rtl">
      <h2 className="text-2xl font-bold text-center mb-6">إنشاء نوع اشتراك جديد</h2>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded mb-4">{error}</div>
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
        <label className="block text-sm font-medium text-gray-700 mb-1">السعر</label>
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

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">النادي</label>
        <select
          name="club"
          value={formData.club}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          required
        >
          <option value="">اختر ناديًا</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">هل الاشتراك فعال؟</label>
        <input
          type="checkbox"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">أقصى عدد للمشاركين</label>
        <input
          type="number"
          name="max_entries"
          min="1"
          value={formData.max_entries}
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
        className="btn w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition"
      >
        إنشاء الاشتراك
      </button>
    </form>
  );
};

export default CreateSubscriptionTypes;

     


