import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BASE_URL from '../../config/api';
import { Link } from 'react-router-dom';

function UserList() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${BASE_URL}/accounts/api/users/`, { headers });

        const sorted = response.data.sort((a, b) => b.id - a.id); // ترتيب من الأحدث
        setUsers(sorted);
      } catch (error) {
        console.error('❌ خطأ في جلب المستخدمين:', error);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`;
    return (
      user.username?.toLowerCase().includes(filter.toLowerCase()) ||
      fullName.toLowerCase().includes(filter.toLowerCase()) ||
      user.email?.toLowerCase().includes(filter.toLowerCase()) ||
      user.role?.toLowerCase().includes(filter.toLowerCase()) ||
      (user.is_active ? 'نشط' : 'غير نشط').includes(filter) ||
      user.rfid_code?.toString().includes(filter)
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLast = currentPage * usersPerPage;
  const indexOfFirst = indexOfLast - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirst, indexOfLast);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">تقارير الموظفين</h1>

      <input
        type="text"
        placeholder="🔍 ابحث عن مستخدم أو بريد أو دور أو حالة أو كود RFID"
        className="mb-4 w-full px-4 py-2 border rounded shadow-sm focus:outline-none focus:ring text-right"
        value={filter}
        onChange={e => setFilter(e.target.value)}
      />

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 bg-white text-right">
          <thead className="">
            <tr>
              <th className="px-4 py-3">اسم المستخدم</th>
              <th className="px-4 py-3">الاسم الكامل</th>
              <th className="px-4 py-3">البريد الإلكتروني</th>
              <th className="px-4 py-3">الدور</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">كود RFID</th>
              <th className="px-4 py-3">النادي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {currentUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                 <Link to={`/attendance/${user.id}`}>{user.username}</Link>
                <td className="px-4 py-2">
                  {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : '—'}
                </td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{user.role}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded  text-sm ${user.is_active ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
                    {user.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </td>
                <td className="px-4 py-2">{user.rfid_code || '—'}</td>
                <td className="px-4 py-2">{user.club?.name || '—'}</td>
              
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex justify-center gap-4">
        <button
          onClick={prevPage}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          السابق
        </button>
        <span className="px-2 py-2 text-sm text-gray-600">
          صفحة {currentPage} من {totalPages}
        </span>
        <button
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          التالي
        </button>
      </div>
    </div>
  );
}

export default UserList;

