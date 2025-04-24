import React, { useState } from 'react';
import AddTicket from '../modals/AddTicket';  
import { CiTrash } from 'react-icons/ci';
import { CiEdit } from 'react-icons/ci';
import { FaEye } from "react-icons/fa";
import {  GiTicket } from 'react-icons/gi';

const Tickets = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Delete confirmation modal state
  const [isMarkUsedModalOpen, setIsMarkUsedModalOpen] = useState(false); // Mark as Used confirmation modal state
  const [ticketToDelete, setTicketToDelete] = useState(null); // Ticket selected for deletion
  const [ticketToMarkUsed, setTicketToMarkUsed] = useState(null); // Ticket selected to mark as used

  const handleCreateTicket = () => {
    setIsModalOpen(true);  
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);  
  };

  const [tickets, setTickets] = useState([
    {
      id: 1,
      club: { name: "Iron Gym" },
      buyer_name: "John Doe",
      ticket_type: "day_pass",
      price: "25.00",
      used: false,
      issue_date: "2025-04-15",
      used_by: null,
    },
    {
      id: 2,
      club: { name: "PowerHouse Club" },
      buyer_name: "Jane Smith",
      ticket_type: "session",
      price: "15.50",
      used: true,
      issue_date: "2025-04-12",
      used_by: { name: "Jane Smith" },
    },
    {
      id: 3,
      club: { name: "Elite Fitness" },
      buyer_name: "Mike Johnson",
      ticket_type: "day_pass",
      price: "30.00",
      used: false,
      issue_date: "2025-04-10",
      used_by: null,
    },
  ]);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalType, setModalType] = useState(null); // "view" | "edit"

  const closeModal = () => {
    setSelectedTicket(null);
    setModalType(null);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setTickets((prev) =>
      prev.map((t) => (t.id === selectedTicket.id ? selectedTicket : t))
    );
    closeModal();
  };

  const handleDeleteTicket = (id) => {
    setTickets(tickets.filter(ticket => ticket.id !== id));
    setIsDeleteModalOpen(false); // Close delete confirmation modal
  };

  const handleMarkAsUsed = (ticket) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticket.id
          ? { ...t, used: true, used_by: { name: "Admin" } } // You can replace 'Admin' with the current user
          : t
      )
    );
    setIsMarkUsedModalOpen(false); // Close the "Mark as Used" modal
  };

  return (
    <div>

<div className="flex items-start space-x-3">
  <GiTicket className="btn-orange text-2xl" />
  <h2 className="text-2xl font-semibold mb-4">Tickets</h2>
</div>


      {/* Create Ticket Button */}
      <button
        onClick={handleCreateTicket}
        className="btn"
      >
        Create Ticket
      </button>

      <table className="min-w-full  shadow rounded-lg overflow-hidden">
        <thead>
          <tr className=" text-left text-sm font-semibold ">
            <th className="px-4 py-3">Club</th>
            <th className="px-4 py-3">Buyer</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Used</th>
            <th className="px-4 py-3">Issue Date</th>
            <th className="px-4 py-3">Used By</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-gray-200">
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td className="px-4 py-2">{ticket.club.name}</td>
              <td className="px-4 py-2">{ticket.buyer_name}</td>
              <td className="px-4 py-2 capitalize">{ticket.ticket_type.replace("_", " ")}</td>
              <td className="px-4 py-2">${ticket.price}</td>
              <td className="px-4 py-2">
                {ticket.used ? (
                  <span className="bg-light-green">Yes</span>
                ) : (
                  <span className="bg-light-red">No</span>
                )}
              </td>
              <td className="px-4 py-2">{ticket.issue_date}</td>
              <td className="px-4 py-2">
                {ticket.used_by ? ticket.used_by.name : "—"}
              </td>
              <td className="px-4 py-2 flex gap-2">
  <button
    onClick={() => {
      setSelectedTicket(ticket);
      setModalType("view");
    }}
    className="btn-blue"
  >
    <FaEye size={20} />
  </button>

  <button
    onClick={() => {
      setSelectedTicket({ ...ticket });
      setModalType("edit");
    }}
    className="btn-green"
  >
    <CiEdit size={20} />
  </button>

  <button
    onClick={() => {
      setTicketToDelete(ticket);
      setIsDeleteModalOpen(true);
    }}
    className="btn-red"
  >
    <CiTrash size={20} />
  </button>

  {!ticket.used && (
    <button
      onClick={() => {
        setTicketToMarkUsed(ticket);
        setIsMarkUsedModalOpen(true);
      }}
      className="text-blue-600 cursor-pointer"
    >
      Mark as Used
    </button>
  )}
</td>

            </tr>
          ))}
        </tbody>
      </table>

      {/* Mark as Used Confirmation Modal */}
      {isMarkUsedModalOpen && ticketToMarkUsed && (
        <div className="fixed inset-0 flex justify-center items-center z-40" style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
          <div className="modal">
            <h3 className="text-lg font-bold mb-4">Do you want to mark this ticket as used?</h3>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setIsMarkUsedModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-black rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleMarkAsUsed(ticketToMarkUsed)}
                className="btn"
              >
                Mark as Used
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {modalType === "edit" && selectedTicket && (
        <div className="fixed inset-0 z-40 flex justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="modal">
            <h3 className="text-lg font-bold mb-4">Edit Ticket</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Club Input */}
              <input
                className="border p-2 w-full"
                value={selectedTicket.club.name}
                onChange={(e) =>
                  setSelectedTicket((prev) => ({
                    ...prev,
                    club: { ...prev.club, name: e.target.value },
                  }))
                }
                placeholder="Club Name"
              />
              
              {/* Buyer Name Input */}
              <input
                className="border p-2 w-full"
                value={selectedTicket.buyer_name}
                onChange={(e) =>
                  setSelectedTicket((prev) => ({
                    ...prev,
                    buyer_name: e.target.value,
                  }))
                }
                placeholder="Buyer Name"
              />
              
              {/* Ticket Type Input */}
              <input
                className="border p-2 w-full"
                value={selectedTicket.ticket_type}
                onChange={(e) =>
                  setSelectedTicket((prev) => ({
                    ...prev,
                    ticket_type: e.target.value,
                  }))
                }
                placeholder="Ticket Type"
              />
              
              {/* Price Input */}
              <input
                className="border p-2 w-full"
                value={selectedTicket.price}
                onChange={(e) =>
                  setSelectedTicket((prev) => ({
                    ...prev,
                    price: e.target.value,
                  }))
                }
                placeholder="Price"
              />
              
              {/* Issue Date Input */}
              <input
                className="border p-2 w-full"
                type="date"
                value={selectedTicket.issue_date}
                onChange={(e) =>
                  setSelectedTicket((prev) => ({
                    ...prev,
                    issue_date: e.target.value,
                  }))
                }
                placeholder="Issue Date"
              />
              
              {/* Used By Input */}
              <input
                className="border p-2 w-full"
                value={selectedTicket.used_by ? selectedTicket.used_by.name : ""}
                onChange={(e) =>
                  setSelectedTicket((prev) => ({
                    ...prev,
                    used_by: e.target.value ? { name: e.target.value } : null,
                  }))
                }
                placeholder="Used By"
              />

              <div className="flex justify-between gap-2">
                <button
                  type="submit"
                  className="btn"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-300 text-black px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && ticketToDelete && (
        <div className="fixed inset-0 flex justify-center items-center z-40" style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
          <div className="modal">
            <h3 className="text-lg font-bold mb-4">Are you sure you want to delete this ticket?</h3>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-black rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTicket(ticketToDelete.id)}
                className="btn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;




