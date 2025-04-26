// src/components/ActiveSubscriptionTypes.tsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchActiveSubscriptionTypes } from '../../redux/slices/subscriptionsSlice';

const ActiveSubscriptionTypes = () => {
  const dispatch = useDispatch();

  // Select the active subscriptions and loading/error states from Redux
  const { ActivesubscriptionTypes, loading, error } = useSelector(
    (state) => state.subscriptions
  );

  // Fetch active subscriptions on component mount
  useEffect(() => {
    dispatch(fetchActiveSubscriptionTypes());
  }, [dispatch]);

  // Render loading state
  if (loading) {
    return <p>Loading...</p>;
  }

  // Render error state
  if (error) {
    return <p>Error: {error}</p>;
  }

  // Render fields of active subscription types
  return (
    <div>
      <h2>Active Subscription Types</h2>
      {ActivesubscriptionTypes && ActivesubscriptionTypes.length > 0 ? (
        <ul>
          {ActivesubscriptionTypes.map((subscription) => (
            <li key={subscription.id}>
              <strong>{subscription.name}</strong> - ${subscription.price}
            </li>
          ))}
        </ul>
      ) : (
        <p>No active subscription types available.</p>
      )}
    </div>
  );
};

export default ActiveSubscriptionTypes;