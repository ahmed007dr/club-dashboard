import React, { useEffect, useState } from 'react';

const Attendance = () => {
  const [attendances, setAttendances] = useState([]);
  const [entryLogs, setEntryLogs] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [entryLogsLoading, setEntryLogsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newAttendance, setNewAttendance] = useState({
    subscription: '',
    attendance_date: '',
  });
  const [newEntryLog, setNewEntryLog] = useState({
    club: '',
    member: '',
  });

  // Fetch attendances
  useEffect(() => {
    const fetchAttendances = async () => {
      try {
        const token = localStorage.getItem('token'); // Retrieve token from localStorage
        const response = await fetch('http://127.0.0.1:8000/attendance/api/attendances/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch attendances.');
        }

        const data = await response.json();
        console.log(data);
        
        setAttendances(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchAttendances();
  }, []);

  // Fetch entry logs
  useEffect(() => {
    const fetchEntryLogs = async () => {
      try {
        const token = localStorage.getItem('token'); // Retrieve token from localStorage
        const response = await fetch('http://127.0.0.1:8000/attendance/api/entry-logs/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch entry logs.');
        }

        const data = await response.json();
        setEntryLogs(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setEntryLogsLoading(false);
      }
    };

    fetchEntryLogs();
  }, []);

  // Handle adding new attendance
  const handleAddAttendance = async (e) => {
    e.preventDefault();

    // Input validation
    if (!validateAttendance()) return;

    try {
      const token = localStorage.getItem('token'); // Retrieve token from localStorage
      const response = await fetch('http://127.0.0.1:8000/attendance/api/attendances/add/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAttendance),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add attendance.');
      }

      // Clear the form
      setNewAttendance({ subscription: '', attendance_date: '' });

      // Refresh the list
      const refreshedResponse = await fetch('http://127.0.0.1:8000/attendance/api/attendances/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const refreshedData = await refreshedResponse.json();
      setAttendances(refreshedData);
    } catch (error) {
      setError(error.message);
    }
  };

  // Handle adding new entry log
  const handleAddEntryLog = async (e) => {
    e.preventDefault();

    // Input validation
    if (!validateEntryLog()) return;

    try {
      const token = localStorage.getItem('token'); // Retrieve token from localStorage
      const response = await fetch('http://127.0.0.1:8000/attendance/api/entry-logs/add/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEntryLog),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add entry log.');
      }

      // Clear the form
      setNewEntryLog({ club: '', member: '' });

      // Refresh the list
      const refreshedResponse = await fetch('http://127.0.0.1:8000/attendance/api/entry-logs/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const refreshedData = await refreshedResponse.json();
      setEntryLogs(refreshedData);
    } catch (error) {
      setError(error.message);
    }
  };

  // Handle deleting attendance
  const handleDeleteAttendance = async (id) => {
    try {
      const token = localStorage.getItem('token'); // Retrieve token from localStorage
      const response = await fetch(`http://127.0.0.1:8000/attendance/api/attendances/${id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete attendance: ${response.statusText}`);
      }

      // Update the state by filtering out the deleted attendance
      setAttendances(attendances.filter((att) => att.id !== id));
    } catch (error) {
      console.error('Error deleting attendance:', error);
    }
  };

  // Handle deleting entry log
  const handleDeleteEntryLog = async (id) => {
    try {
      const token = localStorage.getItem('token'); // Retrieve token from localStorage
      const response = await fetch(`http://127.0.0.1:8000/api/entry-logs/${id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete entry log: ${response.statusText}`);
      }

      // Update the state by filtering out the deleted entry log
      setEntryLogs(entryLogs.filter((log) => log.id !== id));
    } catch (error) {
      console.error('Error deleting entry log:', error);
    }
  };

  // Input validation for attendance
  const validateAttendance = () => {
    if (!newAttendance.subscription || !newAttendance.attendance_date) {
      alert('Please fill in all fields for attendance.');
      return false;
    }
    return true;
  };

  // Input validation for entry log
  const validateEntryLog = () => {
    if (!newEntryLog.club || !newEntryLog.member) {
      alert('Please fill in all fields for entry log.');
      return false;
    }
    return true;
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Attendance and Entry Logs</h2>

      {/* Display error message */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Form to add attendance */}
      <form onSubmit={handleAddAttendance} className="mb-6 space-y-4">
        <h3 className="text-lg font-semibold mb-2">Add Attendance</h3>
        <div>
          <label className="block text-sm mb-1">Subscription ID</label>
          <input
            type="text"
            value={newAttendance.subscription}
            onChange={(e) => setNewAttendance({ ...newAttendance, subscription: e.target.value })}
            className="border px-3 py-2 rounded w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Attendance Date</label>
          <input
            type="date"
            value={newAttendance.attendance_date}
            onChange={(e) => setNewAttendance({ ...newAttendance, attendance_date: e.target.value })}
            className="border px-3 py-2 rounded w-full"
            required
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
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
            value={newEntryLog.club}
            onChange={(e) => setNewEntryLog({ ...newEntryLog, club: e.target.value })}
            className="border px-3 py-2 rounded w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Member ID</label>
          <input
            type="text"
            value={newEntryLog.member}
            onChange={(e) => setNewEntryLog({ ...newEntryLog, member: e.target.value })}
            className="border px-3 py-2 rounded w-full"
            required
          />
        </div>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
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
              <tr key={attendance.id} className="text-center hover:bg-gray-100 transition">
                <td className="p-2">{attendance.id}</td>
                <td className="p-2">{attendance.subscription}</td>
                <td className="p-2">{attendance.attendance_date}</td>
                <td className="p-2">{attendance.member_details?.name || 'N/A'}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleDeleteAttendance(attendance.id)}
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
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entryLogs.map((log) => (
              <tr key={log.id} className="text-center hover:bg-gray-100 transition">
                <td className="p-2">{log.id}</td>
                <td className="p-2">{log.club?.name || 'N/A'}</td>
                <td className="p-2">{log.member?.name || 'N/A'}</td>
                <td className="p-2">{log.approved_by?.name || 'N/A'}</td>
                <td className="p-2">{log.timestamp}</td>
                <td className="p-2">{log.subscription || 'N/A'}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleDeleteEntryLog(log.id)}
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
    </div>
  );
};

export default Attendance;