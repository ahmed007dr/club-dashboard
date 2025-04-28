import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addReceipt } from '../../redux/slices/receiptsSlice';

const AddReceiptForm = () => {
  const [formData, setFormData] = useState({
    club: '',
    member: '',
    subscription: '',
    amount: '',
    paymentMethod: 'cash', // Default to cash
    note: ''
  });

  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.receipts);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert numeric fields and ensure proper formatting
    const payload = {
      ...formData,
      club: parseInt(formData.club, 10),
      member: parseInt(formData.member, 10),
      subscription: parseInt(formData.subscription, 10),
      amount: parseFloat(formData.amount), // Keep as number, don't convert to string
      paymentMethod: formData.paymentMethod,
      note: formData.note || '' // Handle empty note case
    };

    // Validate amount is a valid number
    if (isNaN(payload.amount)) {
      alert('Please enter a valid amount');
      return;
    }

    dispatch(addReceipt(payload));
  };

  return (
    <div className="receipt-form">
      <h2>Add New Receipt</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Club ID:</label>
          <input
            type="number"
            name="club"
            value={formData.club}
            onChange={handleChange}
            min="1"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Member ID:</label>
          <input
            type="number"
            name="member"
            value={formData.member}
            onChange={handleChange}
            min="1"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Subscription ID:</label>
          <input
            type="number"
            name="subscription"
            value={formData.subscription}
            onChange={handleChange}
            min="1"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Amount:</label>
          <input
            type="number"
            step="0.01"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            min="0.01"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Payment Method:</label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
          >
            <option value="cash">Cash</option>
            <option value="credit_card">Credit Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="check">Check</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Note:</label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            rows="3"
          />
        </div>
        
        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Adding Receipt...' : 'Add Receipt'}
        </button>
      </form>
      
      {status === 'failed' && (
        <div className="error-message">
          Error: {error?.message || error?.toString() || 'Failed to add receipt'}
        </div>
      )}
      
      {status === 'succeeded' && (
        <div className="success-message">
          Receipt added successfully!
        </div>
      )}
    </div>
  );
};

export default AddReceiptForm;