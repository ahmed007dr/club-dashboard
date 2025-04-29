import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SubscriptionDetail = ({ isOpen, onClose, subscriptionId }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && subscriptionId) {
      fetchSubscriptionDetail();
    }
  }, [isOpen, subscriptionId]);

  const fetchSubscriptionDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:4000/api/subscriptions/${subscriptionId}`);
      setSubscription(response.data); // Adjust according to your backend response shape
    } catch (err) {
      setError('Failed to fetch subscription details.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Subscription Details</h2>
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : subscription ? (
          <div className="space-y-2">
            <p><strong>Member Name:</strong> {subscription.member_name}</p>
            <p><strong>Subscription Type:</strong> {subscription.type.name}</p>
            <p><strong>Start Date:</strong> {subscription.start_date}</p>
            <p><strong>End Date:</strong> {subscription.end_date}</p>
            <p><strong>Paid Amount:</strong> ${subscription.paid_amount}</p>
            <p><strong>Remaining Amount:</strong> ${subscription.remaining_amount}</p>
            <p><strong>Attendance Days:</strong> {subscription.attendance_days}</p>
            <p><strong>Status:</strong> {subscription.status}</p>
            <p><strong>Club Name:</strong> {subscription.club_name}</p>
            {/* Add more fields if needed */}
          </div>
        ) : (
          <div className="text-center text-gray-500">No details available.</div>
        )}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetail;

