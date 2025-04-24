import React, { useState } from "react";
import { CiEdit } from 'react-icons/ci';

const fakeClubs = [
  {
    id: 1,
    name: "Sports Club A",
    location: "New York, USA",
    logo: "https://via.placeholder.com/150?text=Sports+Club+A",
    createdAt: "2023-05-10T14:32:00Z",
  },
  {
    id: 2,
    name: "Fitness Club B",
    location: "Los Angeles, USA",
    logo: "https://via.placeholder.com/150?text=Fitness+Club+B",
    createdAt: "2022-11-15T08:20:00Z",
  },
  {
    id: 3,
    name: "Elite Sports Club",
    location: "London, UK",
    logo: "https://via.placeholder.com/150?text=Elite+Sports+Club",
    createdAt: "2021-09-01T16:45:00Z",
  },
  {
    id: 4,
    name: "Champions Club",
    location: "Paris, France",
    logo: "https://via.placeholder.com/150?text=Champions+Club",
    createdAt: "2023-02-25T10:10:00Z",
  },
  {
    id: 5,
    name: "ProFit Club",
    location: "Berlin, Germany",
    logo: "https://via.placeholder.com/150?text=ProFit+Club",
    createdAt: "2022-06-05T12:00:00Z",
  },
];

const Club = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    logo: "",
    createdAt: "",
  });

  // Handle opening the modal and setting selected club
  const openModal = (club) => {
    setSelectedClub(club);
    setFormData({
      name: club.name,
      location: club.location,
      logo: club.logo,
      createdAt: club.createdAt,
    });
    setModalOpen(true);
  };

  // Handle closing the modal
  const closeModal = () => {
    setModalOpen(false);
    setSelectedClub(null);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Update club details here, you can send data to the server
    console.log("Updated Club:", formData);
    // Close modal after submission
    closeModal();
  };

  return (
    <div className="p-4 overflow-x-auto">
      <h2 className="text-2xl font-bold text-center mb-4">Clubs List</h2>
      <table className="min-w-full border border-gray-200">
        <thead className=" text-left">
          <tr>
            <th className="p-3 border-b">#</th>
            <th className="p-3 border-b">Logo</th>
            <th className="p-3 border-b">Name</th>
            <th className="p-3 border-b">Location</th>
            <th className="p-3 border-b">Created At</th>
            <th className="p-3 border-b">Action</th>
          </tr>
        </thead>
        <tbody>
          {fakeClubs.map((club, index) => (
            <tr key={club.id} className="hover:bg-gray-50">
              <td className="p-3 border-b">{index + 1}</td>
              <td className="p-3 border-b">
                <img
                  src={club.logo}
                  alt={club.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              </td>
              <td className="p-3 border-b">{club.name}</td>
              <td className="p-3 border-b">{club.location}</td>
              <td className="p-3 border-b">
                {new Date(club.createdAt).toLocaleDateString()}
              </td>
              <td className="p-3 border-b">
                <button
                  onClick={() => openModal(club)}
                  className="btn-green"
                >
                  <CiEdit />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for editing club */}
      {modalOpen && (
        <div className="fixed inset-0 z-40 flex justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="bg-white p-6 rounded shadow-lg w-1/2">
            <h3 className="text-xl font-bold mb-4">Edit Club</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Club Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="logo" className="block text-sm font-medium text-gray-700">
                  Logo URL
                </label>
                <input
                  type="text"
                  id="logo"
                  name="logo"
                  value={formData.logo}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="createdAt" className="block text-sm font-medium text-gray-700">
                  Created At
                </label>
                <input
                  type="datetime-local"
                  id="createdAt"
                  name="createdAt"
                  value={formData.createdAt}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="mr-2 bg-gray-300 text-black p-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white p-2 rounded"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Club;
