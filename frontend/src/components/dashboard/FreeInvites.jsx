import React, { useState } from 'react';
import { CiTrash, CiEdit } from 'react-icons/ci';
import { FaEye } from 'react-icons/fa';

const fakeInvites = [
  {
    guestName: "Mike Johnson",
    phone: "555-1234",
    date: "2025-04-10",
    status: "pending",
    clubId: "club123",
    handledById: "staff001",
    invitedById: "user123",
  },
  {
    guestName: "Sarah Parker",
    phone: "555-5678",
    date: "2025-05-01",
    status: "used",
    clubId: "club456",
    handledById: "staff002",
    invitedById: "user456",
  },
  {
    guestName: "David Brown",
    phone: "555-9012",
    date: "2025-06-15",
    status: "pending",
    clubId: "club789",
    handledById: "staff003",
    invitedById: "user789",
  },
];

const FreeInvites = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isMarkUsedModalOpen, setIsMarkUsedModalOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const openMarkUsedModal = (invite) => {
    setSelectedInvite(invite);
    setIsMarkUsedModalOpen(true);
  };

  const closeMarkUsedModal = () => {
    setIsMarkUsedModalOpen(false);
    setSelectedInvite(null);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const openDeleteModal = (ticket) => {
    setSelectedTicket(ticket);
    setIsDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedTicket(null);
  };

  const openEditModal = (ticket) => {
    setSelectedTicket(ticket);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTicket(null);
  };

  const openViewModal = (ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    console.log("Deleting ticket", selectedTicket);
    // Add logic to delete the ticket here
    closeDeleteModal();
  };

  const handleMarkUsed = () => {
    if (selectedInvite) {
      // Update invite status to 'used'
      setInvites((prevInvites) =>
        prevInvites.map((invite) =>
          invite._id === selectedInvite._id
            ? { ...invite, status: 'used' }
            : invite
        )
      );
      closeMarkUsedModal();  // Close the modal after marking
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Free Invites</h2>
      <p>This is the Free Invites section.</p>

      {/* Table displaying free invites */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-lg">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="px-4 py-2 text-left">Guest Name</th>
              <th className="px-4 py-2 text-left">Phone</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Club ID</th>
              <th className="px-4 py-2 text-left">Handled By</th>
              <th className="px-4 py-2 text-left">Invited By</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fakeInvites.map((invite, index) => (
              <tr key={index} className="border-b hover:bg-gray-100">
                <td className="px-4 py-2">{invite.guestName}</td>
                <td className="px-4 py-2">{invite.phone}</td>
                <td className="px-4 py-2">{invite.date}</td>
                <td className="px-4 py-2 capitalize">{invite.status}</td>
                <td className="px-4 py-2">{invite.clubId}</td>
                <td className="px-4 py-2">{invite.handledById}</td>
                <td className="px-4 py-2">{invite.invitedById}</td>
                <td className="px-4 py-2">
                  <div className="flex space-x-2">
                    {/* Edit Button */}
                    <button
                      onClick={() => openEditModal(invite)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <CiEdit size={20} />
                    </button>
                    {/* View Button */}
                    <button
                      onClick={() => openViewModal(invite)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <FaEye size={20} />
                    </button>
                    {/* Delete Button */}
                    <button
                      onClick={() => openDeleteModal(invite)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <CiTrash size={20} />
                    </button>
                    <button onClick={() => openMarkUsedModal(invite)} className="text-blue-500">
                    Mark as Used
                  </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for confirming deletion */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-40 flex justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <h2 className="text-2xl font-semibold text-center mb-4">Are you sure you want to delete this invite?</h2>
            <p className="mb-4">This action cannot be undone.</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Yes, Delete
              </button>
              <button
                onClick={closeDeleteModal}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for editing a ticket */}
      {isEditModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-40 flex justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <h2 className="text-2xl font-semibold text-center mb-4">Edit Invite</h2>
            <form>
              <div className="mb-4">
                <label className="block text-gray-700">Guest Name</label>
                <input
                  type="text"
                  defaultValue={selectedTicket.guestName}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Phone</label>
                <input
                  type="text"
                  defaultValue={selectedTicket.phone}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Date</label>
                <input
                  type="date"
                  defaultValue={selectedTicket.date}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Status</label>
                <select
                  defaultValue={selectedTicket.status}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                >
                  <option value="pending">Pending</option>
                  <option value="used">Used</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Club ID</label>
                <input
                  type="text"
                  defaultValue={selectedTicket.clubId}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Handled By</label>
                <input
                  type="text"
                  defaultValue={selectedTicket.handledById}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Invited By</label>
                <input
                  type="text"
                  defaultValue={selectedTicket.invitedById}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                />
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={closeEditModal}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for viewing ticket info */}
      {isModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-40 flex justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <h2 className="text-2xl font-semibold text-center mb-4">Invite Details</h2>
            <p><strong>Guest Name:</strong> {selectedTicket.guestName}</p>
            <p><strong>Phone:</strong> {selectedTicket.phone}</p>
            <p><strong>Date:</strong> {selectedTicket.date}</p>
            <p><strong>Status:</strong> {selectedTicket.status}</p>
            <p><strong>Club ID:</strong> {selectedTicket.clubId}</p>
            <p><strong>Handled By:</strong> {selectedTicket.handledById}</p>
            <p><strong>Invited By:</strong> {selectedTicket.invitedById}</p>
            <div className="flex justify-center space-x-4 mt-4">
              <button
                onClick={closeModal}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isMarkUsedModalOpen && (
        <div className="fixed inset-0 z-40 flex justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl mb-4">Do you want to mark this invite as used?</h3>
            <div className="flex space-x-4">
              <button onClick={handleMarkUsed} className="bg-green-500 text-white py-2 px-4 rounded-md">
                Yes
              </button>
              <button onClick={closeMarkUsedModal} className="bg-gray-300 py-2 px-4 rounded-md">
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreeInvites;

