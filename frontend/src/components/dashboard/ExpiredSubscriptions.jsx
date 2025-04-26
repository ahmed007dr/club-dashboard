import React, { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { fetchExpiredSubscriptions, renewSubscription } from '../../redux/slices/subscriptionsSlice'; // Import the renewSubscription action

const ExpiredSubscriptions = () => {
  const dispatch = useDispatch();
  const { expiredSubscriptions, loading, error } = useSelector((state) => state.subscriptions);

  useEffect(() => {
    dispatch(fetchExpiredSubscriptions());
  }, [dispatch]);

  const handleRenew = (subscriptionId) => {
    console.log("Renewing subscription with ID:", subscriptionId);
    dispatch(renewSubscription({ subscriptionId })); 
  };
  

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Expired Subscriptions</h1>
      <ul>
        {expiredSubscriptions.map((subscription) => (
          <li key={subscription.id}>
            <p><strong>ID:</strong> {subscription.id}</p>
            <p><strong>Member Name:</strong> {subscription.member_name}</p>
            <p><strong>Club Name:</strong> {subscription.club_name}</p>
            <p><strong>Start Date:</strong> {subscription.start_date}</p>
            <p><strong>End Date:</strong> {subscription.end_date}</p>
            <p><strong>Attendance Days:</strong> {subscription.attendance_days}</p>
            <p><strong>Paid Amount:</strong> {subscription.paid_amount}</p>
            <p><strong>Remaining Amount:</strong> {subscription.remaining_amount}</p>
            <p><strong>Type:</strong> {subscription.type}</p>

            {/* Add a Renew button for each expired subscription */}
            <button 
              onClick={() => handleRenew(subscription.id)} 
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              Renew Subscription
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ExpiredSubscriptions;

