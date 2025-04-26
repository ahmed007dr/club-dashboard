import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makePayment } from '../../redux/slices/subscriptionsSlice'

const Payment = () => {
  const dispatch = useDispatch();
  const { loading, payment, error } = useSelector((state) => state.subscriptions);
  
  const [amount, setAmount] = useState('');
  const [subscriptionId, setSubscriptionId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !subscriptionId) {
      alert('Please enter subscription ID and amount.');
      return;
    }
    dispatch(makePayment({  subscriptionId, amount: parseFloat(amount) }));
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-semibold mb-4 text-center">Make a Payment</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Subscription ID"
          value={subscriptionId}
          onChange={(e) => setSubscriptionId(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border p-2 rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded"
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </form>

      {payment && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
          <h3 className="font-semibold">Payment Successful!</h3>
          <p>Paid Amount: {payment.paid_amount}</p>
          <p>Remaining Amount: {payment.remaining_amount}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 rounded">
          <p>{error.error || 'Something went wrong'}</p>
        </div>
      )}
    </div>
  );
};

export default Payment;
