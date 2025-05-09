<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shift & Attendance Management</title>
    <script src="https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.development.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.development.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/babel-standalone@7.22.10/babel.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.4.0/dist/axios.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        const { useState, useEffect } = React;

        // Main App Component
        function App() {
            const [user, setUser] = useState({ role: 'staff', club: 1 }); // Mock user data
            const [activeTab, setActiveTab] = useState('shifts');

            return (
                <div className="min-h-screen bg-gray-100">
                    <header className="bg-blue-600 text-white p-4">
                        <h1 className="text-2xl font-bold">Shift & Attendance Management</h1>
                        <nav className="mt-2">
                            <button
                                className={`mr-4 ${activeTab === 'shifts' ? 'underline' : ''}`}
                                onClick={() => setActiveTab('shifts')}
                            >
                                Shifts
                            </button>
                            <button
                                className={`mr-4 ${activeTab === 'attendance' ? 'underline' : ''}`}
                                onClick={() => setActiveTab('attendance')}
                            >
                                Attendance
                            </button>
                            {user.role === 'owner' && (
                                <button
                                    className={`mr-4 ${activeTab === 'reports' ? 'underline' : ''}`}
                                    onClick={() => setActiveTab('reports')}
                                >
                                    Reports
                                </button>
                            )}
                        </nav>
                    </header>
                    <main className="container mx-auto p-4">
                        {activeTab === 'shifts' && <ShiftManagement user={user} />}
                        {activeTab === 'attendance' && <AttendanceManagement user={user} />}
                        {activeTab === 'reports' && user.role === 'owner' && <Reports user={user} />}
                    </main>
                </div>
            );
        }

        // Shift Management Component
        function ShiftManagement({ user }) {
            const [shifts, setShifts] = useState([]);
            const [showForm, setShowForm] = useState(false);
            const [editShift, setEditShift] = useState(null);

            useEffect(() => {
                axios.get('/api/shifts/').then(res => setShifts(res.data));
            }, []);

            return (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Shift Management</h2>
                    {user.role === 'owner' && (
                        <button
                            className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
                            onClick={() => {
                                setShowForm(true);
                                setEditShift(null);
                            }}
                        >
                            Add Shift
                        </button>
                    )}
                    {showForm && (
                        <ShiftForm
                            user={user}
                            editShift={editShift}
                            onClose={() => setShowForm(false)}
                            onSave={() => {
                                setShowForm(false);
                                axios.get('/api/shifts/').then(res => setShifts(res.data));
                            }}
                        />
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {shifts.map(shift => (
                            <ShiftCard
                                key={shift.id}
                                shift={shift}
                                user={user}
                                onEdit={() => {
                                    setEditShift(shift);
                                    setShowForm(true);
                                }}
                                onDelete={() => {
                                    axios.delete(`/api/shifts/${shift.id}/delete/`).then(() => {
                                        setShifts(shifts.filter(s => s.id !== shift.id));
                                    });
                                }}
                            />
                        ))}
                    </div>
                </div>
            );
        }

        // Shift Card Component
        function ShiftCard({ shift, user, onEdit, onDelete }) {
            return (
                <div className="bg-white p-4 rounded shadow">
                    <h3 className="font-bold">{shift.staff_details.username}</h3>
                    <p>Date: {shift.date}</p>
                    <p>Time: {shift.shift_start} - {shift.shift_end}</p>
                    <p>Club: {shift.club_details.name}</p>
                    {user.role === 'owner' && (
                        <div className="mt-2">
                            <button
                                className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                                onClick={onEdit}
                            >
                                Edit
                            </button>
                            <button
                                className="bg-red-500 text-white px-2 py-1 rounded"
                                onClick={onDelete}
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        // Shift Form Component
        function ShiftForm({ user, editShift, onClose, onSave }) {
            const [formData, setFormData] = useState({
                staff: '',
                date: '',
                shift_start: '',
                shift_end: '',
                club: user.club,
                approved_by: user.id
            });

            useEffect(() => {
                if (editShift) {
                    setFormData({
                        staff: editShift.staff,
                        date: editShift.date,
                        shift_start: editShift.shift_start,
                        shift_end: editShift.shift_end,
                        club: editShift.club,
                        approved_by: editShift.approved_by
                    });
                }
            }, [editShift]);

            const handleSubmit = () => {
                const url = editShift ? `/api/shifts/${editShift.id}/edit/` : '/api/shifts/add/';
                const method = editShift ? 'put' : 'post';
                axios({ method, url, data: formData }).then(() => onSave());
            };

            return (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">
                            {editShift ? 'Edit Shift' : 'Add Shift'}
                        </h3>
                        <input
                            type="text"
                            placeholder="Staff ID"
                            value={formData.staff}
                            onChange={e => setFormData({ ...formData, staff: e.target.value })}
                            className="w-full p-2 mb-2 border rounded"
                        />
                        <input
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            className="w-full p-2 mb-2 border rounded"
                        />
                        <input
                            type="time"
                            value={formData.shift_start}
                            onChange={e => setFormData({ ...formData, shift_start: e.target.value })}
                            className="w-full p-2 mb-2 border rounded"
                        />
                        <input
                            type="time"
                            value={formData.shift_end}
                            onChange={e => setFormData({ ...formData, shift_end: e.target.value })}
                            className="w-full p-2 mb-2 border rounded"
                        />
                        <div className="flex justify-end">
                            <button
                                className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-blue-500 text-white px-4 py-2 rounded"
                                onClick={handleSubmit}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Attendance Management Component
        function AttendanceManagement({ user }) {
            const [rfidCode, setRfidCode] = useState('');
            const [message, setMessage] = useState('');

            const handleCheckIn = () => {
                axios.post('/api/check-in/', { rfid_code: rfidCode }).then(res => {
                    setMessage(`Check-in successful at ${new Date(res.data.check_in).toLocaleTimeString()}`);
                    setRfidCode('');
                }).catch(err => {
                    setMessage(err.response.data.error || 'Check-in failed');
                });
            };

            const handleCheckOut = () => {
                axios.post('/api/check-out/', { rfid_code: rfidCode }).then(res => {
                    setMessage(`Check-out successful at ${new Date(res.data.check_out).toLocaleTimeString()}`);
                    setRfidCode('');
                }).catch(err => {
                    setMessage(err.response.data.error || 'Check-out failed');
                });
            };

            return (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Attendance Management</h2>
                    <div className="bg-white p-4 rounded shadow">
                        <input
                            type="text"
                            placeholder="Enter RFID Code"
                            value={rfidCode}
                            onChange={e => setRfidCode(e.target.value)}
                            className="w-full p-2 mb-2 border rounded"
                        />
                        <div className="flex justify-between">
                            <button
                                className="bg-green-500 text-white px-4 py-2 rounded"
                                onClick={handleCheckIn}
                            >
                                Check In
                            </button>
                            <button
                                className="bg-red-500 text-white px-4 py-2 rounded"
                                onClick={handleCheckOut}
                            >
                                Check Out
                            </button>
                        </div>
                        {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
                    </div>
                </div>
            );
        }

        // Reports Component
        function Reports({ user }) {
            const [staffId, setStaffId] = useState('');
            const [report, setReport] = useState(null);
            const [missingCheckins, setMissingCheckins] = useState([]);

            useEffect(() => {
                axios.get('/api/missing-checkins/').then(res => setMissingCheckins(res.data));
            }, []);

            const fetchReport = () => {
                axios.get(`/api/staff/${staffId}/attendance/report/`).then(res => setReport(res.data));
            };

            return (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Reports</h2>
                    <div className="bg-white p-4 rounded shadow mb-4">
                        <h3 className="font-semibold mb-2">Attendance Report</h3>
                        <input
                            type="text"
                            placeholder="Staff ID"
                            value={staffId}
                            onChange={e => setStaffId(e.target.value)}
                            className="w-full p-2 mb-2 border rounded"
                        />
                        <button
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                            onClick={fetchReport}
                        >
                            Generate Report
                        </button>
                        {report && (
                            <div className="mt-4">
                                <p><strong>Staff:</strong> {report.staff_name}</p>
                                <p><strong>RFID Code:</strong> {report.rfid_code}</p>
                                <p><strong>Attendance Days:</strong> {report.attendance_days}</p>
                                <p><strong>Total Hours:</strong> {report.total_hours}</p>
                            </div>
                        )}
                    </div>
                    <div className="bg-white p-4 rounded shadow">
                        <h3 className="font-semibold mb-2">Missing Check-ins</h3>
                        {missingCheckins.length > 0 ? (
                            <ul>
                                {missingCheckins.map(mc => (
                                    <li key={mc.shift_id} className="mb-2">
                                        <p><strong>Staff:</strong> {mc.staff_name}</p>
                                        <p><strong>Club:</strong> {mc.club_name}</p>
                                        <p><strong>Shift:</strong> {mc.shift_start} - {mc.shift_end}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No missing check-ins today.</p>
                        )}
                    </div>
                </div>
            );
        }

        // Render the App
        ReactDOM.render(<App />, document.getElementById('root'));
    </script>
</body>
</html>