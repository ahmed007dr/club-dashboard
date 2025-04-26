// components/subscriptions/SubscriptionDetailModal.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionById } from '../../redux/slices/subscriptionsSlice';

const SubscriptionDetail = ({ isOpen, onClose, subscriptionId }) => {
    if (!isOpen) return null;

  console.log('Detail modal opened for ID:', subscriptionId);
  const dispatch = useDispatch();
  const { subscriptionDetail, status, error } = useSelector(
    (state) => state.subscriptions
  );

  useEffect(() => {
    if (isOpen && subscriptionId) {
      dispatch(fetchSubscriptionById(subscriptionId));
    }
  }, [dispatch, isOpen, subscriptionId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-lg w-full">
        <h2 className="text-xl font-semibold mb-4">Subscription Details</h2>

        {status === 'loading' ? (
          <p>Loading...</p>
        ) : status === 'failed' ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          subscriptionDetail && (
            <div className="space-y-2">
              <p><strong>Member:</strong> {subscriptionDetail.member.name}</p>
              <p><strong>Type:</strong> {subscriptionDetail.type.name}</p>
              <p><strong>Start Date:</strong> {subscriptionDetail.start_date}</p>
              <p><strong>End Date:</strong> {subscriptionDetail.end_date}</p>
              <p><strong>Paid Amount:</strong> ${subscriptionDetail.paid_amount}</p>
              <p><strong>Remaining Amount:</strong> ${subscriptionDetail.remaining_amount}</p>
              <p><strong>Attendance Days:</strong> {subscriptionDetail.attendance_days}</p>
            </div>
          )
        )}

        <div className="mt-4 text-right">
          <button
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetail;
