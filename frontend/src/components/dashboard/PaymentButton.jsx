import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeSubscriptionPayment } from '../../redux/slices/subscriptionsSlice';;

const PaymentButton = ({ subscriptionId }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.subscriptions);

  const handlePayment = () => {
    dispatch(makeSubscriptionPayment(subscriptionId));
  };

  return (
    <div>
      <button
        onClick={handlePayment}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Make Payment'}
      </button>
      {error && <p className="text-red-500 mt-2">Error: {error}</p>}
    </div>
  );
};

export default PaymentButton;
