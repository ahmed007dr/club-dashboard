import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTickets,
  deleteTicketById,
  editTicketById,
  markTicketAsUsed,
} from '../../redux/slices/ticketsSlice';
import { FaEdit, FaTrash, FaCheck, FaEye } from "react-icons/fa"
import { FaPlus } from 'react-icons/fa';

import AddTicket from './AddTicket';
const Tickets = () => {
  const dispatch = useDispatch();
  const { tickets } = useSelector((state) => state.tickets);
  console.log('Tickets:', tickets); // Debugging line to check the tickets data
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMarkAsUsedModal, setShowMarkAsUsedModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const openCreateModal = () => setShowCreateModal(true);
const closeCreateModal = () => setShowCreateModal(false);
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
     <div className="flex justify-between items-center mb-6">
  <h1 className="text-3xl font-bold">Ticket List</h1>
  <button
    onClick={openCreateModal}
    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
  >
    <FaPlus /> Add New Ticket
  </button>
</div>
      <table className="min-w-full bg-white shadow rounded">
  <thead>
    <tr>
      <th className="py-2 px-4 border-b text-left">Club (ID)</th>
      <th className="py-2 px-4 border-b text-left">Club Name</th>
      <th className="py-2 px-4 border-b text-left">Buyer</th>
      <th className="py-2 px-4 border-b text-left">Ticket Type</th>
      <th className="py-2 px-4 border-b text-left">Price</th>
      <th className="py-2 px-4 border-b text-left">Status</th>
      <th className="py-2 px-4 border-b text-center">Actions</th>
    </tr>
  </thead>
  <tbody>
    {tickets.map((ticket) => (
      <tr key={ticket.id} className="hover:bg-gray-100">
        {/* Display Club ID (hidden or visible as needed) */}
        <td className="py-2 px-4 border-b">{ticket.club}</td>

        {/* Display Club Name */}
        <td className="py-2 px-4 border-b">{ticket.club_name}</td>

        {/* Display Buyer Name */}
        <td className="py-2 px-4 border-b">{ticket.buyer_name}</td>

        {/* Display Ticket Type */}
        <td className="py-2 px-4 border-b">{ticket.ticket_type_display}</td>

        {/* Display Price */}
        <td className="py-2 px-4 border-b">${ticket.price}</td>

        {/* Display Status (Used or Available) */}
        <td className="py-2 px-4 border-b">{ticket.used ? 'Used' : 'Available'}</td>

        {/* Action Buttons */}
        <td className="py-2 px-4 border-b">
          <div className="flex justify-center items-center gap-3">
            <button
              onClick={() => openEditModal(ticket)}
              className="text-blue-500 hover:text-blue-700"
              title="Edit"
            >
              <FaEdit size={18} />
            </button>
            <button
              onClick={() => openDeleteModal(ticket)}
              className="text-red-500 hover:text-red-700"
              title="Delete"
            >
              <FaTrash size={18} />
            </button>
            {!ticket.used && (
              <button
                onClick={() => openMarkAsUsedModal(ticket)}
                className="text-green-500 hover:text-green-700"
                title="Mark as Used"
              >
                <FaCheck size={18} />
              </button>
            )}
            <button
              onClick={() => openViewModal(ticket)}
              className="text-gray-500 hover:text-gray-700"
              title="View"
            >
              <FaEye size={18} />
            </button>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
</table>
{showCreateModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
      <div className="flex justify-between items-center border-b p-4">
        <h2 className="text-xl font-semibold">Create New Ticket</h2>
        <button
          onClick={closeCreateModal}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      <div className="p-4">
        <AddTicket onClose={closeCreateModal} />
      </div>
    </div>
  </div>
)}

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

export default Tickets;




