import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTickets,
  deleteTicketById,
  editTicketById,
  markTicketAsUsed,
} from '../../redux/slices/ticketsSlice';

const TicketList = () => {
  const dispatch = useDispatch();
  const { tickets } = useSelector((state) => state.tickets);
  console.log('Tickets:', tickets); // Debugging line to check the tickets data
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMarkAsUsedModal, setShowMarkAsUsedModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const openViewModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowViewModal(true);
  };
  

  useEffect(() => {
    dispatch(fetchTickets());
  }, [dispatch]);

  const openEditModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowEditModal(true);
  };

  const openDeleteModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowDeleteModal(true);
  };

  const openMarkAsUsedModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowMarkAsUsedModal(true);
  };

  const closeModals = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowMarkAsUsedModal(false);
    setSelectedTicket(null);
  };



  const handleEditSave = () => {
    if (selectedTicket) {
      // Ensure club is a number - if it's an array, take the first element
      const clubId = Array.isArray(selectedTicket.club) 
        ? selectedTicket.club[0] 
        : selectedTicket.club;
  
      const updatedTicketData = {
        club: Number(clubId),  // Force conversion to number
        buyer_name: selectedTicket.buyer_name,
        ticket_type: selectedTicket.ticket_type,
        price: selectedTicket.price,
        used: selectedTicket.used,
        used_by: selectedTicket.used ? selectedTicket.used_by : null,
      };
  
      dispatch(editTicketById({ ticketId: selectedTicket.id, ticketData: updatedTicketData }))
        .then(() => {
          closeModals();
          dispatch(fetchTickets());
        })
        .catch((error) => {
          console.error("Error updating ticket:", error);
        });
    }
  };
  
  
  

  const handleDelete = () => {
    if (selectedTicket) {
      dispatch(deleteTicketById(selectedTicket.id))
        .then(() => {
          closeModals();
          dispatch(fetchTickets());
        });
    }
  };
  const handleMarkAsUsed = () => {
    if (selectedTicket) {
      dispatch(markTicketAsUsed({
        ticketId: selectedTicket.id, // numeric ID
        used_by: selectedTicket.used_by || null // member ID or null
      }))
      .then(() => {
        closeModals();
        dispatch(fetchTickets());
      })
      .catch((error) => {
        console.error("Error marking ticket as used:", error);
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
  
    if (type === "checkbox") {
      setSelectedTicket({
        ...selectedTicket,
        [name]: checked,
      });
    } else if (name === "club") {
      // Special handling for club to ensure it's always a number
      setSelectedTicket({
        ...selectedTicket,
        [name]: value === "" ? "" : Number(value),
      });
    } else {
      setSelectedTicket({
        ...selectedTicket,
        [name]: value,
      });
    }
  };
  

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Ticket List</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="border p-4 rounded shadow">
            <h2 className="text-xl font-semibold">{ticket.title}</h2>
            <p className="text-gray-600">Price: ${ticket.price}</p>
            <p className="text-gray-600">Buyer: {ticket.buyer_name}</p>
            <p className="text-gray-600">Club: {ticket.club_name}</p>
            <p className="text-gray-600">Ticket Type: {ticket.ticket_type_display}</p>
            <p className="text-gray-600">Status: {ticket.isUsed ? 'Used' : 'Available'}</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => openEditModal(ticket)}
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => openDeleteModal(ticket)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
              {/* Show only for unused tickets */}
        {!ticket.used && (
          <button
            onClick={() => openMarkAsUsedModal(ticket)}
            className="bg-green-500 text-white px-3 py-1 rounded"
          >
            Mark as Used
          </button>
        )}
              <button
  onClick={() => openViewModal(ticket)}
  className="bg-gray-500 text-white px-3 py-1 rounded"
>
  View
</button>

            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
{showEditModal && selectedTicket && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white p-6 rounded shadow-lg w-96">
      <h2 className="text-2xl font-bold mb-4">Edit Ticket</h2>
      <input
        type="text"
        name="buyer_name"
        value={selectedTicket.buyer_name}
        onChange={handleInputChange}
        placeholder="Buyer Name"
        className="w-full border p-2 mb-4"
      />
      <input
        type="number"
        name="price"
        value={selectedTicket.price}
        onChange={handleInputChange}
        placeholder="Price"
        className="w-full border p-2 mb-4"
      />
      {/* Handle Club as a number (Club ID) */}
      <input
  type="number"
  name="club"
  value={selectedTicket.club}
  onChange={handleInputChange}
  placeholder="Club ID"
  className="w-full border p-2 mb-4"
/>
      {/* Handle Ticket Type */}
      <select
        name="ticket_type"
        value={selectedTicket.ticket_type}
        onChange={handleInputChange}
        className="w-full border p-2 mb-4"
      >
        <option value="session">Session</option>
        <option value="day_pass">Day Pass</option>
        <option value="monthly">Monthly</option>
        {/* Add other options as needed */}
      </select>
      {/* Handle Used as a boolean (Checkbox) */}
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          name="used"
          checked={selectedTicket.used}  // Used as a boolean
          onChange={handleInputChange}
          className="mr-2"
        />
        <label>Used</label>
      </div>
      {/* Handle Used By as a number */}
      {selectedTicket.used && (
        <input
          type="number"
          name="used_by"
          value={selectedTicket.used_by || ""}
          onChange={handleInputChange}
          placeholder="Used By (Member ID)"
          className="w-full border p-2 mb-4"
        />
      )}
      <div className="flex justify-end gap-2">
        <button
          onClick={closeModals}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleEditSave}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
)}


      {/* Delete Modal */}
      {showDeleteModal && selectedTicket && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-80">
            <h2 className="text-2xl font-bold mb-4">Delete Ticket</h2>
            <p>Are you sure you want to delete "{selectedTicket.title}"?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={closeModals}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Used Modal */}
      {showMarkAsUsedModal && selectedTicket && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white p-6 rounded shadow-lg w-80">
      <h2 className="text-2xl font-bold mb-4">Mark Ticket as Used</h2>
      
      <div className="mb-4">
        <label htmlFor="usedBy" className="block mb-2">Member ID:</label>
        <input
          type="number"
          name="used_by"
          value={selectedTicket.used_by || ""}
          onChange={handleInputChange}
          placeholder="Enter member ID"
          className="w-full border p-2 rounded"
          id="usedBy"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={closeModals} className="bg-gray-300 px-4 py-2 rounded">
          Cancel
        </button>
        <button 
          onClick={handleMarkAsUsed} 
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}

{showViewModal && selectedTicket && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white p-6 rounded shadow-lg w-96">
      <h2 className="text-2xl font-bold mb-4">Ticket Details</h2>
      <p><strong>Buyer Name:</strong> {selectedTicket.buyer_name}</p>
      <p><strong>Price:</strong> ${selectedTicket.price}</p>
      <p><strong>Club:</strong> {selectedTicket.club_name}</p>
      <p><strong>Ticket Type:</strong> {selectedTicket.ticket_type_display}</p>
      <p><strong>Status:</strong> {selectedTicket.isUsed ? 'Used' : 'Available'}</p>
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={closeModals}
          className="bg-gray-300 px-4 py-2 rounded"
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

export default TicketList;




