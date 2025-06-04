import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchShiftAttendances } from '../../redux/slices/AttendanceSlice';
import { Link } from 'react-router-dom';
import usePermission from '@/hooks/usePermission';
import { FiRefreshCw, FiFilter, FiX } from 'react-icons/fi';

const ShiftAttendanceList = () => {
  const dispatch = useDispatch();
  const { shiftAttendances, isLoading, error, lastFetched } = useSelector((state) => state.attendance);
  const canViewShifts = usePermission("view_shift");

  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [filters, setFilters] = useState({
    staffName: '',
    clubName: '',
    dateFrom: '',
    dateTo: '',
    status: 'all'
  });

  useEffect(() => {
    dispatch(fetchShiftAttendances());
  }, [dispatch]);

  const handleRetry = () => {
    dispatch(fetchShiftAttendances());
  };

  // Filter handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      staffName: '',
      clubName: '',
      dateFrom: '',
      dateTo: '',
      status: 'all'
    });
    setCurrentPage(1);
  };

  // Memoized filtered data to optimize performance
  const filteredData = useMemo(() => {
    return shiftAttendances
      .filter((attendance) => {
        const matchesStaff = attendance.staff_details.username
          .toLowerCase()
          .includes(filters.staffName.toLowerCase());
        const matchesClub = attendance.club_details.name
          .toLowerCase()
          .includes(filters.clubName.toLowerCase());
        const matchesDateFrom = filters.dateFrom === '' || new Date(attendance.check_in) >= new Date(filters.dateFrom);
        const matchesDateTo = filters.dateTo === '' || new Date(attendance.check_in) <= new Date(filters.dateTo);
        const matchesStatus = filters.status === 'all' ||
          (filters.status === 'checkedIn' && !attendance.check_out) ||
          (filters.status === 'checkedOut' && attendance.check_out);

        return matchesStaff && matchesClub && matchesDateFrom && matchesDateTo && matchesStatus;
      })
      .sort((a, b) => new Date(b.check_in) - new Date(a.check_in));
  }, [shiftAttendances, filters]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (!canViewShifts) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <h2 className="text-3xl font-bold mb-8 text-gray-800">حضور موظفي الورديات</h2>
        <div className="p-6 bg-red-50 text-red-700 rounded-xl shadow-sm flex items-center justify-between">
          <span className="font-medium">ليس لديك صلاحية عرض حضور الموظفين</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">حضور موظفي الورديات</h2>

      {/* Loading State */}
      {isLoading && (
        <div className="p-6 bg-blue-50 text-blue-700 rounded-xl shadow-sm mb-6 animate-pulse">
          جاري التحميل...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 bg-red-50 text-red-700 rounded-xl shadow-sm mb-6 flex items-center justify-between">
          <span className="font-medium">خطأ: {error}</span>
          <button
            onClick={handleRetry}
            className="flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm transition-colors"
          >
            <FiRefreshCw className="mr-2" />
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Filter Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            <FiFilter className="mr-2" />
            تصفية النتائج
          </h3>
          <button
            onClick={resetFilters}
            className="flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 transition-colors"
          >
            <FiX className="mr-2" />
            إعادة ضبط
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">اسم الموظف</label>
            <input
              type="text"
              name="staffName"
              value={filters.staffName}
              onChange={handleFilterChange}
              className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm transition-all"
              placeholder="ابحث باسم الموظف"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">اسم النادي</label>
            <input
              type="text"
              name="clubName"
              value={filters.clubName}
              onChange={handleFilterChange}
              className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm transition-all"
              placeholder="ابحث باسم النادي"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">من تاريخ</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">إلى تاريخ</label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">حالة الحضور</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm transition-all"
            >
              <option value="all">الكل</option>
              <option value="checkedIn">موجود حالياً</option>
              <option value="checkedOut">تم الانصراف</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Info */}
      {filteredData.length > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm text-gray-600">
          <p>
            عرض <span className="font-medium">{indexOfFirstItem + 1}</span> إلى{' '}
            <span className="font-medium">{Math.min(indexOfLastItem, filteredData.length)}</span> من أصل{' '}
            <span className="font-medium">{filteredData.length}</span> سجل
          </p>
          <p>آخر تحديث: {new Date(lastFetched).toLocaleString('ar-EG')}</p>
        </div>
      )}

      {/* Attendance Table */}
      {currentItems.length > 0 ? (
        <div>
          {/* Table View - Larger Screens */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">اسم الموظف</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">النادي</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">وقت الحضور</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">وقت الانصراف</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">المدة (ساعات)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentItems.map((attendance) => (
                  <tr key={attendance.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <Link to={`/attendance/${attendance.staff_details.id}`} className="hover:text-blue-600 transition-colors">
                        {attendance.staff_details.username}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{attendance.club_details.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(attendance.check_in).toLocaleString('ar-EG')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendance.check_out ? new Date(attendance.check_out).toLocaleString('ar-EG') : 'لا يزال موجوداً'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendance.duration_hours ? attendance.duration_hours.toFixed(2) : 'غير متاح'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card View - Mobile Screens */}
          <div className="md:hidden space-y-4">
            {currentItems.map((attendance) => (
              <div key={attendance.id} className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="grid grid-cols-2 gap-y-4">
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">اسم الموظف</p>
                    <p className="text-sm font-medium">
                      <Link to={`/attendance/${attendance.staff_details.id}`} className="hover:text-blue-600 transition-colors">
                        {attendance.staff_details.username}
                      </Link>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">النادي</p>
                    <p className="text-sm">{attendance.club_details.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">المدة (ساعات)</p>
                    <p className="text-sm">{attendance.duration_hours ? attendance.duration_hours.toFixed(2) : 'غير متاح'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">وقت الحضور</p>
                    <p className="text-sm">{new Date(attendance.check_in).toLocaleString('ar-EG')}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">وقت الانصراف</p>
                    <p className="text-sm">
                      {attendance.check_out ? new Date(attendance.check_out).toLocaleString('ar-EG') : 'لا يزال موجوداً'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        !isLoading && !error && (
          <div className="p-6 bg-yellow-50 text-yellow-700 rounded-xl shadow-sm text-center border border-yellow-100">
            لا توجد سجلات مطابقة لمعايير البحث
          </div>
        )
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="inline-flex rounded-lg shadow-sm -space-x-px">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-r-lg border border-gray-200 text-sm font-medium transition-colors ${
                currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              السابق
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => paginate(pageNum)}
                  className={`px-4 py-2 border-t border-b border-gray-200 text-sm font-medium transition-colors ${
                    currentPage === pageNum ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-l-lg border border-gray-200 text-sm font-medium transition-colors ${
                currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              التالي
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default ShiftAttendanceList;