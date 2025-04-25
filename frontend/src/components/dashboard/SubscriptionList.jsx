import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptions, updateSubscription, deleteSubscriptionById } from '../../redux/slices/subscriptionsSlice';
import DeleteSubscriptionModal from './DeleteSubscriptionModal'; // Import the delete modal
import UpdateSubscriptionModal from './UpdateSubscriptionModal'; // Import the update modal
import SubscriptionDetail from './SubscriptionDetail';

const SubscriptionsList = () => {
  const dispatch = useDispatch();
  const { subscriptions, status, error, updateStatus } = useSelector((state) => state.subscriptions);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false); // Delete modal state
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailSubscriptionId, setDetailSubscriptionId] = useState(null);

  const openDetailModal = (id) => {
    setDetailSubscriptionId(id);
    setDetailModalOpen(true);
  };

  useEffect(() => {
    dispatch(fetchSubscriptions());
  }, [dispatch]);

  const openModal = (subscription) => {
    setSelectedSubscription(subscription);
    setIsModalOpen(true); // Set to true to open modal
  };

  const openDeleteModal = (subscription) => {
    setSelectedSubscription(subscription);
    setDeleteModalOpen(true); // Set to true to open delete modal
  };

  const closeModal = () => {
    setIsModalOpen(false); // Close modal
    setSelectedSubscription(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(
      updateSubscription({
        id: selectedSubscription.id,
        subscriptionData: selectedSubscription,
      })
    ).then(() => {
      if (updateStatus === 'succeeded') {
        closeModal();
        dispatch(fetchSubscriptions());
      }
    });
  };

  if (status === 'loading') {
    return <div className="text-center text-xl text-gray-500">Loading...</div>;
  }

  if (status === 'failed') {
    return <div className="text-center text-xl text-red-500">Error: {error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-center text-gray-700 mb-4">
        Subscriptions List
      </h2>
      <div className="space-y-4">
        {subscriptions.length === 0 ? (
          <p className="text-center text-lg text-gray-500">No subscriptions available.</p>
        ) : (
          subscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className="p-4 border rounded-lg shadow-sm hover:bg-gray-100 transition duration-300 ease-in-out"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-medium text-gray-800">{subscription.member_name}</h3>
                <span className="text-lg font-medium text-gray-600">{subscription.type.name}</span>
              </div>
              <p className="text-gray-600">Start Date: {subscription.start_date}</p>
              <p className="text-gray-600">End Date: {subscription.end_date}</p>
              <p className="text-gray-600">Paid Amount: ${subscription.paid_amount}</p>
              <p className="text-gray-600">Remaining Amount: ${subscription.remaining_amount}</p>
              <p className="text-gray-600">Attendance Days: {subscription.attendance_days}</p>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => openModal(subscription)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  Update Subscription
                </button>
                <button
                  onClick={() => openDeleteModal(subscription)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  Delete Subscription
                </button>
                <button
                  onClick={() => openDetailModal(subscription.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Update Modal */}
      {isModalOpen && (
        <UpdateSubscriptionModal
          isOpen={isModalOpen}
          onClose={closeModal}
          subscription={selectedSubscription}
        />
      )}

      {/* Delete Modal */}
      <DeleteSubscriptionModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        subscription={selectedSubscription}
      />

      {/* Details Modal */}
      {detailModalOpen && detailSubscriptionId && (
        <SubscriptionDetail
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          subscriptionId={detailSubscriptionId}
        />
      )}
    </div>
  );
};

export default SubscriptionsList;





