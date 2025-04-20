import React, { useState } from 'react';
import AddFreeInvite from '../modals/AddFreeInvite'; 
const FreeInvites = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Free Invites</h2>
      <p>This is the Free Invites section.</p>

      {/* Add Free Invite Button */}
      <button
        onClick={openModal}
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition duration-200"
      >
        Add Free Invite
      </button>

      {/* Modal for adding Free Invite */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <h2 className="text-2xl font-semibold text-center mb-4">Create Free Invite</h2>
            <AddFreeInvite /> {/* This is the form component */}
            <button
              onClick={closeModal}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreeInvites;
