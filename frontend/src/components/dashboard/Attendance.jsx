import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addAttendance,
  deleteAttendance,
  fetchAttendances,
} from '@/redux/slices/AttendanceSlice';
import { addEntryLog, fetchEntryLogs } from '@/redux/slices/EntryLogsSlice';

const Attendance = () => {
  const dispatch = useDispatch();

  // Select attendance data from Redux store
  const { attendances, loading: attendanceLoading, error: attendanceError } =
    useSelector((state) => state.attendance);

  // Select entry logs data from Redux store
  const { entryLogs, loading: entryLogsLoading, error: entryLogsError } =
    useSelector((state) => state.entryLogs);

  // State for new attendance form
  const [newAttendance, setNewAttendance] = useState({
    subscription: '',
    attendance_date: '',
  });

  // State for new entry log form
  const [newEntryLog, setNewEntryLog] = useState({
    club: '',
    member: '',
  });

  // Fetch attendances and entry logs on component mount
  useEffect(() => {
    dispatch(fetchAttendances());
    dispatch(fetchEntryLogs());
    console.log(entryLogs);

    
  }, [dispatch]);

  // Handle input changes for attendance form
  const handleAttendanceInputChange = (e) => {
    const { name, value } = e.target;
    setNewAttendance({ ...newAttendance, [name]: value });
  };

  // Handle input changes for entry log form
  const handleEntryLogInputChange = (e) => {
    const { name, value } = e.target;
    setNewEntryLog({ ...newEntryLog, [name]: value });
  };

  // Handle adding new attendance
  const handleAddAttendance = (e) => {
    e.preventDefault();
    if (!newAttendance.subscription || !newAttendance.attendance_date) {
      alert('Please fill in all fields for attendance.');
      return;
    }
    console.log('Adding attendance:', newAttendance);
    console.log();
    
    dispatch(addAttendance(newAttendance));
    setNewAttendance({ subscription: '', attendance_date: '' }); // Clear form
  };

  // Handle adding new entry log
  const handleAddEntryLog = (e) => {
    e.preventDefault();
    if (!newEntryLog.club || !newEntryLog.member) {
      alert('Please fill in all fields for entry log.');
      return;
    }
    console.log('Adding entry log:', newEntryLog);
    console.log(entryLogs);
    
    
    dispatch(addEntryLog(newEntryLog));
    setNewEntryLog({ club: '', member: '' }); // Clear form
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Attendance and Entry Logs</h2>

      {/* Display error messages */}
      {(attendanceError || entryLogsError) && (
        <p className="text-red-500 mb-4">
          {attendanceError || entryLogsError}
        </p>
      )}

      {/* Form to add attendance */}
      <form onSubmit={handleAddAttendance} className="mb-6 space-y-4">
        <h3 className="text-lg font-semibold mb-2">Add Attendance</h3>

        <div>
          <label className="block text-sm mb-1">Subscription ID</label>
          <input
            type="text"
            name="subscription"
            value={newAttendance.subscription}
            onChange={handleAttendanceInputChange}
            className="border px-3 py-2 rounded w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Attendance Date</label>
          <input
            type="date"
            name="attendance_date"
            value={newAttendance.attendance_date}
            onChange={handleAttendanceInputChange}
            className="border px-3 py-2 rounded w-full"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add Attendance
        </button>
      </form>

      {/* Form to add entry log */}
      <form onSubmit={handleAddEntryLog} className="mb-6 space-y-4">
        <h3 className="text-lg font-semibold mb-2">Add Entry Log</h3>

        <div>
          <label className="block text-sm mb-1">Club ID</label>
          <input
            type="text"
            name="club"
            value={newEntryLog.club}
            onChange={handleEntryLogInputChange}
            className="border px-3 py-2 rounded w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Member ID</label>
          <input
            type="text"
            name="member"
            value={newEntryLog.member}
            onChange={handleEntryLogInputChange}
            className="border px-3 py-2 rounded w-full"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Add Entry Log
        </button>
      </form>

      {/* Attendance Table */}
      <h3 className="text-lg font-semibold mt-6 mb-4">Attendance Records</h3>
      {attendanceLoading ? (
        <p>Loading attendances...</p>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Subscription</th>
              <th className="p-2">Attendance Date</th>
              <th className="p-2">Member Name</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {attendances.map((attendance) => (
              <tr key={attendance.id || attendance.subscription} className="text-center hover:bg-gray-100 transition">
                <td className="p-2">{attendance.id}</td>
                <td className="p-2">{attendance.subscription}</td>
                <td className="p-2">{attendance.attendance_date}</td>
                <td className="p-2">{attendance.member_details?.name || 'N/A'}</td>
                <td className="p-2">
                  <button
                    onClick={() => dispatch(deleteAttendance(attendance.id))}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Entry Logs Table */}
      <h3 className="text-lg font-semibold mt-6 mb-4">Entry Logs</h3>
      {entryLogsLoading ? (
        <p>Loading entry logs...</p>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Club</th>
              <th className="p-2">Member</th>
              <th className="p-2">Approved By</th>
              <th className="p-2">Timestamp</th>
              <th className="p-2">Subscription</th>
            </tr>
          </thead>
          <tbody>
            {entryLogs.map((log) => (
              <tr key={log.id || log.timestamp} className="text-center hover:bg-gray-100 transition">
                <td className="p-2">{log.id}</td>
                <td className="p-2">{log.club_details?.name || 'N/A'}</td>
                <td className="p-2">{log.member_details?.name || 'N/A'}</td>
                <td className="p-2">{log.approved_by_details?.id || 'N/A'}</td>
                <td className="p-2">{log.timestamp}</td>
                <td className="p-2">{log.subscription_details?.id || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Attendance;