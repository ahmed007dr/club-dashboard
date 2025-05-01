import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchTickets,
  editTicketById,
  deleteTicketById,
  markTicketAsUsed
} from '../../redux/slices/ticketsSlice';
import { FaEdit, FaTrash, FaCheck, FaEye, FaPlus } from 'react-icons/fa';
import { IoTicketOutline } from 'react-icons/io5';
import AddTicket from './AddTicket';



const Tickets = () => {
  const dispatch = useDispatch();
  const { tickets } = useSelector((state) => state.tickets);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMarkAsUsedModal, setShowMarkAsUsedModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filters
  const [filterClub, setFilterClub] = useState('');
  const [filterTicketType, setFilterTicketType] = useState('');
  const [filterBuyerName, setFilterBuyerName] = useState('');
  const [filterUsedStatus, setFilterUsedStatus] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Number of tickets per page

  const actionButtonsRef = useRef(null);

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesClub = filterClub === '' || ticket.club.toString() === filterClub;
    const matchesBuyer = filterBuyerName === '' || 
      ticket.buyer_name?.toLowerCase().includes(filterBuyerName.toLowerCase());
    const matchesType = filterTicketType === '' || ticket.ticket_type === filterTicketType;
    const matchesStatus =
      filterUsedStatus === '' ||
      (filterUsedStatus === 'used' && ticket.used) ||
      (filterUsedStatus === 'unused' && !ticket.used);

    return matchesClub && matchesBuyer && matchesType && matchesStatus;
  });

  // Calculate paginated tickets
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const indexOfLastTicket = currentPage * itemsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - itemsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirstTicket, indexOfLastTicket);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterClub, filterTicketType, filterBuyerName, filterUsedStatus]);

  // Modal handlers
  const openCreateModal = () => {
    closeAllModals();
    setShowCreateModal(true);
  };

  const openViewModal = (ticket) => {
    closeAllModals();
    setSelectedTicket(ticket);
    setShowViewModal(true);
  };

  const openEditModal = (ticket, e) => {
    if (e) e.stopPropagation();
    closeAllModals();
    setSelectedTicket(ticket);
    setShowEditModal(true);
  };

  const openDeleteModal = (ticket, e) => {
    if (e) e.stopPropagation();
    closeAllModals();
    setSelectedTicket(ticket);
    setShowDeleteModal(true);
  };

  const openMarkAsUsedModal = (ticket, e) => {
    if (e) e.stopPropagation();
    closeAllModals();
    setSelectedTicket(ticket);
    setShowMarkAsUsedModal(true);
  };

  const closeAllModals = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowMarkAsUsedModal(false);
    setShowViewModal(false);
    setShowCreateModal(false);
    setSelectedTicket(null);
  };

  // Handle clicks outside modals
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionButtonsRef.current && actionButtonsRef.current.contains(e.target)) {
        return;
      }
      if (!e.target.closest('.modal-container')) {
        closeAllModals();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Data handlers
  const handleEditSave = () => {
    if (selectedTicket) {
      const clubId = Array.isArray(selectedTicket.club) 
        ? selectedTicket.club[0] 
        : selectedTicket.club;
      
      const updatedTicketData = {
        club: Number(clubId),
        buyer_name: selectedTicket.buyer_name,
        ticket_type: selectedTicket.ticket_type,
        price: selectedTicket.price,
        used: selectedTicket.used,
        used_by: selectedTicket.used ? selectedTicket.used_by : null,
      };
      
      dispatch(editTicketById({ 
        ticketId: selectedTicket.id, 
        ticketData: updatedTicketData 
      })).then(() => {
        dispatch(fetchTickets());
        closeAllModals();
      });
    }
  };

  const handleDelete = () => {
    if (selectedTicket) {
      dispatch(deleteTicketById(selectedTicket.id))
        .then(() => {
          dispatch(fetchTickets());
          closeAllModals();
        });
    }
  };

  const handleMarkAsUsed = () => {
    if (selectedTicket) {
      dispatch(markTicketAsUsed({
        ticketId: selectedTicket.id,
        used_by: selectedTicket.used_by || null
      })).then(() => {
        dispatch(fetchTickets());
        closeAllModals();
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setSelectedTicket(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : 
              (name === "club" || name === "used_by") ? Number(value) || "" : 
              value
    }));
  };

  // Load tickets on mount
  useEffect(() => {
    dispatch(fetchTickets());
  }, [dispatch]);

  // Pagination handlers
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-6" dir="rtl">
      {/* Header and Create Button */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-start space-x-3">   
          <IoTicketOutline className="text-blue-600 w-9 h-9 text-2xl" />
          <h2 className="text-2xl font-bold mb-6">التذاكر</h2>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 btn"
        >
          <FaPlus /> 
          إضافة تذكرة جديد
        </button>   
      </div>

      {/* Filters */}
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

      {/* Tickets Table */}
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
          {currentTickets.map((ticket) => (
            <tr key={ticket.id} className="hover:bg-gray-100">
              <td className="py-2 px-4 border-b">{ticket.club}</td>
              <td className="py-2 px-4 border-b">{ticket.club_name}</td>
              <td className="py-2 px-4 border-b">{ticket.buyer_name}</td>
              <td className="py-2 px-4 border-b">{ticket.ticket_type_display}</td>
              <td className="py-2 px-4 border-b">${ticket.price}</td>
              <td className="py-2 px-4 border-b">
                <span className={`px-2 py-1 rounded ${
                  ticket.used ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}>
                  {ticket.used ? 'مستخدمة' : 'متاحة'}
                </span>
              </td>
              <td className="py-2 px-4 border-b">
                <div 
                  ref={actionButtonsRef}
                  className="flex flex-wrap justify-center items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => openEditModal(ticket, e)}
                    className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full"
                    title="Edit"
                  >
                    <FaEdit size={16} />
                  </button>
                  <button
                    onClick={(e) => openDeleteModal(ticket, e)}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full"
                    title="Delete"
                  >
                    <FaTrash size={16} />
                  </button>
                  {!ticket.used && (
                    <button
                      onClick={(e) => openMarkAsUsedModal(ticket, e)}
                      className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-full"
                      title="Mark as Used"
                    >
                      <FaCheck size={16} />
                    </button>
                  )}
                  <button
                    onClick={(e) => openViewModal(ticket, e)}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            السابق
          </button>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              onClick={() => goToPage(index + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            التالي
          </button>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-xl font-semibold">Create New Ticket</h2>
              <button
                onClick={closeAllModals}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <AddTicket onClose={closeAllModals} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTicket && (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-40">

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
            <input
              type="number"
              name="club"
              value={selectedTicket.club}
              onChange={handleInputChange}
              placeholder="معرف النادي"
              className="w-full border p-2 mb-4"
            />
            <select
              name="ticket_type"
              value={selectedTicket.ticket_type}
              onChange={handleInputChange}
              className="w-full border p-2 mb-4"
            >
              <option value="session">جلسة</option>
              <option value="day_pass">تصريح يومي</option>
              <option value="monthly">شهري</option>
            </select>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                name="used"
                checked={selectedTicket.used}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label>مستخدمة</label>
            </div>
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
                onClick={closeAllModals}
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-40">
          <div className="bg-white p-6 rounded shadow-lg w-80">
            <h2 className="text-2xl font-bold mb-4">حذف التذكرة</h2>
            <p>هل أنت متأكد أنك تريد حذف "{selectedTicket.buyer_name}"؟</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={closeAllModals}
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-40">
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
              <button 
                onClick={closeAllModals} 
                className="bg-gray-300 px-4 py-2 rounded"
              >
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

      {/* View Modal */}
      {showViewModal && selectedTicket && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-40">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-2xl font-bold mb-4">تفاصيل التذكرة</h2>
            <p><strong>اسم المشتري:</strong> {selectedTicket.buyer_name}</p>
            <p><strong>السعر:</strong> ${selectedTicket.price}</p>
            <p><strong>النادي:</strong> {selectedTicket.club_name}</p>
            <p><strong>نوع التذكرة:</strong> {selectedTicket.ticket_type_display}</p>
            <p><strong>الحالة:</strong> {selectedTicket.used ? 'مستخدمة' : 'متاحة'}</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={closeAllModals}
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




