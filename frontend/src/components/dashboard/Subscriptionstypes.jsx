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
  const [includesGym, setIncludesGym] = useState('');
  const [includesPool, setIncludesPool] = useState('');
  const [includesClasses, setIncludesClasses] = useState('');
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

  // Handle search button click
  const handleSearch = () => {
    dispatch(
      fetchSubscriptionTypes({
        page: 1, // Reset to first page on new search
        searchQuery,
        statusFilter,
        durationFilter,
        includesGym,
        includesPool,
        includesClasses,
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
              includesGym,
              includesPool,
              includesClasses,
            })
          );
        }
      });
    setCurrentPage(1); // Reset page to 1 when filters change
  };

  // Fetch subscriptions when page changes
  useEffect(() => {
    dispatch(
      fetchSubscriptionTypes({
        page: currentPage,
        searchQuery,
        statusFilter,
        durationFilter,
        includesGym,
        includesPool,
        includesClasses,
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
              includesGym,
              includesPool,
              includesClasses,
            })
          );
        }
      });
  }, [dispatch, currentPage]);

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
          <button
            onClick={openCreateModal}
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            <FaPlus className="mr-2" />
            إضافة نوع جديد
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="بحث بالاسم"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border px-3 py-2 rounded-md w-full text-right"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center"
          >
            <FaSearch className="mr-2" />
            بحث
          </button>
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
        <input
          type="number" // Fixed typo from 'kilk="number"'
          placeholder="المدة (أيام)"
          value={durationFilter}
          onChange={(e) => setDurationFilter(e.target.value)}
          className="border px-3 py-2 rounded-md w-full text-right"
        />
        <select
          value={includesGym}
          onChange={(e) => setIncludesGym(e.target.value)}
          className="border px-3 py-2 rounded-md w-full text-right"
        >
          <option value="">يشمل الجيم؟</option>
          <option value="yes">نعم</option>
          <option value="no">لا</option>
        </select>
        <select
          value={includesPool}
          onChange={(e) => setIncludesPool(e.target.value)}
          className="border px-3 py-2 rounded-md w-full text-right"
        >
          <option value="">يشمل المسبح؟</option>
          <option value="yes">نعم</option>
          <option value="no">لا</option>
        </select>
        <select
          value={includesClasses}
          onChange={(e) => setIncludesClasses(e.target.value)}
          className="border px-3 py-2 rounded-md w-full text-right"
        >
          <option value="">يشمل الحصص؟</option>
          <option value="yes">نعم</option>
          <option value="no">لا</option>
        </select>
      </div>

      <div className="mb-6">
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center"
        >
          <FaSearch className="mr-2" />
          تطبيق الفلاتر
        </button>
      </div>

   <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {(subscriptionTypes.results || []).length > 0 ? (
    subscriptionTypes.results.map((type) => (
      <li
        key={type.id}
        className="bg-white rounded-xl shadow-sm hover:shadow-md transform hover:-translate-y-1 transition-all duration-300 border border-gray-100"
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex-grow">
            <h3 className="text-2xl font-bold mb-4 text-gray-800 border-b border-gray-100 pb-3">{type.name}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-600 font-medium">نشط</span>
                {type.is_active ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    نعم
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    لا
                  </span>
                )}
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">عدد المشتركين</span>
                  <span className="text-xl font-bold text-gray-800">{type.subscriptions_count}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="relative group">
                <button
                  onClick={() => openDetailsModal(type)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                >
                  <FaEye className="w-5 h-5" />
                </button>
                <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  عرض التفاصيل
                </span>
              </div>
              
              {canEditSubscriptionTypes && (
                <div className="relative group">
                  <button
                    onClick={() => openModal(type)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    <FaEdit className="w-5 h-5" />
                  </button>
                  <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    تعديل
                  </span>
                </div>
              )}
              
              {canDeleteSubscriptionTypes && (
                <div className="relative group">
                  <button
                    onClick={() => openDeleteModal(type)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <FaTrash className="w-5 h-5" />
                  </button>
                  <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    حذف
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </li>
    ))
  ) : (
    <p className="text-center text-gray-600 col-span-full py-8 bg-gray-50 rounded-lg border border-gray-100">
      لا توجد أنواع اشتراكات مطابقة
    </p>
  )}
</ul>

      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-md ${
            currentPage === 1
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          السابق
        </button>
        <div className="flex gap-2">
          {getPageButtons().map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`px-4 py-2 rounded-md ${
                currentPage === pageNum
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage >= totalPages || totalPages === 0}
          className={`px-4 py-2 rounded-md ${
            currentPage >= totalPages || totalPages === 0
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          التالي
        </button>
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
          <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
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