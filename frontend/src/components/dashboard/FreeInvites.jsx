import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFreeInvites,
  addInvite,
  fetchInviteById,
  editInviteById,
  deleteInviteById,
  markInviteAsUsed,
} from "../../redux/slices/invitesSlice";
import { RiVipCrown2Line } from "react-icons/ri";
import BASE_URL from '../../config/api';
import { toast } from 'react-hot-toast';

import usePermission from "@/hooks/usePermission";

import { useDebounce } from "use-debounce";





const InviteList = () => {
  const dispatch = useDispatch();
  const {
    invites: {
      results: invites = [],
      count: totalItems = 0,
      next: nextPageUrl,
      previous: prevPageUrl,
    },
    loading,
    error,
  } = useSelector((state) => state.invites);

  // State definitions
  const [userClub, setUserClub] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [formError, setFormError] = useState(null);

  // Permission checks
  const canViewInvites = usePermission("view_freeinvite");
  const canAddInvites = usePermission("add_freeinvite");
  const canDeleteInvites = usePermission("delete_freeinvite");
  const canEditInvites = usePermission("change_freeinvite");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMarkUsedModal, setShowMarkUsedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const actionButtonsRef = useRef(null);

  // Form states
  const [formData, setFormData] = useState({
    club: "",
    guest_name: "",
    phone: "",
    date: "",
    status: "pending",
    invited_by: "",
  });

  const [markUsedData, setMarkUsedData] = useState({ used_by: "" });

  // Filters state
  const [filterGuestName, setFilterGuestName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [debouncedGuestName] = useDebounce(filterGuestName, 500);
  const [debouncedDate] = useDebounce(filterDate, 500);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const itemsPerPageOptions = [10, 20, 50];

  // Fetch user profile to get club details
  useEffect(() => {
    if (!canViewInvites) {
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    fetch(`${BASE_URL}accounts/api/profile/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data && data.club && data.club.id) {
          const club = { id: data.club.id, name: data.club.name };
          setUserClub(club);
          setFormData((prev) => ({ ...prev, club: club.id.toString() }));
        }
        setLoadingProfile(false);
      })
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
        setLoadingProfile(false);
      });
  }, [canViewInvites]);

  // Fetch invites with backend pagination and filters
  useEffect(() => {
    if (userClub && canViewInvites) {
      dispatch(
        fetchFreeInvites({
          page: currentPage,
          page_size: itemsPerPage,
          club: userClub.id,
          guest_name: debouncedGuestName || undefined,
          status: filterStatus || undefined,
          date: debouncedDate || undefined,
        })
      );
    }
  }, [dispatch, userClub, canViewInvites, currentPage, itemsPerPage, debouncedGuestName, filterStatus, debouncedDate]);

  // Reset currentPage when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedGuestName, filterStatus, debouncedDate]);

  // Modal handlers
  const openAddModal = () => {
    closeAllModals();
    setFormData({
      club: userClub?.id?.toString() || "",
      guest_name: "",
      phone: "",
      date: "",
      status: "pending",
      invited_by: "",
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const openEditModal = (invite, e) => {
    if (e) e.stopPropagation();
    closeAllModals();
    setSelectedInvite(invite);
    setFormData({
      club: userClub?.id?.toString() || invite.club.toString(),
      guest_name: invite.guest_name || "",
      phone: invite.phone || "",
      date: invite.date || "",
      status: invite.status || "pending",
      invited_by: invite.invited_by_details?.membership_number || "",
    });
    setShowEditModal(true);
  };

  const openMarkUsedModal = (invite, e) => {
    if (e) e.stopPropagation();
    closeAllModals();
    setSelectedInvite(invite);
    setMarkUsedData({ used_by: "" });
    setShowMarkUsedModal(true);
  };

  const openDeleteModal = (invite, e) => {
    if (e) e.stopPropagation();
    closeAllModals();
    setSelectedInvite(invite);
    setShowDeleteModal(true);
  };

  const closeAllModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowMarkUsedModal(false);
    setShowDeleteModal(false);
    setSelectedInvite(null);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError(null);
  };

  const handleMarkUsedChange = (e) => {
    const { name, value } = e.target;
    setMarkUsedData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.club) errors.club = "اختيار النادي مطلوب";
    if (!formData.guest_name) errors.guest_name = "اسم الضيف مطلوب";
    if (!formData.phone) errors.phone = "رقم الهاتف مطلوب";
    if (!formData.date) errors.date = "التاريخ مطلوب";
    return errors;
  };

  const handleAddInvite = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormError(Object.values(errors)[0]);
      return;
    }

    try {
      await dispatch(
        addInvite({
          ...formData,
          club: Number(formData.club),
          invited_by: formData.invited_by || null,
        })
      ).unwrap();
      toast.success("تمت إضافة الدعوة بنجاح");
      closeAllModals();
      dispatch(
        fetchFreeInvites({
          page: 1,
          page_size: itemsPerPage,
          club: userClub?.id,
          guest_name: debouncedGuestName || undefined,
          status: filterStatus || undefined,
          date: debouncedDate || undefined,
        })
      );
    } catch (error) {
      console.error("Failed to add invite:", error);
      setFormError("فشل في إضافة الدعوة: " + (error.message || "خطأ غير معروف"));
      toast.error("فشل في إضافة الدعوة");
    }
  };

  const handleEditSave = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormError(Object.values(errors)[0]);
      return;
    }

    try {
      await dispatch(
        editInviteById({
          inviteId: selectedInvite.id,
          inviteData: {
            ...formData,
            club: Number(formData.club),
            invited_by: formData.invited_by || null,
          },
        })
      ).unwrap();
      toast.success("تم تعديل الدعوة بنجاح");
      closeAllModals();
      dispatch(
        fetchFreeInvites({
          page: currentPage,
          page_size: itemsPerPage,
          club: userClub?.id,
          guest_name: debouncedGuestName || undefined,
          status: filterStatus || undefined,
          date: debouncedDate || undefined,
        })
      );
    } catch (error) {
      console.error("Failed to edit invite:", error);
      setFormError("فشل في تعديل الدعوة: " + (error.message || "خطأ غير معروف"));
      toast.error("فشل في تعديل الدعوة");
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteInviteById(selectedInvite.id)).unwrap();
      toast.success("تم حذف الدعوة بنجاح");
      closeAllModals();
      dispatch(
        fetchFreeInvites({
          page: currentPage,
          page_size: itemsPerPage,
          club: userClub?.id,
          guest_name: debouncedGuestName || undefined,
          status: filterStatus || undefined,
          date: debouncedDate || undefined,
        })
      );
    } catch (error) {
      console.error("Failed to delete invite:", error);
      toast.error("فشل في حذف الدعوة");
    }
  };

  const handleMarkAsUsed = async () => {
    if (!markUsedData.used_by) {
      setFormError("معرف العضو مطلوب");
      return;
    }

    try {
      await dispatch(
        markInviteAsUsed({
          inviteId: selectedInvite.id,
          used_by: Number(markUsedData.used_by),
        })
      ).unwrap();
      toast.success("تم تحديد الدعوة كمستخدمة");
      closeAllModals();
      dispatch(
        fetchFreeInvites({
          page: currentPage,
          page_size: itemsPerPage,
          club: userClub?.id,
          guest_name: debouncedGuestName || undefined,
          status: filterStatus || undefined,
          date: debouncedDate || undefined,
        })
      );
    } catch (error) {
      console.error("Failed to mark invite as used:", error);
      setFormError("فشل في تحديد الدعوة كمستخدمة");
      toast.error("فشل في تحديد الدعوة كمستخدمة");
    }
  };

  const getStatusBadge = (status) => {
    let bgColor = "bg-gray-500";
    let textColor = "text-gray-600";
    let statusText = status;
    if (status === "used") {
      bgColor = "bg-red-100";
      textColor = "text-red-600";
      statusText = "مستخدمة";
    }
    if (status === "pending") {
      bgColor = "bg-green-100";
      textColor = "text-green-600";
      statusText = "متاحة";
    }
    if (status === "cancelled") {
      bgColor = "bg-gray-100";
      textColor = "text-gray-600";
      statusText = "ملغاة";
    }

    return (
      <span className={`${bgColor} ${textColor} text-xs px-2 py-1 rounded-full`}>
        {statusText}
      </span>
    );
  };

  // Calculate total pages based on backend count
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

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
    if (pageNumber >= 1 && pageNumber <= totalPages && totalItems > 0) {
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

  if (loading || loadingProfile) {
    return (
      <div className="flex justify-center items-center h-screen text-sm sm:text-base">
        جاري التحميل...
      </div>
    );
  }

  if (!canViewInvites) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <RiForbidLine className="text-red-600 text-2xl" />
        </div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">لا يوجد صلاحية</h2>
        <p className="text-gray-500 max-w-md">
          ليس لديك الصلاحيات اللازمة لعرض الدعوات المجانية. يرجى التواصل مع المسؤول.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6" dir="rtl">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3 space-x-reverse">
          <RiVipCrown2Line className="text-blue-600 w-6 h-6 sm:w-8 sm:h-8" />
          <h2 className="text-xl sm:text-2xl font-bold">الدعوات المجانية</h2>
        </div>
        {canAddInvites && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 w-full sm:w-auto btn bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            disabled={loadingProfile || !userClub}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            إضافة دعوة جديدة
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium">تصفية الدعوات</h3>
          <button
            onClick={() => {
              setFilterGuestName("");
              setFilterStatus("");
              setFilterDate("");
              setCurrentPage(1);
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            إعادة التصفية
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">اسم الضيف</label>
            <input
              type="text"
              placeholder="ابحث باسم الضيف"
              className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-200"
              value={filterGuestName}
              onChange={(e) => setFilterGuestName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الحالة</label>
            <select
              className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-200"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">كل الحالات</option>
              <option value="pending">متاحة</option>
              <option value="used">مستخدمة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">التاريخ</label>
            <input
              type="date"
              className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-200"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Invites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {invites.length === 0 ? (
          <p className="text-sm sm:text-base text-center p-4 text-gray-500 col-span-full">
            لا توجد دعوات تطابق المعايير في هذه الصفحة
          </p>
        ) : (
          invites.map((invite) => (
            <div
              key={invite.id}
              className="rounded-lg shadow-md overflow-hidden border border-gray-200"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold">{invite.guest_name}</h3>
                  {getStatusBadge(invite.status)}
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <strong>الهاتف:</strong> {invite.phone || "غير متوفر"}
                  </p>
                  <p>
                    <strong>التاريخ:</strong>{" "}
                    {invite.date ? new Date(invite.date).toLocaleDateString() : "غير متوفر"}
                  </p>
                  <p>
                    <strong>النادي:</strong>{" "}
                    {invite.club_details?.name || "غير متوفر"}
                  </p>
                  <p>
                    <strong>رقم العضو:</strong>{" "}
                    {invite.invited_by_details?.membership_number || "غير متوفر"}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-2 space-x-reverse">
                <div ref={actionButtonsRef}>
                  {canEditInvites && (
                    <button
                      onClick={(e) => openEditModal(invite, e)}
                      className="text-yellow-600 hover:text-yellow-800 p-2 rounded-full hover:bg-yellow-50"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={(e) => openMarkUsedModal(invite, e)}
                    disabled={invite.status === "used"}
                    className={`p-2 rounded-full ${
                      invite.status === "used"
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-green-600 hover:text-green-800 hover:bg-green-50"
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </button>
                  {canDeleteInvites && (
                    <button
                      onClick={(e) => openDeleteModal(invite, e)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      <div
        className="flex flex-col sm:flex-row justify-between items-center mt-6 space-y-4 sm:space-y-0"
        dir="rtl"
      >
        {totalItems === 0 && (
          <div className="text-sm text-gray-600">لا توجد دعوات لعرضها</div>
        )}
     {totalItems > 0 && (
  <>
    <div className="text-sm text-gray-700">
      عرض {(currentPage - 1) * itemsPerPage + 1}–
      {Math.min(currentPage * itemsPerPage, totalItems)} من {totalItems} دعوة
    </div>
    <div className="flex items-center gap-2">
      <select
        value={itemsPerPage}
        onChange={handleItemsPerPageChange}
        className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-green-200"
        aria-label="عدد الدعوات لكل صفحة"
      >
        {itemsPerPageOptions.map((option) => (
          <option key={option} value={option}>
            {option} لكل صفحة
          </option>
        ))}
      </select>
      <button
        onClick={() => handlePageChange(1)}
        disabled={currentPage === 1 || totalItems === 0}
        className={`px-3 py-1 rounded-md text-sm ${
          currentPage === 1 || totalItems === 0
            ? "bg-gray-200 cursor-not-allowed"
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
        aria-label="الصفحة الأولى"
      >
        الأول
      </button>
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1 || totalItems === 0}
        className={`px-3 py-1 rounded-md text-sm ${
          currentPage === 1 || totalItems === 0
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
          disabled={totalItems === 0}
          className={`px-3 py-1 rounded-md text-sm ${
            currentPage === page && totalItems > 0
              ? "bg-blue-500 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          } ${totalItems === 0 ? "cursor-not-allowed" : ""}`}
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
        disabled={currentPage === totalPages || totalItems === 0}
        className={`px-3 py-1 rounded-md text-sm ${
          currentPage === totalPages || totalItems === 0
            ? "bg-gray-200 cursor-not-allowed"
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
        aria-label="الصفحة التالية"
      >
        التالي
      </button>
      <button
        onClick={() => handlePageChange(totalPages)}
        disabled={currentPage === totalPages || totalItems === 0}
        className={`px-3 py-1 rounded-md text-sm ${
          currentPage === totalPages || totalItems === 0
            ? "bg-gray-200 cursor-not-allowed"
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
        aria-label="الصفحة الأخيرة"
      >
        الأخير
      </button>
    </div>
  </>
)}
      </div>

      {/* Add Invite Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-40 flex justify-center items-center bg-black bg-opacity-50 p-4"
          onClick={closeAllModals}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-lg sm:text-xl font-semibold">إضافة دعوة جديدة</h2>
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
              <form onSubmit={handleAddInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">
                    النادي
                  </label>
                  <select
                    name="club"
                    value={formData.club}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                    disabled
                    required
                  >
                    {userClub ? (
                      <option value={userClub.id}>{userClub.name}</option>
                    ) : (
                      <option value="">جاري التحميل...</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">
                    اسم الضيف
                  </label>
                  <input
                    type="text"
                    name="guest_name"
                    value={formData.guest_name}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">
                    التاريخ
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">
                    الحالة
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                    required
                  >
                    <option value="pending">متاحة</option>
                    <option value="used">مستخدمة</option>
                    <option value="cancelled">ملغاة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">
                    بدعوة من (رقم العضوية)
                  </label>
                  <input
                    type="text"
                    name="invited_by"
                    value={formData.invited_by}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                    placeholder="أدخل رقم العضوية"
                  />
                  <p className="mt-1 text-xs text-gray-500 text-right">
                    اختياري - اتركه فارغًا إذا لم يكن ذلك ممكنًا
                  </p>
                </div>
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
                    إضافة الدعوة
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invite Modal */}
      {showEditModal && selectedInvite && (
        <div
          className="fixed inset-0 z-40 flex justify-center items-center bg-black bg-opacity-50 p-4"
          onClick={closeAllModals}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-lg sm:text-xl font-semibold">تعديل الدعوة</h2>
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
                  <label className="block text-sm font-medium mb-1 text-right">
                    النادي
                  </label>
                  <select
                    name="club"
                    value={formData.club}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                    disabled
                    required
                  >
                    {userClub ? (
                      <option value={userClub.id}>{userClub.name}</option>
                    ) : (
                      <option value="">جاري التحميل...</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">
                    اسم الضيف
                  </label>
                  <input
                    type="text"
                    name="guest_name"
                    value={formData.guest_name}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">
                    التاريخ
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">
                    الحالة
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                    required
                  >
                    <option value="pending">متاحة</option>
                    <option value="used">مستخدمة</option>
                    <option value="cancelled">ملغاة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">
                    بدعوة من (رقم العضوية)
                  </label>
                  <input
                    type="text"
                    name="invited_by"
                    value={formData.invited_by}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-200 text-right"
                    placeholder="أدخل رقم العضوية"
                  />
                  <p className="mt-1 text-xs text-gray-500 text-right">
                    اختياري - اتركه فارغًا إذا لم يكن ذلك ممكنًا
                  </p>
                </div>
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

      {/* Mark as Used Modal */}
      {showMarkUsedModal && selectedInvite && (
        <div
          className="fixed inset-0 z-40 flex justify-center items-center bg-black bg-opacity-50 p-4"
          onClick={closeAllModals}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-sm modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-lg sm:text-xl font-semibold">تحديد الدعوة كمستخدمة</h2>
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
              <div className="mb-4">
                <label
                  htmlFor="used_by"
                  className="block text-sm font-medium mb-1 text-right"
                >
                  رقم العضو <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="used_by"
                  value={markUsedData.used_by}
                  onChange={handleMarkUsedChange}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring ${
                    !markUsedData.used_by ? "border-red-500" : "border-gray-300 focus:ring-green-200"
                  } text-right`}
                  placeholder="أدخل رقم العضو"
                  id="used_by"
                  required
                />
                {!markUsedData.used_by && (
                  <p className="text-red-500 text-xs mt-1 text-right">
                    هذا الحقل مطلوب
                  </p>
                )}
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
                  className={`px-4 py-2 rounded text-sm transition ${
                    !markUsedData.used_by
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                  disabled={!markUsedData.used_by}
                >
                  تأكيد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

   {/* Delete Modal */}
      {showDeleteModal && selectedInvite && (
        <div
          className="fixed inset-0 z-40 flex justify-center items-center bg-black bg-opacity-50 p-4"
          onClick={closeAllModals}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-sm modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-lg sm:text-xl font-semibold">حذف الدعوة</h2>
              <button
                onClick={closeAllModals}
                className="text-gray-500 hover:text-gray-700 text-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <p className="text-sm">
                هل أنت متأكد أنك تريد حذف دعوة "{selectedInvite.guest_name}"؟
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
    </div>
  );
};

export default InviteList;