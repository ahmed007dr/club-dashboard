import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, addUser, updateUser } from '@/redux/slices/users';
import { FaUserPlus, FaEdit, FaSearch } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import BASE_URL from '../../config/api';

const ManageUsers = () => {
  const dispatch = useDispatch();
  const { items: users, loading, error, pagination } = useSelector((state) => state.users);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    card_number: '',
    address: '',
    notes: '',
    role: 'reception',
    club: '',
    rfid_code: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchUsers({ page: currentPage, search: searchQuery }));
    // Fetch clubs for the club selection
    const fetchClubs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${BASE_URL}core/api/clubs/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClubs(res.data.results || []);
      } catch (err) {
        toast.error('خطأ في جلب الأندية');
      }
    };
    fetchClubs();
  }, [dispatch, currentPage, searchQuery]);

  const handleSearch = () => {
    setCurrentPage(1);
    dispatch(fetchUsers({ page: 1, search: searchQuery }));
  };

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setFormData({
      username: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      card_number: '',
      address: '',
      notes: '',
      role: 'reception',
      club: '',
      rfid_code: '',
      password: '',
    });
    setFormErrors({});
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone_number: user.phone_number || '',
      card_number: user.card_number || '',
      address: user.address || '',
      notes: user.notes || '',
      role: user.role,
      club: user.club?.id || '',
      rfid_code: user.rfid_code || '',
      password: '',
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
    setFormData({
      username: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      card_number: '',
      address: '',
      notes: '',
      role: 'reception',
      club: '',
      rfid_code: '',
      password: '',
    });
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = (isEdit = false) => {
    const errors = {};
    if (!formData.username) errors.username = 'اسم المستخدم مطلوب';
    if (!formData.role) errors.role = 'الدور مطلوب';
    if (formData.role === 'reception' && !formData.password && !isEdit) {
      errors.password = 'كلمة المرور مطلوبة لدور الريسبشن';
    }
    if (!['reception', 'coach', 'accountant'].includes(formData.role)) {
      errors.role = 'غير مسموح بإنشاء أو تعديل هذا الدور';
    }
    if (formData.phone_number && !/^\d{9,15}$/.test(formData.phone_number)) {
      errors.phone_number = 'رقم الهاتف غير صحيح';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await dispatch(addUser(formData)).unwrap();
      toast.success('تم إنشاء الموظف بنجاح');
      closeCreateModal();
    } catch (error) {
      toast.error(`خطأ في إنشاء الموظف: ${error.message || 'حاول مرة أخرى'}`);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    try {
      await dispatch(updateUser({ id: selectedUser.id, updatedUser: formData })).unwrap();
      toast.success('تم تعديل الموظف بنجاح');
      closeEditModal();
    } catch (error) {
      toast.error(`خطأ في تعديل الموظف: ${error.message || 'حاول مرة أخرى'}`);
    }
  };

  const allowedRoles = [
    { value: 'reception', label: 'ريسبشن' },
    { value: 'coach', label: 'مدرب' },
    { value: 'accountant', label: 'محاسب' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div className="flex items-center space-x-3 space-x-reverse">
            <FaUserPlus className="text-blue-600 w-8 h-8" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">إدارة الموظفين</h1>
          </div>
          <button
            onClick={openCreateModal}
            className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm sm:text-base"
          >
            <FaUserPlus className="mr-2 w-4 h-4" />
            إضافة موظف جديد
          </button>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse mb-6">
          <input
            type="text"
            placeholder="بحث بالاسم أو الدور"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md w-full text-right text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <button
            onClick={handleSearch}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm sm:text-base"
          >
            <FaSearch className="mr-2 w-4 h-4" />
            بحث
          </button>
        </div>

        {loading && (
          <div className="flex justify-center items-center my-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 dark:text-gray-400 mr-3 text-sm sm:text-base">جاري التحميل...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg text-red-600 dark:text-red-400 text-center mb-6 text-sm sm:text-base">
            خطأ: {error}
          </div>
        )}

        <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg">
          <table className="w-full border-collapse text-right text-sm sm:text-base">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                <th className="px-4 py-3 font-semibold">الاسم</th>
                <th className="px-4 py-3 font-semibold">الدور</th>
                <th className="px-4 py-3 font-semibold">رقم الهاتف</th>
                <th className="px-4 py-3 font-semibold">النادي</th>
                <th className="px-4 py-3 font-semibold">نشط</th>
                <th className="px-4 py-3 font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <td className="px-4 py-3 text-gray-800 dark:text-white">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {allowedRoles.find((r) => r.value === user.role)?.label || user.role}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{user.phone_number || '-'}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{user.club?.name || '-'}</td>
                    <td className="px-4 py-3">
                      {user.is_active ? (
                        <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400 px-2 py-1 rounded text-xs">نعم</span>
                      ) : (
                        <span className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400 px-2 py-1 rounded text-xs">لا</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-all duration-200"
                        disabled={['owner', 'admin'].includes(user.role)}
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-gray-600 dark:text-gray-400 py-8">
                    لا توجد بيانات موظفين
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* نموذج إنشاء/تعديل موظف */}
        {(isCreateModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl relative">
              <button
                className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-lg"
                onClick={isCreateModalOpen ? closeCreateModal : closeEditModal}
              >
                ✕
              </button>
              <h2 className="text-xl font-semibold mb-6 text-right text-gray-800 dark:text-white">
                {isCreateModalOpen ? 'إنشاء موظف جديد' : 'تعديل بيانات الموظف'}
              </h2>
              <form onSubmit={isCreateModalOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right">اسم المستخدم</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 text-right text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      required
                    />
                    {formErrors.username && (
                      <p className="text-red-600 dark:text-red-400 text-xs mt-1 text-right">{formErrors.username}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right">الدور</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 text-right text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.role ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      required
                    >
                      {allowedRoles.map((role) => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                    {formErrors.role && (
                      <p className="text-red-600 dark:text-red-400 text-xs mt-1 text-right">{formErrors.role}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right">الاسم الأول</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-right text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right">اسم العائلة</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-right text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right">رقم الهاتف</label>
                    <input
                      type="text"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 text-right text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.phone_number ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    />
                    {formErrors.phone_number && (
                      <p className="text-red-600 dark:text-red-400 text-xs mt-1 text-right">{formErrors.phone_number}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right">رقم البطاقة</label>
                    <input
                      type="text"
                      name="card_number"
                      value={formData.card_number}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-right text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right">النادي</label>
                    <select
                      name="club"
                      value={formData.club}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-right text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">اختر نادي</option>
                      {clubs.map((club) => (
                        <option key={club.id} value={club.id}>{club.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right">كود RFID</label>
                    <input
                      type="text"
                      name="rfid_code"
                      value={formData.rfid_code}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-right text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  {(formData.role === 'reception' || (isEditModalOpen && ['owner', 'admin'].includes(formData.role))) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right">كلمة المرور</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full border rounded-md px-3 py-2 text-right text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        placeholder={isEditModalOpen ? 'أدخل كلمة مرور جديدة (اختياري)' : 'أدخل كلمة المرور'}
                        required={formData.role === 'reception' && !isEditModalOpen}
                      />
                      {formErrors.password && (
                        <p className="text-red-600 dark:text-red-400 text-xs mt-1 text-right">{formErrors.password}</p>
                      )}
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right">العنوان</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-right text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows="3"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right">ملاحظات</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-right text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows="3"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 space-x-reverse mt-6">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm sm:text-base"
                  >
                    {isCreateModalOpen ? 'إنشاء' : 'حفظ'}
                  </button>
                  <button
                    type="button"
                    onClick={isCreateModalOpen ? closeCreateModal : closeEditModal}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200 text-sm sm:text-base"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;