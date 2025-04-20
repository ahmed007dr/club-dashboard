import React, { useState } from 'react';
import AddTicket from '../modals/AddTicket';  

const Tickets = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateTicket = () => {
    setIsModalOpen(true);  
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);  
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Tickets</h2>

      {/* Create Ticket Button */}
      <button
        onClick={handleCreateTicket}
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
      >
        Create Ticket
      </button>

      {/* Modal for Adding Ticket */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }} >
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full relative">
            {/* Close Modal Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              &times;
            </button>
            {/* AddTicket Form Component */}
            <AddTicket />
          </div>
        </div>
      )}

      <p>This is the Tickets section.</p>
    </div>
  );
};

export default Tickets;

