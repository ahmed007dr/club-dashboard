import React, { useState } from 'react';

const AddSubscription = ({ formData, handleChange, handleSubmit, closeModal }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative">
        <button
          onClick={closeModal}
          className="absolute top-2 right-4 text-gray-500 text-2xl hover:text-red-500"
        >
          &times;
        </button>

        <h3 className="text-xl font-semibold text-center mb-4">Add Subscription</h3>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Member */}
          <div>
            <label className="block text-sm mb-1">Member</label>
            <select name="member" value={formData.member} onChange={handleChange} className="w-full border p-2 rounded">
              <option value="">Select Member</option>
              <option value="1">Member 1</option>
              <option value="2">Member 2</option>
            </select>
          </div>

          {/* Subscription Type */}
          <div>
            <label className="block text-sm mb-1">Subscription Type</label>
            <select name="subscription_type" value={formData.subscription_type} onChange={handleChange} className="w-full border p-2 rounded">
              <option value="">Select Type</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Sport Type */}
          <div>
            <label className="block text-sm mb-1">Sport Type</label>
            <select name="sport_type" value={formData.sport_type} onChange={handleChange} className="w-full border p-2 rounded">
              <option value="">Select Sport</option>
              <option value="football">Football</option>
              <option value="basketball">Basketball</option>
            </select>
          </div>

          {/* Dates */}
          <div>
            <label className="block text-sm mb-1">Start Date</label>
            <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>

          <div>
            <label className="block text-sm mb-1">End Date</label>
            <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>

          {/* Attendance */}
          <div>
            <label className="block text-sm mb-1">Attendance Days</label>
            <input type="number" name="attendance_days" value={formData.attendance_days} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>

          {/* Payments */}
          <div>
            <label className="block text-sm mb-1">Subscription Value</label>
            <input type="number" name="subscription_value" value={formData.subscription_value} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>

          <div>
            <label className="block text-sm mb-1">Amount Paid</label>
            <input type="number" name="amount_paid" value={formData.amount_paid} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Amount Remaining</label>
            <input type="number" name="amount_remaining" value={formData.amount_remaining} readOnly className="w-full border p-2 rounded bg-gray-100" />
          </div>

          <div className="md:col-span-2 mt-4 text-center">
            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubscription;
