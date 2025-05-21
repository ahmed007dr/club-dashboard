import React, { useEffect, useState } from "react";
import { CiTrash, CiEdit } from "react-icons/ci";
import { FaEye, FaPlus } from "react-icons/fa";
import { RiUserLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import {
  addStaff,
  deleteStaff,
  editStaff,
  fetchStaff,
} from "@/redux/slices/staff";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { MoreVertical } from "lucide-react";
import BASE_URL from "@/config/api";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import usePermission from "@/hooks/usePermission";

const Staff = () => {
  const dispatch = useDispatch();
  const staff = useSelector((state) => state.staff.items);
  console.log(staff)
  const pagination = useSelector((state) => state.staff.pagination);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filters state
  const [filters, setFilters] = useState({
    club: "",
    staff: "",
    date_min: "",
    date_max: "",
  });

  // Clubs and profile state
  const [clubs, setClubs] = useState([]);
  const [userClub, setUserClub] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [selectedClubUsers, setSelectedClubUsers] = useState([]);
  const [profileUser, setProfileUser] = useState({ id: "", username: "" });

  // Modals state
  const [selectedShift, setSelectedShift] = useState(null);
  const [modalType, setModalType] = useState("");
  const [formData, setFormData] = useState({
    date: "",
    shift_start: "",
    shift_end: "",
    club: "",
    staff: "",
    approved_by: null,
  });
  const [formError, setFormError] = useState(null);

  // Permissions
  const canViewStaffAttendance = usePermission("view_staffattendance");
  const canAddStaffAttendance = usePermission("add_staffattendance");
  const canEditStaffAttendance = usePermission("change_staffattendance");
  const canDeleteStaffAttendance = usePermission("delete_staffattendance");

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch clubs
        const token = localStorage.getItem("token");
        const usersResponse = await axios.get(
          `${BASE_URL}/accounts/api/users/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const clubsMap = {};
        console.log('usersResponse.data', usersResponse);
        usersResponse.data.results.forEach((user) => {
          if (!user.club) return;
          if (!clubsMap[user.club.id]) {
            clubsMap[user.club.id] = {
              club_id: user.club.id,
              club_name: user.club.name,
              users: [],
            };
          }
          clubsMap[user.club.id].users.push({
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
          });
        });
        setClubs(Object.values(clubsMap));

        // Fetch profile
        const profileResponse = await axios.get(
          `${BASE_URL}/accounts/api/profile/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const profileData = profileResponse.data;
        const club = { id: profileData.club.id, name: profileData.club.name };
        setUserClub(club);
        setProfileUser({ id: profileData.id, username: profileData.username });
        setLoadingProfile(false);
      } catch (error) {
        console.error("Initial data fetch error:", error);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch staff data with pagination and filters
  useEffect(() => {
    dispatch(
      fetchStaff({
        page: currentPage,
        club: filters.club,
        staff: filters.staff,
        date_min: filters.date_min,
        date_max: filters.date_max,
      })
    );
  }, [dispatch, currentPage, filters]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.club, filters.staff, filters.date_min, filters.date_max]);

  // Pagination logic
  const totalPages = Math.ceil(pagination.count / itemsPerPage) || 1;

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Handle club selection for forms
  const handleClubChange = (e) => {
    const clubId = e.target.value;
    const selected = clubs.find((c) => c.club_id.toString() === clubId);
    setSelectedClubUsers(selected ? selected.users : []);
    setFormData((prev) => ({ ...prev, club: clubId }));
  };

  // Modal handlers
  const handleOpenModal = (type, shift = null) => {
    setModalType(type);
    setSelectedShift(shift);
    setFormError(null);

    if (type === "add") {
      setFormData({
        date: "",
        shift_start: "",
        shift_end: "",
        club: userClub?.id || "",
        staff: "",
        approved_by: null,
      });
    } else if (type === "edit" && shift) {
      setFormData({
        id: shift.id,
        date: shift.date,
        shift_start: shift.shift_start,
        shift_end: shift.shift_end,
        club: shift.club_details.id,
        staff: shift.staff_details.id,
        approved_by: shift.approved_by_details?.id || null,
      });
    }
  };

  const handleCloseModal = () => {
    setModalType("");
    setSelectedShift(null);
    setFormData({
      date: "",
      shift_start: "",
      shift_end: "",
      club: "",
      staff: "",
      approved_by: null,
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Form submissions
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!userClub) {
      toast.error("النادي غير متاح. يرجى المحاولة لاحقًا.");
      return;
    }

    const staffData = {
      ...formData,
      club: Number(formData.club),
      staff: Number(formData.staff),
      approved_by: formData.approved_by ? Number(formData.approved_by) : null,
    };

    dispatch(addStaff(staffData))
      .unwrap()
      .then(() => {
        dispatch(fetchStaff({ page: currentPage, ...filters }));
        toast.success("تم إضافة الوردية بنجاح!");
        handleCloseModal();
      })
      .catch((err) => {
        toast.error(
          "فشل في إضافة الوردية: " + (err.message || "خطأ غير معروف")
        );
      });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const updatedStaff = {
      ...formData,
      club: Number(formData.club),
      staff: Number(formData.staff),
      approved_by: formData.approved_by ? Number(formData.approved_by) : null,
    };

    dispatch(editStaff({ id: selectedShift.id, updatedStaff }))
      .unwrap()
      .then(() => {
        dispatch(fetchStaff({ page: currentPage, ...filters }));
        toast.success("تم تعديل الوردية بنجاح!");
        handleCloseModal();
      })
      .catch((err) => {
        toast.error(
          "فشل في تعديل الوردية: " + (err.message || "خطأ غير معروف")
        );
      });
  };

  const confirmDelete = () => {
    dispatch(deleteStaff(selectedShift.id))
      .unwrap()
      .then(() => {
        dispatch(fetchStaff({ page: currentPage, ...filters }));
        toast.success("تم حذف الوردية بنجاح!");
        handleCloseModal();
      })
      .catch((err) => {
        toast.error("فشل في حذف الوردية: " + (err.message || "خطأ غير معروف"));
      });
  };

  
  useEffect(() => {
    if (staff) console.log("staff", staff);
  }, [staff]);

  // Loading and permission states
  if (loadingProfile) {
    return (
      <div className="flex justify-center items-center h-screen text-sm sm:text-base">
        جاري التحميل...
      </div>
    );
  }

  if (!canViewStaffAttendance) {
    return (
      <div className="flex text-red-500 justify-center items-center h-screen text-sm sm:text-base">
        ليس لديك صلاحية عرض الطاقم
      </div>
    );
  }
  
  return (
    <div className="p-4 sm:p-6" dir="rtl">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3 space-x-reverse">
          <RiUserLine className="text-blue-600 w-6 h-6 sm:w-8 sm:h-8" />
          <h2 className="text-xl sm:text-2xl font-semibold">الطاقم</h2>
        </div>
        {canAddStaffAttendance && (
          <button
            onClick={() => handleOpenModal("add")}
            className="flex items-center gap-2 btn"
            disabled={!userClub}
          >
            <FaPlus className="w-4 h-4" />
            إضافة وردية جديدة
          </button>
        )}
      </div>

      {/* Filter Inputs */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Club Filter */}
        <div>
          <label className="block text-sm font-medium mb-1">النادي</label>
          <select
            name="club"
            value={filters.club}
            onChange={handleFilterChange}
            className="w-full border px-3 py-2 rounded-md text-sm"
          >
            <option value="">الكل</option>
            {clubs.map((club) => (
              <option key={club.club_id} value={club.club_name}>
                {club.club_name}
              </option>
            ))}
          </select>
        </div>

        {/* Staff Search */}
        <div>
          <label className="block text-sm font-medium mb-1">بحث بالاسم</label>
          <input
            type="text"
            name="staff"
            value={filters.staff}
            onChange={handleFilterChange}
            placeholder="اسم المستخدم"
            className="w-full border px-3 py-2 rounded-md text-sm"
          />
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium mb-1">من تاريخ</label>
          <input
            type="date"
            name="date_min"
            value={filters.date_min}
            onChange={handleFilterChange}
            className="w-full border px-3 py-2 rounded-md text-sm"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium mb-1">إلى تاريخ</label>
          <input
            type="date"
            name="date_max"
            value={filters.date_max}
            onChange={handleFilterChange}
            className="w-full border px-3 py-2 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="overflow-x-auto">
        {staff.length > 0 ? (
          <>
            <table className="w-full border text-sm hidden sm:table">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 sm:p-3 text-right">#</th>
                  <th className="p-2 sm:p-3 text-right">التاريخ</th>
                  <th className="p-2 sm:p-3 text-right">بداية الوردية</th>
                  <th className="p-2 sm:p-3 text-right">نهاية الوردية</th>
                  <th className="p-2 sm:p-3 text-right">النادي</th>
                  <th className="p-2 sm:p-3 text-right">الموظف</th>
                  <th className="p-2 sm:p-3 text-right">تمت الموافقة بواسطة</th>
                  <th className="p-2 sm:p-3 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {staff.map((shift, index) => (
                  <tr key={shift.id} className="hover:bg-gray-50">
                    <td className="p-2 sm:p-3">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="p-2 sm:p-3">{shift.date}</td>
                    <td className="p-2 sm:p-3">{shift.shift_start}</td>
                    <td className="p-2 sm:p-3">{shift.shift_end}</td>
                    <td className="p-2 sm:p-3">{shift.club_details?.name}</td>
                    <td className="p-2 sm:p-3 text-blue-600 hover:underline">
                      <Link to={`/staff/${shift.staff_details.id}`}>
                        {`${shift.staff_details.first_name} ${shift.staff_details.last_name}`}
                      </Link>
                    </td>
                    <td className="p-2 sm:p-3">
                      {shift.approved_by_details?.username || "غير موافق عليه"}
                    </td>
                    <td className="p-2 sm:p-3 flex gap-2 justify-center">
                      <DropdownMenu dir="rtl">
                        <DropdownMenuTrigger asChild>
                          <button className="bg-gray-200 text-gray-700 px-1 py-1 rounded-md hover:bg-gray-300 transition-colors">
                            <MoreVertical className="h-5 w-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => handleOpenModal("view", shift)}
                            className="cursor-pointer text-green-600 hover:bg-green-50"
                          >
                            <FaEye className="mr-2" /> بيانات
                          </DropdownMenuItem>
                          {canEditStaffAttendance && (
                            <DropdownMenuItem
                              onClick={() => handleOpenModal("edit", shift)}
                              className="cursor-pointer text-yellow-600 hover:bg-yellow-50"
                            >
                              <CiEdit className="mr-2" /> تعديل
                            </DropdownMenuItem>
                          )}
                          {canDeleteStaffAttendance && (
                            <DropdownMenuItem
                              onClick={() => handleOpenModal("delete", shift)}
                              className="cursor-pointer text-red-600 hover:bg-red-50"
                            >
                              <CiTrash className="mr-2" /> حذف
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile View */}
            <div className="sm:hidden space-y-4">
              {staff.map((shift) => (
                <div
                  key={shift.id}
                  className="border rounded-md p-4 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold">
                      التاريخ:{" "}
                      {shift.date
                        ? new Date(shift.date).toLocaleDateString("en-GB")
                        : "N/A"}
                    </span>
                    <DropdownMenu dir="rtl">
                      <DropdownMenuTrigger asChild>
                        <button className="bg-gray-200 text-gray-700 px-1 py-1 rounded-md hover:bg-gray-300 transition-colors">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => handleOpenModal("view", shift)}
                          className="cursor-pointer text-green-600 hover:bg-green-50"
                        >
                          <FaEye className="mr-2" /> بيانات
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenModal("edit", shift)}
                          className="cursor-pointer text-yellow-600 hover:bg-yellow-50"
                        >
                          <CiEdit className="mr-2" /> تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenModal("delete", shift)}
                          className="cursor-pointer text-red-600 hover:bg-red-50"
                        >
                          <CiTrash className="mr-2" /> حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-sm">
                    <strong>بداية الوردية:</strong> {shift.shift_start}
                  </p>
                  <p className="text-sm">
                    <strong>نهاية الوردية:</strong> {shift.shift_end}
                  </p>
                  <p className="text-sm">
                    <strong>النادي:</strong> {shift.club_details?.name}
                  </p>
                  <p className="text-sm">
                    <strong>الموظف:</strong>{" "}
                    {`${shift.staff_details?.first_name} ${shift.staff_details?.last_name}`}
                  </p>
                  <p className="text-sm">
                    <strong>تمت الموافقة بواسطة:</strong>{" "}
                    {shift.approved_by_details
                      ? shift.approved_by_details.username
                      : "غير موافق عليه"}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm sm:text-base text-center p-4 text-gray-500">
            لا توجد ورديات متاحة
          </p>
        )}
      </div>

      {/* Pagination */}
      {pagination.count > 0 && (
        <div className="flex justify-between items-center mt-4" dir="rtl">
          <div className="text-sm text-gray-600">
            عرض {(currentPage - 1) * itemsPerPage + 1} إلى{" "}
            {Math.min(currentPage * itemsPerPage, pagination.count)} من{" "}
            {pagination.count}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => paginate(1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1
                  ? "bg-gray-200 opacity-50 cursor-not-allowed"
                  : "bg-blue-700 text-white hover:bg-blue-800"
              }`}
            >
              الأول
            </button>
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={!pagination.previous}
              className={`px-3 py-1 rounded ${
                !pagination.previous
                  ? "bg-gray-200 opacity-50 cursor-not-allowed"
                  : "bg-blue-700 text-white hover:bg-blue-800"
              }`}
            >
              السابق
            </button>

            {/* Page Number Buttons */}
            {(() => {
              const maxButtons = 5;
              const sideButtons = Math.floor(maxButtons / 2);
              let start = Math.max(1, currentPage - sideButtons);
              let end = Math.min(totalPages, currentPage + sideButtons);

              // Adjust if we're at the beginning or end
              if (end - start + 1 < maxButtons) {
                if (currentPage <= sideButtons) {
                  end = Math.min(totalPages, maxButtons);
                } else {
                  start = Math.max(1, totalPages - maxButtons + 1);
                }
              }

              return Array.from(
                { length: end - start + 1 },
                (_, i) => start + i
              ).map((page) => (
                <button
                  key={page}
                  onClick={() => paginate(page)}
                  className={`px-3 py-1 rounded ${
                    currentPage === page
                      ? "bg-blue-700 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {page}
                </button>
              ));
            })()}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={!pagination.next}
              className={`px-3 py-1 rounded ${
                !pagination.next
                  ? "bg-gray-200 opacity-50 cursor-not-allowed"
                  : "bg-blue-700 text-white hover:bg-blue-800"
              }`}
            >
              التالي
            </button>
            <button
              onClick={() => paginate(totalPages)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${
                currentPage === totalPages
                  ? "bg-gray-200 opacity-50 cursor-not-allowed"
                  : "bg-blue-700 text-white hover:bg-blue-800"
              }`}
            >
              الأخير
            </button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {modalType === "add" && canAddStaffAttendance && (
        <div className="fixed inset-0 z-40 flex justify-center items-center bg-black bg-opacity-50 p-4">
          <div
            className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg sm:text-xl font-bold mb-4">
              إضافة وردية جديدة
            </h2>
            {formError && (
              <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-right text-sm">
                {formError}
              </div>
            )}
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  التاريخ
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  بداية الوردية
                </label>
                <input
                  type="time"
                  name="shift_start"
                  value={formData.shift_start || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  نهاية الوردية
                </label>
                <input
                  type="time"
                  name="shift_end"
                  value={formData.shift_end || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">النادي</label>
                <select
                  name="club"
                  value={formData.club || ""}
                  onChange={(e) => {
                    handleFormChange(e);
                    handleClubChange(e);
                  }}
                  className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-200"
                  required
                >
                  <option value="">اختر نادي</option>
                  {clubs.map((club) => (
                    <option key={club.club_id} value={club.club_id}>
                      {club.club_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الموظف</label>
                <select
                  name="staff"
                  value={formData.staff || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-200"
                  required
                  disabled={!formData.club || loadingProfile}
                >
                  <option value="">اختر موظف</option>
                  {selectedClubUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.username})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  تمت الموافقة بواسطة
                </label>
                <select
                  name="approved_by"
                  value={formData.approved_by || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-200"
                  disabled={!formData.club || loadingProfile}
                >
                  <option value="">اختر موافق</option>
                  {profileUser.id && (
                    <option value={profileUser.id}>
                      {profileUser.username}
                    </option>
                  )}
                </select>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-300 rounded text-sm hover:bg-gray-400"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  disabled={
                    !formData.club ||
                    !formData.staff ||
                    !formData.date ||
                    !formData.shift_start ||
                    !formData.shift_end
                  }
                >
                  إضافة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modalType === "edit" && selectedShift && canEditStaffAttendance && (
        <div className="fixed inset-0 z-40 flex justify-center items-center bg-black bg-opacity-50 p-4">
          <div
            className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg sm:text-xl font-bold mb-4">تعديل الوردية</h2>
            {formError && (
              <div
                className="bg-red-100 text-red-7
              00 p-2 rounded mb-4 text-right text-sm"
              >
                {formError}
              </div>
            )}
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  التاريخ
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  بداية الوردية
                </label>
                <input
                  type="time"
                  name="shift_start"
                  value={formData.shift_start || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  نهاية الوردية
                </label>
                <input
                  type="time"
                  name="shift_end"
                  value={formData.shift_end || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">النادي</label>
                <select
                  name="club"
                  value={formData.club || ""}
                  onChange={(e) => {
                    handleFormChange(e);
                    handleClubChange(e);
                  }}
                  className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-200"
                  required
                >
                  {clubs.map((club) => (
                    <option key={club.club_id} value={club.club_id}>
                      {club.club_name}
                    </option>
                  ))}
                  {!userClub && <option value="">جاري التحميل...</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الموظف</label>
                <select
                  name="staff"
                  value={formData.staff || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-200"
                  required
                >
                  <option value="">اختر موظف</option>
                  {selectedClubUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.username})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  تمت الموافقة بواسطة
                </label>
                <select
                  name="approved_by"
                  value={formData.approved_by || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-200"
                >
                  <option value="">اختر موافق</option>
                  {profileUser.id && (
                    <option value={profileUser.id}>
                      {profileUser.username}
                    </option>
                  )}
                </select>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-300 rounded text-sm hover:bg-gray-400"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {modalType === "view" && selectedShift && (
        <div className="fixed inset-0 z-40 flex justify-center items-center bg-black bg-opacity-50 p-4">
          <div
            className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg sm:text-xl font-bold mb-4">
              تفاصيل الوردية
            </h2>
            <ul className="text-sm space-y-2">
              <li>
                <strong>التاريخ:</strong>{" "}
                {selectedShift.date
                  ? new Date(selectedShift.date).toLocaleDateString("en-GB")
                  : "N/A"}
              </li>
              <li>
                <strong>بداية الوردية:</strong> {selectedShift.shift_start}
              </li>
              <li>
                <strong>نهاية الوردية:</strong> {selectedShift.shift_end}
              </li>
              <li>
                <strong>النادي:</strong> {selectedShift.club_details?.name}
              </li>
              <li>
                <strong>الموظف:</strong>{" "}
                {`${selectedShift.staff_details?.first_name} ${selectedShift.staff_details?.last_name}`}
              </li>
              <li>
                <strong>تمت الموافقة بواسطة:</strong>{" "}
                {selectedShift.approved_by_details
                  ? selectedShift.approved_by_details.username
                  : "غير موافق عليه"}
              </li>
            </ul>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-300 rounded text-sm hover:bg-gray-400"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modalType === "delete" && selectedShift && canDeleteStaffAttendance && (
        <div className="fixed inset-0 z-40 flex justify-center items-center bg-black bg-opacity-50 p-4">
          <div
            className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg sm:text-xl font-semibold mb-4">
              هل أنت متأكد أنك تريد حذف هذه الوردية؟
            </h2>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-300 rounded text-sm hover:bg-gray-400"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
