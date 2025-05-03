import React, { useEffect, useState } from "react";
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


const InviteList = () => {
  const dispatch = useDispatch();
  const { invites, loading, error } = useSelector((state) => state.invites);
  const [userClub, setUserClub] = useState(null); // Logged-in user's club
  const [loadingProfile, setLoadingProfile] = useState(true); // Profile loading state

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMarkUsedModal, setShowMarkUsedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInviteId, setSelectedInviteId] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    club: "",
    guest_name: "",
    phone: "",
    date: "",
    status: "pending",
    invited_by: "",
  });

  const [markUsedData, setMarkUsedData] = useState({
    used_by: "",
  });

  const [formErrors, setFormErrors] = useState({});

  // Filters state
  const [filters, setFilters] = useState({
    status: "",
    club: "",
    guestName: "",
    date: "",
  });

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
        console.log("Fetched userClub:", club);
        setUserClub(club);
        setFilters((prev) => ({ ...prev, club: club.id.toString() }));
        setFormData((prev) => ({ ...prev, club: club.id.toString() }));
        setLoadingProfile(false);
      })
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
        setLoadingProfile(false);
      });
  }, []);


  // Fetch invites
  useEffect(() => {
    dispatch(fetchFreeInvites());
  }, [dispatch]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleMarkUsedChange = (e) => {
    const { name, value } = e.target;
    setMarkUsedData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Filter invites
  const filteredInvites = invites.filter((invite) => {
    const matchesGuest =
      filters.guestName === "" ||
      invite.guest_name.toLowerCase().includes(filters.guestName.toLowerCase());
    const matchesStatus = filters.status === "" || invite.status === filters.status;
    const matchesClub =
      userClub && invite.club_details?.id.toString() === userClub.id.toString();
    let matchesDate = true;
    if (filters.date) {
      const inviteDate = new Date(invite.date);
      inviteDate.setHours(0, 0, 0, 0);
      const selectedDate = new Date(filters.date);
      selectedDate.setHours(0, 0, 0, 0);
      matchesDate = inviteDate.getTime() === selectedDate.getTime();
    }

    return matchesGuest && matchesStatus && matchesClub && matchesDate;
  });

  const validateForm = () => {
    const errors = {};
    if (!formData.club) errors.club = "اختيار النادي مطلوب";
    if (!formData.guest_name) errors.guest_name = "اسم الضيف مطلوب";
    if (!formData.phone) errors.phone = "رقم الهاتف مطلوب";
    if (!formData.date) errors.date = "التاريخ مطلوب";
    // Optional: Validate membership_number against members (uncomment if members are fetched)
    /*
    if (formData.invited_by && members.length > 0) {
      const validMembership = members.some(
        (member) => member.membership_number === formData.invited_by
      );
      if (!validMembership) {
        errors.invited_by = "رقم العضوية غير صالح لهذا النادي";
      }
    }
    */
    return errors;
  };

  const handleAddInvite = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await dispatch(
        addInvite({
          ...formData,
          club: Number(formData.club),
          invited_by: formData.invited_by || null, // Send membership_number as string or null
        })
      ).unwrap();
      setShowAddModal(false);
      setFormData({
        club: userClub?.id?.toString() || "",
        guest_name: "",
        phone: "",
        date: "",
        status: "pending",
        invited_by: "",
      });
      setFormErrors({});
    } catch (error) {
      console.error("Failed to add invite:", error);
      setFormErrors({
        general: "فشل في إضافة الدعوة: " + (error.message || "خطأ غير معروف"),
      });
    }
  };

  const handleEditInvite = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const cleanedData = {
      ...formData,
      club: Number(formData.club),
      invited_by: formData.invited_by || null, // Send membership_number as string or null
    };

    try {
      await dispatch(
        editInviteById({
          inviteId: selectedInviteId,
          inviteData: cleanedData,
        })
      ).unwrap();
      setShowEditModal(false);
      setFormErrors({});
    } catch (error) {
      console.error("Failed to edit invite:", error);
      setFormErrors({
        general: "فشل في تعديل الدعوة: " + (error.message || "خطأ غير معروف"),
      });
    }
  };

  const handleDeleteInvite = async () => {
    try {
      await dispatch(deleteInviteById(selectedInviteId)).unwrap();
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Failed to delete invite:", error);
    }
  };

  const handleMarkAsUsed = async (e) => {
    e.preventDefault();
    if (!markUsedData.used_by) {
      setFormErrors({ used_by: "معرف العضو مطلوب" });
      return;
    }

    try {
      await dispatch(
        markInviteAsUsed({
          inviteId: selectedInviteId,
          used_by: Number(markUsedData.used_by),
        })
      ).unwrap();
      setShowMarkUsedModal(false);
      setMarkUsedData({ used_by: "" });
      setFormErrors({});
    } catch (error) {
      console.error("Failed to mark invite as used:", error);
      setFormErrors({
        general:
          "فشل في تحديد الدعوة كمستخدمة: " + (error.message || "خطأ غير معروف"),
      });
    }
  };

  const openEditModal = async (inviteId) => {
    setSelectedInviteId(inviteId);
    try {
      const result = await dispatch(fetchInviteById(inviteId)).unwrap();
      setFormData({
        club: userClub?.id?.toString() || result.club.toString(),
        guest_name: result.guest_name,
        phone: result.phone,
        date: result.date,
        status: result.status,
        invited_by: result.invited_by_details?.membership_number || "",
      });
      setShowEditModal(true);
    } catch (error) {
      console.error("Failed to fetch invite:", error);
    }
  };

  const openMarkUsedModal = (inviteId) => {
    setSelectedInviteId(inviteId);
    setShowMarkUsedModal(true);
  };

  const openDeleteModal = (inviteId) => {
    setSelectedInviteId(inviteId);
    setShowDeleteModal(true);
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvites = filteredInvites.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInvites.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    let bgColor = "bg-gray-500";
    if (status === "used") bgColor = "bg-green-100 text-green-600";
    if (status === "pending") bgColor = "bg-yellow-100 text-yellow-600";
    if (status === "cancelled") bgColor = "bg-red-100 text-red-600";

    const statusText =
      {
        used: "تم الاستخدام",
        pending: "قيد الانتظار",
        cancelled: "ملغاة",
      }[status] || status;

    return (
      <span className={`${bgColor} text-xs px-2 py-1 rounded-full`}>
        {statusText}
      </span>
    );
  };

  if (loading || loadingProfile)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        خطأ: {error}
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="flex items-start justify-between">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn flex items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            disabled={loadingProfile || !userClub}
          >
            دعوة جديدة
            <svg
              className="w-5 h-5 mr-2"
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
          </button>
        </div>
        <div className="flex items-start space-x-3">
          <h1 className="text-2xl font-bold">الدعوات المجانية</h1>
          <RiVipCrown2Line className="text-blue-600 w-9 h-9 text-2xl" />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          name="guestName"
          placeholder="ابحث عن الضيف"
          className="border border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg px-3 py-2 text-sm text-right shadow-sm placeholder-gray-400 transition-all duration-200 ease-in-out"
          value={filters.guestName}
          onChange={handleFilterChange}
        />
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="border border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg px-3 py-2 text-sm text-right shadow-sm placeholder-gray-400 transition-all duration-200 ease-in-out"
        >
          <option value="">جميع الحالات</option>
          <option value="pending">قيد الانتظار</option>
          <option value="used">تم الاستخدام</option>
          <option value="cancelled">ملغاة</option>
        </select>
        <select
          name="club"
          value={filters.club}
          onChange={handleFilterChange}
          className="border border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg px-3 py-2 text-sm text-right shadow-sm placeholder-gray-400 transition-all duration-200 ease-in-out"
          disabled
        >
          {userClub ? (
            <option value={userClub.id}>{userClub.name}</option>
          ) : (
            <option value="">جاري التحميل...</option>
          )}
        </select>
        <input
          type="date"
          name="date"
          className="border border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg px-3 py-2 text-sm text-right shadow-sm placeholder-gray-400 transition-all duration-200 ease-in-out"
          value={filters.date}
          onChange={handleFilterChange}
        />
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        dir="rtl"
      >
        {currentInvites.map((invite) => (
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
                  <span className="font-medium">الهاتف:</span> {invite.phone}
                </p>
                <p>
                  <span className="font-medium">التاريخ:</span>{" "}
                  {new Date(invite.date).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">النادي:</span>{" "}
                  {invite.club_details?.name || "غير متوفر"}
                </p>
                <p>
                  <span className="font-medium">رقم العضو:</span>{" "}
                  {invite.invited_by_details?.membership_number || "غير متوفر"}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex justify-end space-x-2">
              <button
                onClick={() => openEditModal(invite.id)}
                className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50"
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
              <button
                onClick={() => openMarkUsedModal(invite.id)}
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
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
              <button
                onClick={() => openDeleteModal(invite.id)}
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
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {filteredInvites.length > itemsPerPage && (
        <div className="mt-6 flex justify-center items-center space-x-2 rtl">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${
              currentPage === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            السابق
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {page}
              </button>
            )
          )}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md ${
              currentPage === totalPages
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            التالي
          </button>
        </div>
      )}

      {/* Add Invite Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="modal bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-semibold">إضافة دعوة جديدة</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddInvite} className="p-6 space-y-4">
              {formErrors.general && (
                <div className="bg-red-100 text-red-700 p-2 rounded text-right">
                  {formErrors.general}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  النادي
                </label>
                <select
                  name="club"
                  value={formData.club}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.club ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled
                  required
                >
                  {userClub ? (
                    <option value={userClub.id}>{userClub.name}</option>
                  ) : (
                    <option value="">جاري التحميل...</option>
                  )}
                </select>
                {formErrors.club && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.club}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم الضيف
                </label>
                <input
                  type="text"
                  name="guest_name"
                  value={formData.guest_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.guest_name ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {formErrors.guest_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.guest_name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم الهاتف
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {formErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.phone}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  التاريخ
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.date ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {formErrors.date && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.date}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الحالة
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="pending">قيد الانتظار</option>
                  <option value="used">تم الاستخدام</option>
                  <option value="cancelled">ملغاة</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  بدعوة من (رقم العضوية)
                </label>
                <input
                  type="text"
                  name="invited_by"
                  value={formData.invited_by}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.invited_by ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="أدخل رقم العضوية "
                />
                {formErrors.invited_by && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.invited_by}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  اختياري - اتركه فارغًا إذا لم يكن ذلك ممكنًا
                </p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={!userClub}
                >
                  حفظ الدعوة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Invite Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="modal bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-semibold">تعديل الدعوة</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditInvite} className="p-6 space-y-4">
              {formErrors.general && (
                <div className="bg-red-100 text-red-700 p-2 rounded text-right">
                  {formErrors.general}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  النادي
                </label>
                <select
                  name="club"
                  value={formData.club}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.club ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled
                  required
                >
                  {userClub ? (
                    <option value={userClub.id}>{userClub.name}</option>
                  ) : (
                    <option value="">جاري التحميل...</option>
                  )}
                </select>
                {formErrors.club && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.club}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم الضيف
                </label>
                <input
                  type="text"
                  name="guest_name"
                  value={formData.guest_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.guest_name ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {formErrors.guest_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.guest_name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم الهاتف
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {formErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.phone}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  التاريخ
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.date ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {formErrors.date && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.date}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الحالة
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="pending">قيد الانتظار</option>
                  <option value="used">تم الاستخدام</option>
                  <option value="cancelled">ملغاة</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  بدعوة من (رقم العضوية)
                </label>
                <input
                  type="text"
                  name="invited_by"
                  value={formData.invited_by}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.invited_by ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="أدخل رقم العضوية (مثال: MEM-79831)"
                />
                {formErrors.invited_by && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.invited_by}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  اختياري - اتركه فارغًا إذا لم يكن ذلك ممكنًا
                </p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  حفظ التغييرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark as Used Modal */}
      {showMarkUsedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="modal bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-semibold">تحديد كمستخدم</h3>
              <button
                onClick={() => setShowMarkUsedModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handleMarkAsUsed} className="p-6 space-y-4">
              {formErrors.general && (
                <div className="bg-red-100 text-red-700 p-2 rounded text-right">
                  {formErrors.general}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم العضو (المستخدم من قبله)
                </label>
                <input
                  type="number"
                  name="used_by"
                  value={markUsedData.used_by}
                  onChange={handleMarkUsedChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.used_by ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                  min="1"
                />
                {formErrors.used_by && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.used_by}
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMarkUsedModal(false)}
                  className="px-4 py-2 border border-gray-_TRIGGERED300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  تحديد كمستخدم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="modal bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-semibold">تأكيد الحذف</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                هل أنت متأكد أنك تريد حذف هذه الدعوة؟ لا يمكن التراجع عن هذا
                الإجراء.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteInvite}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
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