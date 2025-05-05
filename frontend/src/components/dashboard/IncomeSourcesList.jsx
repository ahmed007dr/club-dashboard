import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import BASE_URL from '../../config/api';
import IncomeSourceForm from './IncomeSourceForm'; // Adjust the import path as needed

const IncomeSourcesList = () => {
  const [sources, setSources] = useState([]);
  const [filteredSources, setFilteredSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filter States
  const [filter, setFilter] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchSources();
  }, []);

  useEffect(() => {
    // Whenever sources or filter change, apply the filter and paginate
    applyFiltersAndPagination();
  }, [sources, filter]);

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
      });

      // Sort by ID in descending order (newest first)
      const sortedSources = response.data.sort((a, b) => b.id - a.id);
      setSources(sortedSources);
      toast.success('تم تحميل مصادر الدخل بنجاح', { id: loadingToast });
    } catch (error) {
      console.error('فشل في جلب مصادر الدخل:', error);
      toast.error('فشل في تحميل البيانات', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    fetchSources(); // Refresh the list after successful addition
  };

  // Filter handler
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prevFilter) => ({
      ...prevFilter,
      [name]: value,
    }));
  };

  const applyFiltersAndPagination = () => {
    // Filter the sources based on the filter state
    const filtered = sources.filter((source) => {
      return (
        (filter.name === '' || source.name.toLowerCase().includes(filter.name.toLowerCase())) &&
        (filter.description === '' || source.description.toLowerCase().includes(filter.description.toLowerCase()))
      );
    });

    setFilteredSources(filtered);

    // Pagination logic
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setFilteredSources(filtered.slice(startIndex, endIndex));
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6  rounded-lg ">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn"
        >
          إضافة مصدر دخل جديد
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <input
          type="text"
          name="name"
          placeholder="بحث بالاسم"
          value={filter.name}
          onChange={handleFilterChange}
          className="px-4 py-2 border rounded-md mr-2"
        />
        <input
          type="text"
          name="description"
          placeholder="بحث بالوصف"
          value={filter.description}
          onChange={handleFilterChange}
          className="px-4 py-2 border rounded-md"
        />
      </div>

      {loading ? (
        <p className="text-center text-gray-500">جارٍ التحميل...</p>
      ) : filteredSources.length === 0 ? (
        <p className="text-center text-gray-500">لا توجد مصادر دخل مسجلة.</p>
      ) : (
        <ul className="space-y-4">
          {filteredSources.map((source) => (
            <li key={source.id} className="p-4 border rounded-md shadow-sm">
              <p><span className="font-semibold">الاسم:</span> {source.name}</p>
              <p><span className="font-semibold">الوصف:</span> {source.description}</p>
              <p><span className="font-semibold">النادي:</span> {source.club_details?.name || "غير معروف"}</p>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      <div className="flex justify-center mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-500 text-white rounded-md mr-2 disabled:bg-gray-300"
        >
          السابق
        </button>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage * itemsPerPage >= filteredSources.length}
          className="px-4 py-2 bg-gray-500 text-white rounded-md"
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
                >
                  &times;
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

