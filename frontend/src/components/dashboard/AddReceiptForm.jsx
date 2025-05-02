import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addReceipt, fetchReceipts } from '../../redux/slices/receiptsSlice';
import { fetchSubscriptions } from '../../redux/slices/subscriptionsSlice';

function AddReceiptForm({ onClose }) {
  const dispatch = useDispatch();
  const { subscriptions } = useSelector((state) => state.subscriptions);

  const [formData, setFormData] = useState({
    club: '',
    member: '',
    subscription: '',
    amount: '',
    payment_method: 'cash',
    note: '',
  });

  const [selectedClubName, setSelectedClubName] = useState('');

  useEffect(() => {
    dispatch(fetchSubscriptions());
  }, [dispatch]);

  // Get unique clubs with their IDs and names
  const uniqueClubs = Array.from(
    new Map(
      subscriptions.map(sub => [sub.club, { id: sub.club, name: sub.club_name }])
    ).values()
  );

  // Filter members based on selected club
  const filteredMembers = formData.club
    ? subscriptions.filter(sub => sub.club === parseInt(formData.club))
    : subscriptions;

  // Get unique members with their IDs and names
  const uniqueMembers = Array.from(
    new Map(
      filteredMembers.map(sub => [sub.member, { id: sub.member, name: sub.member_name }])
    ).values()
  );

  // Filter subscriptions based on selected member
  const filteredSubscriptions = formData.member
    ? subscriptions.filter(sub => sub.member === parseInt(formData.member))
    : [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const receiptData = {
      ...formData,
      club: parseInt(formData.club),
      member: parseInt(formData.member),
      subscription: parseInt(formData.subscription),
      amount: parseFloat(formData.amount),
    };
    
    try {
      await dispatch(addReceipt(receiptData)).unwrap();
      await dispatch(fetchReceipts());
      onClose();
    } catch (error) {
      console.error("Error adding receipt:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow-md">
      {/* Club Dropdown */}
      <div>
        <label className="block mb-1 font-medium text-gray-700">Select Club</label>
        <select
          name="club"
          value={formData.club}
          onChange={(e) => {
            handleChange(e);
            setSelectedClubName(
              uniqueClubs.find(club => club.id === parseInt(e.target.value))?.name || ''
            );
            setFormData(prev => ({ 
              ...prev, 
              member: '', 
              subscription: '' 
            }));
          }}
          className="w-full border px-3 py-2 rounded-md"
          required
        >
          <option value="">-- Select Club --</option>
          {uniqueClubs.map(club => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      {/* Member Dropdown */}
      <div>
        <label className="block mb-1 font-medium text-gray-700">Select Member</label>
        <select
          name="member"
          value={formData.member}
          onChange={(e) => {
            handleChange(e);
            setFormData(prev => ({ ...prev, subscription: '' }));
          }}
          className="w-full border px-3 py-2 rounded-md"
          required
          disabled={!formData.club}
        >
          <option value="">-- Select Member --</option>
          {uniqueMembers.map(member => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subscription Dropdown */}
      <div>
        <label className="block mb-1 font-medium text-gray-700">Select Subscription</label>
        <select
          name="subscription"
          value={formData.subscription}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md"
          required
          disabled={!formData.member}
        >
          <option value="">-- Select Subscription --</option>
          {filteredSubscriptions.map(sub => (
            <option key={sub.id} value={sub.id}>
              {sub?.type_details?.name || 'Unknown Type'} - ${sub.price}
            </option>
          ))}
        </select>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block mb-1 font-medium text-gray-700">Amount</label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md"
          required
          step="0.01"
          min="0"
        />
      </div>

      {/* Payment Method */}
      <div>
        <label className="block mb-1 font-medium text-gray-700">Payment Method</label>
        <select
          name="payment_method"
          value={formData.payment_method}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md"
        >
          <option value="cash">Cash</option>
          <option value="bank">Bank Transfer</option>
          <option value="visa">Visa</option>
        </select>
      </div>

      {/* Note */}
      <div>
        <label className="block mb-1 font-medium text-gray-700">Note</label>
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          rows={3}
          className="w-full border px-3 py-2 rounded-md"
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={!formData.club || !formData.member || !formData.subscription || !formData.amount}
        >
          Add Receipt
        </button>
      </div>
    </form>
  );
}

export default AddReceiptForm;
