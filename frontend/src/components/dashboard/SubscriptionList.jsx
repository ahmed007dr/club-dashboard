import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptions, updateSubscription, renewSubscription, makePayment } from '../../redux/slices/subscriptionsSlice';
import DeleteSubscriptionModal from './DeleteSubscriptionModal'; // Import the delete modal
import UpdateSubscriptionModal from './UpdateSubscriptionModal'; // Import the update modal
import SubscriptionDetail from './SubscriptionDetail';
import { Link } from 'react-router-dom';

const SubscriptionsList = () => {
  const dispatch = useDispatch();
  const { subscriptions, status, error, updateStatus } = useSelector((state) => state.subscriptions);
console.log('Subscriptions:', subscriptions); // Debugging line to check the subscriptions data
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false); // Delete modal state
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailSubscriptionId, setDetailSubscriptionId] = useState(null);
  const [paymentAmounts, setPaymentAmounts] = useState({});

  const handleInputChange = (e, subscriptionId) => {
    const { value } = e.target;
    // Allow only numbers and a single decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setPaymentAmounts((prev) => ({
        ...prev,
        [subscriptionId]: value, // Store the entered amount for the subscription
      }));
    }
  };

  const handlePayment = (subscription) => {
    // Get the amount from input or fallback to the remaining_amount
    let amount = paymentAmounts[subscription.id] || subscription.remaining_amount;
    
    // Ensure it's a valid decimal value formatted to 2 decimal places
    amount = parseFloat(amount).toFixed(2);
    
    dispatch(makePayment({
      subscriptionId: subscription.id,
      amount: amount, // Sending the amount as a string formatted to 2 decimal places
    }))
      .unwrap()
      .then(() => {
        alert('Payment successful!');
        // Clear the payment input after success
        setPaymentAmounts(prev => ({
          ...prev,
          [subscription.id]: ''
        }));
      })
      .catch((error) => {
        console.error(error);
        alert(`Payment failed: ${error.message}`);
      });
  };

  


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

  const handleSubmit = (formData) => {
    dispatch(
      updateSubscription({
        id: selectedSubscription.id,
        subscriptionData: formData, // Use the form data passed from the modal
      })
    ).then(() => {
      if (updateStatus === 'succeeded') {
        closeModal();
        dispatch(fetchSubscriptions());
      }
    });
  };

   const handleRenew = (subscriptionId) => {
      console.log("Renewing subscription with ID:", subscriptionId);
      dispatch(renewSubscription({ subscriptionId })); 
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
              <Link
                  to={`/member-subscriptions/${subscription.member}`} // Navigate to member subscriptions page
                  className="text-xl font-medium text-gray-800 hover:text-blue-600"
                >
                  {subscription.member_name}
                </Link>
                <span className="text-lg font-medium text-gray-600">{subscription.type.name}</span>
              </div>
              <p className="text-gray-600">Start Date: {subscription.start_date}</p>
              <p className="text-gray-600">End Date: {subscription.end_date}</p>
              <p className="text-gray-600">Paid Amount: ${subscription.paid_amount}</p>
              <p className="text-gray-600">Remaining Amount: ${subscription.remaining_amount}</p>
              <p className="text-gray-600">Attendance Days: {subscription.attendance_days}</p>
              <p className="text-gray-600">Status: {subscription.status}</p>
              <p className="text-gray-600">Club Name: {subscription.club_name}</p>
              {/* Input for payment */}
                {/* Input for payment */}
                  {/* Input for payment */}
              <input
                type="text" // Changed from number to text for better control
                inputMode="decimal" // Suggests numeric keyboard on mobile
                pattern="[0-9]*\.?[0-9]*" // Regex pattern for decimal validation
                placeholder="0.00"
                value={paymentAmounts[subscription.id] || ''}
                onChange={(e) => handleInputChange(e, subscription.id)}
                className="border p-1 rounded mb-2"
              />

              {/* Make Payment Button */}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handlePayment(subscription)}
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
                >
                  Make Payment
                </button>
              </div>


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
                {subscription.status === 'Expired' && (
    <button
      onClick={() => handleRenew(subscription.id)}
      className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
    >
      Renew Subscription
    </button>
  )}
                
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
          onSubmit={handleSubmit}
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





