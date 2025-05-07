import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchClubs } from '../../redux/slices/clubSlice';
import toast from 'react-hot-toast';
import BASE_URL from '../../config/api';

const EntryForm = ({ onSuccess }) => {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    club: '',
    membership_number: '',
  });

  const [clubs, setClubs] = useState([]);

  useEffect(() => {
    const getClubs = async () => {
      try {
        const res = await dispatch(fetchClubs()).unwrap();
        setClubs(res);
      } catch (error) {
        console.error('Error fetching clubs:', error);
        toast.error('Failed to fetch clubs');
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
        membership_number: Number(formData.membership_number),
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
        console.error('Response error details:', data);
        throw new Error(data.message || 'فشل في إضافة سجل الدخول');
      }
  
      console.log('✅ Successfully submitted:');
      console.log('➡️ Data sent:', requestBody);
      console.log('✅ Response received:', data);
  
      // Arabic success message
      toast.success('تم إضافة سجل الدخول بنجاح!');
      setFormData({ club: '', membership_number: '' });
  
      if (onSuccess) {
        onSuccess(); // Close modal on success
      }
  
    } catch (error) {
      console.error('Submit Entry Error:', error);
  
      // Arabic error message
      toast.error(error.message || 'حدث خطأ أثناء إضافة السجل');
    }
  };
  

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4 border rounded">
      <div>
        <label htmlFor="club" className="block text-sm font-medium text-gray-700 mb-2">Club</label>
        <select
          id="club"
          name="club"
          value={formData.club}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
          required
        >
          <option value="">Select a club</option>
          {clubs.map((club) => (
            <option key={club.id || club._id} value={club.id || club._id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      <input
        type="number"
        name="membership_number"
        placeholder="Membership Number"
        value={formData.membership_number}
        onChange={handleChange}
        required
        className="w-full border px-3 py-2 rounded"
      />

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        Submit Entry
      </button>
    </form>
  );
};

export default EntryForm;





