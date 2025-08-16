import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionTypes } from '../../redux/slices/subscriptionsSlice';
import UpdateSubscriptionTypes from './UpdateSubscriptionTypes';
import DeleteSubscriptionTypesModal from './DeleteSubscriptionTypesModal';
import SubscriptionTypeDetails from './SubscriptionTypeDetails';
import CreateSubscriptionType from './CreateSubscriptionType';
import { FaEye, FaEdit, FaTrash, FaPlus, FaSearch, FaSortUp, FaSortDown } from 'react-icons/fa';
import { CiShoppingTag } from 'react-icons/ci';
import { RiForbidLine } from 'react-icons/ri';
import usePermission from '@/hooks/usePermission';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import BASE_URL from '../../config/api';

const SubscriptionsTypes = () => {
  const dispatch = useDispatch();
  const { subscriptionTypes, loading, error } = useSelector((state) => state.subscriptions);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState(null);
  const [subscriptionToView, setSubscriptionToView] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('');
  const [featureId, setFeatureId] = useState('');
  const [features, setFeatures] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'active_subscribers', direction: 'desc' });
  const itemsPerPage = 20;
  const maxButtons = 5;

  // التحقق من الصلاحيات
  const canViewSubscriptionTypes = usePermission('view_subscriptiontype');
  const canAddSubscriptionTypes = usePermission('add_subscriptiontype');
  const canEditSubscriptionTypes = usePermission('change_subscriptiontype');
  const canDeleteSubscriptionTypes = usePermission('delete_subscriptiontype');

  // جلب الميزات للفلتر
  const fetchFeatures = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/subscriptions/api/features/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('فشل في جلب الميزات');
      const data = await response.json();
      setFeatures(data);
    } catch (err) {
      console.error('خطأ جلب الميزات:', err);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  // معالجة الفرز
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
    setCurrentPage(1);
  };

  // جلب أنواع الاشتراكات مع الفرز
  const fetchData = useCallback(() => {
    const ordering = `${sortConfig.direction === 'desc' ? '-' : ''}${sortConfig.key}`;
    const query = {
      page: currentPage,
      searchQuery: searchQuery.trim(),
      statusFilter,
      durationFilter,
      feature_id: featureId,
      ordering,
    };
    dispatch(fetchSubscriptionTypes(query))
      .unwrap()
      .catch((err) => {
        if (err.includes('Page not found')) {
          setCurrentPage(1);
          dispatch(fetchSubscriptionTypes({ ...query, page: 1 }));
        }
      });
  }, [dispatch, currentPage, searchQuery, statusFilter, durationFilter, featureId, sortConfig]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // معالجة البحث
  const handleSearch = () => {
    setCurrentPage(1);
    fetchData();
  };

  // إعادة تعيين الفلاتر
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDurationFilter('');
    setFeatureId('');
    setCurrentPage(1);
    setSortConfig({ key: 'active_subscribers', direction: 'desc' });
  };

  // فتح وإغلاق المودالات
  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);

  const openUpdateModal = (subscription) => {
    setSelectedSubscription(subscription);
    setIsUpdateModalOpen(true);
  };

  const closeUpdateModal = () => {
    setSelectedSubscription(null);
    setIsUpdateModalOpen(false);
  };

  const openDeleteModal = (subscription) => {
    setSubscriptionToDelete(subscription);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSubscriptionToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const openDetailsModal = (subscription) => {
    setSubscriptionToView(subscription);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setSubscriptionToView(null);
    setIsDetailsModalOpen(false);
  };

  // منطق الترقيم
  const totalPages = Math.ceil((subscriptionTypes.count || 0) / itemsPerPage);

  const getPageButtons = useCallback(() => {
    const half = Math.floor(maxButtons / 2);
    let startPage = Math.max(1, currentPage - half);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }, [currentPage, totalPages]);

  // إذا لم يكن لديك صلاحية العرض
  if (!canViewSubscriptionTypes) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-screen text-center p-4"
        dir="rtl"
      >
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <RiForbidLine className="text-red-600 text-2xl" />
        </div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">لا يوجد صلاحية</h2>
        <p className="text-gray-500 max-w-md">
          ليس لديك الصلاحيات اللازمة لعرض أنواع الاشتراكات. يرجى التواصل مع المسؤول.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 bg-gray-100 min-h-screen"
      dir="rtl"
    >
      {/* العنوان وزر الإضافة */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <CiShoppingTag className="text-blue-600 w-9 h-9" />
          <h1 className="text-2xl font-bold text-gray-700">أنواع الاشتراكات</h1>
        </div>
        {canAddSubscriptionTypes && (
          <Button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <FaPlus />
            إضافة نوع جديد
          </Button>
        )}
      </div>

      {/* فلاتر البحث */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="بحث بالاسم"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-right"
            disabled={loading}
          />
          <Button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            disabled={loading}
          >
            <FaSearch />
            بحث
          </Button>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-2 w-full text-right"
          disabled={loading}
        >
          <option value="all">الحالة (الكل)</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
        </select>
        <Input
          type="number"
          placeholder="المدة (أيام)"
          value={durationFilter}
          onChange={(e) => setDurationFilter(e.target.value)}
          className="w-full text-right"
          disabled={loading}
        />
        <select
          value={featureId}
          onChange={(e) => setFeatureId(e.target.value)}
          className="border rounded-md px-3 py-2 w-full text-right"
          disabled={loading}
        >
          <option value="">اختر ميزة</option>
          {features.map((feature) => (
            <option key={feature.id} value={feature.id}>
              {feature.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-6">
        <Button
          onClick={resetFilters}
          className="bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2"
          disabled={loading}
        >
          إعادة تعيين
        </Button>
      </div>

      {/* الجدول */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th
                className="px-4 py-3 font-semibold text-gray-700 border-b text-center cursor-pointer"
                onClick={() => handleSort('name')}
              >
                <div className="inline-flex items-center gap-1">
                  الاسم
                  {sortConfig.key === 'name' && (
                    sortConfig.direction === 'desc' ? <FaSortDown /> : <FaSortUp />
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3 font-semibold text-gray-700 border-b text-center cursor-pointer"
                onClick={() => handleSort('is_active')}
              >
                <div className="inline-flex items-center gap-1">
                  الحالة
                  {sortConfig.key === 'is_active' && (
                    sortConfig.direction === 'desc' ? <FaSortDown /> : <FaSortUp />
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3 font-semibold text-gray-700 border-b text-center cursor-pointer"
                onClick={() => handleSort('active_subscribers')}
              >
                <div className="inline-flex items-center gap-1">
                  المشتركين النشطين
                  {sortConfig.key === 'active_subscribers' && (
                    sortConfig.direction === 'desc' ? <FaSortDown /> : <FaSortUp />
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3 font-semibold text-gray-700 border-b text-center cursor-pointer"
                onClick={() => handleSort('max_freeze_days')}
              >
                <div className="inline-flex items-center gap-1">
                  أيام التجميد
                  {sortConfig.key === 'max_freeze_days' && (
                    sortConfig.direction === 'desc' ? <FaSortDown /> : <FaSortUp />
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3 font-semibold text-gray-700 border-b text-center cursor-pointer"
                onClick={() => handleSort('is_private_training')}
              >
                <div className="inline-flex items-center gap-1">
                  تدريب خاص
                  {sortConfig.key === 'is_private_training' && (
                    sortConfig.direction === 'desc' ? <FaSortDown /> : <FaSortUp />
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3 font-semibold text-gray-700 border-b text-center cursor-pointer"
                onClick={() => handleSort('max_entries')}
              >
                <div className="inline-flex items-center gap-1">
                  الحد الأقصى للدخول
                  {sortConfig.key === 'max_entries' && (
                    sortConfig.direction === 'desc' ? <FaSortDown /> : <FaSortUp />
                  )}
                </div>
              </th>
              <th className="px-4 py-3 font-semibold text-gray-700 border-b text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-600">
                  جاري التحميل...
                </td>
              </tr>
            ) : (subscriptionTypes.results || []).length > 0 ? (
              subscriptionTypes.results.map((type) => (
                <motion.tr
                  key={type.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-b hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-4 py-3 text-gray-700 text-center">{type.name}</td>
                  <td className="px-4 py-3 text-gray-700 text-center">
                    <div className="inline-flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          type.is_active ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      ></span>
                      <span>{type.is_active ? "نشط" : "غير نشط"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-center">{type.active_subscribers || 0}</td>
                  <td className="px-4 py-3 text-gray-700 text-center">{type.max_freeze_days}</td>
                  <td className="px-4 py-3 text-gray-700 text-center">
                    <div className="inline-flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          type.is_private_training ? "bg-indigo-500" : "bg-gray-400"
                        }`}
                      ></span>
                      <span>{type.is_private_training ? "نعم" : "لا"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-center">{type.max_entries || "غير محدود"}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => openDetailsModal(type)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full relative group transition-colors"
                        title="عرض التفاصيل"
                      >
                        <FaEye className="w-4 h-4" />
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          عرض
                        </span>
                      </button>
                      {canEditSubscriptionTypes && (
                        <button
                          onClick={() => openUpdateModal(type)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full relative group transition-colors"
                          title="تعديل"
                        >
                          <FaEdit className="w-4 h-4" />
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            تعديل
                          </span>
                        </button>
                      )}
                      {canDeleteSubscriptionTypes && (
                        <button
                          onClick={() => openDeleteModal(type)}
                          className="p-2 text-rose-600 hover:bg-rose-100 rounded-full relative group transition-colors"
                          title="حذف"
                        >
                          <FaTrash className="w-4 h-4" />
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            حذف
                          </span>
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-600">
                  لا توجد أنواع اشتراكات مطابقة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* الترقيم */}
      <div className="flex justify-between items-center mt-6">
        <Button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1 || loading}
          className={`px-4 py-2 rounded-md ${
            currentPage === 1 || loading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          السابق
        </Button>
        <div className="flex gap-2">
          {getPageButtons().map((pageNum) => (
            <Button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`px-4 py-2 rounded-md ${
                currentPage === pageNum
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              disabled={loading}
            >
              {pageNum}
            </Button>
          ))}
        </div>
        <Button
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={currentPage >= totalPages || totalPages === 0 || loading}
          className={`px-4 py-2 rounded-md ${
            currentPage >= totalPages || totalPages === 0 || loading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          التالي
        </Button>
      </div>

      {/* المودالات */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={closeCreateModal}
              >
                ✕
              </button>
              <h2 className="text-xl font-semibold mb-4 text-right">إنشاء نوع اشتراك جديد</h2>
              <CreateSubscriptionType onClose={closeCreateModal} />
            </div>
          </motion.div>
        )}
        {isUpdateModalOpen && selectedSubscription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={closeUpdateModal}
              >
                ✕
              </button>
              <h2 className="text-xl font-semibold mb-4 text-right">تحديث نوع الاشتراك</h2>
              <UpdateSubscriptionTypes
                subscriptionId={selectedSubscription.id}
                subscriptionData={selectedSubscription}
                closeModal={closeUpdateModal}
              />
            </div>
          </motion.div>
        )}
        {isDeleteModalOpen && subscriptionToDelete && (
          <DeleteSubscriptionTypesModal
            isOpen={isDeleteModalOpen}
            onClose={closeDeleteModal}
            subscription={subscriptionToDelete}
          />
        )}
        {isDetailsModalOpen && subscriptionToView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white p-6 rounded-lg max-w-6xl relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={closeDetailsModal}
              >
                ✕
              </button>
              <h2 className="text-xl font-semibold mb-4 text-right">تفاصيل نوع الاشتراك</h2>
              <SubscriptionTypeDetails id={subscriptionToView.id} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SubscriptionsTypes;