import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSubscriptions,
  fetchSubscriptionById,
  updateSubscription,
  renewSubscription,
  makePayment,
} from "../../redux/slices/subscriptionsSlice";
import DeleteSubscriptionModal from "./DeleteSubscriptionModal";
import UpdateSubscriptionModal from "./UpdateSubscriptionModal";
import { Link } from "react-router-dom";
import { FaEdit, FaTrash, FaEye, FaRedo } from "react-icons/fa";
import { CiCircleList } from "react-icons/ci";
import CreateSubscription from "./CreateSubscription";
import { FaArrowRotateLeft } from "react-icons/fa6";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/DropdownMenu";
import { MoreVertical } from "lucide-react";



const SubscriptionList = () => {
  const dispatch = useDispatch();
  const { subscriptions, status, error, updateStatus } = useSelector(
    (state) => state.subscriptions
  );

  // State management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailSubscriptionId, setDetailSubscriptionId] = useState(null);
  const [paymentAmounts, setPaymentAmounts] = useState({});
  const [detailSubscription, setDetailSubscription] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [filters, setFilters] = useState({
    memberName: '',
    status: '',
    startDate: '',
    endDate: '',
    clubId: '',
    attendanceDays: '',
  });

  // Sort subscriptions by start_date (newest first)
  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    return new Date(b.start_date) - new Date(a.start_date);
  });

  // Apply filters to the sorted array
  const filteredSubscriptions = sortedSubscriptions.filter((subscription) => {
    const matchesMember = filters.memberName
      ? subscription.member_name
          .toLowerCase()
          .includes(filters.memberName.toLowerCase())
      : true;
    const matchesStatus = filters.status
      ? subscription.status === filters.status
      : true;
    const subscriptionStartDate = new Date(subscription.start_date);
    const subscriptionEndDate = new Date(subscription.end_date);
    const filterStartDate = filters.startDate
      ? new Date(filters.startDate)
      : null;
    const filterEndDate = filters.endDate ? new Date(filters.endDate) : null;
    const matchesStartDate = filterStartDate
      ? subscriptionStartDate.setHours(0, 0, 0, 0) ===
        filterStartDate.setHours(0, 0, 0, 0)
      : true;
    const matchesEndDate = filterEndDate
      ? subscriptionEndDate.setHours(0, 0, 0, 0) ===
        filterEndDate.setHours(0, 0, 0, 0)
      : true;
    const matchesClubId = filters.clubId
      ? subscription.club === parseInt(filters.clubId)
      : true;
    const matchesAttendanceDays = filters.attendanceDays
      ? subscription.attendance_days === parseInt(filters.attendanceDays)
      : true;
    return (
      matchesMember &&
      matchesStatus &&
      matchesStartDate &&
      matchesEndDate &&
      matchesClubId &&
      matchesAttendanceDays
    );
  });

  // Pagination
  const totalItems = filteredSubscriptions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSubscriptions = filteredSubscriptions.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Handlers
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      memberName: '',
      status: '',
      startDate: '',
      endDate: '',
      clubId: '',
      attendanceDays: '',
    });
    setCurrentPage(1);
  };

  const handleInputChange = (e, subscriptionId) => {
    const { value } = e.target;
    if (/^\d*\.?\d*$/.test(value)) {
      setPaymentAmounts((prev) => ({
        ...prev,
        [subscriptionId]: value,
      }));
    }
  };

  const handlePayment = (subscription) => {
    let amount =
      paymentAmounts[subscription.id] || subscription.remaining_amount;
    amount = parseFloat(amount).toFixed(2);
    
    dispatch(
      makePayment({
        subscriptionId: subscription.id,
        amount,
      })
    )
      .unwrap()
      .then(() => {
        alert('Payment successful!');
        setPaymentAmounts((prev) => ({
          ...prev,
          [subscription.id]: '',
        }));
        dispatch(fetchSubscriptions());
      })
      .catch((error) => {
        console.error(error);
        alert(`Payment failed: ${error.message}`);
      });
  };

  const openDetailModal = (id) => {
    dispatch(fetchSubscriptionById(id))
      .unwrap()
      .then((data) => {
        setDetailSubscription(data);
        setDetailSubscriptionId(id);
        setDetailModalOpen(true);
      })
      .catch((error) => {
        console.error('Failed to fetch subscription details:', error);
        alert('Failed to load subscription details');
      });
  };

  useEffect(() => {
    dispatch(fetchSubscriptions());
  }, [dispatch]);

  const openModal = (subscription) => {
    setSelectedSubscription(subscription);
    setIsModalOpen(true);
  };

  const openDeleteModal = (subscription) => {
    setSelectedSubscription(subscription);
    setDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSubscription(null);
  };

  const handleSubmit = (formData) => {
    dispatch(
      updateSubscription({
        id: selectedSubscription.id,
        subscriptionData: formData,
      })
    ).then(() => {
      if (updateStatus === 'succeeded') {
        closeModal();
        dispatch(fetchSubscriptions());
      }
    });
  };

  const handleRenew = (subscriptionId) => {
    dispatch(renewSubscription({ subscriptionId }));
  };

  if (status === 'loading') {
    return <div className="text-center text-xl text-gray-500">Loading...</div>;
  }

  if (status === 'failed') {
    return (
      <div className="text-center text-xl text-red-500">Error: {error}</div>
    );
  }

  return (
    <div className="mx-auto p-6" dir="rtl">
      {/* Header and Create Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2 items-start">
          <CiCircleList className="text-blue-600 w-9 h-9 text-2xl" />
          <h2 className="text-2xl font-semibold text-center text-gray-700 mb-4">
            قائمة الاشتراكات
          </h2>
        </div>
        <button 
          onClick={() => setCreateModalOpen(true)} 
          className="btn"
        >
          إضافة اشتراك
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 my-6 px-4" dir="rtl">
        {/* Member Name Filter */}
        <div className="flex flex-col w-56">
          <label className="text-sm font-medium text-gray-700 mb-1 text-right">
            اسم العضو
          </label>
          <input
            type="text"
            name="memberName"
            value={filters.memberName}
            onChange={handleFilterChange}
            placeholder="بحث باسم العضو"
            className="border border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg px-3 py-2 text-sm text-right shadow-sm placeholder-gray-400 transition-all duration-200 ease-in-out"
          />
        </div>

        {/* Start Date Filter */}
        <div className="flex flex-col w-56">
          <label className="text-sm font-medium text-gray-700 mb-1 text-right">
            تاريخ البدء
          </label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="border border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg px-3 py-2 text-sm text-right shadow-sm transition-all duration-200 ease-in-out"
          />
        </div>

        {/* End Date Filter */}
        <div className="flex flex-col w-56">
          <label className="text-sm font-medium text-gray-700 mb-1 text-right">
            تاريخ الانتهاء
          </label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="border border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg px-3 py-2 text-sm text-right shadow-sm transition-all duration-200 ease-in-out"
          />
        </div>

        {/* Club ID Filter */}
        <div className="flex flex-col w-56">
          <label className="text-sm font-medium text-gray-700 mb-1 text-right">
            معرف النادي
          </label>
          <input
            type="number"
            name="clubId"
            value={filters.clubId}
            onChange={handleFilterChange}
            placeholder="تصفية حسب معرف النادي"
            min="1"
            className="border border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg px-3 py-2 text-sm text-right shadow-sm placeholder-gray-400 transition-all duration-200 ease-in-out"
          />
        </div>

        {/* Attendance Days Filter */}
        <div className="flex flex-col w-56">
          <label className="text-sm font-medium text-gray-700 mb-1 text-right">
            أيام الحضور
          </label>
          <input
            type="number"
            name="attendanceDays"
            value={filters.attendanceDays}
            onChange={handleFilterChange}
            placeholder="تصفية حسب أيام الحضور"
            min="0"
            className="border border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg px-3 py-2 text-sm text-right shadow-sm placeholder-gray-400 transition-all duration-200 ease-in-out"
          />
        </div>

        {/* Status Filter */}
        <div className="flex flex-col w-56">
          <label className="text-sm font-medium text-gray-700 mb-1 text-right">
            الحالة
          </label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="border border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg px-3 py-2 text-sm text-right shadow-sm transition-all duration-200 ease-in-out"
          >
            <option value="">كل الحالات</option>
            <option value="Active">نشط</option>
            <option value="Expired">منتهي</option>
            <option value="Pending">قيد الانتظار</option>
          </select>
        </div>

        {/* Reset Filters Button */}
        <div className="flex items-end">
          <button onClick={resetFilters} className="btn">
            <FaArrowRotateLeft />
          </button>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="overflow-x-auto">
        {currentSubscriptions.length === 0 ? (
          <p className="text-center text-lg text-gray-500">
            لا توجد اشتراكات متاحة.
          </p>
        ) : (
          <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 text-right">العضو</th>
                <th className="py-2 px-4 text-right">اسم النادي</th>
                <th className="py-2 px-4 text-right">تاريخ البدء</th>
                <th className="py-2 px-4 text-right">تاريخ الانتهاء</th>
                <th className="py-2 px-4 text-right">المبلغ المدفوع</th>
                <th className="py-2 px-4 text-right">المبلغ المتبقي</th>
                <th className="py-2 px-4 text-right">الحالة</th>
                <th className="py-2 px-4 text-right">الدفع</th>
                <th className="py-2 px-4 text-right">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {currentSubscriptions.map((subscription) => (
                <tr
                  key={subscription.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="py-2 px-4">
                    <Link
                      to={`/member-subscriptions/${subscription.member}`}
                      className="text-blue-600 hover:underline"
                    >
                      {subscription.member_name}
                    </Link>
                  </td>
                  <td className="py-2 px-4">{subscription.club_name}</td>
                  <td className="py-2 px-4">{subscription.start_date}</td>
                  <td className="py-2 px-4">{subscription.end_date}</td>
                  <td className="py-2 px-4">${subscription.paid_amount}</td>
                  <td className="py-2 px-4">${subscription.remaining_amount}</td>
                  <td className="py-2 px-4">
                    <span
                      className={`px-2 py-1 rounded text-sm font-medium
                        ${
                          subscription.status === 'Active'
                            ? 'bg-green-100 text-green-600'
                            : subscription.status === 'Expired'
                            ? 'bg-red-100 text-red-600'
                            : subscription.status === 'Upcoming'
                            ? 'bg-blue-100 text-blue-600'
                            : ''
                        }`}
                    >
                      {subscription.status}
                    </span>
                  </td>
                  <td className="py-2 px-8 flex">
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*\.?[0-9]*"
                      placeholder="0.00"
                      value={paymentAmounts[subscription.id] || ''}
                      onChange={(e) => handleInputChange(e, subscription.id)}
                      className="border p-1 rounded w-15"
                    />
                    <button
                      onClick={() => handlePayment(subscription)}
                      className="btn"
                    >
                      دفع
                    </button>
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <DropdownMenu dir="rtl">
                        <DropdownMenuTrigger asChild>
                          <button className="bg-gray-200 text-gray-700 px-1 py-1 rounded-md hover:bg-gray-300 transition-colors">
                            <MoreVertical className="h-5 w-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => openModal(subscription)}
                            className="cursor-pointer text-yellow-600 hover:bg-yellow-50"
                          >
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDetailModal(subscription.id)}
                            className="cursor-pointer text-green-600 hover:bg-yellow-50"
                          >
                            عرض
                          </DropdownMenuItem>
                          {subscription.status === 'Expired' && (
                            <DropdownMenuItem
                              onClick={() => handleRenew(subscription.id)}
                              className="cursor-pointer text-yellow-600 hover:bg-yellow-50"
                            >
                              تجديد
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => openDeleteModal(subscription)}
                            className="cursor-pointer text-red-600 hover:bg-red-50"
                          >
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-2" dir="rtl">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg ${
              currentPage === 1
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            } transition`}
          >
            السابق
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } transition`}
              >
                {page}
              </button>
            )
          )}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg ${
              currentPage === totalPages
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            } transition`}
          >
            التالي
          </button>
        </div>
      )}

      {/* Modals */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-40">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              X
            </button>
            <h3 className="text-2xl font-semibold mb-4 text-center">
              إضافة اشتراك
            </h3>
            <CreateSubscription />
          </div>
        </div>
      )}

      {isModalOpen && (
        <UpdateSubscriptionModal
          isOpen={isModalOpen}
          onClose={closeModal}
          subscription={selectedSubscription}
          onSubmit={handleSubmit}
        />
      )}

      <DeleteSubscriptionModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        subscription={selectedSubscription}
      />

      {detailModalOpen && detailSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-2xl font-semibold mb-4">تفاصيل الاشتراك</h3>
            <p>
              <strong>اسم العضو:</strong> {detailSubscription.member_name}
            </p>
            <p>
              <strong>تاريخ البدء:</strong> {detailSubscription.start_date}
            </p>
            <p>
              <strong>تاريخ الانتهاء:</strong> {detailSubscription.end_date}
            </p>
            <p>
              <strong>المبلغ المدفوع:</strong> ${detailSubscription.paid_amount}
            </p>
            <p>
              <strong>المبلغ المتبقي:</strong> $
              {detailSubscription.remaining_amount}
            </p>
            <p>
              <strong>الحالة:</strong> {detailSubscription.status}
            </p>
            <p>
              <strong>أيام الحضور:</strong> {detailSubscription.attendance_days}
            </p>
            <p>
              <strong>اسم النادي:</strong> {detailSubscription.club_name}
            </p>
            <button
              onClick={() => setDetailModalOpen(false)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionList;
