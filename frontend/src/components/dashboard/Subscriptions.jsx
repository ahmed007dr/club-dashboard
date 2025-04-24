import React, { useState } from 'react';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';

import AddSubscription from '../modals/AddSubscription';
import SubscriptionsTable from './SubscriptionsTable'; // Import the table component
import SubscriptionsTypes from './SubscriptionsTypes'; // Import SubscriptionsTypes
import { MdOutlineSubscriptions } from 'react-icons/md';
const fakeSubscriptions = [
  {
    id: 1,
    member_name: "Ahmed ElSayed",
    club_name: "Fitness Club",
    subscription_type: "Basic Gym Membership",
    start_date: "2023-01-15",
    end_date: "2023-02-14",
    paid_amount: "30.00",
    remaining_amount: "0.00",
    attendance_days: 20,
  },
  // Add more subscriptions here
];

const Subscriptions = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [formData, setFormData] = useState({
    member: '',
    subscription_type: '',
    sport_type: '',
    start_date: '',
    end_date: '',
    attendance_days: '',
    subscription_value: '',
    amount_paid: '',
    amount_remaining: '',
  });

  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedData = { ...formData, [name]: value };

    if (name === 'subscription_value' || name === 'amount_paid') {
      const subscriptionValue = parseFloat(name === 'subscription_value' ? value : formData.subscription_value);
      const amountPaid = parseFloat(name === 'amount_paid' ? value : formData.amount_paid);

      if (!isNaN(subscriptionValue) && !isNaN(amountPaid)) {
        updatedData.amount_remaining = (subscriptionValue - amountPaid).toFixed(2);
      }
    }

    setFormData(updatedData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted:', formData);
    setIsModalOpen(false); // Close modal
  };

  const openEditModal = (subscription) => {
    setFormData({
      member: subscription.member_name,
      subscription_type: subscription.subscription_type,
      sport_type: '', // Update if you have this data
      start_date: subscription.start_date,
      end_date: subscription.end_date,
      attendance_days: subscription.attendance_days,
      subscription_value: subscription.paid_amount, // Assuming
      amount_paid: subscription.paid_amount,
      amount_remaining: subscription.remaining_amount,
    });
    setSelectedSubscription(subscription);
    setIsModalOpen(true);
  };

  const openDeleteModal = (subscription) => {
    setSelectedSubscription(subscription);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    console.log("Deleting:", selectedSubscription);
    setIsDeleteModalOpen(false); // Close the delete modal
  };

  const openInfoModal = (subscription) => {
    setSelectedSubscription(subscription);
    setIsInfoModalOpen(true);
  };

  const closeInfoModal = () => setIsInfoModalOpen(false);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
      <div className="flex items-start space-x-3">
  <MdOutlineSubscriptions className="btn-indigo text-2xl" />
  <h2 className="text-2xl font-semibold mb-4">Subscription</h2>
</div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn"
        >
          Add Subscription
        </button>
      </div>


      {/* Subscription Types Accordion */}
      <div className="border-b border-gray-200 mb-4">
        <button
          onClick={() => toggleSection('subscriptionsTypes')}
          className="w-full flex items-center justify-between text-left text-lg font-medium py-3 px-4  rounded-t"
        >
          <span>Subscription Types</span>
          {openSection === 'subscriptionsTypes' ? (
            <IoIosArrowUp className="text-xl" />
          ) : (
            <IoIosArrowDown className="text-xl" />
          )}
        </button>
        {openSection === 'subscriptionsTypes' && (
          <div className="shadow rounded-b">
            <SubscriptionsTypes />
          </div>
        )}
      </div>

      {/* Subscriptions Table Accordion */}
      <div className="border-b border-gray-200 mb-4">
        <button
          onClick={() => toggleSection('subscriptionsTable')}
          className="w-full flex items-center justify-between text-left text-lg font-medium py-3 px-4  rounded-t"
        >
          <span>Subscriptions Table</span>
          {openSection === 'subscriptionsTable' ? (
            <IoIosArrowUp className="text-xl" />
          ) : (
            <IoIosArrowDown className="text-xl" />
          )}
        </button>
        {openSection === 'subscriptionsTable' && (
          <div className="shadow rounded-b">
            <SubscriptionsTable 
              subscriptions={fakeSubscriptions} 
              openEditModal={openEditModal} 
              openDeleteModal={openDeleteModal} 
              openInfoModal={openInfoModal} 
            />
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <>
          <div
            className="fixed inset-0 flex justify-center items-center z-40" style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
            onClick={() => setIsModalOpen(false)}
          ></div>
          <AddSubscription
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            closeModal={() => setIsModalOpen(false)}
          />
        </>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <>
          <div
            className="fixed inset-0 flex justify-center items-center z-40" style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
            onClick={() => setIsDeleteModalOpen(false)}
          ></div>
          <div className="fixed z-50  p-6 rounded-lg shadow-md top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Confirm Deletion</h2>
            <p className="mb-6">Are you sure you want to delete this subscription?</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600  rounded hover:bg-red-700"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}

      {/* Subscription Info Modal */}
      {isInfoModalOpen && (
        <div
          className="fixed inset-0 flex justify-center items-center z-40"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
          onClick={closeInfoModal}
        >
          <div className="fixed z-50  p-6 rounded-lg shadow-md top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md">
            <div>
              <p><strong>Member Name:</strong> {selectedSubscription.member_name}</p>
              <p><strong>Club Name:</strong> {selectedSubscription.club_name}</p>
              <p><strong>Subscription Type:</strong> {selectedSubscription.subscription_type}</p>
              <p><strong>Start Date:</strong> {selectedSubscription.start_date}</p>
              <p><strong>End Date:</strong> {selectedSubscription.end_date}</p>
              <p><strong>Paid Amount:</strong> ${selectedSubscription.paid_amount}</p>
              <p><strong>Remaining Amount:</strong> ${selectedSubscription.remaining_amount}</p>
              <p><strong>Attendance Days:</strong> {selectedSubscription.attendance_days}</p>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={closeInfoModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;


