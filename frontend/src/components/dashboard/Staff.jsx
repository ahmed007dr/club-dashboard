import React, { useEffect, useState } from "react";
import { CiTrash, CiEdit } from "react-icons/ci";
import { FaEye, FaPlus } from "react-icons/fa";
import { RiUserLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { addStaff, deleteStaff, editStaff, fetchStaff } from "@/redux/slices/staff";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { MoreVertical } from "lucide-react";

const Staff = () => {
  const dispatch = useDispatch();
  const staff = useSelector((state) => state.staff.items || []);
  const [selectedShift, setSelectedShift] = useState(null);
  const [modalType, setModalType] = useState(""); // 'view' | 'edit' | 'delete' | 'add'
  const [formData, setFormData] = useState({}); // Form inputs for add/edit
  const [formError, setFormError] = useState(null); // Form error state
  const [userClub, setUserClub] = useState(null); // Logged-in user's club
  const [loadingProfile, setLoadingProfile] = useState(true); // Profile loading state
  const [filters, setFilters] = useState({
    club: "",
    staff: "",
    date: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

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
        setFilters((prev) => ({ ...prev, club: club.id.toString() }));
        setFormData((prev) => ({ ...prev, club: club.id.toString() }));
        setLoadingProfile(false);
      })
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
        setLoadingProfile(false);
      });
  }, []);

  // Fetch staff data
  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchStaff()).unwrap();
      } catch (error) {
        console.error("Error fetching staff:", error);
      }
    };
    fetchData();
  }, [dispatch]);

  // Filter staff based on filters
  const filteredStaff = staff.filter((shift) => {
    const clubMatch =
      userClub && shift.club_details?.id.toString() === userClub.id.toString();
    const staffMatch = filters.staff
      ? `${shift.staff_details?.first_name} ${shift.staff_details?.last_name}`
          .toLowerCase()
          .includes(filters.staff.toLowerCase())
      : true;
    const dateMatch = filters.date ? shift.date === filters.date : true;

    return clubMatch && staffMatch && dateMatch;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStaff.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle filter input changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    setCurrentPage(1);
  };

  // Open modal and populate formData
  const handleOpenModal = (type, shift = null) => {
    setModalType(type);
    setSelectedShift(shift);
    setFormError(null);

    if (type === "edit" && shift) {
      setFormData({
        id: shift.id,
        date: shift.date,
        shift_start: shift.shift_start,
        shift_end: shift.shift_end,
        club: userClub?.id?.toString() || shift.club_details.id.toString(),
        staff: `${shift.staff_details.id}`,
        approved_by: shift.approved_by_details
          ? `${shift.approved_by_details.id}`
          : null,
      });
    } else if (type === "add") {
      setFormData({
        date: "",
        shift_start: "",
        shift_end: "",
        club: userClub?.id?.toString() || "",
        staff: "",
        approved_by: null,
      });
    }
  };

  const handleCloseModal = () => {
    setModalType("");
    setSelectedShift(null);
    setFormData({});
    setFormError(null);
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Submit new staff shift
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!userClub) {
      setFormError("النادي غير متاح. يرجى المحاولة لاحقًا.");
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
        handleCloseModal();
      })
      .catch((err) => {
        console.error("Failed to add staff:", err);
        setFormError("فشل في إضافة الوردية: " + (err.message || "خطأ غير معروف"));
      });
  };

  // Submit edited staff shift
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!userClub) {
      setFormError("النادي غير متاح. يرجى المحاولة لاحقًا.");
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
        handleCloseModal();
      })
      .catch((err) => {
        console.error("Failed to edit staff:", err);
        setFormError("فشل في تعديل الوردية: " + (err.message || "خطأ غير معروف"));
      });
  };

  const confirmDelete = () => {
    dispatch(deleteStaff(selectedShift.id))
      .unwrap()
      .then(() => {
        dispatch(fetchStaff());
        handleCloseModal();
        setCurrentPage(1);
      });
  };

  if (loadingProfile)
    return <div className="flex justify-center items-center h-screen">جاري التحميل...</div>;

  return (
    <div className="p-6" dir="rtl">
      {/* Header and Add Button */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-start space-x-3">
          <RiUserLine className="text-blue-600 w-9 h-9 text-2xl" />
          <h2 className="text-2xl font-semibold mb-4">الطاقم</h2>
        </div>
        <button
          onClick={() => handleOpenModal("add")}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          disabled={loadingProfile || !userClub}
        >
          <FaPlus />
          إضافة وردية جديدة
        </button>
      </div>

      {/* Filter Inputs */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium">النادي</label>
          <select
            name="club"
            value={filters.club}
            onChange={handleFilterChange}
            className="w-full border px-3 py-1 rounded"
          >
            {userClub ? (
              <option value={userClub.id}>{userClub.name}</option>
            ) : (
              <option value="">جاري التحميل...</option>
            )}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">الموظف</label>
          <input
            type="text"
            name="staff"
            value={filters.staff}
            onChange={handleFilterChange}
            placeholder="تصفية حسب اسم الموظف"
            className="w-full border px-3 py-1 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">التاريخ</label>
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
            className="w-full border px-3 py-1 rounded"
          />
        </div>
      </div>

      {/* Staff Table */}
      <table className="w-full border text-sm">
        <thead>
          <tr>
            <th className="p-2">التاريخ</th>
            <th className="p-2">بداية الوردية</th>
            <th className="p-2">نهاية الوردية</th>
            <th className="p-2">النادي</th>
            <th className="p-2">الموظف</th>
            <th className="p-2">تمت الموافقة بواسطة</th>
            <th className="p-2">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(currentItems) &&
            currentItems.map((shift) => (
              <tr key={shift.id} className="text-center">
                <td className="p-2">{shift.date}</td>
                <td className="p-2">{shift.shift_start}</td>
                <td className="p-2">{shift.shift_end}</td>
                <td className="p-2">{shift.club_details?.name}</td>
                <td className="p-2">
                  {`${shift.staff_details?.first_name} ${shift.staff_details?.last_name}`}
                </td>
                <td className="p-2">
                  {shift.approved_by_details
                    ? `${shift.approved_by_details.first_name} ${shift.approved_by_details.last_name}`
                    : "غير موافق عليه"}
                </td>
                <td className="p-2 flex gap-2 justify-center">
                  <DropdownMenu dir="rtl">
                    <DropdownMenuTrigger asChild>
                      <button className="bg-gray-200 text-gray-700 px-1 py-1 rounded-md hover:bg-gray-300 transition-colors">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => handleOpenModal("view", shift)}
                        className="cursor-pointer text-green-600 hover:bg-yellow-50"
                      >
                        بيانات
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenModal("edit", shift)}
                        className="cursor-pointer text-yellow-600 hover:bg-yellow-50"
                      >
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenModal("delete", shift)}
                        className="cursor-pointer text-red-600 hover:bg-red-50"
                      >
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <div>
          عرض {indexOfFirstItem + 1} إلى{" "}
          {Math.min(indexOfLastItem, filteredStaff.length)} من{" "}
          {filteredStaff.length} وردية
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            السابق
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => paginate(page)}
              className={`px-3 py-1 rounded ${
                currentPage === page ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            التالي
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {modalType === "add" && (
        <div
          className="fixed inset-0 z-40 flex justify-center items-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        >
          <div className="modal bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">إضافة وردية جديدة</h2>
            {formError && (
              <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-right">
                {formError}
              </div>
            )}
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">التاريخ</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-1 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">بداية الوردية</label>
                <input
                  type="time"
                  name="shift_start"
                  value={formData.shift_start || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-1 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">نهاية الوردية</label>
                <input
                  type="time"
                  name="shift_end"
                  value={formData.shift_end || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-1 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">النادي</label>
                <select
                  name="club"
                  value={formData.club || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-1 rounded"
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
                <label className="block text-sm font-medium">الموظف (معرف)</label>
                <input
                  type="number"
                  name="staff"
                  value={formData.staff || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-1 rounded"
                  placeholder="أدخل معرف الموظف"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">تمت الموافقة بواسطة (معرف)</label>
                <input
                  type="number"
                  name="approved_by"
                  value={formData.approved_by || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-1 rounded"
                  placeholder="أدخل معرف الموافق"
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={handleCloseModal}
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded"
                  disabled={!userClub}
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
        <div
          className="fixed inset-0 z-40 flex justify-center items-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        >
          <div className="modal bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">تعديل الوردية</h2>
            {formError && (
              <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-right">
                {formError}
              </div>
            )}
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">التاريخ</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-1 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">بداية الوردية</label>
                <input
                  type="time"
                  name="shift_start"
                  value={formData.shift_start || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-1 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">نهاية الوردية</label>
                <input
                  type="time"
                  name="shift_end"
                  value={formData.shift_end || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-1 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">النادي</label>
                <select
                  name="club"
                  value={formData.club || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-1 rounded"
                  
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
                <label className="block text-sm font-medium">الموظف (معرف)</label>
                <input
                  type="number"
                  name="staff"
                  value={formData.staff || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-1 rounded"
                  placeholder="أدخل معرف الموظف"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">تمت الموافقة بواسطة (معرف)</label>
                <input
                  type="number"
                  name="approved_by"
                  value={formData.approved_by || ""}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-1 rounded"
                  placeholder="أدخل معرف الموافق"
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={handleCloseModal}
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded"
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
        <div
          className="fixed inset-0 z-40 flex justify-center items-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        >
          <div className="modal bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">تفاصيل الوردية</h2>
            <ul className="text-sm space-y-2">
              <li>
                <strong>معرف الوردية:</strong> {selectedShift.id}
              </li>
              <li>
                <strong>التاريخ:</strong> {selectedShift.date}
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
                  ? `${selectedShift.approved_by_details.first_name} ${selectedShift.approved_by_details.last_name}`
                  : "غير موافق عليه"}
              </li>
            </ul>
            <div className="mt-6 text-right">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modalType === "delete" && selectedShift && (
        <div
          className="fixed inset-0 z-40 flex justify-center items-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        >
          <div className="modal bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4">
              هل أنت متأكد أنك تريد حذف هذه الوردية؟
            </h2>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded"
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