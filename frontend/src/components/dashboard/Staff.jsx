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
  const [formData, setFormData] = useState({}); // New state for form inputs

  const staff = useSelector((state) => state.staff.items || []); // Fallback to empty array
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchStaff()).unwrap();
        console.log("Staff fetched:", staff); // Log the fetched staff
      } catch (error) {
        console.error("Error fetching staff:", error);
      }
    };

    fetchData();
  }, [dispatch]);

  // Open modal and populate formData with selectedShift
  const handleOpenModal = (type, shift) => {
    setModalType(type);
    setSelectedShift(shift);

    if (type === 'edit') {
      setFormData({
        id: shift.id,
        date: shift.date,
        shift_start: shift.shift_start,
        shift_end: shift.shift_end,
        club: shift.club_details.id, // Use club name from nested object
        staff: `${shift.staff_details.id}`, // Combine first and last name
        approved_by: shift.approved_by_details
          ? `${shift.approved_by_details.id}`
          : null,
      });
    }
  };

  const handleCloseModal = () => {
    setModalType('');
    setSelectedShift(null);
    setFormData({}); // Reset formData when closing the modal
  };

  const confirmDelete = () => {
    dispatch(deleteStaff(selectedShift.id)); // Dispatch delete action
    handleCloseModal();
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    console.log("Form Data:", formData); // Log the form data before dispatching
    dispatch(editStaff({ id: selectedShift.id, updatedStaff: formData })); // Dispatch edit action
    handleCloseModal();
  };

  return (
    <div className="p-6">
      <div className="flex items-start space-x-3">
        <RiUserLine className="btn-brown text-2xl" />
        <h2 className="text-2xl font-semibold mb-4">Staff</h2>
      </div>
      <table className="w-full border text-sm">
        <thead>
          <tr>
            <th className="p-2">Shift ID</th>
            <th className="p-2">Date</th>
            <th className="p-2">Shift Start</th>
            <th className="p-2">Shift End</th>
            <th className="p-2">Club</th>
            <th className="p-2">Staff</th>
            <th className="p-2">Approved By</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(staff) &&
            staff.map((shift) => (
              <tr key={shift.id} className="text-center">
                <td className="p-2">{shift.id}</td>
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
                ?`${selectedShift.approved_by_details.first_name} ${selectedShift.approved_by_details.last_name}`
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
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full border px-3 py-1 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Shift Start</label>
                <input
                  type="time"
                  value={formData.shift_start}
                  onChange={(e) => setFormData({ ...formData, shift_start: e.target.value })}
                  className="w-full border px-3 py-1 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Shift End</label>
                <input
                  type="time"
                  value={formData.shift_end}
                  onChange={(e) => setFormData({ ...formData, shift_end: e.target.value })}
                  className="w-full border px-3 py-1 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Club</label>
                <input
                  type="text"
                  value={formData.club}
                  readOnly
                  className="w-full border px-3 py-1 rounded bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Staff</label>
                <input
                  type="text"
                  value={formData.staff}
                  readOnly
                  className="w-full border px-3 py-1 rounded bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Approved By</label>
                <input
                  type="text"
                  value={formData.approved_by}
                  readOnly
                  className="w-full border px-3 py-1 rounded bg-gray-100"
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