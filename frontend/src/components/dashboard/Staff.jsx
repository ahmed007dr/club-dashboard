import React, { useEffect, useState, useMemo } from "react";
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

const Staff = () => {
  const dispatch = useDispatch();
  const staff = useSelector((state) => state.staff.items || []);
  console.log("Staff data:", staff);
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
  const [userClub, setUserClub] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [filters, setFilters] = useState({
    club: "",
    staff: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [clubs, setClubs] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState("");
  const [selectedClubUsers, setSelectedClubUsers] = useState([]);
  const [profileUser, setProfileUser] = useState({ id: "", username: "" });

  // Fetch users grouped by club
  useEffect(() => {
    const fetchUsersGroupedByClub = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${BASE_URL}/accounts/api/users/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const clubsMap = {};
        response.data.forEach((user) => {
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
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    fetchUsersGroupedByClub();
  }, []);

  // Fetch users grouped by club
  const fetchUsersGroupedByClub = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/accounts/api/users/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const clubsMap = {};
      response.data.forEach((user) => {
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
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/accounts/api/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      const club = { id: data.club.id, name: data.club.name };
      setUserClub(club);
      setFilters((prev) => ({
        ...prev,
        club: "",
      }));
      setFormData((prev) => ({ ...prev, club: club.id.toString() }));
      setSelectedClubId(club.id.toString());
      setProfileUser({ id: data.id, username: data.username });
      setLoadingProfile(false);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchUsersGroupedByClub(); // First fetch clubs
      await fetchProfile(); // Then fetch profile
    };
    fetchInitialData();
  }, []);

  // Fetch staff data
  useEffect(() => {
    dispatch(fetchStaff());
  }, [dispatch]);

  const handleClubChange = (e) => {
    const clubId = e.target.value;
    setSelectedClubId(clubId);
    const selected = clubs.find((c) => c.club_id.toString() === clubId);
    setSelectedClubUsers(selected ? selected.users : []);
  };

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
        date: shift.date || "",
        shift_start: shift.shift_start || "",
        shift_end: shift.shift_end || "",
        club: userClub.id,
        staff: `${shift.staff_details.id}`,
        approved_by: shift.approved_by_details
          ? `${shift.approved_by_details.id}`
          : null,
      });
      const clubId =
        userClub?.id?.toString() || shift.club_details.id.toString();
      setSelectedClubId(clubId);
      const selected = clubs.find((c) => c.club_id.toString() === clubId);
      setSelectedClubUsers(selected ? selected.users : []);
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();

    if (!userClub) {
      toast.error("النادي غير متاح. يرجى المحاولة لاحقًا.");
      return;
    }

    const staffData = {
      date: formData.date,
      shift_start: formData.shift_start,
      shift_end: formData.shift_end,
      club: Number(formData.club),
      staff: Number(formData.staff) || null,
      approved_by: Number(formData.approved_by) || null,
    };

    dispatch(addStaff(staffData))
      .unwrap()
      .then(() => {
        dispatch(fetchStaff());
        toast.success("تم إضافة الوردية بنجاح!");
        handleCloseModal();
      })
      .catch((err) => {
        toast.error(
          "فشل في إضافة الوردية: " + (err.message || "خطأ غير معروف")
        );
      });
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
    setFormError(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();

    if (!userClub) {
      toast.error("النادي غير متاح. يرجى المحاولة لاحقًا.");
      return;
    }

    const updatedStaff = {
      date: formData.date,
      shift_start: formData.shift_start,
      shift_end: formData.shift_end,
      club: Number(formData.club),
      staff: Number(formData.staff) || null,
      approved_by: Number(formData.approved_by) || null,
    };

    dispatch(editStaff({ id: selectedShift.id, updatedStaff }))
      .unwrap()
      .then(() => {
        dispatch(fetchStaff());
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
        dispatch(fetchStaff());
        toast.success("تم حذف الوردية بنجاح!");
        handleCloseModal();
        setCurrentPage(1);
      })
      .catch((err) => {
        toast.error("فشل في حذف الوردية: " + (err.message || "خطأ غير معروف"));
      });
  };

  const parseTime = (timeStr) => {
    if (!timeStr) return new Date(0);

    if (timeStr.includes(".")) {
      timeStr = timeStr.split(".")[0];
    }

    if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
      const today = new Date();
      const [hours, minutes, seconds] = timeStr.split(":");
      today.setHours(hours, minutes, seconds, 0);
      return today;
    }

    const parsedDate = new Date(timeStr);
    return isNaN(parsedDate) ? new Date(0) : parsedDate;
  };

  // Filter and sort staff based on filters and id
  const filteredStaff = useMemo(() => {
    return staff
      .filter((shift) => {
        // Club match should be true when no club is selected
        const clubMatch =
          !filters.club || // ← Allow all clubs when empty
          shift.club_details?.id.toString() === filters.club.toString();

        const staffMatch = filters.staff
          ? `${shift.staff_details?.first_name} ${shift.staff_details?.last_name}`
              .toLowerCase()
              .includes(filters.staff.toLowerCase())
          : true;

        return clubMatch && staffMatch;
      })
      .sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [staff, filters]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStaff.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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

  if (loadingProfile)
    return (
      <div className="flex justify-center items-center h-screen text-sm sm:text-base">
        جاري التحميل...
      </div>
    );

  return (
    <div className="p-4 sm:p-6" dir="rtl">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3 space-x-reverse">
          <RiUserLine className="text-blue-600 w-6 h-6 sm:w-8 sm:h-8" />
          <h2 className="text-xl sm:text-2xl font-semibold">الطاقم</h2>
        </div>
        <button
          onClick={() => handleOpenModal("add")}
          className="flex items-center gap-2 btn"
          disabled={loadingProfile || !userClub}
        >
          <FaPlus className="w-4 h-4" />
          إضافة وردية جديدة
        </button>
      </div>

      {/* Filter Inputs */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">النادي</label>
          <select
            name="club"
            value={filters.club}
            onChange={(e) => setFilters({ ...filters, club: e.target.value })}
            className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-200"
          >
            <option value="">جميع الأندية</option>
            {clubs.map((club) => (
              <option key={club.club_id} value={club.club_id}>
                {club.club_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">الموظف</label>
          <input
            type="text"
            name="staff"
            value={filters.staff}
            onChange={(e) => setFilters({ ...filters, staff: e.target.value })}
            placeholder="تصفية حسب اسم الموظف"
            className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-200"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="overflow-x-auto">
        {currentItems.length > 0 ? (
          <>
            <table className="w-full border text-sm hidden sm:table">
              <thead>
                <tr className="bg-gray-50">
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
                {currentItems.map((shift) => (
                  <tr key={shift.id} className="hover:bg-gray-50">
                    <td className="p-2 sm:p-3">
                      {shift.date
                        ? new Date(shift.date).toLocaleDateString("en-GB")
                        : "N/A"}
                    </td>
                    <td className="p-2 sm:p-3">
                      {shift.shift_start
                        ? parseTime(shift.shift_start).toLocaleTimeString(
                            "en-GB",
                            { hour: "2-digit", minute: "2-digit" }
                          )
                        : "Invalid date"}
                    </td>
                    <td className="p-2 sm:p-3">
                      {shift.shift_end
                        ? parseTime(shift.shift_end).toLocaleTimeString(
                            "en-GB",
                            { hour: "2-digit", minute: "2-digit" }
                          )
                        : "Invalid date"}
                    </td>
                    <td className="p-2 sm:p-3">{shift.club_details?.name}</td>
                    <td className="p-2 sm:p-3 text-blue-600 hover:underline">
                      <Link to={`/staff/${shift.staff_details.id}`}>
                        {`${shift.staff_details.first_name} ${shift.staff_details.last_name}`}
                      </Link>
                    </td>
                    <td className="p-2 sm:p-3">
                      {shift.approved_by_details
                        ? shift.approved_by_details.username
                        : "غير موافق عليه"}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile View */}
            <div className="sm:hidden space-y-4">
              {currentItems.map((shift) => (
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
                    <strong>بداية الوردية:</strong>{" "}
                    {shift.shift_start
                      ? parseTime(shift.shift_start).toLocaleTimeString(
                          "en-GB",
                          { hour: "2-digit", minute: "2-digit" }
                        )
                      : "Invalid date"}
                  </p>
                  <p className="text-sm">
                    <strong>نهاية الوردية:</strong>{" "}
                    {shift.shift_end
                      ? parseTime(shift.shift_end).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Invalid date"}
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
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-2 sm:space-y-0">
          <div className="text-sm text-gray-700">
            عرض {indexOfFirstItem + 1} إلى{" "}
            {Math.min(indexOfLastItem, filteredStaff.length)} من{" "}
            {filteredStaff.length} وردية
          </div>
          <div className="flex items-center gap-2">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded px-2 py-1 text-sm"
            >
              {[5, 10, 20].map((size) => (
                <option key={size} value={size}>
                  {size} لكل صفحة
                </option>
              ))}
            </select>
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 text-sm"
            >
              السابق
            </button>
            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => paginate(page)}
                className={`px-3 py-1 rounded text-sm ${
                  currentPage === page
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {page}
              </button>
            ))}
            {totalPages > getPageNumbers().length &&
              getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                <span className="px-3 py-1 text-sm">...</span>
              )}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 text-sm"
            >
              التالي
            </button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {modalType === "add" && (
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
      {modalType === "edit" && selectedShift && (
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
                <strong>بداية الوردية:</strong>{" "}
                {selectedShift.shift_start
                  ? parseTime(selectedShift.shift_start).toLocaleTimeString(
                      "en-GB",
                      { hour: "2-digit", minute: "2-digit" }
                    )
                  : "Invalid date"}
              </li>
              <li>
                <strong>نهاية الوردية:</strong>{" "}
                {selectedShift.shift_end
                  ? parseTime(selectedShift.shift_end).toLocaleTimeString(
                      "en-GB",
                      { hour: "2-digit", minute: "2-digit" }
                    )
                  : "Invalid date"}
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
      {modalType === "delete" && selectedShift && (
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
