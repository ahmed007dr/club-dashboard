import React, { useEffect, useState } from "react";
import AddMember from "../modals/AddMember";
import { Link } from "react-router-dom";
import { CiTrash, CiEdit } from "react-icons/ci";
import { RiGroupLine } from "react-icons/ri";
import { useSelector, useDispatch } from "react-redux";
import { deleteMember, editMember, fetchUsers, searchMember } from "../../redux/slices/memberSlice";
import { IoAddOutline } from "react-icons/io5";
import toast from 'react-hot-toast';

const Members = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Matches backend configuration

  // Updated selectors
  const members = useSelector((state) => state.member.items); // Now an array (results)
  const pagination = useSelector((state) => state.member.pagination); // { count, next, previous }
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedData = await dispatch(fetchUsers({ page: currentPage })).unwrap();
        console.log('Raw fetched data:', fetchedData);
      } catch (error) {
        console.error('Fetch error:', error);
        setError('Failed to fetch members. Please try again later: ' + error.message);
      }
    };

    fetchData();
  }, [dispatch, currentPage]);

  const handleSearch = async (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on search

    try {
      if (query.trim() === "") {
        await dispatch(fetchUsers({ page: 1 })).unwrap();
      } else {
        await dispatch(searchMember({ query, page: 1 })).unwrap();
      }
    } catch (error) {
      setError('Failed to search members. Please try again later: ' + error);
    }
  };

  const handleDeleteClick = (member) => {
    setSelectedMember(member);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedMember) {
      setError('No member selected for deletion.');
      return;
    }

    try {
      await dispatch(deleteMember(selectedMember.id)).unwrap();
      // Refresh current page
      const fetchedData = await dispatch(fetchUsers({ page: currentPage })).unwrap();
      // If current page is empty and not the first page, go to previous page
      if (fetchedData.results.length === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      setIsDeleteModalOpen(false);
      toast.success("تم حذف العضو بنجاح");
    } catch (error) {
      setError('Failed to delete member. Please try again later: ' + error.message);
    }
  };

 const handleEditClick = (member) => {
  setSelectedMember(member); // Corrected function name
  setIsEditModalOpen(true);
};

  const handleEditChange = (e) => {
    setSelectedMember({ ...selectedMember, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async () => {
    try {
      const toastId = toast.loading('جاري حفظ التعديلات...', {
        position: 'top-center',
      });

      await dispatch(
        editMember({ id: selectedMember.id, updatedUser: selectedMember })
      ).unwrap();

      // Refresh current page
      await dispatch(fetchUsers({ page: currentPage })).unwrap();
      setIsEditModalOpen(false);
      toast.success('تم تحديث بيانات العضو بنجاح', { id: toastId });
    } catch (error) {
      toast.error(`فشل في التحديث: ${error.message}`);
    }
  };

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => setIsAddModalOpen(false);

  // Updated pagination logic
  const totalPages = Math.ceil(pagination.count / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="p-4 overflow-x-auto" dir="rtl">
      <div className="flex items-start space-x-3">
        <RiGroupLine className="text-2xl" />
        <h2 className="text-2xl font-semibold mb-4">الأعضاء</h2>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearch}
        placeholder="ابحث بالاسم، رقم العضوية، أو الرقم القومي"
        className="border p-2 rounded-md mb-4 w-full"
      />
      <div className="flex justify-end mb-4">
        <button
          onClick={openAddModal}
          className="flex justify-end text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2"
        >
          <IoAddOutline className="flex inline-block text-xl" />
          إضافة عضو
        </button>
      </div>

      <table className="min-w-full border border-gray-200">
        <thead className="text-right">
          <tr>
            <th className="p-3 border-b">#</th>
            <th className="p-3 border-b">الصورة</th>
            <th className="p-3 border-b">الاسم</th>
            <th className="p-3 border-b">rfid code</th>
            <th className="p-3 border-b">رقم العضوية</th>
            <th className="p-3 border-b">الرقم القومي</th>
            <th className="p-3 border-b">الهاتف</th>
            <th className="p-3 border-b">اسم النادي</th>
            <th className="p-3 border-b">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(members) &&
            members.map((member, index) => (
              <tr key={member.id}>
                <td className="p-3 border-b">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td className="p-3 border-b">
                  <Link to={`/member/${member.id}`}>
                    <img
                      src={
                        member.photo
                          ? member.photo
                          : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU-rxXTrx4QdTdwIpw938VLL8EuJiVhCelkQ&s'
                      }
                      alt="member"
                      className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition"
                    />
                  </Link>
                </td>
                <td className="p-3 border-b">{member.name}</td>
                <td className="p-3 border-b">{member.rfid_code}</td>
                <td className="p-3 border-b">{member.membership_number}</td>
                <td className="p-3 border-b">{member.national_id}</td>
                <td className="p-3 border-b">{member.phone}</td>
                <td className="p-3 border-b">{member.club_name}</td>
                <td className="p-3 border-b">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(member)}
                      className="text-green-700 text-xl"
                      title="Edit"
                    >
                      <CiEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(member)}
                      className="text-red-500 text-xl"
                      title="Delete"
                    >
                      <CiTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* Updated Pagination Controls */}
      <div className="flex justify-between items-center mt-4" dir="rtl">
        {pagination.count === 0 && (
          <div className="text-sm text-gray-600">لا توجد أعضاء لعرضهم</div>
        )}
        {pagination.count > 0 && (
          <>
            <div className="text-sm text-gray-600">
              عرض {(currentPage - 1) * itemsPerPage + 1} إلى{' '}
              {Math.min(currentPage * itemsPerPage, pagination.count)} من {pagination.count} عضو
            </div>
            <div className="flex gap-2">
              {/* First Page Button */}
              <button
                onClick={() => paginate(1)}
                disabled={currentPage === 1 || pagination.count === 0}
                className={`px-3 py-1 rounded ${
                  currentPage === 1 || pagination.count === 0
                    ? 'bg-gray-200 opacity-50 cursor-not-allowed'
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                الأول
              </button>

              {/* Previous Page Button */}
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={!pagination.previous || pagination.count === 0}
                className={`px-3 py-1 rounded ${
                  !pagination.previous || pagination.count === 0
                    ? 'bg-gray-200 opacity-50 cursor-not-allowed'
                    : 'bg-blue-700 text-white hover:bg-blue-800'
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

                if (end - start + 1 < maxButtons) {
                  if (currentPage <= sideButtons) {
                    end = Math.min(totalPages, maxButtons);
                  } else {
                    start = Math.max(1, totalPages - maxButtons + 1);
                  }
                }

                return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => paginate(page)}
                      disabled={pagination.count === 0}
                      className={`px-3 py-1 rounded ${
                        currentPage === page && pagination.count > 0
                          ? 'bg-blue-700 text-white'
                          : 'bg-gray-200 hover:bg-gray-300'
                      } ${pagination.count === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {page}
                    </button>
                  )
                );
              })()}

              {/* Next Page Button */}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={!pagination.next || pagination.count === 0}
                className={`px-3 py-1 rounded ${
                  !pagination.next || pagination.count === 0
                    ? 'bg-gray-200 opacity-50 cursor-not-allowed'
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                التالي
              </button>

              {/* Last Page Button */}
              <button
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages || pagination.count === 0}
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages || pagination.count === 0
                    ? 'bg-gray-200 opacity-50 cursor-not-allowed'
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                الأخير
              </button>
            </div>
          </>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-40 bg-[rgba(0,0,0,0.2)]">
          <div className="bg-white p-6 rounded-lg w-1/3 relative">
            <button
              onClick={closeAddModal}
              className="absolute top-2 right-3 text-xl"
            >
              ×
            </button>
            <AddMember closeAddModal={closeAddModal} />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 flex justify-center items-center z-40 bg-[rgba(0,0,0,0.2)]"
        >
          <div className="modal relative bg-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">تأكيد الحذف</h3>
            <p>
              هل أنت متأكد من حذف <strong>{selectedMember?.name}</strong>؟
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                إلغاء
              </button>
              <button onClick={confirmDelete} className="bg-red-600 text-white px-4 py-2 rounded">
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedMember && (
        <div className="fixed inset-0 flex justify-center items-center z-40 bg-[rgba(0,0,0,0.2)]">
          <div className="modal relative bg-white p-6 rounded-lg w-1/2">
            <h3 className="text-lg font-semibold mb-4 text-right">تعديل العضو</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex flex-col">
                  <label className="text-right mb-1">الاسم الكامل</label>
                  <input
                    type="text"
                    name="name"
                    value={selectedMember.name}
                    onChange={handleEditChange}
                    className="border px-3 py-2 rounded text-right"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-right mb-1">رقم العضوية</label>
                  <input
                    type="text"
                    name="membership_number"
                    value={selectedMember.membership_number}
                    onChange={handleEditChange}
                    className="border px-3 py-2 rounded text-right"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-right mb-1">الرقم القومي</label>
                  <input
                    type="text"
                    name="national_id"
                    value={selectedMember.national_id}
                    onChange={handleEditChange}
                    className="border px-3 py-2 rounded text-right"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-right mb-1">رقم الهاتف الأساسي</label>
                  <input
                    type="text"
                    name="phone"
                    value={selectedMember.phone}
                    onChange={handleEditChange}
                    className="border px-3 py-2 rounded text-right"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-right mb-1">رقم الهاتف الثانوي</label>
                  <input
                    type="text"
                    name="phone2"
                    value={selectedMember.phone2 || ""}
                    onChange={handleEditChange}
                    className="border px-3 py-2 rounded text-right"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex flex-col">
                  <label className="text-right mb-1">كود البطاقة (RFID)</label>
                  <input
                    type="text"
                    name="rfid_code"
                    value={selectedMember.rfid_code || ""}
                    onChange={handleEditChange}
                    className="border px-3 py-2 rounded text-right"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-right mb-1">الوظيفة</label>
                  <input
                    type="text"
                    name="job"
                    value={selectedMember.job || ""}
                    onChange={handleEditChange}
                    className="border px-3 py-2 rounded text-right"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-right mb-1">اسم النادي</label>
                  <input
                    type="text"
                    name="club_name"
                    value={selectedMember.club_name}
                    disabled
                    className="border px-3 py-2 rounded text-right bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-right mb-1">العنوان</label>
                  <input
                    type="text"
                    name="address"
                    value={selectedMember.address || ""}
                    onChange={handleEditChange}
                    className="border px-3 py-2 rounded text-right"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-right mb-1">ملاحظات</label>
                  <textarea
                    name="note"
                    value={selectedMember.note || ""}
                    onChange={handleEditChange}
                    className="border px-3 py-2 rounded text-right"
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                إلغاء
              </button>
              <button
                onClick={handleEditSubmit}
                className="bg-blue-600 text-white px-4 py-2 rounded"
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