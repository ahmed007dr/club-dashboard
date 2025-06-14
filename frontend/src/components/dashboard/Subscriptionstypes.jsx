
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionTypes } from '../../redux/slices/subscriptionsSlice';
import UpdateSubscriptionTypes from './UpdateSubscriptionTypes';
import DeleteSubscriptionTypesModal from './DeleteSubscriptionTypesModal';
import SubscriptionTypeDetails from './SubscriptionTypeDetails';
import CreateSubscriptionType from './CreateSubscriptionType';
import { FaEye, FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import { CiShoppingTag } from 'react-icons/ci';
import { RiForbidLine } from 'react-icons/ri';
import usePermission from '@/hooks/usePermission';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import BASE_URL from '../../config/api';

const SubscriptionsTypes = () => {
  const dispatch = useDispatch();
  const { subscriptionTypes, loading, error } = useSelector((state) => state.subscriptions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [subscriptionToView, setSubscriptionToView] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('');
  const [featureId, setFeatureId] = useState('');
  const [features, setFeatures] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const maxButtons = 5;

  // Permission checks
  const canViewSubscriptionTypes = usePermission('view_subscriptiontype');
  const canAddSubscriptionTypes = usePermission('add_subscriptiontype');
  const canEditSubscriptionTypes = usePermission('change_subscriptiontype');
  const canDeleteSubscriptionTypes = usePermission('delete_subscriptiontype');

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);

  // Fetch features for filter
  const fetchFeatures = async () => {
    try {
      const response = await fetch(`${BASE_URL}/subscriptions/api/features/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('فشل في جلب الميزات');
      const data = await response.json();
      setFeatures(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  // Handle search button click
  const handleSearch = () => {
    dispatch(
      fetchSubscriptionTypes({
        page: 1,
        searchQuery,
        statusFilter,
        durationFilter,
        feature_id: featureId,
      })
    )
      .unwrap()
      .catch((err) => {
        if (err.includes('Page not found')) {
          setCurrentPage(1);
          dispatch(
            fetchSubscriptionTypes({
              page: 1,
              searchQuery,
              statusFilter,
              durationFilter,
              feature_id: featureId,
            })
          );
        }
      });
    setCurrentPage(1);
  };

  // Fetch subscriptions when page changes
  useEffect(() => {
    dispatch(
      fetchSubscriptionTypes({
        page: currentPage,
        searchQuery,
        statusFilter,
        durationFilter,
        feature_id: featureId,
      })
    )
      .unwrap()
      .catch((err) => {
        if (err.includes('Page not found')) {
          setCurrentPage(1);
          dispatch(
            fetchSubscriptionTypes({
              page: 1,
              searchQuery,
              statusFilter,
              durationFilter,
              feature_id: featureId,
            })
          );
        }
      });
  }, [dispatch, currentPage, featureId]);

  const openModal = (subscription) => {
    setSelectedSubscription(subscription);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedSubscription(null);
    setIsModalOpen(false);
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

  // Pagination logic
  const totalPages = Math.ceil((subscriptionTypes.count || 0) / itemsPerPage);

  const getPageButtons = () => {
    const buttons = [];
    const half = Math.floor(maxButtons / 2);
    let startPage = Math.max(1, currentPage - half);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(i);
    }
    return buttons;
  };

  if (loading) return <div className="text-right p-6">جاري التحميل...</div>;
  if (error) return <div className="text-right p-6 text-red-600">خطأ: {error}</div>;

  // Early return if no view permission
  if (!canViewSubscriptionTypes) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <RiForbidLine className="text-red-600 text-2xl" />
        </div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">لا يوجد صلاحية</h2>
        <p className="text-gray-500 max-w-md">
          ليس لديك الصلاحيات اللازمة لعرض أنواع الاشتراكات. يرجى التواصل مع المسؤول.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <CiShoppingTag className="text-blue-600 w-9 h-9" />
          <h1 className="text-2xl font-bold">أنواع الاشتراكات</h1>
        </div>
        {canAddSubscriptionTypes && (
          <Button
            onClick={openCreateModal}
            className="flex items-center btn"
          >
            <FaPlus className="mr-2" />
            إضافة نوع جديد
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="بحث بالاسم"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border px-3 py-2 rounded-md w-full text-right"
          />
          <Button
            onClick={handleSearch}
            className="flex items-center gap-2 btn"
          >
            <FaSearch className="mr-2" />
            بحث
          </Button>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border px-3 py-2 rounded-md w-full text-right"
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
          className="border px-3 py-2 rounded-md w-full text-right"
        />
        <select
          value={featureId}
          onChange={(e) => setFeatureId(e.target.value)}
          className="border px-3 py-2 rounded-md w-full text-right"
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
          onClick={handleSearch}
          className="flex items-center gap-2 btn"
        >
          <FaSearch className="mr-2" />
          تطبيق الفلاتر
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow-sm rounded-lg">
          <thead>
            <tr className="bg-gray-100 text-right">
              <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-b">الاسم</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-b">الحالة</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-b">المشتركين</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-b">أيام التجميد</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-b">تدريب خاص</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-b">الحد الأقصى للدخول</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-b">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {(subscriptionTypes.results || []).length > 0 ? (
              subscriptionTypes.results.map((type) => (
                <tr key={type.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{type.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="flex items-center justify-end">
                      {type.is_active ? (
                        <>
                          <span className="w-2 h-2 bg-emerald-500 rounded-full ml-2"></span>
                          <span>نشط</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 bg-rose-500 rounded-full ml-2"></span>
                          <span>غير نشط</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{type.subscriptions_count}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{type.max_freeze_days}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="flex items-center justify-end">
                      {type.is_private_training ? (
                        <>
                          <span className="w-2 h-2 bg-indigo-500 rounded-full ml-2"></span>
                          <span>نعم</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 bg-gray-400 rounded-full ml-2"></span>
                          <span>لا</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{type.max_entries || 'غير محدود'}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={() => openDetailsModal(type)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full relative group"
                      >
                        <FaEye className="w-4 h-4" />
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          عرض التفاصيل
                        </span>
                      </button>
                      {canEditSubscriptionTypes && (
                        <button
                          onClick={() => openModal(type)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full relative group"
                        >
                          <FaEdit className="w-4 h-4" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            تعديل
                          </span>
                        </button>
                      )}
                      {canDeleteSubscriptionTypes && (
                        <button
                          onClick={() => openDeleteModal(type)}
                          className="p-2 text-rose-600 hover:bg-rose-100 rounded-full relative group"
                        >
                          <FaTrash className="w-4 h-4" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            حذف
                          </span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
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

      <style jsx>{`
        .group:hover .absolute {
          opacity: 1;
        }
      `}</style>

      <div className="flex justify-between items-center mt-6">
        <Button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-md ${
            currentPage === 1
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
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
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {pageNum}
            </Button>
          ))}
        </div>
        <Button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage >= totalPages || totalPages === 0}
          className={`px-4 py-2 rounded-md ${
            currentPage >= totalPages || totalPages === 0
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          التالي
        </Button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={closeModal}
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold mb-4 text-right">تحديث نوع الاشتراك</h2>
            <UpdateSubscriptionTypes
              subscriptionId={selectedSubscription.id}
              subscriptionData={selectedSubscription}
              closeModal={closeModal}
            />
          </div>
        </div>
      )}

      <DeleteSubscriptionTypesModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        subscription={subscriptionToDelete}
      />

      {isDetailsModalOpen && subscriptionToView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
        </div>
      )}
    </div>
  );
};

export default SubscriptionsTypes;
