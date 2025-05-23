import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionTypes } from '../../redux/slices/subscriptionsSlice';
import UpdateSubscriptionTypes from './UpdateSubscriptionTypes';
import DeleteSubscriptionTypesModal from './DeleteSubscriptionTypesModal';
import SubscriptionTypeDetails from './SubscriptionTypeDetails';
import CreateSubscriptionType from './CreateSubscriptionType';
import { FaEye, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { CiShoppingTag } from 'react-icons/ci';
import { RiForbidLine } from 'react-icons/ri';
import usePermission from '@/hooks/usePermission';

const SubscriptionsTypes = () => {
  const dispatch = useDispatch();
  const { subscriptionTypes, loading, error } = useSelector((state) => state.subscriptions);
  console.log(subscriptionTypes);
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

  // Permission checks at the top
  const canViewSubscriptionTypes = usePermission("view_subscriptiontype");
  const canAddSubscriptionTypes = usePermission("add_subscriptiontype");
  const canEditSubscriptionTypes = usePermission("change_subscriptiontype");
  const canDeleteSubscriptionTypes = usePermission("delete_subscriptiontype");


  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);

  useEffect(() => {
    dispatch(fetchSubscriptionTypes({ page: currentPage }))
      .unwrap()
      .catch((err) => {
        if (err.includes("Page not found")) {
          setCurrentPage(1);
          dispatch(fetchSubscriptionTypes({ page: 1 }));
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

  // Filter logic
  const filteredSubscriptions = (subscriptionTypes.results || []).filter((type) => {
    const matchesSearch =
      searchQuery === '' || type.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
  statusFilter === 'all' ||
  (statusFilter === 'active' && type.is_active) ||
  (statusFilter === 'inactive' && !type.is_active);

    const matchesDuration =
      durationFilter === '' || type.duration_days === Number(durationFilter);
    const matchesGym =
      includesGym === '' ||
      (includesGym === 'yes' && type.includes_gym) ||
      (includesGym === 'no' && !type.includes_gym);
    const matchesPool =
      includesPool === '' ||
      (includesPool === 'yes' && type.includes_pool) ||
      (includesPool === 'no' && !type.includes_pool);
    const matchesClasses =
      includesClasses === '' ||
      (includesClasses === 'yes' && type.includes_classes) ||
      (includesClasses === 'no' && !type.includes_classes);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesDuration &&
      matchesGym &&
      matchesPool &&
      matchesClasses
    );
  }).sort((a, b) => b.id - a.id); // Sort by id descending

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
        <input
          type="text"
          placeholder="بحث بالاسم"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border px-3 py-2 rounded-md w-full text-right"
        />
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
          type="number"
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

      <ul className="space-y-4">
        {filteredSubscriptions.length > 0 ? (
          filteredSubscriptions.map((type) => (
            <li
              key={type.id}
              className="p-4 border-b border-gray-200 flex items-start justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col">
                <span className="text-lg font-semibold">{type.name}</span>
                <div className="text-sm text-gray-600">
                <p>
  نشط:{" "}
  {type.is_active ? (
    <span className="text-green-500">نعم</span>
  ) : (
    <span className="text-red-500">لا</span>
  )}
</p>

                </div>
              </div>
              <div className="flex space-x-2">
                <div className="relative group">
                  <button
                    onClick={() => openDetailsModal(type)}
                    className="text-green-500 p-2 rounded hover:text-green-600 transition-colors"
                  >
                    <FaEye />
                  </button>
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    عرض التفاصيل
                  </span>
                </div>
                  {canEditSubscriptionTypes && (
                  <div className="relative group">
                    <button
                      onClick={() => openModal(type)}
                      className="text-blue-500 p-2 rounded hover:text-blue-600 transition-colors"
                    >
                      <FaEdit />
                    </button>
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      تعديل
                    </span>
                  </div>
                )}
                    {canDeleteSubscriptionTypes && (
                  <div className="relative group">
                    <button
                      onClick={() => openDeleteModal(type)}
                      className="text-red-500 p-2 rounded hover:text-red-600 transition-colors"
                    >
                      <FaTrash />
                    </button>
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      حذف
                    </span>
                  </div>
                )}
              </div>
            </li>
          ))
        ) : (
          <p className="text-right text-gray-600">لا توجد أنواع اشتراكات مطابقة</p>
        )}
      </ul>

      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-md ${
            currentPage === 1
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
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
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
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