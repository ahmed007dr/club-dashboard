import React, { useState } from 'react';

const AddTicket = () => {
  const [formData, setFormData] = useState({
    club: '',
    buyer_name: '',
    ticket_type: '',
    price: '',
    used: false,
    used_by: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Ticket submitted:', formData);
    // You can send this data to your Django backend via API
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-center">Create Ticket</h2>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Club */}
        <div>
          <label className="block text-sm font-medium mb-1">Club</label>
          <select name="club" value={formData.club} onChange={handleChange}
            className="w-full border rounded-md p-2 focus:ring focus:ring-green-500">
            <option value="">Select Club</option>
            <option value="1">Club A</option>
            <option value="2">Club B</option>
          </select>
        </div>

        {/* Buyer Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Buyer Name</label>
          <input
            type="text"
            name="buyer_name"
            value={formData.buyer_name}
            onChange={handleChange}
            className="w-full border rounded-md p-2 focus:ring focus:ring-green-500"
            placeholder="Enter buyer name"
          />
        </div>

        {/* Ticket Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Ticket Type</label>
          <select name="ticket_type" value={formData.ticket_type} onChange={handleChange}
            className="w-full border rounded-md p-2 focus:ring focus:ring-green-500">
            <option value="">Select Type</option>
            <option value="day_pass">Day Pass</option>
            <option value="session">Session</option>
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="w-full border rounded-md p-2 focus:ring focus:ring-green-500"
            placeholder="Enter price"
          />
        </div>

        {/* Used */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="used"
            checked={formData.used}
            onChange={handleChange}
            className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <label className="text-sm font-medium">Used</label>
        </div>

        {/* Used By */}
        <div>
          <label className="block text-sm font-medium mb-1">Used By</label>
          <select name="used_by" value={formData.used_by} onChange={handleChange}
            className="w-full border rounded-md p-2 focus:ring focus:ring-green-500">
            <option value="">Select Member</option>
            <option value="1">Member A</option>
            <option value="2">Member B</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition duration-200"
        >
          Submit Ticket
        </button>
      </form>
    </div>
  );
};

export default AddTicket;
