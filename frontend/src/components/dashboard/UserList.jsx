import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import BASE_URL from '../../config/api';
import { Link } from 'react-router-dom';
import usePermission from '@/hooks/usePermission';
import { FiSearch, FiRefreshCw, FiX } from 'react-icons/fi';
import { RiForbidLine } from 'react-icons/ri';

function UserList() {
  const canViewUsers = usePermission('view_user');
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [prevPageUrl, setPrevPageUrl] = useState(null);

  useEffect(() => {
    if (!canViewUsers) return;

    const source = axios.CancelToken.source();

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        let url = currentPage === 1 || filter ? `${BASE_URL}/accounts/api/users/` : nextPageUrl || prevPageUrl;
        const params = filter ? { search: filter } : {};

        const response = await axios.get(url, {
          headers,
          params,
          cancelToken: source.token,
        });

        setUsers(response.data.results);
        setCount(response.data.count);
        setNextPageUrl(response.data.next);
        setPrevPageUrl(response.data.previous);
        setTotalPages(Math.ceil(response.data.count / 20));
        setLoading(false);
      } catch (err) {
        if (axios.isCancel(err)) return;
        setError('حدث خطأ أثناء جلب بيانات المستخدمين. يرجى المحاولة لاحقاً.');
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchUsers, 500);

    return () => {
      source.cancel();
      clearTimeout(debounceTimer);
    };
  }, [canViewUsers, currentPage, filter, nextPageUrl, prevPageUrl]);

  const nextPage = () => {
    if (currentPage < totalPages && nextPageUrl) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1 && prevPageUrl) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const resetFilter = () => {
    setFilter('');
    setCurrentPage(1);
  };

  const startNumber = (currentPage - 1) * 20 + 1;

  const memoizedUsers = useMemo(() => users, [users]);

  if (!canViewUsers) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <RiForbidLine className="text-red-600 text-3xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">لا يوجد صلاحية</h2>
        <p className="text-gray-600 max-w-md">
          ليس لديك الصلاحيات اللازمة لعرض المستخدمين. يرجى التواصل مع المسؤول.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">تقارير الموظفين</h1>
        <Link
          to="/attendance-report"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          تقرير شامل لجميع الموظفين
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث عن مستخدم، دور، حالة، أو كود RFID"
            className="w-full p-2.5 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm transition-all"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <button
          onClick={resetFilter}
          className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 transition-colors"
        >
          <FiX className="mr-2" />
          إعادة ضبط
        </button>
      </div>

      {loading && (
        <div className="p-6 bg-blue-50 text-blue-700 rounded-xl shadow-sm mb-6 flex items-center justify-center animate-pulse">
          <FiRefreshCw className="animate-spin mr-2" />
          جاري التحميل...
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-50 text-red-700 rounded-xl shadow-sm mb-6 flex items-center justify-between">
          <span className="font-medium">{error}</span>
          <button
            onClick={() => setCurrentPage(1)}
            className="flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm transition-colors"
          >
            <FiRefreshCw className="mr-2" />
            إعادة المحاولة
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-100 shadow-sm mb-6">
            <table className="min-w-full divide-y divide-gray-100 bg-white text-right">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">اسم المستخدم</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">الاسم الكامل</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">الدور</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">الحالة</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">كود RFID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">النادي</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {memoizedUsers.length > 0 ? (
                  memoizedUsers.map((user, index) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500">{startNumber + index}</td>
                      <td className="px-6 py-4 text-sm">
                        <Link to={`/attendance/${user.id}`} className="text-blue-600 hover:text-blue-800 transition-colors">
                          {user.username}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">{user.role || '—'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            user.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {user.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{user.rfid_code || '—'}</td>
                      <td className="px-6 py-4 text-sm">{user.club?.name || '—'}</td>
                      <td className="px-6 py-4 text-sm flex gap-2">
                        <Link
                          to={`/attendance-report/${user.id}`}
                          className="inline-block bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                        >
                          تقرير الحضور
                        </Link>
                        {user.role === 'coach' && (
                          <Link
                            to={`/coach-profile/${user.id}`}
                            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            بروفايل
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-6 text-center text-gray-500">
                      لا يوجد مستخدمين متطابقين مع بحثك
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden space-y-4 mb-6">
            {memoizedUsers.length > 0 ? (
              memoizedUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start border-b pb-2 mb-3">
                    <span className="text-gray-500 text-sm">{startNumber + index}</span>
                    <Link to={`/attendance/${user.id}`} className="text-blue-600 hover:text-blue-800 text-lg font-medium">
                      {user.username}
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">الاسم الكامل</p>
                      <p>{user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">الدور</p>
                      <p>{user.role || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">الحالة</p>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          user.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {user.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">كود RFID</p>
                      <p>{user.rfid_code || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">النادي</p>
                      <p>{user.club?.name || '—'}</p>
                    </div>
                  </div>
                  <div className="mt-4 text-left flex gap-2">
                    <Link
                      to={`/attendance-report/${user.id}`}
                      className="inline-block bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                    >
                      تقرير الحضور
                    </Link>
                    {user.role === 'coach' && (
                      <Link
                        to={`/coach-profile/${user.id}`}
                        className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                      >
                        بروفايل
                      </Link>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center text-gray-500">
                لا يوجد مستخدمين متطابقين مع بحثك
              </div>
            )}
          </div>

          {count > 20 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={prevPage}
                disabled={currentPage === 1 || loading}
                className={`px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium transition-colors ${
                  currentPage === 1 || loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                السابق
              </button>
              <span className="text-sm text-gray-600">
                صفحة {currentPage} من {totalPages} ({count} مستخدم)
              </span>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages || loading}
                className={`px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium transition-colors ${
                  currentPage === totalPages || loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
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