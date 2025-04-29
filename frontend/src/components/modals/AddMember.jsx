import React, { useState } from 'react';
import { useDispatch } from "react-redux";
import { addMember } from '../../redux/slices/memberSlice';

const AddMember = () => {
  const dispatch = useDispatch();
   
  const [formData, setFormData] = useState({
    name: '',
    membership_number: '',
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
        setFormData({ ...formData, [name]: reader.result }); // Store Base64 string
      };
      reader.readAsDataURL(files[0]); // Convert file to Base64
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // const token = localStorage.getItem('token'); // Adjust key if needed
    const form = new FormData();

    // Append only valid Django fields
    form.append('club', formData.club);
    form.append('name', formData.name);
    form.append('membership_number', formData.membership_number);
    form.append('national_id', formData.national_id);
    form.append('birth_date', formData.birth_date);
    form.append('phone', formData.phone);
    // if (formData.photo) {
    //   form.append('photo', formData.photo);
    // }
    form.append('referred_by', formData.referred_by);
        console.log("Form data:", formData); // Log the form data to check its structure
        dispatch(addMember(formData));
    
    // try { //http://127.0.0.1:8000/members/api/members/create/
    //   console.log(form);
    //   const response = await fetch(`${BASE_URL}/members/api/members/create/`, {
    //     method: 'POST',
    //     headers: {
    //       Authorization: `Token ${token}`,
    //       'Content-Type': 'application/json'
    //     },
    //     // body: form,
    //     body: JSON.stringify(form)
        
    //   });

    //   if (!response.ok) {
    //     const errorData = await response.json();
    //     console.error('Error:', errorData);
    //     alert('Failed to add member. Please check the input.');
    //     return;
    //   }

    //   const result = await response.json();
    //   console.log('Member added successfully:', result);
    //   alert('Member added successfully!');

      // Optional: Reset form
      setFormData({
        name: '',
        membership_number: '',
        national_id: '',
        birth_date: '',
        phone: '',
        photo: null,
        club: '',
        referred_by: '',
      });
    
  };

  return (
    <div className="modal max-h-[80vh] overflow-auto">
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="membership_number">Membership Number</label>
            <input
              id="membership_number"
              name="membership_number"
              type="text"
              value={formData.membership_number}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="Enter membership number"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="birth_date">Date of Birth</label>
            <input
              id="birth_date"
              name="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="club">Club ID</label>
            <input
              id="club"
              name="club"
              type="text"
              value={formData.club}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="Enter club ID"
            />
          </div>
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

        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="photo">Photo</label>
          <input
            id="photo"
            name="photo"
            type="file"
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
          />
        </div> */}

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
