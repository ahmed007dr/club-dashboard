import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BASE_URL from '../../config/api';
import { Link } from 'react-router-dom';
import usePermission from '@/hooks/usePermission';
import { RiForbidLine } from 'react-icons/ri';

function UserList() {
  const canViewUsers = usePermission('view_user');
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [prevPageUrl, setPrevPageUrl] = useState(null);

  useEffect(() => {
    if (!canViewUsers) return;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        let url = `${BASE_URL}/accounts/api/users/`;
        const params = {};
        
        if (filter) {
          params.search = filter;
        }
        
        if (currentPage !== 1 && !filter) {
          url = nextPageUrl || prevPageUrl;
        }

        const response = await axios.get(url, { 
          headers,
          params 
        });

        setUsers(response.data.results);
        setCount(response.data.count);
        setNextPageUrl(response.data.next);
        setPrevPageUrl(response.data.previous);
        setTotalPages(Math.ceil(response.data.count / 20));
        setLoading(false);
      } catch (error) {
        console.error('❌ خطأ في جلب المستخدمين:', error);
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [canViewUsers, currentPage, filter]);

  if (!canViewUsers) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <RiForbidLine className="text-red-600 text-2xl" />
        </div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">لا يوجد صلاحية</h2>
        <p className="text-gray-500 max-w-md">
          ليس لديك الصلاحيات اللازمة لعرض المستخدمين. يرجى التواصل مع المسؤول.
        </p>
      </div>
    );
  }

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const startNumber = (currentPage - 1) * 20 + 1;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">تقارير الموظفين</h1>

      <input
        type="text"
        placeholder="🔍 ابحث عن مستخدم أو بريد أو دور أو حالة أو كود RFID"
        className="mb-4 w-full px-4 py-2 border rounded shadow-sm focus:outline-none focus:ring text-right"
        value={filter}
        onChange={e => {
          setFilter(e.target.value);
          setCurrentPage(1);
        }}
      />

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : (
        <>
          <div className="overflow-x-auto shadow-md rounded-lg" dir="rtl">
            {/* Table view for large screens (lg and up) */}
            <table className="hidden lg:table min-w-full divide-y divide-gray-200 bg-white text-right">
              <thead className="">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">اسم المستخدم</th>
                  <th className="px-4 py-3">الاسم الكامل</th>
                  <th className="px-4 py-3">البريد الإلكتروني</th>
                  <th className="px-4 py-3">الدور</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">كود RFID</th>
                  <th className="px-4 py-3">النادي</th>
                  <th className="px-4 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {users.length > 0 ? (
                  users.map((user, index) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-500">{startNumber + index}</td>
                      <td className="px-4 py-2">
                        <Link to={`/attendance/${user.id}`} className="text-blue-600 hover:underline">
                          {user.username}
                        </Link>
                      </td>
                      <td className="px-4 py-2">
                        {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : '—'}
                      </td>
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">{user.role}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            user.is_active ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'
                          }`}
                        >
                          {user.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="px-4 py-2">{user.rfid_code || '—'}</td>
                      <td className="px-4 py-2">{user.club?.name || '—'}</td>
                      <td className="px-4 py-2">
                        {user.role === 'coach' && (
                          <Link 
  to={`/coach-profile/${user.id}`}  // Changed from direct API URL to route
  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
>
  بروفايل
</Link>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-4 py-4 text-center text-gray-500">
                      لا يوجد مستخدمين متطابقين مع بحثك
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Card view for medium and small screens (md and below) */}
            <div className="lg:hidden space-y-4 p-4">
              {users.length > 0 ? (
                users.map((user, index) => (
                  <div key={user.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start border-b pb-2 mb-2">
                      <span className="text-gray-500">{startNumber + index}</span>
                      <Link to={`/attendance/${user.id}`} className="text-blue-600 hover:underline text-lg font-medium">
                        {user.username}
                      </Link>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-gray-500 text-sm">الاسم الكامل</p>
                        <p>{user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : '—'}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500 text-sm">البريد الإلكتروني</p>
                        <p>{user.email}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500 text-sm">الدور</p>
                        <p>{user.role}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500 text-sm">الحالة</p>
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            user.is_active ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'
                          }`}
                        >
                          {user.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </div>
                      
                      <div>
                        <p className="text-gray-500 text-sm">كود RFID</p>
                        <p>{user.rfid_code || '—'}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500 text-sm">النادي</p>
                        <p>{user.club?.name || '—'}</p>
                      </div>
                    </div>

                    {user.role === 'coach' && (
                      <div className="mt-3 text-left">
                      <Link 
  to={`/coach-profile/${user.id}`}  // Changed from direct API URL to route
  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
>
  بروفايل
</Link>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white p-4 rounded-lg shadow text-center text-gray-500">
                  لا يوجد مستخدمين متطابقين مع بحثك
                </div>
              )}
            </div>
          </div>

          {count > 20 && (
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={prevPage}
                disabled={currentPage === 1 || loading}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                السابق
              </button>
              <span className="px-2 py-2 text-sm text-gray-600">
                صفحة {currentPage} من {totalPages} ({count} مستخدم)
              </span>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages || loading}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default UserList;
