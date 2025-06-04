import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { putSubscriptionType } from '../../redux/slices/subscriptionsSlice';
import { fetchClubs } from '../../redux/slices/clubSlice';
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
    max_entries: '',
    max_freeze_days: 0,
    is_private_training: false,
  });

  const [clubs, setClubs] = useState([]);

  useEffect(() => {
    // Fetch clubs
    const loadClubs = async () => {
      try {
        const res = await dispatch(fetchClubs()).unwrap();
        setClubs(res);
      } catch (error) {
        console.error('Error fetching clubs:', error);
      }
    };

    loadClubs();

    // Set form data when subscriptionData changes
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
        max_entries: subscriptionData.max_entries || '',
        max_freeze_days: subscriptionData.max_freeze_days || 0,
        is_private_training: subscriptionData.is_private_training || false,
      });
    }
  }, [subscriptionData, dispatch]);

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
        subscriptionData: {
          ...formData,
          price: parseFloat(formData.price),
          duration_days: parseInt(formData.duration_days, 10),
          max_entries: parseInt(formData.max_entries, 10),
          max_freeze_days: parseInt(formData.max_freeze_days, 10),
        }
      })).unwrap();
      toast.success("تم تحديث نوع الاشتراك بنجاح!");
      closeModal();
    } catch (err) {
      console.error("Update failed:", err);
      toast.error(err.message || "فشل في تحديث نوع الاشتراك");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-6 rounded shadow" dir="rtl">
      <h2 className="text-2xl font-bold text-center mb-6">تحديث نوع الاشتراك</h2>

      <div className="space-y-4">
        {/* Name + Price */}
        <div className="flex gap-4">
          <div className="flex-1">
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
          <div className="flex-1">
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
        </div>

        {/* Duration + Club */}
        <div className="flex gap-4">
          <div className="flex-1">
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
          <div className="flex-1">
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
        </div>

        {/* Max Entries + Max Freeze Days */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">أقصى عدد للحضور</label>
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
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">أقصى أيام للتجميد</label>
            <input
              type="number"
              name="max_freeze_days"
              min="0"
              value={formData.max_freeze_days}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Active Status + Private Training */}
        <div className="flex gap-4">
          <div className="flex-1 flex items-end gap-2 pb-1">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600"
            />
            <label className="text-sm font-medium text-gray-700">هل الاشتراك فعال؟</label>
          </div>
          <div className="flex-1 flex items-end gap-2 pb-1">
            <input
              type="checkbox"
              name="is_private_training"
              checked={formData.is_private_training}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600"
            />
            <label className="text-sm font-medium text-gray-700">هل يشمل تدريبًا خاصًا؟</label>
          </div>
        </div>

        {/* Facilities Checkboxes - full width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">المرافق المشمولة:</label>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="includes_gym"
                checked={formData.includes_gym}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">صالة الألعاب الرياضية</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="includes_pool"
                checked={formData.includes_pool}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">المسبح</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="includes_classes"
                checked={formData.includes_classes}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">الحصص التدريبية</span>
            </label>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="btn w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition mt-6"
      >
        تحديث نوع الاشتراك
      </button>
    </form>
  );
};

export default UpdateSubscriptionTypes;
