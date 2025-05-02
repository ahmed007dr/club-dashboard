import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTickets,
  editTicketById,
  deleteTicketById,
  markTicketAsUsed,
} from "../../redux/slices/ticketsSlice";
import { addTicket } from "../../redux/slices/ticketsSlice";

import { FaPlus } from "react-icons/fa";
import { IoTicketOutline } from "react-icons/io5";
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
  const [userClub, setUserClub] = useState(null); // Store logged-in user's club
  const [loadingProfile, setLoadingProfile] = useState(true); // Profile loading state
  const [formError, setFormError] = useState(null); // Form error state

  // Filters
  const [filterClub, setFilterClub] = useState("");
  const [filterTicketType, setFilterTicketType] = useState("");
  const [filterBuyerName, setFilterBuyerName] = useState("");
  const [filterUsedStatus, setFilterUsedStatus] = useState("");

  // Add Ticket Form
  const [formData, setFormData] = useState({
    club: "",
    buyer_name: "",
    ticket_type: "",
    price: "",
    used: false,
    used_by: "",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const itemsPerPageOptions = [5, 10, 20];
  const actionButtonsRef = useRef(null);

  // Fetch user profile to get club details
  useEffect(() => {
    setLoadingProfile(true);
    fetch("http://127.0.0.1:8000/accounts/api/profile/", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const club = { id: data.club.id, name: data.club.name };
        console.log("Fetched userClub:", club); // Debug log
        setUserClub(club);
        setFilterClub(club.id.toString());
        setFormData((prev) => ({ ...prev, club: club.id.toString() }));
        setLoadingProfile(false);
      })
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
        setLoadingProfile(false);
      });
  }, []);

  // Load tickets on mount
  useEffect(() => {
    dispatch(fetchTickets());
  }, [dispatch]);

  // Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    const matchesClub =
      userClub && ticket.club.toString() === userClub.id.toString();
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
    setFormData({
      club: userClub?.id?.toString() || "",
      buyer_name: "",
      ticket_type: "",
      price: "",
      used: false,
      used_by: "",
    });
    setFormError(null);
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
    setFormError(null);
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
    if (selectedTicket && userClub) {
      const updatedTicketData = {
        club: Number(userClub.id),
        buyer_name: selectedTicket.buyer_name,
        ticket_type: selectedTicket.ticket_type,
        price: Number(selectedTicket.price),
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
          : name === "used_by" || name === "price"
          ? Number(value) || ""
          : value,
    }));
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "price" || name === "used_by"
          ? Number(value) || ""
          : value,
    }));
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!userClub) {
      setFormError("النادي غير متاح. يرجى المحاولة لاحقًا.");
      return;
    }

    const ticketData = {
      club: Number(formData.club),
      buyer_name: formData.buyer_name,
      ticket_type: formData.ticket_type,
      price: Number(formData.price),
      used: formData.used,
      used_by: formData.used ? Number(formData.used_by) || null : null,
    };

    dispatch(addTicket(ticketData))
      .unwrap()
      .then(() => {
        dispatch(fetchTickets());
        closeAllModals();
      })
      .catch((err) => {
        console.error("Failed to create ticket:", err);
        setFormError("فشل في إضافة التذكرة: " + (err.message || "خطأ غير معروف"));
      });
  };

  if (status === "loading" || loadingProfile)
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
          disabled={loadingProfile || !userClub}
        >
          <FaPlus />
          إضافة تذكرة جديد
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-gray-700 font-medium mb-2">النادي</label>
          <select
            className="border p-2 rounded w-full"
            value={filterClub}
            onChange={(e) => setFilterClub(e.target.value)}
            
          >
            {userClub ? (
              <option value={userClub.id}>{userClub.name}</option>
            ) : (
              <option value="">جاري التحميل...</option>
            )}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">اسم المشتري</label>
          <input
            type="text"
            placeholder="بحث عن اسم المشتري"
            className="border p-2 rounded w-full"
            value={filterBuyerName}
            onChange={(e) => setFilterBuyerName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">نوع التذكرة</label>
          <select
            className="border p-2 rounded w-full"
            value={filterTicketType}
            onChange={(e) => setFilterTicketType(e.target.value)}
          >
            <option value="">كل الأنواع</option>
            <option value="session">جلسة</option>
            <option value="day_pass">تصريح يومي</option>
            <option value="monthly">شهري</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">الحالة</label>
          <select
            className="border p-2 rounded w-full"
            value={filterUsedStatus}
            onChange={(e) => setFilterUsedStatus(e.target.value)}
          >
            <option value="">كل الحالات</option>
            <option value="used">مستخدمة</option>
            <option value="unused">متاحة</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <table className="min-w-full bg-white shadow rounded">
        <thead>
          <tr>
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md modal-container">
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
              {formError && (
                <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-right">
                  {formError}
                </div>
              )}
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                {/* Club */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">النادي</label>
                  <select
                    name="club"
                    value={formData.club}
                    onChange={handleFormChange}
                    className="w-full border rounded-md p-2 focus:ring focus:ring-green-500 text-right"
                    
                    required
                  >
                    {userClub ? (
                      <option value={userClub.id}>{userClub.name}</option>
                    ) : (
                      <option value="">جاري التحميل...</option>
                    )}
                  </select>
                </div>
                {/* Buyer Name */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">اسم المشتري</label>
                  <input
                    type="text"
                    name="buyer_name"
                    value={formData.buyer_name}
                    onChange={handleFormChange}
                    className="w-full border rounded-md p-2 focus:ring focus:ring-green-500 text-right"
                    placeholder="أدخل اسم المشتري"
                    required
                  />
                </div>
                {/* Ticket Type */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">نوع التذكرة</label>
                  <select
                    name="ticket_type"
                    value={formData.ticket_type}
                    onChange={handleFormChange}
                    className="w-full border rounded-md p-2 focus:ring focus:ring-green-500 text-right"
                    required
                  >
                    <option value="">اختر نوع التذكرة</option>
                    <option value="session">جلسة</option>
                    <option value="day_pass">تصريح يومي</option>
                    <option value="monthly">شهري</option>
                  </select>
                </div>
                {/* Price */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">السعر</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    className="w-full border rounded-md p-2 focus:ring focus:ring-green-500 text-right"
                    placeholder="أدخل السعر"
                    min="0"
                    required
                  />
                </div>
                {/* Used */}
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    name="used"
                    checked={formData.used}
                    onChange={handleFormChange}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label className="text-sm font-medium">مستخدمة</label>
                </div>
                {/* Used By */}
                {formData.used && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">المستخدم</label>
                    <input
                      type="number"
                      name="used_by"
                      value={formData.used_by}
                      onChange={handleFormChange}
                      className="w-full border rounded-md p-2 focus:ring focus:ring-green-500 text-right"
                      placeholder="أدخل معرف العضو"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeAllModals}
                    className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition duration-200"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition duration-200"
                    disabled={!userClub}
                  >
                    إضافة التذكرة
                  </button>
                </div>
              </form>
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
            className="bg-white p-6 rounded shadow-lg w-96 modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">تعديل التذكرة</h2>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">النادي</label>
              <select
                name="club"
                value={userClub?.id || ""}
                onChange={handleInputChange}
                className="w-full border p-2 rounded"
                disabled
              >
                {userClub ? (
                  <option value={userClub.id}>{userClub.name}</option>
                ) : (
                  <option value="">جاري التحميل...</option>
                )}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">اسم المشتري</label>
              <input
                type="text"
                name="buyer_name"
                value={selectedTicket.buyer_name || ""}
                onChange={handleInputChange}
                className="w-full border p-2 rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">نوع التذكرة</label>
              <select
                name="ticket_type"
                value={selectedTicket.ticket_type || ""}
                onChange={handleInputChange}
                className="w-full border p-2 rounded"
              >
                <option value="">اختر نوع التذكرة</option>
                <option value="session">جلسة</option>
                <option value="day_pass">تصريح يومي</option>
                <option value="monthly">شهري</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">السعر</label>
              <input
                type="number"
                name="price"
                value={selectedTicket.price || ""}
                onChange={handleInputChange}
                className="w-full border p-2 rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">مستخدم</label>
              <input
                type="checkbox"
                name="used"
                checked={selectedTicket.used || false}
                onChange={handleInputChange}
                className="mr-2"
              />
              مستخدمة
            </div>
            {selectedTicket.used && (
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">معرف العضو</label>
                <input
                  type="number"
                  name="used_by"
                  value={selectedTicket.used_by || ""}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={closeAllModals}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                إلغاء
              </button>
              <button
                onClick={handleEditSave}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedTicket && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-40">
          <div className="bg-white p-6 rounded shadow-lg w-80 modal-container">
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
          <div className="bg-white p-6 rounded shadow-lg w-80 modal-container">
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
          <div className="bg-white p-6 rounded shadow-lg w-96 modal-container">
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