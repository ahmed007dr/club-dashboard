import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionTypes } from '../../redux/slices/subscriptionsSlice';
import UpdateSubscriptionTypes from './UpdateSubscriptionTypes';
import DeleteSubscriptionTypesModal from './DeleteSubscriptionTypesModal';
import SubscriptionTypeDetails from './SubscriptionTypeDetails';
import { FaEye, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import CreateSubscriptionType from './CreateSubscriptionType';
import { CiShoppingTag } from 'react-icons/ci';



const SubscriptionsTypes = () => {
  const dispatch = useDispatch();
  const { subscriptionTypes, loading, error } = useSelector((state) => state.subscriptions);
  console.log('Subscription Types:', subscriptionTypes);
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
  const [itemsPerPage] = useState(5);

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);

  useEffect(() => {
    dispatch(fetchSubscriptionTypes());
  }, [dispatch]);

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

  // Sort subscriptions by id (descending order, assuming higher ID = newer)
  const sortedSubscriptions = [...subscriptionTypes].sort((a, b) => b.id - a.id);

  // Filter logic
  const filteredSubscriptions = sortedSubscriptions.filter((type) => {
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
  });

  // Pagination logic
  const totalItems = filteredSubscriptions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSubscriptions.slice(indexOfFirstItem, indexOfLastItem);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6 mt-6">
        <div className="flex items-start space-x-3">
          <CiShoppingTag className="text-blue-600 w-9 h-9 text-2xl" />
          <h1 className="text-2xl font-bold mb-4">أنواع الاشتراكات</h1>
        </div>
        <button onClick={openCreateModal} className="flex items-center btn">
          <FaPlus />
          إضافة نوع جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="بحث بالاسم"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border px-3 py-2 rounded-md w-full"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border px-3 py-2 rounded-md w-full"
        >
          <option value="all">الحالة (الكل)</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
        </select>
        <input
          type="text"
          placeholder="المدة (مثال: 30 )"
          value={durationFilter}
          onChange={(e) => setDurationFilter(e.target.value)}
          className="border px-3 py-2 rounded-md w-full"
        />
        <select
          value={includesGym}
          onChange={(e) => setIncludesGym(e.target.value)}
          className="border px-3 py-2 rounded-md w-full"
        >
          <option value="">يشمل الجيم؟</option>
          <option value="yes">نعم</option>
          <option value="no">لا</option>
        </select>
        <select
          value={includesPool}
          onChange={(e) => setIncludesPool(e.target.value)}
          className="border px-3 py-2 rounded-md w-full"
        >
          <option value="">يشمل المسبح؟</option>
          <option value="yes">نعم</option>
          <option value="no">لا</option>
        </select>
        <select
          value={includesClasses}
          onChange={(e) => setIncludesClasses(e.target.value)}
          className="border px-3 py-2 rounded-md w-full"
        >
          <option value="">يشمل الحصص؟</option>
          <option value="yes">نعم</option>
          <option value="no">لا</option>
        </select>
      </div>

      <ul>
        {currentItems.map((type) => (
          <li
            key={type.id}
            className="mb-4 p-4 border-b border-gray-200 flex items-start justify-between hover:bg-gray-50 transition-colors"
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
                <span className="absolute -top-8 left-1/2 text-white transform -translate-x-1/2 bg-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  View Details
                </span>
              </div>
              <div className="relative group">
                <button
                  onClick={() => openModal(type)}
                  className="text-blue-500 p-2 rounded hover:text-blue-600 transition-colors"
                >
                  <FaEdit />
                </button>
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Edit
                </span>
              </div>
              <div className="relative group">
                <button
                  onClick={() => openDeleteModal(type)}
                  className="text-red-500 p-2 rounded hover:text-red-600 transition-colors"
                >
                  <FaTrash />
                </button>
                <span className="absolute -top-8 left-1/2 transform text-white -translate-x-1/2 bg-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Delete
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-md ${
            currentPage === 1
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          السابق
        </button>
        <span>
          صفحة {currentPage} من {totalPages}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-md ${
            currentPage === totalPages
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
            <h2 className="text-xl font-semibold mb-4">Update Subscription</h2>
            <UpdateSubscriptionTypes
              subscriptionId={selectedSubscription.id}
              subscriptionData={selectedSubscription}
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
            <h2 className="text-xl font-semibold mb-4">Subscription Details</h2>
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
            <h2 className="text-xl font-semibold mb-4">Create New Subscription</h2>
            <CreateSubscriptionType />
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsTypes;