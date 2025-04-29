import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionTypes } from '../../redux/slices/subscriptionsSlice';
import UpdateSubscriptionTypes from './UpdateSubscriptionTypes';
import DeleteSubscriptionTypesModal from './DeleteSubscriptionTypesModal';
import SubscriptionTypeDetails from './SubscriptionTypeDetails'; // ✅ Import the details modal
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import CreateSubscriptionType from "./CreateSubscriptionType"; // ✅ Import the create modal
import { FaPlus } from 'react-icons/fa';
const SubscriptionsTypes = () => {
  const dispatch = useDispatch();
  const { subscriptionTypes, loading, error } = useSelector((state) => state.subscriptions);
console.log(subscriptionTypes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [subscriptionToView, setSubscriptionToView] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const openCreateModal = () => setIsCreateModalOpen(true);
const closeCreateModal = () => setIsCreateModalOpen(false);
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
      <h1 className="text-2xl font-bold mb-4">          أنواع الاشتراكات
      </h1>
      <ul>
      <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
           إضافة نوع جديد<FaPlus />
        </button>
  {subscriptionTypes.map((type) => (
   <li key={type.id} className="mb-4 p-4 border-b border-gray-200 flex items-start justify-between hover:bg-gray-50 transition-colors">
 
   <div className="flex space-x-2">
     <div className="relative group">
       <button
         onClick={() => openDetailsModal(type)}
         className="text-green-500  p-2 rounded hover:text-green-600 transition-colors"
       >
         <FaEye />
       </button>
       <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800  text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
         View Details
       </span>
     </div>
     <div className="relative group">
       <button
         onClick={() => openModal(type)}
         className="text-blue-500  p-2 rounded hover:text-blue-600 transition-colors"
       >
         <FaEdit />
       </button>
       <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800  text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
         Edit
       </span>
     </div>
     <div className="relative group">
       <button
         onClick={() => openDeleteModal(type)}
         className="text-red-500  p-2 rounded hover:text-red-600 transition-colors"
       >
         <FaTrash />
       </button>
       <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800  text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
         Delete
       </span>
     </div>
   </div>
   <div className="flex flex-col">
     <span className="text-lg font-semibold">{type.name}</span>
     <div className="text-sm text-gray-600">
     <p>
  نشط:{" "}
  {type.is_active ? (
    <span className="text-green-500">نعم</span>
  ) : (
    <span className="text-red-500">لا</span>
  )}
</p>

     </div>
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

{isCreateModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        onClick={closeCreateModal}
      >
        ✕
      </button>
      <h2 className="text-xl font-semibold mb-4">Create New Subscription</h2>
      <CreateSubscriptionType />
    </div>
  </div>
)}
    </div>
  );
};

export default SubscriptionsTypes; 