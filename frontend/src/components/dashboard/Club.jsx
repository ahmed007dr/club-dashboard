import React, { useEffect, useState } from "react";
import { CiEdit } from 'react-icons/ci';
import { HiOutlineDocumentReport } from 'react-icons/hi';
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../ui/button";
import { editClub, fetchClubs } from "@/redux/slices/clubSlice";

const Club = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    logo: "",
    createdAt: "",
  });

  const [clubs, setClubs] = useState([]); // Initialize clubs state
  const isLoading = useSelector((state) => state.club.isLoading);
  const error = useSelector((state) => state.club.error);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dispatch(fetchClubs()).unwrap();
        setClubs(res); // Set the fetched clubs to state
      } catch (error) {
        console.error("Error fetching Club:", error);
      }
    };

    fetchData();
  }, [dispatch]);

  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
   

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleEditClick = (club) => {
    setSelectedClub(club);
    setFormData({
      name: club.name,
      location: club.location,
      logo: club.logo,
      createdAt: formatDateForInput(club.createdAt),
    });
    setModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditSubmit = () => {
    const updatedClubs = clubs.map((c) =>
      c.id === selectedClub.id ? { ...selectedClub, ...formData } : c
    );

    dispatch(editClub({ id: selectedClub.id, updatedClub: formData }));

    setClubs(updatedClubs); // Update the local state with the edited club
    setModalOpen(false); // Close the modal
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedClub(null);
  };

  if (isLoading) {
    return <p className="text-center">Loading...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-center">Error: {error}</p>;
  }

  return (
    <div className="p-4 overflow-x-auto" dir="rtl">
      <div className="flex items-start space-x-3">
        <HiOutlineDocumentReport className="btn-forest text-2xl" />
        <h2 className="text-2xl font-semibold mb-4">Clubs</h2>
      </div>
      <table className="min-w-full border border-gray-200">
      <thead className="text-left">
    <tr>
      <th className="p-3 border-b">#</th>
      <th className="p-3 border-b">الشعار</th>
      <th className="p-3 border-b">الاسم</th>
      <th className="p-3 border-b">الموقع</th>
      <th className="p-3 border-b">تاريخ الإنشاء</th>
      <th className="p-3 border-b">الإجراء</th>
    </tr>
  </thead>
        <tbody>
          {clubs.map((club, index) => (
            <tr key={club.id} className="">
              <td className="p-3 border-b">{index + 1}</td>
              <td className="p-3 border-b">
                <img
                  src={club.logo? club.logo : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU-rxXTrx4QdTdwIpw938VLL8EuJiVhCelkQ&s"}
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
                <Button onClick={() => handleEditClick(club)} className="bg-light text-green-700 text-2xl">
                  <CiEdit />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for editing club */}
      {modalOpen && (
        <div className="fixed inset-0 z-40 flex justify-center items-center bg-[rgba(0,0,0,0.2)] bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold mb-4">Edit Club</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEditSubmit();
              }}
            >
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
                  required
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
                  required
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
                  value={formData.logo? formData.logo : ""}
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
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
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