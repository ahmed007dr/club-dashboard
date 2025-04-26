import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionTypes } from '../../redux/slices/subscriptionsSlice';
import UpdateSubscriptionTypes from './UpdateSubscriptionTypes';
import DeleteSubscriptionTypesModal from './DeleteSubscriptionTypesModal';
import SubscriptionTypeDetails from './SubscriptionTypeDetails'; // ✅ Import the details modal

const SubscriptionComponent = () => {
  const dispatch = useDispatch();
  const { subscriptionTypes, loading, error } = useSelector((state) => state.subscriptions);
console.log(subscriptionTypes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [subscriptionToView, setSubscriptionToView] = useState(null);

  useEffect(() => {
    dispatch(fetchSubscriptionTypes());
  }, [dispatch]);

  const openModal = (subscription) => {
    setSelectedSubscription(subscription);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedSubscription(null);
    setIsModalOpen(false);
  };

  const openDeleteModal = (subscription) => {
    setSubscriptionToDelete(subscription);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSubscriptionToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const openDetailsModal = (subscription) => {
    setSubscriptionToView(subscription);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setSubscriptionToView(null);
    setIsDetailsModalOpen(false);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Subscription Types</h1>
      <ul>
        {subscriptionTypes.map((type) => (
          <li key={type.id} className="mb-2 flex items-center justify-between">
            <span className="mr-4">{type.name}</span>
            <div className="space-x-2">
              <button
                onClick={() => openDetailsModal(type)}
                className="bg-green-500 text-white px-3 py-1 rounded"
              >
                View
              </button>
              <button
                onClick={() => openModal(type)}
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => openDeleteModal(type)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={closeModal}
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold mb-4">Update Subscription</h2>
            <UpdateSubscriptionTypes
              subscriptionId={selectedSubscription.id}
              subscriptionData={selectedSubscription}
            />
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteSubscriptionTypesModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        subscription={subscriptionToDelete}
      />

      {/* Details Modal */}
      {isDetailsModalOpen && subscriptionToView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={closeDetailsModal}
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold mb-4">Subscription Details</h2>
            <SubscriptionTypeDetails id={subscriptionToView.id} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionComponent;



