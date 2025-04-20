import React, { useState } from 'react';

const AddFreeInvite = () => {
  const [formData, setFormData] = useState({
    club: '',
    guest_name: '',
    phone: '',
    date: '',
    status: '',
    invited_by: '',
    handled_by: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Free Invite submitted:', formData);
    // Submit formData to your backend
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-center">Create Free Invite</h2>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Row 1: Club & Guest Name */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[45%]">
            <label className="block text-sm font-medium mb-1">Club</label>
            <select
              name="club"
              value={formData.club}
              onChange={handleChange}
              className="w-full border rounded-md p-2 focus:ring focus:ring-green-500"
            >
              <option value="">Select Club</option>
              <option value="1">Club A</option>
              <option value="2">Club B</option>
            </select>
          </div>

          <div className="flex-1 min-w-[45%]">
            <label className="block text-sm font-medium mb-1">Guest Name</label>
            <input
              type="text"
              name="guest_name"
              value={formData.guest_name}
              onChange={handleChange}
              className="w-full border rounded-md p-2 focus:ring focus:ring-green-500"
              placeholder="Enter guest name"
            />
          </div>
        </div>

        {/* Row 2: Phone & Date */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[45%]">
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border rounded-md p-2 focus:ring focus:ring-green-500"
              placeholder="Enter phone number"
            />
          </div>

          <div className="flex-1 min-w-[45%]">
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full border rounded-md p-2 focus:ring focus:ring-green-500"
            />
          </div>
        </div>

        {/* Row 3: Status & Invited By */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[45%]">
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border rounded-md p-2 focus:ring focus:ring-green-500"
            >
              <option value="">Select Status</option>
              <option value="pending">Pending</option>
              <option value="used">Used</option>
            </select>
          </div>

          <div className="flex-1 min-w-[45%]">
            <label className="block text-sm font-medium mb-1">Invited By</label>
            <select
              name="invited_by"
              value={formData.invited_by}
              onChange={handleChange}
              className="w-full border rounded-md p-2 focus:ring focus:ring-green-500"
            >
              <option value="">Select Member</option>
              <option value="1">Member A</option>
              <option value="2">Member B</option>
            </select>
          </div>
        </div>

        {/* Row 4: Handled By */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[45%]">
            <label className="block text-sm font-medium mb-1">Handled By</label>
            <select
              name="handled_by"
              value={formData.handled_by}
              onChange={handleChange}
              className="w-full border rounded-md p-2 focus:ring focus:ring-green-500"
            >
              <option value="">Select User</option>
              <option value="1">User A</option>
              <option value="2">User B</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition duration-200"
        >
          Submit Invite
        </button>
      </form>
    </div>
  );
};

export default AddFreeInvite;

