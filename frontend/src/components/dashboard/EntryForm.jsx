import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchClubs } from '../../redux/slices/clubSlice';
import toast from 'react-hot-toast';
import BASE_URL from '../../config/api';

const EntryForm = ({ onSuccess }) => {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    club: '',
    identifier: '',
  });

  const [clubs, setClubs] = useState([]);

  useEffect(() => {
    const getClubs = async () => {
      try {
        const res = await dispatch(fetchClubs()).unwrap();
        setClubs(res);
      } catch (error) {
        console.error('خطأ في جلب الأندية:', error);
        toast.error('فشل في جلب قائمة الأندية');
      }
    };

    getClubs();
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const token = localStorage.getItem('token');
  
      const requestBody = {
        club: Number(formData.club),
        identifier: Number(formData.identifier),
      };
  
      const response = await fetch(`${BASE_URL}/attendance/api/entry-logs/add/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error('تفاصيل الخطأ من السيرفر:', data);
        throw new Error(data.message || 'فشل في إضافة سجل الدخول');
      }
  
      toast.success('تم إضافة سجل الدخول بنجاح!');
      setFormData({ club: '', identifier: '' });
  
      if (onSuccess) {
        onSuccess();
      }
  
    } catch (error) {
      console.error('خطأ أثناء إرسال السجل:', error);
      toast.error(error.message || 'حدث خطأ أثناء إضافة السجل');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4 border rounded text-right">
      <div>
        <label htmlFor="club" className="block text-sm font-medium text-gray-700 mb-2">النادي</label>
        <select
          id="club"
          name="club"
          value={formData.club}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
          required
        >
          <option value="">اختر ناديًا</option>
          {clubs.map((club) => (
            <option key={club.id || club._id} value={club.id || club._id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      <input
        type="number"
        name="identifier"
        placeholder="المعرّف"
        value={formData.identifier}
        onChange={handleChange}
        required
        className="w-full border px-3 py-2 rounded"
      />

      <button
        type="submit"
        className="w-full btn"
      >
        إرسال الدخول
      </button>
    </form>
  );
};

export default EntryForm;






