import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import BASE_URL from '../../config/api';
import IncomeSourceForm from './IncomeSourceForm';

const IncomeSourcesList = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filter States
  const [filter, setFilter] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchSources();
  }, [currentPage, itemsPerPage, filter]);

  const fetchSources = async () => {
    const loadingToast = toast.loading('جارٍ تحميل مصادر الدخل...');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('رمز الدخول غير موجود', { id: loadingToast });
        return;
      }

      const response = await axios.get(`${BASE_URL}/finance/api/income-sources/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: currentPage,
          page_size: itemsPerPage,
          name: filter.name || undefined,
          description: filter.description || undefined,
          ordering: 'id', // Sort by ID in descending order (newest first)
        },
      });

      setSources(response.data.results || []);
      setTotalItems(response.data.count || 0);
      setTotalPages(Math.ceil(response.data.count / itemsPerPage) || 1);
      toast.success('تم تحميل مصادر الدخل بنجاح', { id: loadingToast });
    } catch (error) {
      console.error('فشل في جلب مصادر الدخل:', error.response?.data || error.message);
      toast.error('فشل في تحميل البيانات', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    setCurrentPage(1);
    fetchSources();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prevFilter) => ({
      ...prevFilter,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    if (totalItems === 0) {
      return [1];
    }

    const maxButtons = 5;
    const half = Math.floor(maxButtons / 2);
    let startPage = Math.max(1, currentPage - half);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 rounded-lg" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          إضافة مصدر دخل جديد
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          name="name"
          placeholder="بحث بالاسم"
          value={filter.name}
          onChange={handleFilterChange}
          className="px-4 py-2 border rounded-md w-full text-right"
        />
        <input
          type="text"
          name="description"
          placeholder="بحث بالوصف"
          value={filter.description}
          onChange={handleFilterChange}
          className="px-4 py-2 border rounded-md w-full text-right"
        />
      </div>

      {/* Page Size Selector */}
      <div className="mb-4 flex justify-end">
        <select
          value={itemsPerPage}
          onChange={handlePageSizeChange}
          className="px-4 py-2 border rounded-md text-right"
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size} لكل صفحة
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center">
          <svg
            className="animate-spin h-5 w-5 mx-auto text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      ) : sources.length === 0 ? (
        <p className="text-center text-gray-500">لا توجد مصادر دخل مسجلة.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border border-gray-300">
            <thead>
              <tr className="text-right bg-gray-100">
                <th className="px-4 py-2 border">ID</th>
                <th className="px-4 py-2 border">الاسم</th>
                <th className="px-4 py-2 border">الوصف</th>
                <th className="px-4 py-2 border">النادي</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="text-right hover:bg-gray-50">
                  <td className="px-4 py-2 border">{source.id}</td>
                  <td className="px-4 py-2 border">{source.name}</td>
                  <td className="px-4 py-2 border">{source.description || 'لا يوجد وصف'}</td>
                  <td className="px-4 py-2 border">{source.club_details?.name || 'غير معروف'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || totalItems === 0}
          className="px-3 py-1 bg-gray-500 text-white rounded-md disabled:bg-gray-300"
          aria-label="الصفحة السابقة"
        >
          السابق
        </button>
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-1 rounded-md ${
              currentPage === page && totalItems > 0
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } ${totalItems === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
            aria-label={`الصفحة ${page}`}
            aria-current={currentPage === page && totalItems > 0 ? 'page' : undefined}
            disabled={totalItems === 0}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalItems === 0}
          className="px-3 py-1 bg-gray-500 text-white rounded-md disabled:bg-gray-300"
          aria-label="الصفحة التالية"
        >
          التالي
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-green-700">إضافة مصدر دخل جديد</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="إغلاق"
                >
                  ×
                </button>
              </div>
              <IncomeSourceForm onSuccess={handleSuccess} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomeSourcesList;