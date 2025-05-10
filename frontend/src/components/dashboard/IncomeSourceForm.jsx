import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import BASE_URL from '../../config/api';

const IncomeSourceForm = () => {
  const [formData, setFormData] = useState({
    club: '',
    name: '',
    description: '',
  });

  const [userClub, setUserClub] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${BASE_URL}/accounts/api/profile/`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (data.club) {
          setUserClub({ id: data.club.id, name: data.club.name });
          setFormData((prev) => ({ ...prev, club: data.club.id }));
        }

        if (data.id) {
          setUserId(data.id);
        }
      } catch (err) {
        console.error('فشل في جلب الملف الشخصي للمستخدم:', err);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('جارٍ الإرسال...');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('لم يتم العثور على رمز الدخول', { id: loadingToast });
        return;
      }

      await axios.post(`${BASE_URL}/finance/api/income-sources/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success('تمت إضافة مصدر الدخل بنجاح!', { id: loadingToast });
      setFormData({ club: userClub?.id || '', name: '', description: '' });
    } catch (err) {
      toast.error('فشل في إرسال النموذج', { id: loadingToast });
      console.error(err);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg" dir="rtl">
      <h2 className="text-2xl font-bold mb-4 text-center">إضافة مصدر دخل</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 text-right">النادي</label>
          <select
            name="club"
            value={formData.club}
            onChange={handleChange}
            disabled={!!userClub}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 bg-gray-100 text-right disabled:cursor-not-allowed"
          >
            <option value="">اختر النادي</option>
            {userClub && <option value={userClub.id}>{userClub.name}</option>}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 text-right">الاسم</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-right focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 text-right">الوصف</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-right focus:outline-none focus:ring-2 focus:ring-green-500"
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition duration-200"
        >
          إرسال
        </button>
      </form>
    </div>
  );
};

export default IncomeSourceForm;

