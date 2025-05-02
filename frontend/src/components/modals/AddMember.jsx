import React, { useState, useEffect } from 'react';
import { useDispatch } from "react-redux";
import { addMember } from '../../redux/slices/memberSlice';
import { fetchClubs } from '../../redux/slices/clubSlice';

const AddMember = () => {
  const dispatch = useDispatch();
  const [clubs, setClubs] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    national_id: '',
    birth_date: '',
    phone: '',
    club: '',
    referred_by: '',
  });

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file' && files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData({ ...formData, [name]: reader.result });
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form data:", formData);
    dispatch(addMember(formData));
    
    setFormData({
      name: '',
      national_id: '',
      birth_date: '',
      phone: '',
      club: '',
      referred_by: '',
    });
  };

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

  return (
    <div className="max-h-[80vh] overflow-auto">
      <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">Add Member</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="Enter full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="national_id">National ID</label>
            <input
              id="national_id"
              name="national_id"
              type="text"
              value={formData.national_id}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="Enter national ID"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="birth_date">Date of Birth</label>
            <input
              id="birth_date"
              name="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              name="phone"
              type="text"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="Enter phone number"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="club">Club</label>
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
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="referred_by">Referred By (Member ID)</label>
            <input
              id="referred_by"
              name="referred_by"
              type="text"
              value={formData.referred_by}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="Enter referring member ID"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition"
          >
            Add Member
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMember;
