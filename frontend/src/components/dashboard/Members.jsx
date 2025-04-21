import React, { useEffect, useState } from "react";
import AddMember from "../modals/AddMember";
import { Link } from "react-router-dom";
import { CiTrash } from "react-icons/ci";
import { CiEdit } from "react-icons/ci";

const Members = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); // Added search query state

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => setIsAddModalOpen(false);

  const fakeMembers = [
    {
      id: 1,
      photo: "https://i.pravatar.cc/100?img=11",
      name: "Ahmed El-Zahrani",
      membership_number: "1001",
      national_id: "102030405060",
      phone: "0101234567",
      club_name: "Sports Club",
    },
    {
      id: 2,
      photo: "https://i.pravatar.cc/100?img=12",
      name: "Sara Al-Otaibi",
      membership_number: "1002",
      national_id: "112233445566",
      phone: "0109876543",
      club_name: "Sports Club",
    },
  ];

  useEffect(() => {
    setData(fakeMembers);
    setFilteredData(fakeMembers); // Initially show all members
  }, []);

  // Function to filter members based on search query
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = data.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.membership_number.includes(query) ||
        member.national_id.includes(query)
    );
    setFilteredData(filtered);
  };

  const handleDeleteClick = (member) => {
    setSelectedMember(member);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    setData(data.filter((m) => m.id !== selectedMember.id));
    setFilteredData(filteredData.filter((m) => m.id !== selectedMember.id)); // Update filtered data after deletion
    setIsDeleteModalOpen(false);
  };

  const handleEditClick = (member) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    setSelectedMember({ ...selectedMember, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = () => {
    const updatedData = data.map((m) =>
      m.id === selectedMember.id ? selectedMember : m
    );
    setData(updatedData);
    setFilteredData(updatedData); // Update filtered data after edit
    setIsEditModalOpen(false);
  };

  return (
    <div className="p-4 overflow-x-auto">
      <h2 className="text-2xl font-bold text-center mb-4">Members List</h2>
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearch}
        placeholder="Search by name, membership number, or national ID"
        className="border p-2 rounded-md mb-4 w-full"
      />
      <button
        onClick={openAddModal}
        className="bg-green-600 text-white py-2 px-4 rounded-md mb-4"
      >
        Add Member
      </button>

      <table className="min-w-full border border-gray-200">
        <thead className="bg-green-100 text-left">
          <tr>
            <th className="p-3 border-b">#</th>
            <th className="p-3 border-b">Photo</th>
            <th className="p-3 border-b">Name</th>
            <th className="p-3 border-b">Membership Number</th>
            <th className="p-3 border-b">National ID</th>
            <th className="p-3 border-b">Phone</th>
            <th className="p-3 border-b">Club Name</th>
            <th className="p-3 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((member, index) => (
            <tr key={member.id} className="hover:bg-gray-50">
              <td className="p-3 border-b">{index + 1}</td>
              <td className="p-3 border-b">
                <Link to={`/member/${member.id}`}>
                  <img
                    src={member.photo}
                    alt="member"
                    className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition"
                  />
                </Link>
              </td>
              <td className="p-3 border-b">{member.name}</td>
              <td className="p-3 border-b">{member.membership_number}</td>
              <td className="p-3 border-b">{member.national_id}</td>
              <td className="p-3 border-b">{member.phone}</td>
              <td className="p-3 border-b">{member.club_name}</td>
              <td className="p-3 border-b">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(member)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit"
                  >
                    <CiEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(member)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    <CiTrash />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 flex justify-center items-center z-40"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        >
          <div className="bg-white p-6 rounded-lg w-1/3 relative">
            <button onClick={closeAddModal} className="absolute top-2 right-3 text-xl">
              &times;
            </button>
            <AddMember />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 flex justify-center items-center z-40"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        >
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3 relative">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p>
              Are you sure you want to delete <strong>{selectedMember?.name}</strong>?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedMember && (
        <div
          className="fixed inset-0 flex justify-center items-center z-40"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        >
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3 relative">
            <h3 className="text-lg font-semibold mb-4">Edit Member</h3>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                name="name"
                value={selectedMember.name}
                onChange={handleEditChange}
                placeholder="Name"
                className="border px-3 py-2 rounded"
              />
              <input
                type="text"
                name="membership_number"
                value={selectedMember.membership_number}
                onChange={handleEditChange}
                placeholder="Membership Number"
                className="border px-3 py-2 rounded"
              />
              <input
                type="text"
                name="national_id"
                value={selectedMember.national_id}
                onChange={handleEditChange}
                placeholder="National ID"
                className="border px-3 py-2 rounded"
              />
              <input
                type="text"
                name="phone"
                value={selectedMember.phone}
                onChange={handleEditChange}
                placeholder="Phone"
                className="border px-3 py-2 rounded"
              />
              <input
                type="text"
                name="club_name"
                value={selectedMember.club_name}
                onChange={handleEditChange}
                placeholder="Club Name"
                className="border px-3 py-2 rounded"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-gray-300 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
