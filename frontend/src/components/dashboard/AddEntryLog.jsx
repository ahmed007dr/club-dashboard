import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addEntryLog } from "@/redux/slices/EntryLogsSlice";

import toast from 'react-hot-toast';

const EntryForm = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.attendance);

  const [formData, setFormData] = useState({
    club: '',
    membership_number: '',
    membership_name: '',
  });

  const handleChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const resultAction = await dispatch(addEntryLog({
        club: Number(formData.club),
        membership_number: Number(formData.membership_number),
        membership_name: formData.membership_name,
      }));

      if (addEntryLog.fulfilled.match(resultAction)) {
        toast.success('Entry log added successfully!');
      } else {
        throw new Error(resultAction.payload || 'Failed to add entry log');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4 border rounded">
      <input
        type="number"
        name="club"
        placeholder="Club ID"
        value={formData.club}
        onChange={handleChange}
        required
        className="w-full border px-3 py-2 rounded"
      />
      <input
        type="number"
        name="membership_number"
        placeholder="Membership Number"
        value={formData.membership_number}
        onChange={handleChange}
        required
        className="w-full border px-3 py-2 rounded"
      />
      <input
        type="text"
        name="membership_name"
        placeholder="Membership Name"
        value={formData.membership_name}
        onChange={handleChange}
        required
        className="w-full border px-3 py-2 rounded"
      />
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        disabled={loading}
      >
        {loading ? 'Submitting...' : 'Submit Entry'}
      </button>
    </form>
  );
};

export default EntryForm;
