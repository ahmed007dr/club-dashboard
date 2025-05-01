import React, { useEffect, useState } from 'react';
import { CiTrash } from 'react-icons/ci';
import { CiEdit } from 'react-icons/ci';
import { FaEye } from "react-icons/fa";
import { RiUserLine } from 'react-icons/ri';
import { useDispatch, useSelector } from 'react-redux';
import { deleteStaff, editStaff, fetchStaff } from '@/redux/slices/staff';

const Staff = () => {
  const [selectedShift, setSelectedShift] = useState(null);
  const [modalType, setModalType] = useState(''); // 'view' | 'edit' | 'delete'
  const [formData, setFormData] = useState({}); // Form inputs
  const [filters, setFilters] = useState({
    club: '',
    staff: '',
    date: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Configurable items per page

  const staff = useSelector((state) => state.staff.items || []); // Fallback to empty array
  const dispatch = useDispatch();

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

  // Filter staff based on filter inputs
  const filteredStaff = staff.filter((shift) => {
    const clubMatch = filters.club
      ? shift.club_details?.name.toLowerCase().includes(filters.club.toLowerCase())
      : true;
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
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Open modal and populate formData
  const handleOpenModal = (type, shift) => {
    setModalType(type);
    setSelectedShift(shift);

    if (type === 'edit') {
      setFormData({
        id: shift.id,
        date: shift.date,
        shift_start: shift.shift_start,
        shift_end: shift.shift_end,
        club: shift.club_details.id,
        staff: `${shift.staff_details.id}`,
        approved_by: shift.approved_by_details
          ? `${shift.approved_by_details.id}`
          : null,
      });
    }
  };

  const handleCloseModal = () => {
    setModalType('');
    setSelectedShift(null);
    setFormData({});
  };

  const confirmDelete = () => {
    dispatch(deleteStaff(selectedShift.id));
    handleCloseModal();
    setCurrentPage(1); // Reset to first page after deletion
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    dispatch(editStaff({ id: selectedShift.id, updatedStaff: formData }));
    handleCloseModal();
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-start space-x-3">
        <RiUserLine className=" text-2xl" />
        <h2 className="text-2xl font-semibold mb-4">الموظفون</h2>

      </div>

      {/* Filter Inputs */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
  <div>
    <label className="block text-sm font-medium">النادي</label>
    <input
      type="text"
      name="club"
      value={filters.club}
      onChange={handleFilterChange}
      placeholder="تصفية حسب اسم النادي"
      className="w-full border px-3 py-1 rounded"
    />
  </div>
  <div>
    <label className="block text-sm font-medium">الطاقم</label>
    <input
      type="text"
      name="staff"
      value={filters.staff}
      onChange={handleFilterChange}
      placeholder="تصفية حسب اسم الطاقم"
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
                    : 'Not Approved'}
                </td>
                <td className="p-2 flex gap-2 justify-center">
                  <button onClick={() => handleOpenModal('view', shift)} className="btn-blue">
                    <FaEye />
                  </button>
                  <button onClick={() => handleOpenModal('edit', shift)} className="btn-green">
                    <CiEdit />
                  </button>
                  <button onClick={() => handleOpenModal('delete', shift)} className="btn-red">
                    <CiTrash />
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <div>
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredStaff.length)} of {filteredStaff.length} shifts
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => paginate(page)}
              className={`px-3 py-1 rounded ${currentPage === page ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      {modalType === 'delete' && selectedShift && (
        <div className="fixed inset-0 z-40 flex justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="modal bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4">Are you sure you want to delete this shift?</h2>
            <div className="flex justify-end gap-4">
              <button onClick={handleCloseModal} className="px-4 py-2 bg-gray-300 rounded">
                Cancel
              </button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {modalType === 'view' && selectedShift && (
        <div className="fixed inset-0 z-40 flex justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="modal bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Shift Details</h2>
            <ul className="text-sm space-y-2">
              <li><strong>Shift ID:</strong> {selectedShift.id}</li>
              <li><strong>Date:</strong> {selectedShift.date}</li>
              <li><strong>Shift Start:</strong> {selectedShift.shift_start}</li>
              <li><strong>Shift End:</strong> {selectedShift.shift_end}</li>
              <li><strong>Club:</strong> {selectedShift.club_details?.name}</li>
              <li><strong>Staff:</strong> {`${selectedShift.staff_details?.first_name} ${selectedShift.staff_details?.last_name}`}</li>
              <li><strong>Approved By:</strong> {selectedShift.approved_by_details
                ? `${selectedShift.approved_by_details.first_name} ${selectedShift.approved_by_details.last_name}`
                : 'Not Approved'}</li>
            </ul>
            <div className="mt-6 text-right">
              <button onClick={handleCloseModal} className="px-4 py-2 bg-gray-300 rounded">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modalType === 'edit' && selectedShift && (
  <div className="fixed inset-0 z-40 flex justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
    <div className="modal bg-white p-6 rounded-lg shadow-lg w-96">
      <h2 className="text-xl font-bold mb-4">Edit Shift</h2>
      <form onSubmit={handleEditSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Date</label>
          <input
            type="date"
            value={formData.date || ''}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full border px-3 py-1 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Shift Start</label>
          <input
            type="time"
            value={formData.shift_start || ''}
            onChange={(e) => setFormData({ ...formData, shift_start: e.target.value })}
            className="w-full border px-3 py-1 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Shift End</label>
          <input
            type="time"
            value={formData.shift_end || ''}
            onChange={(e) => setFormData({ ...formData, shift_end: e.target.value })}
            className="w-full border px-3 py-1 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Club</label>
          <input
            type="text"
            value={formData.club || ''}
            onChange={(e) => setFormData({ ...formData, club: e.target.value })}
            className="w-full border px-3 py-1 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Staff</label>
          <input
            type="text"
            value={formData.staff || ''}
            onChange={(e) => setFormData({ ...formData, staff: e.target.value })}
            className="w-full border px-3 py-1 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Approved By</label>
          <input
            type="text"
            value={formData.approved_by || ''}
            onChange={(e) => setFormData({ ...formData, approved_by: e.target.value })}
            className="w-full border px-3 py-1 rounded"
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={handleCloseModal} type="button" className="px-4 py-2 bg-gray-300 rounded">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
)}

    </div>
  );
};

export default Staff;