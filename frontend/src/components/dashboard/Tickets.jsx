import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTickets,
  editTicketById,
  deleteTicketById,
  markTicketAsUsed,
} from "../../redux/slices/ticketsSlice";
import { FaEdit, FaTrash, FaCheck, FaEye, FaPlus } from "react-icons/fa";
import { IoTicketOutline } from "react-icons/io5";
import AddTicket from "./AddTicket";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { MoreVertical } from "lucide-react";

const Tickets = () => {
  const dispatch = useDispatch();
  const { tickets, status, error } = useSelector((state) => state.tickets);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMarkAsUsedModal, setShowMarkAsUsedModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filters
  const [filterClub, setFilterClub] = useState("");
  const [filterTicketType, setFilterTicketType] = useState("");
  const [filterBuyerName, setFilterBuyerName] = useState("");
  const [filterUsedStatus, setFilterUsedStatus] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const itemsPerPageOptions = [5, 10, 20];
  const actionButtonsRef = useRef(null);

  // Extract unique clubs from tickets
  const clubs = Array.from(
    new Map(
      tickets.map((ticket) => [
        ticket.club,
        { id: ticket.club, name: ticket.club_name },
      ])
    ).values()
  );

  // Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    const matchesClub =
      filterClub === "" || ticket.club.toString() === filterClub;
    const matchesBuyer =
      filterBuyerName === "" ||
      ticket.buyer_name?.toLowerCase().includes(filterBuyerName.toLowerCase());
    const matchesType =
      filterTicketType === "" || ticket.ticket_type === filterTicketType;
    const matchesStatus =
      filterUsedStatus === "" ||
      (filterUsedStatus === "used" && ticket.used) ||
      (filterUsedStatus === "unused" && !ticket.used);

    return matchesClub && matchesBuyer && matchesType && matchesStatus;
  });

  // Pagination logic
  const totalItems = filteredTickets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastTicket = currentPage * itemsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - itemsPerPage;
  const currentTickets = filteredTickets.slice(
    indexOfFirstTicket,
    indexOfLastTicket
  );
  const startIndex = indexOfFirstTicket + 1;
  const endIndex = Math.min(indexOfLastTicket, totalItems);

  // Generate page numbers (limited range)
  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    const halfPages = Math.floor(maxPagesToShow / 2);
    let startPage = Math.max(1, currentPage - halfPages);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Pagination handlers
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Reset to first page when filters or itemsPerPage change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterClub, filterTicketType, filterBuyerName, filterUsedStatus, itemsPerPage]);

  // Modal handlers
  const openCreateModal = () => {
    closeAllModals();
    setShowCreateModal(true);
  };

  const openViewModal = (ticket, e) => {
    if (e) e.stopPropagation();
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
      if (
        actionButtonsRef.current &&
        actionButtonsRef.current.contains(e.target)
      ) {
        return;
      }
      if (!e.target.closest(".modal-container")) {
        closeAllModals();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
        price: Number(selectedTicket.price), // Parse price to number
        used: selectedTicket.used,
        used_by: selectedTicket.used ? Number(selectedTicket.used_by) || null : null,
      };

      dispatch(
        editTicketById({
          ticketId: selectedTicket.id,
          ticketData: updatedTicketData,
        })
      ).then(() => {
        dispatch(fetchTickets());
        closeAllModals();
      });
    }
  };

  const handleDelete = () => {
    if (selectedTicket) {
      dispatch(deleteTicketById(selectedTicket.id)).then(() => {
        dispatch(fetchTickets());
        closeAllModals();
      });
    }
  };

  const handleMarkAsUsed = () => {
    if (selectedTicket) {
      dispatch(
        markTicketAsUsed({
          ticketId: selectedTicket.id,
          used_by: Number(selectedTicket.used_by) || null,
        })
      ).then(() => {
        dispatch(fetchTickets());
        closeAllModals();
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setSelectedTicket((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "club" || name === "used_by" || name === "price"
          ? Number(value) || ""
          : value,
    }));
  };

  // Load tickets on mount
  useEffect(() => {
    dispatch(fetchTickets());
  }, [dispatch]);

  if (status === "loading")
    return <div className="flex justify-center items-center h-screen">جاري التحميل...</div>;
  if (error) return <div className="text-red-500 text-center p-4">خطأ: {error}</div>;

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
        <select
          className="border p-2 rounded"
          value={filterClub}
          onChange={(e) => setFilterClub(e.target.value)}
        >
          <option value="">كل الأندية</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
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
            <th className="py-2 px-4 border-b text-center">النادي (المعرف)</th>
            <th className="py-2 px-4 border-b text-center">اسم النادي</th>
            <th className="py-2 px-4 border-b text-center">المشتري</th>
            <th className="py-2 px-4 border-b text-center">نوع التذكرة</th>
            <th className="py-2 px-4 border-b text-center">السعر</th>
            <th className="py-2 px-4 border-b text-center">الحالة</th>
            <th className="py-2 px-4 border-b text-center">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {currentTickets.map((ticket) => (
            <tr key={ticket.id} className="hover:bg-gray-100">
              <td className="py-2 px-4 border-b text-center">{ticket.club}</td>
              <td className="py-2 px-4 border-b text-center">{ticket.club_name}</td>
              <td className="py-2 px-4 border-b text-center">{ticket.buyer_name}</td>
              <td className="py-2 px-4 border-b text-center">
                {ticket.ticket_type_display}
              </td>
              <td className="py-2 px-4 border-b text-center">${ticket.price}</td>
              <td className="py-2 px-4 border-b text-center">
                <span
                  className={`px-2 py-1 rounded ${
                    ticket.used
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {ticket.used ? "مستخدمة" : "متاحة"}
                </span>
              </td>
              <td className="py-2 px-4 border-b">
                <div
                  ref={actionButtonsRef}
                  className="flex flex-wrap justify-center items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu dir="rtl">
                    <DropdownMenuTrigger asChild>
                      <button className="bg-gray-200 text-gray-700 px-1 py-1 rounded-md hover:bg-gray-300 transition-colors">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={(e) => openViewModal(ticket, e)}
                        className="cursor-pointer text-green-600 hover:bg-yellow-50"
                      >
                        بيانات
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => openEditModal(ticket, e)}
                        className="cursor-pointer text-yellow-600 hover:bg-yellow-50"
                      >
                        تعديل
                      </DropdownMenuItem>
                      {!ticket.used && (
                        <DropdownMenuItem
                          onClick={(e) => openMarkAsUsedModal(ticket, e)}
                          className="cursor-pointer text-green-600 hover:bg-yellow-50"
                        >
                          تحديد كمستخدمة
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={(e) => openDeleteModal(ticket, e)}
                        className="cursor-pointer text-red-600 hover:bg-red-50"
                      >
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {totalPages > 0 && (
        <div className="flex flex-col items-center mt-6 space-y-4">
          <div className="flex justify-center items-center space-x-2 space-x-reverse">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-md ${
                currentPage === 1
                  ? "bg-gray-200 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
              aria-label="الصفحة السابقة"
            >
              السابق
            </button>

            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 rounded-md ${
                  currentPage === page
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
                aria-label={`الصفحة ${page}`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-md ${
                currentPage === totalPages
                  ? "bg-gray-200 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
              aria-label="الصفحة التالية"
            >
              التالي
            </button>
          </div>

          <div className="flex items-center justify-center gap-4">
            <span>
              عرض {startIndex}–{endIndex} من {totalItems} تذكرة
            </span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border p-2 rounded"
              aria-label="عدد التذاكر لكل صفحة"
            >
              {itemsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option} لكل صفحة
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-xl font-semibold">إضافة تذكرة جديدة</h2>
              <button
                onClick={closeAllModals}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <AddTicket onClose={closeAllModals} clubs={clubs} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
     {showEditModal && selectedTicket && (
  <div 
    className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-40"
    onClick={closeAllModals}
  >
    <div 
      className="bg-white p-6 rounded shadow-lg w-96"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-2xl font-bold mb-4">تعديل التذكرة</h2>
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          النادي
        </label>
        <select
          name="club"
          value={selectedTicket.club}
          onChange={(e) => {
            e.stopPropagation();
            handleInputChange(e);
          }}
          className="w-full border p-2 rounded"
          required
        >
          <option value="">اختر النادي</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>
      {/* rest of your modal content */}
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
              <label htmlFor="usedBy" className="block mb-2">
                معرف العضو:
              </label>
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
            <p>
              <strong>اسم المشتري:</strong> {selectedTicket.buyer_name}
            </p>
            <p>
              <strong>السعر:</strong> ${selectedTicket.price}
            </p>
            <p>
              <strong>النادي:</strong> {selectedTicket.club_name}
            </p>
            <p>
              <strong>نوع التذكرة:</strong> {selectedTicket.ticket_type_display}
            </p>
            <p>
              <strong>الحالة:</strong>{" "}
              {selectedTicket.used ? "مستخدمة" : "متاحة"}
            </p>
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