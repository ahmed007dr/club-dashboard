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
  const [error, setError] = useState(null); // State to handle errors
  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => setIsAddModalOpen(false);
  const [searchResult,SetSearchResult ]=useState([])
  
  
  const members = useSelector((state) => state.member.items).results; ;
  const [filteredData, setFilteredData] = useState(members);
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedData= await dispatch(fetchUsers()).unwrap(); 
        SetSearchResult(fetchedData.results)
        setData(fetchedData.results);
        // setFilteredData(data);
      } catch (error) {
        setError("Failed to fetch members. Please try again later."+error.message);
      }
    };

    fetchData();
  }, [filteredData]);


  const handleSearch = async (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
  
    if (query.trim() === "") {
      console.log(query)
      // setFilteredData(members);
      SetSearchResult(data)
      return;
    }
    try {
      const result = await dispatch(searchMember(query)).unwrap();
      console.log("Search result:", result);
      SetSearchResult(result)
    } catch (error) {
      setError("Failed to search members. Please try again later. " + error);
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
      // Dispatch the delete action
      await dispatch(deleteMember(selectedMember.id)).unwrap();
  
      // Update the local states after successful deletion
      const updatedData = data.filter((m) => m.id !== selectedMember.id);
      setData(updatedData);
      setFilteredData(updatedData);
  
      setIsDeleteModalOpen(false);
    } catch (error) {
      setError("Failed to delete member. Please try again later." + error.message);
    }
  };

  const handleEditClick = (member) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
    // 
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
    setFilteredData(updatedData);
    setIsEditModalOpen(false);
  };

  return (
    <div className="p-4 overflow-x-auto">
      <div className="flex items-start space-x-3">
      <RiGroupLine className=" text-2xl" />
        {/* <RiGroupLine className="btn-yellow text-2xl" /> */}
        <h2 className="text-2xl font-semibold mb-4">Members</h2>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearch}
        placeholder="Search by name, membership number, or national ID"
        className="border p-2 rounded-md mb-4 w-full"
      />
      <div className="flex justify-end mb-4">
      
      
      <button onClick={openAddModal} className="flex justify-end text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
      <IoAddOutline className="flex inline-block text-xl" /> 
      Add Member
      </button>
      </div>

      <table className="min-w-full border border-gray-200">
        <thead className="text-left">
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
          {Array.isArray(searchResult) && searchResult.map((member, index) => (
            <tr key={member.id}>
              <td className="p-3 border-b">{index + 1}</td>
              <td className="p-3 border-b">
                <Link to={`/member/${member.id}`}>
                  <img
                    src={member.photo? member.photo : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU-rxXTrx4QdTdwIpw938VLL8EuJiVhCelkQ&s"}
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

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-40 bg-[rgba(0,0,0,0.2)] dark:bg-[rgba(255, 255, 255, 0.2)]">
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
