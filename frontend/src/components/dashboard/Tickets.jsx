import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTickets,
  editTicketById,
  deleteTicketById,
  markTicketAsUsed,
  addTicket,
} from "../../redux/slices/ticketsSlice";
import { FaPlus } from "react-icons/fa";
import { IoTicketOutline } from "react-icons/io5";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { MoreVertical } from "lucide-react";
import BASE_URL from "@/config/api";

const Tickets = () => {
  const dispatch = useDispatch();
  const { tickets, status, error } = useSelector((state) => state.tickets);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMarkAsUsedModal, setShowMarkAsUsedModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userClub, setUserClub] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [formError, setFormError] = useState(null);

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
    fetch(`${BASE_URL}/accounts/api/profile/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const club = { id: data.club.id, name: data.club.name };
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
    setSelectedTicket({
      ...ticket,
      price: ticket.price || "",
      used_by: ticket.used_by || "",
    });
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
    setSelectedTicket({ ...ticket, used_by: ticket.used_by || "" });
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
      )
        .unwrap()
        .then(() => {
          dispatch(fetchTickets());
          closeAllModals();
        })
        .catch((err) => {
          console.error("Failed to edit ticket:", err);
          setFormError("فشل في تعديل التذكرة: " + (err.message || "خطأ غير معروف"));
        });
    }
  };

  const handleDelete = () => {
    if (selectedTicket) {
      dispatch(deleteTicketById(selectedTicket.id))
        .unwrap()
        .then(() => {
          dispatch(fetchTickets());
          closeAllModals();
        })
        .catch((err) => {
          console.error("Failed to delete ticket:", err);
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
      )
        .unwrap()
        .then(() => {
          dispatch(fetchTickets());
          closeAllModals();
        })
        .catch((err) => {
          console.error("Failed to mark ticket as used:", err);
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
    return (
      <div className="flex justify-center items-center h-screen text-sm sm:text-base">
        جاري التحميل...
      </div>
    );
  if (error)
    return (
      <div className="text-red-500 text-center p-4 text-sm sm:text-base">
        خطأ: {error}
      </div>
    );

  return (
    <div className="container mx-auto p-4 sm:p-6" dir="rtl">
      {/* Header and Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3 space-x-reverse">
          <IoTicketOutline className="text-blue-600 w-6 h-6 sm:w-8 sm:h-8" />
          <h2 className="text-xl sm:text-2xl font-bold">التذاكر</h2>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm sm:text-base transition"
          disabled={loadingProfile || !userClub}
        >
          <FaPlus className="w-4 h-4" />
          إضافة تذكرة جديدة
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">النادي</label>
          <select
            className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-200"
            value={filterClub}
            onChange={(e) => setFilterClub(e.target.value)}
            disabled
          >
            {userClub ? (
              <option value={userClub.id}>{userClub.name}</option>
            ) : (
              <option value="">جاري التحميل...</option>
            )}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">اسم المشتري</label>
          <input
            type="text"
            placeholder="بحث عن اسم المشتري"
            className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-200"
            value={filterBuyerName}
            onChange={(e) => setFilterBuyerName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">نوع التذكرة</label>
          <select
            className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-200"
            value={filterTicketType}
            onChange={(e) => setFilterTicketType(e.target.value)}
          >
            <option value="">كل الأنواع</option>
            <option value="session">جلسة</option>
            <option value="day_pass">تصريح يومي</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">الحالة</label>
          <select
            className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-200"
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
      <div className="overflow-x-auto">
        {currentTickets.length > 0 ? (
          <>
            {/* Table for Small Screens and Above */}
            <table className="min-w-full bg-white shadow rounded hidden sm:table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 border-b text-center text-sm font-medium text-gray-700">
                    اسم النادي
                  </th>
                  <th className="py-2 px-4 border-b text-center text-sm font-medium text-gray-700">
                    المشتري
                  </th>
                  <th className="py-2 px-4 border-b text-center text-sm font-medium text-gray-700">
                    نوع التذكرة
                  </th>
                  <th className="py-2 px-4 border-b text-center text-sm font-medium text-gray-700">
                    السعر
                  </th>
                  <th className="py-2 px-4 border-b text-center text-sm font-medium text-gray-700">
                    الحالة
                  </th>
                  <th className="py-2 px-4 border-b text-center text-sm font-medium text-gray-700">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b text-center text-sm">{ticket.club_name}</td>
                    <td className="py-2 px-4 border-b text-center text-sm">{ticket.buyer_name}</td>
                    <td className="py-2 px-4 border-b text-center text-sm">
                      {ticket.ticket_type_display}
                    </td>
                    <td className="py-2 px-4 border-b text-center text-sm">{ticket.price} جنيه</td>
                    <td className="py-2 px-4 border-b text-center text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          ticket.used
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {ticket.used ? "مستخدمة" : "متاحة"}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b text-center">
                      <div ref={actionButtonsRef} className="flex justify-center items-center gap-2">
                        <DropdownMenu dir="rtl">
                          <DropdownMenuTrigger asChild>
                            <button className="bg-gray-200 text-gray-700 px-1 py-1 rounded-md hover:bg-gray-300 transition-colors">
                              <MoreVertical className="h-5 w-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={(e) => openViewModal(ticket, e)}
                              className="cursor-pointer text-green-600 hover:bg-green-50"
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
                                className="cursor-pointer text-green-600 hover:bg-green-50"
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

            {/* Card Layout for Mobile */}
            <div className="sm:hidden space-y-4">
              {currentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border rounded-md p-4 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold">{ticket.buyer_name}</span>
                    <DropdownMenu dir="rtl">
                      <DropdownMenuTrigger asChild>
                        <button className="bg-gray-200 text-gray-700 px-1 py-1 rounded-md hover:bg-gray-300 transition-colors">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={(e) => openViewModal(ticket, e)}
                          className="cursor-pointer text-green-600 hover:bg-green-50"
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
                            className="cursor-pointer text-green-600 hover:bg-green-50"
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
                  <p className="text-sm">
                    <strong>النادي:</strong> {ticket.club_name}
                  </p>
                  <p className="text-sm">
                    <strong>نوع التذكرة:</strong> {ticket.ticket_type_display}
                  </p>
                  <p className="text-sm">
                    <strong>السعر:</strong> {ticket.price} جنيه
                  </p>
                  <p className="text-sm">
                    <strong>الحالة:</strong>{" "}
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        ticket.used
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {ticket.used ? "مستخدمة" : "متاحة"}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm sm:text-base text-center p-4 text-gray-500">
            لا توجد تذاكر متاحة
          </p>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 space-y-4 sm:space-y-0">
          <div className="text-sm text-gray-700">
            عرض {startIndex}–{endIndex} من {totalItems} تذكرة
          </div>
          <div className="flex items-center gap-2">
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border rounded px-2 py-1 text-sm"
              aria-label="عدد التذاكر لكل صفحة"
            >
              {itemsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option} لكل صفحة
                </option>
              ))}
            </select>
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md text-sm ${
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
                className={`px-3 py-1 rounded-md text-sm ${
                  currentPage === page
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
                aria-label={`الصفحة ${page}`}
              >
                {page}
              </button>
            ))}
            {totalPages > getPageNumbers().length &&
              getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                <span className="px-3 py-1 text-sm">...</span>
              )}
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md text-sm ${
                currentPage === totalPages
                  ? "bg-gray-200 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
              aria-label="الصفحة التالية"
            >
              التالي
            </button>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-40 flex justify-center items-center bg-black bg-opacity-50 p-4"
          onClick={closeAllModals}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-lg sm:text-xl font-semibold">إضافة تذكرة جديدة</h2>
              <button
                onClick={closeAllModals}
                className="text-gray-500 hover:text-gray-700 text-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-6">
              {formError && (
                <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-right text-sm">
                  {formError}
                </div>
              )}
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">النادي</label>
                  <select
                    name="club"
                    value={formData.club}
                    onChange={handleFormChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                    required
                    disabled
                  >
                    {userClub ? (
                      <option value={userClub.id}>{userClub.name}</option>
                    ) : (
                      <option value="">جاري التحميل...</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">اسم المشتري</label>
                  <input
                    type="text"
                    name="buyer_name"
                    value={formData.buyer_name}
                    onChange={handleFormChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                    placeholder="أدخل اسم المشتري"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">نوع التذكرة</label>
                  <select
                    name="ticket_type"
                    value={formData.ticket_type}
                    onChange={handleFormChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                    required
                  >
                    <option value="">اختر نوع التذكرة</option>
                    <option value="session">جلسة</option>
                    <option value="day_pass">تصريح يومي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">السعر (جنيه)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                    placeholder="أدخل السعر"
                    min="0"
                    required
                  />
                </div>
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
                {formData.used && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">معرف العضو</label>
                    <input
                      type="number"
                      name="used_by"
                      value={formData.used_by}
                      onChange={handleFormChange}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                      placeholder="أدخل معرف العضو"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeAllModals}
                    className="px-4 py-2 bg-gray-300 rounded text-sm hover:bg-gray-400 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
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
          className="fixed inset-0 z-40 flex justify-center items-center bg-black bg-opacity-50 p-4"
          onClick={closeAllModals}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-lg sm:text-xl font-semibold">تعديل التذكرة</h2>
              <button
                onClick={closeAllModals}
                className="text-gray-500 hover:text-gray-700 text-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-6">
              {formError && (
                <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-right text-sm">
                  {formError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">النادي</label>
                  <select
                    name="club"
                    value={userClub?.id || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                    disabled
                  >
                    {userClub ? (
                      <option value={userClub.id}>{userClub.name}</option>
                    ) : (
                      <option value="">جاري التحميل...</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">اسم المشتري</label>
                  <input
                    type="text"
                    name="buyer_name"
                    value={selectedTicket.buyer_name || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">نوع التذكرة</label>
                  <select
                    name="ticket_type"
                    value={selectedTicket.ticket_type || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                    required
                  >
                    <option value="">اختر نوع التذكرة</option>
                    <option value="session">جلسة</option>
                    <option value="day_pass">تصريح يومي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">السعر (جنيه)</label>
                  <input
                    type="number"
                    name="price"
                    value={selectedTicket.price || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                    min="0"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    name="used"
                    checked={selectedTicket.used || false}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label className="text-sm font-medium">مستخدمة</label>
                </div>
                {selectedTicket.used && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">معرف العضو</label>
                    <input
                      type="number"
                      name="used_by"
                      value={selectedTicket.used_by || ""}
                      onChange={handleInputChange}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                      placeholder="أدخل معرف العضو"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={closeAllModals}
                    className="px-4 py-2 bg-gray-300 rounded text-sm hover:bg-gray-400 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleEditSave}
                    className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
                  >
                    حفظ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedTicket && (
        <div
          className="fixed inset-0 z-40 flex justify-center items-center bg-black bg-opacity-50 p-4"
          onClick={closeAllModals}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-sm modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-lg sm:text-xl font-semibold">حذف التذكرة</h2>
              <button
                onClick={closeAllModals}
                className="text-gray-500 hover:text-gray-700 text-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <p className="text-sm sm:text-base">
                هل أنت متأكد أنك تريد حذف تذكرة "{selectedTicket.buyer_name}"؟
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={closeAllModals}
                  className="px-4 py-2 bg-gray-300 rounded text-sm hover:bg-gray-400 transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Used Modal */}
      {showMarkAsUsedModal  && selectedTicket && (
        <div
          className="fixed inset-0 z-40 flex justify-center items-center bg-black bg-opacity-50 p-4"
          onClick={closeAllModals}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-sm modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-lg sm:text-xl font-semibold">تحديد التذكرة كمستخدمة</h2>
              <button
                onClick={closeAllModals}
                className="text-gray-500 hover:text-gray-700 text-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="mb-4">
                <label htmlFor="usedBy" className="block text-sm font-medium mb-1 text-right">
                  معرف العضو
                </label>
                <input
                  type="number"
                  name="used_by"
                  value={selectedTicket.used_by || ""}
                  onChange={handleInputChange}
                  placeholder="أدخل معرف العضو"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                  id="usedBy"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={closeAllModals}
                  className="px-4 py-2 bg-gray-300 rounded text-sm hover:bg-gray-400 transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleMarkAsUsed}
                  className="px-4 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition"
                >
                  تأكيد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedTicket && (
        <div
          className="fixed inset-0 z-40 flex justify-center items-center bg-black bg-opacity-50 p-4"
          onClick={closeAllModals}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-lg sm:text-xl font-semibold">تفاصيل التذكرة</h2>
              <button
                onClick={closeAllModals}
                className="text-gray-500 hover:text-gray-700 text-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <p className="text-sm sm:text-base mb-2">
                <strong>اسم المشتري:</strong> {selectedTicket.buyer_name}
              </p>
              <p className="text-sm sm:text-base mb-2">
                <strong>السعر:</strong> {selectedTicket.price} جنيه
              </p>
              <p className="text-sm sm:text-base mb-2">
                <strong>النادي:</strong> {selectedTicket.club_name}
              </p>
              <p className="text-sm sm:text-base mb-2">
                <strong>نوع التذكرة:</strong> {selectedTicket.ticket_type_display}
              </p>
              <p className="text-sm sm:text-base mb-2">
                <strong>الحالة:</strong>{" "}
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    selectedTicket.used
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {selectedTicket.used ? "مستخدمة" : "متاحة"}
                </span>
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={closeAllModals}
                  className="px-4 py-2 bg-gray-300 rounded text-sm hover:bg-gray-400 transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;