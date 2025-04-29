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
import { IoTicketOutline } from "react-icons/io5";

import AddTicket from './AddTicket';
const Tickets = () => {
  const dispatch = useDispatch();
  const { tickets } = useSelector((state) => state.tickets);
  console.log('Tickets:', tickets); // Debugging line
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMarkAsUsedModal, setShowMarkAsUsedModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [filterClub, setFilterClub] = useState('');
const [filterTicketType, setFilterTicketType] = useState('');
const [filterBuyerName, setFilterBuyerName] = useState('');
const [filterUsedStatus, setFilterUsedStatus] = useState(''); // 'used', 'unused', or ''

const filteredTickets = tickets.filter(ticket => {
  const matchesClub = filterClub === '' || ticket.club.toString() === filterClub;
  const matchesBuyer = filterBuyerName === '' || ticket.buyer_name?.toLowerCase().includes(filterBuyerName.toLowerCase());
  const matchesType = filterTicketType === '' || ticket.ticket_type === filterTicketType;
  const matchesStatus =
    filterUsedStatus === '' ||
    (filterUsedStatus === 'used' && ticket.used) ||
    (filterUsedStatus === 'unused' && !ticket.used);

  return matchesClub && matchesBuyer && matchesType && matchesStatus;
});


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
    console.log('Opening Mark as Used Modal for ticket:', ticket.id); // Debug
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
  } else if (name === "used_by") {
    setSelectedTicket({
      ...selectedTicket,
      [name]: value === "" ? "" : Number(value), // Ensure it is a number or empty string
    });
  } else {
    setSelectedTicket({
      ...selectedTicket,
      [name]: value,
    });
  }
};
  

  return (
    <div className="p-6" >
     <div className="flex justify-between items-start mb-6">
     <div className="flex items-start space-x-3">   
     <IoTicketOutline className="text-blue-600 w-9 h-9 text-2xl" />

           <h2 className="text-2xl font-bold mb-6">التذاكر</h2>
     
           </div>
     <button
    onClick={openCreateModal}
    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
  >
    <FaPlus /> 

    إضافة تذكرة جديد
  </button>   
</div>
<div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
  <input
    type="text"
    placeholder="بحث عن اسم المشتري"
    className="border p-2 rounded"
    value={filterBuyerName}
    onChange={(e) => setFilterBuyerName(e.target.value)}
  />
  <input
    type="number"
    placeholder="معرف النادي"
    className="border p-2 rounded"
    value={filterClub}
    onChange={(e) => setFilterClub(e.target.value)}
  />
  <select
    className="border p-2 rounded"
    value={filterTicketType}
    onChange={(e) => setFilterTicketType(e.target.value)}
  >
    <option value="">كل الأنواع</option>
    <option value="session">جلسة</option>
    <option value="day_pass">تصريح يومي</option>
    <option value="monthly">شهري</option>
  </select>
  <select
    className="border p-2 rounded"
    value={filterUsedStatus}
    onChange={(e) => setFilterUsedStatus(e.target.value)}
  >
    <option value="">كل الحالات</option>
    <option value="used">مستخدمة</option>
    <option value="unused">متاحة</option>
  </select>
</div>
      <table className="min-w-full bg-white shadow rounded">
  <thead>
    <tr>
    <th className="py-2 px-4 border-b text-left">النادي (المعرف)</th>
        <th className="py-2 px-4 border-b text-left">اسم النادي</th>
        <th className="py-2 px-4 border-b text-left">المشتري</th>
        <th className="py-2 px-4 border-b text-left">نوع التذكرة</th>
        <th className="py-2 px-4 border-b text-left">السعر</th>
        <th className="py-2 px-4 border-b text-left">الحالة</th>
        <th className="py-2 px-4 border-b text-center">إجراءات</th>
    </tr>
  </thead>
  <tbody>
    {filteredTickets.map((ticket) => (
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
        <td className="py-2 px-4 border-b">
  <span className={`px-2 py-1 rounded ${
    ticket.used ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
  }`}>
    {ticket.used ? 'مستخدمة' : 'متاحة'}
  </span>
</td>



        {/* Action Buttons */}
        <td className="py-2 px-4 border-b">
  <div className="flex flex-wrap justify-center items-center gap-2">
    <button
      onClick={() => openEditModal(ticket)}
      className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full"
      title="Edit"
    >
      <FaEdit size={16} />
    </button>
    <button
      onClick={() => openDeleteModal(ticket)}
      className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full"
      title="Delete"
    >
      <FaTrash size={16} />
    </button>
    {!ticket.used && (
      <button
        onClick={() => openMarkAsUsedModal(ticket)}
        className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-full"
        title="Mark as Used"
      >
        <FaCheck size={16} />
      </button>
    )}
    <button
      onClick={() => openViewModal(ticket)}
      className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full"
      title="View"
    >
      <FaEye size={16} />
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
    <h2 className="text-2xl font-bold mb-4">تعديل التذكرة</h2>
      <input
        type="text"
        name="buyer_name"
        value={selectedTicket.buyer_name}
        onChange={handleInputChange}
        placeholder="اسم المشتري"
        className="w-full border p-2 mb-4"
      />
      <input
        type="number"
        name="price"
        value={selectedTicket.price}
        onChange={handleInputChange}
        placeholder="السعر"
        className="w-full border p-2 mb-4"
      />
      {/* Handle Club as a number (Club ID) */}
      <input
  type="number"
  name="club"
  value={selectedTicket.club}
  onChange={handleInputChange}
  placeholder="معرف النادي"
  className="w-full border p-2 mb-4"
/>
      {/* Handle Ticket Type */}
      <select
        name="ticket_type"
        value={selectedTicket.ticket_type}
        onChange={handleInputChange}
        className="w-full border p-2 mb-4"
      >
       <option value="session">جلسة</option>
          <option value="day_pass">تصريح يومي</option>
          <option value="monthly">شهري</option>
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
        <label>مستخدمة</label>
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
          <h2 className="text-2xl font-bold mb-4">حذف التذكرة</h2>
          <p>هل أنت متأكد أنك تريد حذف "{selectedTicket.title}"؟</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={closeModals}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Used Modal */}
      {showMarkAsUsedModal && selectedTicket && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white p-6 rounded shadow-lg w-80">
    <h2 className="text-2xl font-bold mb-4">تحديد التذكرة كمستخدمة</h2>
      
      <div className="mb-4">
      <label htmlFor="usedBy" className="block mb-2">معرف العضو:</label>
        <input
          type="number"
          name="used_by"
          value={selectedTicket.used_by || ""}
          onChange={handleInputChange}
          placeholder="أدخل معرف العضو"
          className="w-full border p-2 rounded"
          id="usedBy"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={closeModals} className="bg-gray-300 px-4 py-2 rounded">
        إلغاء
        </button>
        <button 
          onClick={handleMarkAsUsed} 
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          تأكيد
        </button>
      </div>
    </div>
  </div>
)}

{showViewModal && selectedTicket && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white p-6 rounded shadow-lg w-96">
    <h2 className="text-2xl font-bold mb-4">تفاصيل التذكرة</h2>
        <p><strong>اسم المشتري:</strong> {selectedTicket.buyer_name}</p>
        <p><strong>السعر:</strong> ${selectedTicket.price}</p>
        <p><strong>النادي:</strong> {selectedTicket.club_name}</p>
        <p><strong>نوع التذكرة:</strong> {selectedTicket.ticket_type_display}</p>
        <p><strong>الحالة:</strong> {selectedTicket.isUsed ? 'مستخدمة' : 'متاحة'}</p>
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={closeModals}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          إغلاق
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Tickets;




