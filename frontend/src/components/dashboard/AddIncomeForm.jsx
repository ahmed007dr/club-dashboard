import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addIncome } from '../../redux/slices/financeSlice';
import BASE_URL from '../../config/api';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const AddIncomeForm = () => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.finance);

  const [formData, setFormData] = useState({
    club: '',
    source: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [userClub, setUserClub] = useState(null);
  const [userId, setUserId] = useState(null);
  const [incomeSources, setIncomeSources] = useState([]);
  const [loadingSources, setLoadingSources] = useState(false);

  useEffect(() => {
    // Fetch user profile
    fetch(`${BASE_URL}/accounts/api/profile/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.club) {
          setUserClub({ id: data.club.id, name: data.club.name });
          setFormData((prev) => ({ ...prev, club: data.club.id }));
        }
        if (data.id) {
          setUserId(data.id);
        }
      })
      .catch((err) => {
        console.error('فشل في جلب الملف الشخصي للمستخدم:', err);
      });
  }, []);

  useEffect(() => {
    const fetchSources = async () => {
      setLoadingSources(true);
      const loadingToast = toast.loading('جارٍ تحميل مصادر الدخل...');
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('رمز الدخول غير موجود', { id: loadingToast });
          return;
        }

        const response = await axios.get(`${BASE_URL}/finance/api/income-sources/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page_size: 100, // Fetch all sources (adjust as needed)
            ordering: 'id', // Sort by ID
          },
        });
        setIncomeSources(response.data.results || []);
        toast.success('تم تحميل مصادر الدخل بنجاح', { id: loadingToast });
      } catch (error) {
        console.error('فشل في جلب مصادر الدخل:', error.response?.data || error.message);
        toast.error('فشل في تحميل مصادر الدخل', { id: loadingToast });
      } finally {
        setLoadingSources(false);
      }
    };

    fetchSources();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const sourceId = parseInt(formData.source);

    if (!formData.source || !formData.club || !userId) {
      toast.error('الرجاء تعبئة جميع الحقول المطلوبة');
      return;
    }

    const incomeData = {
      ...formData,
      amount: parseFloat(formData.amount),
      source: sourceId,
      club: parseInt(formData.club),
      received_by: userId,
    };

    try {
      await dispatch(addIncome(incomeData)).unwrap();
      toast.success('تم تسجيل الدخل بنجاح');
      setFormData({
        club: userClub?.id || '',
        source: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('خطأ أثناء إضافة الدخل:', error);
      toast.error('فشل في تسجيل الدخل');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 text-center">إضافة الدخل</h2>
    
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700">النادي</label>
          <select
            name="club"
            value={formData.club}
            onChange={handleChange}
            disabled={!!userClub}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">اختر النادي</option>
            {userClub && <option value={userClub.id}>{userClub.name}</option>}
          </select>
        </div>
    
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700">المصدر</label>
          <select
            name="source"
            value={formData.source}
            onChange={handleChange}
            required
            disabled={loadingSources}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">اختر المصدر</option>
            {incomeSources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
          {loadingSources && <p className="text-sm text-gray-500 mt-1">جارٍ تحميل المصادر...</p>}
        </div>
      </div>
    
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700">المبلغ</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
    
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700">التاريخ</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>
    
      <div>
        <label className="block text-sm font-medium text-gray-700">الوصف</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          rows={3}
        />
      </div>
    
      <button
        type="submit"
        disabled={isLoading || loadingSources}
        className="w-full btn"
      >
        {isLoading ? 'جاري الإرسال...' : 'إرسال'}
      </button>
    </form>
  );
};

export default AddIncomeForm;
 




 




