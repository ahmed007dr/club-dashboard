
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch } from 'react-icons/fa';
import { CiShoppingTag } from 'react-icons/ci';
import { RiForbidLine } from 'react-icons/ri';
import usePermission from '@/hooks/usePermission';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BASE_URL from '../../config/api';

const PaymentMethodsList = () => {
  const dispatch = useDispatch();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);

  const canViewMethods = usePermission('view_paymentmethod');
  const canAddMethods = usePermission('add_paymentmethod');
  const canEditMethods = usePermission('change_paymentmethod');
  const canDeleteMethods = usePermission('delete_paymentmethod');

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/subscriptions/api/payment-methods/?q=${searchQuery}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('فشل في جلب طرق الدفع');
      const data = await response.json();
      setMethods(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewMethods) fetchMethods();
  }, [searchQuery]);

  const handleCreate = async (data) => {
    try {
      const response = await fetch(`${BASE_URL}/subscriptions/api/payment-methods/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('فشل في إنشاء طريقة الدفع');
      toast.success('تم إنشاء طريقة الدفع بنجاح');
      fetchMethods();
      setIsCreateModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEdit = async (data) => {
    try {
      const response = await fetch(`${BASE_URL}/subscriptions/api/payment-methods/${selectedMethod.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('فشل في تعديل طريقة الدفع');
      toast.success('تم تعديل طريقة الدفع بنجاح');
      fetchMethods();
      setIsEditModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${BASE_URL}/subscriptions/api/payment-methods/${selectedMethod.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('فشل في حذف طريقة الدفع');
      toast.success('تم حذف طريقة الدفع بنجاح');
      fetchMethods();
      setIsDeleteModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!canViewMethods) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4" dir="rtl">
        <RiForbidLine className="text-red-600 text-2xl mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">لا يوجد صلاحية</h2>
        <p className="text-gray-500">ليس لديك الصلاحيات اللازمة لعرض طرق الدفع.</p>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <CiShoppingTag className="text-blue-600 w-9 h-9" />
          <h1 className="text-2xl font-bold">طرق الدفع</h1>
        </div>
        {canAddMethods && (
          <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center btn">
            <FaPlus className="mr-2" />
            إضافة طريقة دفع جديدة
          </Button>
        )}
      </div>

      <div className="mb-6 flex items-center space-x-2">
        <Input
          type="text"
          placeholder="بحث بالاسم"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border px-3 py-2 rounded-md w-full text-right"
        />
        <Button onClick={fetchMethods} className="flex items-center gap-2 btn">
          <FaSearch className="mr-2" />
          بحث
        </Button>
      </div>

      {loading && <div className="text-right p-6">جاري التحميل...</div>}
      {error && <div className="text-right p-6 text-red-600">خطأ: {error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow-sm rounded-lg">
          <thead>
            <tr className="bg-gray-100 text-right">
              <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-b">الاسم</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-b">الحالة</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-b">تاريخ الإنشاء</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-b">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {methods.length > 0 ? (
              methods.map((method) => (
                <tr key={method.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{method.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {method.is_active ? (
                      <span className="flex items-center justify-end">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full ml-2"></span>
                        نشط
                      </span>
                    ) : (
                      <span className="flex items-center justify-end">
                        <span className="w-2 h-2 bg-rose-500 rounded-full ml-2"></span>
                        غير نشط
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{new Date(method.created_at).toLocaleDateString('ar-EG')}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                      <button
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full relative group"
                        onClick={() => {
                          setSelectedMethod(method);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                      {canEditMethods && (
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full relative group"
                          onClick={() => {
                            setSelectedMethod(method);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                      )}
                      {canDeleteMethods && (
                        <button
                          className="p-2 text-rose-600 hover:bg-rose-100 rounded-full relative group"
                          onClick={() => {
                            setSelectedMethod(method);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-gray-600">
                  لا توجد طرق دفع مطابقة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsCreateModalOpen(false)}
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold mb-4 text-right">إنشاء طريقة دفع جديدة</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate({ name: e.target.name.value, is_active: e.target.is_active.checked });
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                <Input type="text" name="name" required className="text-right" />
              </div>
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="is_active" defaultChecked className="form-checkbox" />
                  <span>نشط</span>
                </label>
              </div>
              <Button type="submit" className="w-full btn">إنشاء</Button>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedMethod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsEditModalOpen(false)}
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold mb-4 text-right">تعديل طريقة الدفع</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEdit({ name: e.target.name.value, is_active: e.target.is_active.checked });
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                <Input type="text" name="name" defaultValue={selectedMethod.name} required className="text-right" />
              </div>
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={selectedMethod.is_active}
                    className="form-checkbox"
                  />
                  <span>نشط</span>
                </label>
              </div>
              <Button type="submit" className="w-full btn">تحديث</Button>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && selectedMethod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold mb-4 text-right">حذف طريقة الدفع</h2>
            <p className="mb-4">هل أنت متأكد من حذف طريقة الدفع "{selectedMethod.name}"؟</p>
            <div className="flex justify-end space-x-2">
              <Button onClick={() => setIsDeleteModalOpen(false)} className="btn bg-gray-300">
                إلغاء
              </Button>
              <Button onClick={handleDelete} className="btn bg-red-600 text-white">
                حذف
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodsList;