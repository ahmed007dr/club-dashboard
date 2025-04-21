import React, { useState } from 'react';

const fakeShifts = [
  {
    staffId: 'S001',
    date: '2025-04-20',
    shiftStart: '08:00 AM',
    shiftEnd: '04:00 PM',
    approvedBy: 'Manager01',
    clubId: 'C001'
  },
  {
    staffId: 'S002',
    date: '2025-04-20',
    shiftStart: '10:00 AM',
    shiftEnd: '06:00 PM',
    approvedBy: 'Manager02',
    clubId: 'C002'
  },
  {
    staffId: 'S003',
    date: '2025-04-21',
    shiftStart: '09:00 AM',
    shiftEnd: '05:00 PM',
    approvedBy: 'Manager01',
    clubId: 'C001'
  },
  {
    staffId: 'S004',
    date: '2025-04-21',
    shiftStart: '12:00 PM',
    shiftEnd: '08:00 PM',
    approvedBy: 'Manager03',
    clubId: 'C003'
  },
  {
    staffId: 'S005',
    date: '2025-04-22',
    shiftStart: '07:00 AM',
    shiftEnd: '03:00 PM',
    approvedBy: 'Manager02',
    clubId: 'C002'
  },
  {
    staffId: 'S006',
    date: '2025-04-22',
    shiftStart: '02:00 PM',
    shiftEnd: '10:00 PM',
    approvedBy: 'Manager01',
    clubId: 'C001'
  },
  {
    staffId: 'S007',
    date: '2025-04-23',
    shiftStart: '06:00 AM',
    shiftEnd: '02:00 PM',
    approvedBy: 'Manager03',
    clubId: 'C003'
  },
  {
    staffId: 'S008',
    date: '2025-04-23',
    shiftStart: '08:00 AM',
    shiftEnd: '04:00 PM',
    approvedBy: 'Manager01',
    clubId: 'C001'
  },
  {
    staffId: 'S009',
    date: '2025-04-24',
    shiftStart: '11:00 AM',
    shiftEnd: '07:00 PM',
    approvedBy: 'Manager02',
    clubId: 'C002'
  },
  {
    staffId: 'S010',
    date: '2025-04-24',
    shiftStart: '01:00 PM',
    shiftEnd: '09:00 PM',
    approvedBy: 'Manager03',
    clubId: 'C003'
  }
];

const Staff = () => {
    const [shifts, setShifts] = useState(fakeShifts);
    const [selectedShift, setSelectedShift] = useState(null);
    const [modalType, setModalType] = useState(''); // 'view' | 'edit' | 'delete'
  
    const handleOpenModal = (type, shift) => {
      setModalType(type);
      setSelectedShift(shift);
    };
  
    const handleCloseModal = () => {
      setModalType('');
      setSelectedShift(null);
    };
  
    const handleDelete = () => {
      setShifts(shifts.filter(s => s.id !== selectedShift.id));
      handleCloseModal();
    };
  
    const handleEditSubmit = (e) => {
      e.preventDefault();
      setShifts(shifts.map(s => (s.id === selectedShift.id ? selectedShift : s)));
      handleCloseModal();
    };
  
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Staff Shifts</h1>
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Staff ID</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Shift Start</th>
              <th className="p-2 border">Shift End</th>
              <th className="p-2 border">Approved By</th>
              <th className="p-2 border">Club ID</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <tr key={shift.id} className="text-center">
                <td className="border p-2">{shift.staffId}</td>
                <td className="border p-2">{shift.date}</td>
                <td className="border p-2">{shift.shiftStart}</td>
                <td className="border p-2">{shift.shiftEnd}</td>
                <td className="border p-2">{shift.approvedBy}</td>
                <td className="border p-2">{shift.clubId}</td>
                <td className="border p-2 flex gap-2 justify-center">
                  <button onClick={() => handleOpenModal('view', shift)} className="text-blue-500">View</button>
                  <button onClick={() => handleOpenModal('edit', shift)} className="text-green-500">Edit</button>
                  <button onClick={() => handleOpenModal('delete', shift)} className="text-red-500">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
  
        {/* Delete Modal */}
        {modalType === 'delete' && selectedShift && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-80">
              <h2 className="text-lg font-semibold mb-4">Are you sure you want to delete this shift?</h2>
              <div className="flex justify-end gap-4">
                <button onClick={handleCloseModal} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded">Delete</button>
              </div>
            </div>
          </div>
        )}
  
        {/* View Modal */}
        {modalType === 'view' && selectedShift && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-96">
              <h2 className="text-xl font-bold mb-4">Shift Details</h2>
              <ul className="text-sm space-y-2">
                <li><strong>Staff ID:</strong> {selectedShift.staffId}</li>
                <li><strong>Date:</strong> {selectedShift.date}</li>
                <li><strong>Shift Start:</strong> {selectedShift.shiftStart}</li>
                <li><strong>Shift End:</strong> {selectedShift.shiftEnd}</li>
                <li><strong>Approved By:</strong> {selectedShift.approvedBy}</li>
                <li><strong>Club ID:</strong> {selectedShift.clubId}</li>
              </ul>
              <div className="mt-6 text-right">
                <button onClick={handleCloseModal} className="px-4 py-2 bg-blue-500 text-white rounded">Close</button>
              </div>
            </div>
          </div>
        )}
  
        {/* Edit Modal */}
        {modalType === 'edit' && selectedShift && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-96">
              <h2 className="text-xl font-bold mb-4">Edit Shift</h2>
              <form onSubmit={handleEditSubmit} className="space-y-3">
                {['staffId', 'date', 'shiftStart', 'shiftEnd', 'approvedBy', 'clubId'].map(field => (
                  <div key={field}>
                    <label className="block text-sm font-medium capitalize">{field}</label>
                    <input
                      type="text"
                      value={selectedShift[field]}
                      onChange={(e) =>
                        setSelectedShift({ ...selectedShift, [field]: e.target.value })
                      }
                      className="w-full border px-3 py-1 rounded"
                    />
                  </div>
                ))}
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={handleCloseModal} type="button" className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

export default Staff;
