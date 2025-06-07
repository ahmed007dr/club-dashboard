import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, addUser, updateUser } from '@/redux/slices/users';
import { FaUserPlus, FaEdit, FaSearch } from 'react-icons/fa';
import { RiForbidLine } from 'react-icons/ri';
import usePermission from '@/hooks/usePermission';

const ManageUsers = () => {
  const dispatch = useDispatch();
  const { items: users, loading, error, pagination } = useSelector((state) => state.users);
  const canManageUsers = usePermission('manage_users'); // افتراضي، يمكن تغييره إلى add_user أو change_user
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    card_number: '',
    address: '',
    notes: '',
    role: 'reception',
    club: '',
    rfid_code: '',
  });

  useEffect(() => {
    if (canManageUsers) {
      dispatch(fetchUsers({ page: currentPage, search: searchQuery }));
    }
  }, [dispatch, currentPage, searchQuery, canManageUsers]);

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
      email: '',
      phone_number: '',
      card_number: '',
      address: '',
      notes: '',
      role: 'reception',
      club: '',
      rfid_code: '',
    });
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone_number: user.phone_number || '',
      card_number: user.card_number || '',
      address: user.address || '',
      notes: user.notes || '',
      role: user.role,
      club: user.club?.id || '',
      rfid_code: user.rfid_code || '',
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
      email: '',
      phone_number: '',
      card_number: '',
      address: '',
      notes: '',
      role: 'reception',
      club: '',
      rfid_code: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(addUser(formData)).unwrap();
      closeCreateModal();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateUser({ id: selectedUser.id, updatedUser: formData })).unwrap();
      closeEditModal();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  if (!canManageUsers) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <RiForbidLine className="text-red-600 text-2xl" />
        </div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">لا يوجد صلاحية</h2>
        <p className="text-gray-500 max-w-md">
          ليس لديك الصلاحيات اللازمة لإدارة الموظفين. يرجى التواصل مع المسؤول.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3 space-x-reverse">
          <FaUserPlus className="text-blue-600 w-9 h-9" />
          <h1 className="text-2xl font-bold">إدارة الموظفين</h1>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaUserPlus className="mr-2" />
          إضافة موظف جديد
        </button>
      </div>

      <div className="flex items-center space-x-2 space-x-reverse mb-6">
        <input
          type="text"
          placeholder="بحث بالاسم أو الدور"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border px-3 py-2 rounded-md w-full text-right"
        />
        <button
          onClick={handleSearch}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaSearch className="mr-2" />
          بحث
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mr-3">جاري التحميل...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 p-4 rounded-lg text-red-600 text-center mb-6">
          خطأ: {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow-sm rounded-lg text-right">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="px-4 py-3 font-semibold w-[20%]">الاسم</th>
              <th className="px-4 py-3 font-semibold w-[15%]">الدور</th>
              <th className="px-4 py-3 font-semibold w-[20%]">رقم الهاتف</th>
              <th className="px-4 py-3 font-semibold w-[20%]">النادي</th>
              <th className="px-4 py-3 font-semibold w-[15%]">نشط</th>
              <th className="px-4 py-3 font-semibold w-[10%]">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b hover:bg-gray-50 transition-all duration-200"
                >
                  <td className="px-4 py-3 text-gray-800">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{user.role}</td>
                  <td className="px-4 py-3 text-gray-700">{user.phone_number || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{user.club?.name || '-'}</td>
                  <td className="px-4 py-3">
                    {user.is_active ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">نعم</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">لا</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-all"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-gray-600 py-8">
                  لا توجد بيانات موظفين
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* نموذج إنشاء موظف */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={closeCreateModal}
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold mb-4 text-right">إنشاء موظف جديد</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">اسم المستخدم</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-right"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">الاسم الأول</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">اسم العائلة</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">البريد الإلكتروني</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">رقم الهاتف</label>
                <input
                  type="text"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">رقم البطاقة</label>
                <input
                  type="text"
                  name="card_number"
                  value={formData.card_number}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">العنوان</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">ملاحظات</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">الدور</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-right"
                >
                  <option value="owner">مالك</option>
                  <option value="admin">أدمن</option>
                  <option value="reception">ريسبشن</option>
                  <option value="accountant">محاسب</option>
                  <option value="coach">مدرب</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">كود RFID</label>
                <input
                  type="text"
                  name="rfid_code"
                  value={formData.rfid_code}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-right"
                />
              </div>
              <div className="flex justify-end space-x-2 space-x-reverse">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  إنشاء
                </button>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نموذج تعديل موظف */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={closeEditModal}
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold mb-4 text-right">تعديل بيانات الموظف</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">اسم المستخدم</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-right"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">الاسم الأول</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">اسم العائلة</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">البريد الإلكتروني</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">رقم الهاتف</label>
                <input
                  type="text"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">رقم البطاقة</label>
                <input
                  type="text"
                  name="card_number"
                  value={formData.card_number}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">العنوان</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">ملاحظات</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">الدور</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-right"
                >
                  <option value="owner">مالك</option>
                  <option value="admin">أدمن</option>
                  <option value="reception">ريسبشن</option>
                  <option value="accountant">محاسب</option>
                  <option value="coach">مدرب</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-right">كود RFID</label>
                <input
                  type="text"
                  name="rfid_code"
                  value={formData.rfid_code}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 text-right"
                />
              </div>
              <div className="flex justify-end space-x-2 space-x-reverse">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;