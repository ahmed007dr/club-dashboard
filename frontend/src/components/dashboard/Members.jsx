import React, { useEffect, useState } from "react";
import AddMember from "../modals/AddMember";
import { Link } from "react-router-dom";
import { CiTrash, CiEdit } from "react-icons/ci";
import { useSelector, useDispatch } from "react-redux";
import {
  deleteMember,
  editMember,
  fetchUsers,
  searchMember,
} from "../../redux/slices/memberSlice";
import { IoAddOutline } from "react-icons/io5";
import toast from "react-hot-toast";
import usePermission from "@/hooks/usePermission";
import { RiGroupLine, RiForbidLine } from "react-icons/ri";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { MoreVertical, Loader2 } from "lucide-react";

const Members = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 20;

  const canViewMembers = usePermission("view_member");
  const canAddMembers = usePermission("add_member");
  const canEditMembers = usePermission("change_member");
  const canDeleteMembers = usePermission("delete_member");

  const members = useSelector((state) => state.member.items);
  const pagination = useSelector((state) => state.member.pagination);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await dispatch(fetchUsers({ page: currentPage })).unwrap();
      } catch (error) {
        setError(`فشل في جلب الأعضاء: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [dispatch, currentPage]);

  const handleSearch = async (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setCurrentPage(1);
    setIsLoading(true);
    try {
      if (query.trim() === "") {
        await dispatch(fetchUsers({ page: 1 })).unwrap();
      } else {
        await dispatch(searchMember({ query, page: 1 })).unwrap();
      }
    } catch (error) {
      setError(`فشل في البحث: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (member) => {
    setSelectedMember(member);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedMember) {
      setError("لم يتم اختيار عضو لحذفه.");
      return;
    }
    try {
      await dispatch(deleteMember(selectedMember.id)).unwrap();
      const fetchedData = await dispatch(fetchUsers({ page: currentPage })).unwrap();
      if (fetchedData.results.length === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      setIsDeleteModalOpen(false);
      toast.success("تم حذف العضو بنجاح");
    } catch (error) {
      setError(`فشل في الحذف: ${error.message}`);
    }
  };

  const handleEditClick = (member) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    setSelectedMember({ ...selectedMember, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async () => {
    try {
      const toastId = toast.loading("جاري حفظ التعديلات...");
      await dispatch(
        editMember({ id: selectedMember.id, updatedUser: selectedMember })
      ).unwrap();
      await dispatch(fetchUsers({ page: currentPage })).unwrap();
      setIsEditModalOpen(false);
      toast.success("تم تحديث بيانات العضو بنجاح", { id: toastId });
    } catch (error) {
      toast.error(`فشل في التحديث: ${error.message}`);
    }
  };

  const totalPages = Math.ceil(pagination.count / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  if (!canViewMembers) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-6" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4 animate-pulse">
          <RiForbidLine className="text-red-600 text-3xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">لا يوجد صلاحية</h2>
        <p className="text-gray-600 max-w-md">
          ليس لديك الصلاحيات اللازمة لعرض الأعضاء. تواصل مع المسؤول.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <RiGroupLine className="text-3xl text-blue-600" />
        <h2 className="text-3xl font-bold text-gray-800">الأعضاء</h2>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="ابحث بالاسم، رقم العضوية، أو الرقم القومي"
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-right bg-white shadow-sm"
        />
        {canAddMembers && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <IoAddOutline className="text-xl" />
            إضافة عضو
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto rounded-lg shadow">
            <table className="w-full text-sm bg-white">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  {["#", "الصورة", "الاسم", "كود RFID", "رقم العضوية", "الرقم القومي", "الهاتف", "اسم النادي", "الإجراءات"].map((header) => (
                    <th key={header} className="p-4 text-right font-semibold border-b">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Array.isArray(members) && members.map((member, index) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="p-4">
                      <Link to={`/member/${member.id}`}>
                        <img
                          src={member.photo || "https://via.placeholder.com/40"}
                          alt="member"
                          className="w-10 h-10 rounded-full object-cover hover:scale-105 transition-transform"
                        />
                      </Link>
                    </td>
                    <td className="p-4 font-medium">{member.name}</td>
                    <td className="p-4">{member.rfid_code || "—"}</td>
                    <td className="p-4">{member.membership_number}</td>
                    <td className="p-4">{member.national_id}</td>
                    <td className="p-4">{member.phone}</td>
                    <td className="p-4">{member.club_name}</td>
                    <td className="p-4 flex gap-2 justify-center">
                      <DropdownMenu dir="rtl">
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-white shadow-lg rounded-lg">
                          {canEditMembers && (
                            <DropdownMenuItem
                              onClick={() => handleEditClick(member)}
                              className="flex items-center gap-2 px-4 py-2 text-yellow-600 hover:bg-yellow-50 cursor-pointer"
                            >
                              <CiEdit className="w-5 h-5" /> تعديل
                            </DropdownMenuItem>
                          )}
                          {canDeleteMembers && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(member)}
                              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <CiTrash className="w-5 h-5" /> حذف
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-4">
            {Array.isArray(members) && members.map((member, index) => (
              <div
                key={member.id}
                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <Link to={`/member/${member.id}`}>
                      <img
                        src={member.photo || "https://via.placeholder.com/48"}
                        alt="member"
                        className="w-12 h-12 rounded-full object-cover hover:scale-105 transition-transform"
                      />
                    </Link>
                    <div>
                      <span className="text-xs text-gray-500">#{(currentPage - 1) * itemsPerPage + index + 1}</span>
                      <h3 className="text-lg font-semibold text-gray-800">{member.name}</h3>
                    </div>
                  </div>
                  <DropdownMenu dir="rtl">
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-white shadow-lg rounded-lg">
                      {canEditMembers && (
                        <DropdownMenuItem
                          onClick={() => handleEditClick(member)}
                          className="flex items-center gap-2 px-4 py-2 text-yellow-600 hover:bg-yellow-50 cursor-pointer"
                        >
                          <CiEdit className="w-5 h-5" /> تعديل
                        </DropdownMenuItem>
                      )}
                      {canDeleteMembers && (
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(member)}
                          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <CiTrash className="w-5 h-5" /> حذف
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">كود RFID</p>
                    <p className="font-medium">{member.rfid_code || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">رقم العضوية</p>
                    <p className="font-medium">{member.membership_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">الرقم القومي</p>
                    <p>{member.national_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">الهاتف</p>
                    <p>{member.phone}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500">اسم النادي</p>
                    <p className="text-sm font-medium">{member.club_name}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4" dir="rtl">
            {pagination.count === 0 ? (
              <div className="text-sm text-gray-600">لا توجد أعضاء لعرضهم</div>
            ) : (
              <>
                <div className="text-sm text-gray-600">
                  عرض {(currentPage - 1) * itemsPerPage + 1} إلى{" "}
                  {Math.min(currentPage * itemsPerPage, pagination.count)} من{" "}
                  {pagination.count}
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  <button
                    onClick={() => paginate(1)}
                    disabled={currentPage === 1 || pagination.count === 0}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      currentPage === 1 || pagination.count === 0
                        ? "bg-gray-200 opacity-50 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    الأول
                  </button>
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={!pagination.previous || pagination.count === 0}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      !pagination.previous || pagination.count === 0
                        ? "bg-gray-200 opacity-50 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    السابق
                  </button>
                  {(() => {
                    const maxButtons = 5;
                    const sideButtons = Math.floor(maxButtons / 2);
                    let start = Math.max(1, currentPage - sideButtons);
                    let end = Math.min(totalPages, currentPage + sideButtons);
                    if (end - start + 1 < maxButtons) {
                      if (currentPage <= sideButtons) {
                        end = Math.min(totalPages, maxButtons);
                      } else {
                        start = Math.max(1, totalPages - maxButtons + 1);
                      }
                    }
                    return Array.from({ length: end - start + 1 }, (_, i) => start + i).map((page) => (
                      <button
                        key={page}
                        onClick={() => paginate(page)}
                        disabled={pagination.count === 0}
                        className={`px-4 py-2 rounded-lg text-sm ${
                          currentPage === page && pagination.count > 0
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 hover:bg-gray-300"
                        } ${pagination.count === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {page}
                      </button>
                    ));
                  })()}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={!pagination.next || pagination.count === 0}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      !pagination.next || pagination.count === 0
                        ? "bg-gray-200 opacity-50 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    التالي
                  </button>
                  <button
                    onClick={() => paginate(totalPages)}
                    disabled={currentPage === totalPages || pagination.count === 0}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      currentPage === totalPages || pagination.count === 0
                        ? "bg-gray-200 opacity-50 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    الأخير
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 flex justify-center items-center z-50 bg-black/50"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white p-6 rounded-lg w-full max-w-md sm:max-w-lg relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <AddMember closeAddModal={() => setIsAddModalOpen(false)} onAddSuccess={() => {
              setIsAddModalOpen(false);
              dispatch(fetchUsers({ page: currentPage }));
            }} />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 flex justify-center items-center z-50 bg-black/50"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            className="bg-white p-6 rounded-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-right">تأكيد الحذف</h3>
            <p className="text-right">
              هل أنت متأكد من حذف <strong>{selectedMember?.name}</strong>؟
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedMember && (
        <div
          className="fixed inset-0 flex justify-center items-center z-50 bg-black/50"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="bg-white p-6 rounded-lg w-full max-w-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-xl font-semibold mb-6 text-right">تعديل العضو</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4">
                {[
                  { label: "الاسم الكامل", name: "name", value: selectedMember.name },
                  { label: "رقم العضوية", name: "membership_number", value: selectedMember.membership_number },
                  { label: "الرقم القومي", name: "national_id", value: selectedMember.national_id },
                  { label: "رقم الهاتف الأساسي", name: "phone", value: selectedMember.phone },
                  { label: "رقم الهاتف الثانوي", name: "phone2", value: selectedMember.phone2 || "" },
                ].map((field) => (
                  <div key={field.name} className="flex flex-col">
                    <label className="text-right mb-1 text-sm font-medium">{field.label}</label>
                    <input
                      type="text"
                      name={field.name}
                      value={field.value}
                      onChange={handleEditChange}
                      className="border border-gray-300 px-3 py-2 rounded-lg text-right focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {[
                  { label: "كود البطاقة (RFID)", name: "rfid_code", value: selectedMember.rfid_code || "" },
                  { label: "الوظيفة", name: "job", value: selectedMember.job || "" },
                  { label: "اسم النادي", name: "club_name", value: selectedMember.club_name, disabled: true },
                  { label: "العنوان", name: "address", value: selectedMember.address || "" },
                ].map((field) => (
                  <div key={field.name} className="flex flex-col">
                    <label className="text-right mb-1 text-sm font-medium">{field.label}</label>
                    <input
                      type="text"
                      name={field.name}
                      value={field.value}
                      onChange={handleEditChange}
                      disabled={field.disabled}
                      className={`border border-gray-300 px-3 py-2 rounded-lg text-right focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                        field.disabled ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                ))}
                <div className="flex flex-col">
                  <label className="text-right mb-1 text-sm font-medium">ملاحظات</label>
                  <textarea
                    name="note"
                    value={selectedMember.note || ""}
                    onChange={handleEditChange}
                    className="border border-gray-300 px-3 py-2 rounded-lg text-right focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
