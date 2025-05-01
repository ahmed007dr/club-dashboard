import React, { useEffect, useState } from "react";
import AddMember from "../modals/AddMember";
import { Link } from "react-router-dom";
import { CiTrash } from "react-icons/ci";
import { CiEdit } from "react-icons/ci";
import { RiGroupLine } from "react-icons/ri";
import { useSelector, useDispatch } from "react-redux";
import { deleteMember, editMember, fetchUsers, searchMember } from "../../redux/slices/memberSlice";
import { IoAddOutline } from "react-icons/io5";

const Members = () => {
  const [data, setData] = useState([{
    id: "4",
    photo: "https://i.pravatar.cc/100?img=11",
    name: "ahmed El-Zahrani",
    membership_number: "1008",
    national_id: "102030405066",
    phone: "0101234566",
    club_name: "Sports Club"
  }]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [searchResult, setSearchResult] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Configurable items per page

  const members = useSelector((state) => state.member.items).results;
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedData = await dispatch(fetchUsers()).unwrap();
        setSearchResult(fetchedData.results);
        setData(fetchedData.results);
      } catch (error) {
        setError("Failed to fetch members. Please try again later: " + error.message);
      }
    };

    fetchData();
  }, []);

  const handleSearch = async (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on search

    if (query.trim() === "") {
      setSearchResult(data);
      return;
    }
    try {
      const result = await dispatch(searchMember(query)).unwrap();
      setSearchResult(result);
    } catch (error) {
      setError("Failed to search members. Please try again later: " + error);
    }
  };

  const handleDeleteClick = (member) => {
    setSelectedMember(member);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedMember) {
      setError("No member selected for deletion.");
      return;
    }

    try {
      await dispatch(deleteMember(selectedMember.id)).unwrap();
      const updatedData = data.filter((m) => m.id !== selectedMember.id);
      setData(updatedData);
      setSearchResult(updatedData);
      setIsDeleteModalOpen(false);
      // Adjust current page if necessary
      const totalPages = Math.ceil(updatedData.length / itemsPerPage);
      if (currentPage > totalPages) {
        setCurrentPage(totalPages || 1);
      }
    } catch (error) {
      setError("Failed to delete member. Please try again later: " + error.message);
    }
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
    dispatch(editMember({ id: selectedMember.id, updatedUser: selectedMember }));
    setData(updatedData);
    setSearchResult(updatedData);
    setIsEditModalOpen(false);
  };

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => setIsAddModalOpen(false);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = searchResult.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(searchResult.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="p-4 overflow-x-auto"dir="rtl">
      <div className="flex items-start space-x-3">
        <RiGroupLine className="text-2xl" />
        <h2 className="text-2xl font-semibold mb-4">الأعضاء</h2>

      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearch}
        placeholder="ابحث بالاسم، رقم العضوية، أو الرقم القومي"

        className="border p-2 rounded-md mb-4 w-full"
      />
      <div className="flex justify-end mb-4">
      <button
  onClick={openAddModal}
  className="flex justify-end text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
>
  <IoAddOutline className="flex inline-block text-xl" />
  إضافة عضو
</button>

      </div>

      <table className="min-w-full border border-gray-200">
      <thead className="text-right">
  <tr>
    <th className="p-3 border-b">#</th>
    <th className="p-3 border-b">الصورة</th>
    <th className="p-3 border-b">الاسم</th>
    <th className="p-3 border-b">رقم العضوية</th>
    <th className="p-3 border-b">الرقم القومي</th>
    <th className="p-3 border-b">الهاتف</th>
    <th className="p-3 border-b">اسم النادي</th>
    <th className="p-3 border-b">الإجراءات</th>
  </tr>
</thead>

        <tbody>
          {Array.isArray(currentItems) && currentItems.map((member, index) => (
            <tr key={member.id}>
              <td className="p-3 border-b">{indexOfFirstItem + index + 1}</td>
              <td className="p-3 border-b">
                <Link to={`/member/${member.id}`}>
                  <img
                    src={member.photo ? member.photo : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU-rxXTrx4QdTdwIpw938VLL8EuJiVhCelkQ&s"}
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
                    className="text-green-700 text-xl"
                    title="Edit"
                  >
                    <CiEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(member)}
                    className="text-red-500 text-xl"
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

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <div>
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, searchResult.length)} of {searchResult.length} members
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => paginate(page)}
              className={`px-3 py-1 rounded ${currentPage === page ? 'bg-blue-700 text-white' : 'bg-gray-200'}`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-40 bg-[rgba(0,0,0,0.2)] dark:bg-[rgba(255, 255, 255, 0.2)]">
          <div className="bg-white p-6 rounded-lg w-1/3 relative">
            <button onClick={closeAddModal} className="absolute top-2 right-3 text-xl">
              ×
            </button>
            <AddMember />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 flex justify-center items-center z-40 bg-[rgba(0,0,0,0.2)] dark:bg-[rgba(249, 236, 236, 0.2)]"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        >
          <div className="modal relative">
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
              <button onClick={confirmDelete} className="btn">
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
          <div className="modal relative">
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
                <button onClick={handleEditSubmit} className="btn">
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
