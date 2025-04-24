// components/SubscriptionList.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionTypes } from '../../redux/slices/subscriptionsSlice';  // Correct import path

const SubscriptionList = () => {
  const dispatch = useDispatch();
  const { subscriptionTypes, loading, error } = useSelector(state => state.subscriptions);

  useEffect(() => {
    dispatch(fetchSubscriptionTypes());
  }, [dispatch]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Subscription Types</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      <ul className="list-disc pl-6">
        {subscriptionTypes.map((sub) => (
          <li key={sub.id} className="mb-2">
            {sub.name} - {sub.price} USD (Duration: {sub.duration_days} days)
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SubscriptionList;
