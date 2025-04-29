import { useState } from 'react';
import axios from 'axios';

const AddReceiptForm = () => {
  const [formData, setFormData] = useState({
    club: '',
    member: '',
    subscription: null,
    amount: '',
    payment_method: 'cash', // default option
    note: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const token = localStorage.getItem('token');
  
      const response = await axios.post(
        'http://127.0.0.1:8000/receipts/api/receipts/add/',
        formData,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      // Log the success response
      console.log('Success:', response.data);
      // Optional: show a success message or reset form
    } catch (error) {
      // Log the error response
      console.error('Error:', error.response ? error.response.data : error.message);
      // Optional: handle the error and show an error message
    }
  };
  

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 border border-gray-300 rounded-lg">
      <div className="mb-4">
        <label htmlFor="club" className="block text-sm font-medium text-gray-700">Club</label>
        <input
          type="number"
          id="club"
          name="club"
          value={formData.club}
          onChange={handleChange}
          className="mt-1 p-2 w-full border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="member" className="block text-sm font-medium text-gray-700">Member</label>
        <input
          type="number"
          id="member"
          name="member"
          value={formData.member}
          onChange={handleChange}
          className="mt-1 p-2 w-full border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="subscription" className="block text-sm font-medium text-gray-700">Subscription</label>
        <input
          type="text"
          id="subscription"
          name="subscription"
          value={formData.subscription || ''}
          onChange={handleChange}
          className="mt-1 p-2 w-full border border-gray-300 rounded-md"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
        <input
          type="text"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          className="mt-1 p-2 w-full border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">Payment Method</label>
        <select
          id="payment_method"
          name="payment_method"
          value={formData.payment_method}
          onChange={handleChange}
          className="mt-1 p-2 w-full border border-gray-300 rounded-md"
        >
          <option value="cash">Cash</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="note" className="block text-sm font-medium text-gray-700">Note</label>
        <textarea
          id="note"
          name="note"
          value={formData.note}
          onChange={handleChange}
          className="mt-1 p-2 w-full border border-gray-300 rounded-md"
          rows="4"
        />
      </div>

      <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md">Submit Receipt</button>
    </form>
  );
};

export default AddReceiptForm;
