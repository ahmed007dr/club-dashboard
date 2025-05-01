import React, { useState } from 'react';
import axios from 'axios';

const UpdateAnyInviteForm = () => {
  const [inviteId, setInviteId] = useState('');
  const [formData, setFormData] = useState({
    club: '',
    guest_name: '',
    phone: '',
    date: '',
    status: 'pending',
    invited_by: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleIdChange = (e) => {
    setInviteId(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inviteId) {
      setMessage('Invite ID is required.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/invites/api/free-invites/${inviteId}/edit/`,
        formData
      );
      setMessage('Invite updated successfully!');
    } catch (error) {
      setMessage('Error: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded-lg shadow-md mt-6">
      <h2 className="text-xl font-semibold mb-4">Update Any Invite</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="number"
          value={inviteId}
          onChange={handleIdChange}
          placeholder="Invite ID"
          className="w-full p-2 border rounded"
          required
        />

        <input
          type="number"
          name="club"
          value={formData.club}
          onChange={handleFormChange}
          placeholder="Club ID"
          className="w-full p-2 border rounded"
          required
        />

        <input
          type="text"
          name="guest_name"
          value={formData.guest_name}
          onChange={handleFormChange}
          placeholder="Guest Name"
          className="w-full p-2 border rounded"
          required
        />

        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleFormChange}
          placeholder="Phone Number"
          className="w-full p-2 border rounded"
          required
        />

        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleFormChange}
          className="w-full p-2 border rounded"
          required
        />

        <select
          name="status"
          value={formData.status}
          onChange={handleFormChange}
          className="w-full p-2 border rounded"
        >
          <option value="pending">Pending</option>
          <option value="used">Used</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <input
          type="number"
          name="invited_by"
          value={formData.invited_by}
          onChange={handleFormChange}
          placeholder="Invited By (User ID)"
          className="w-full p-2 border rounded"
          required
        />

        <button
          type="submit"
          className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Invite'}
        </button>
      </form>

      {message && <p className="mt-4 text-center text-sm text-gray-700">{message}</p>}
    </div>
  );
};

export default UpdateAnyInviteForm;
