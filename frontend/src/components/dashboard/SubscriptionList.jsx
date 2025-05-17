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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { MoreVertical } from "lucide-react";

const SubscriptionList = () => {
  const dispatch = useDispatch();
  const { subscriptions, status, error, updateStatus } = useSelector(
    (state) => state.subscriptions
  );

  console.log("Subscriptions:", subscriptions);

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
  const [itemsPerPage] = useState(20);
  const [filters, setFilters] = useState({
    memberName: "",
    status: "",
    startDate: "",
    endDate: "",
    clubName: "",
   entryCount: "",
  });

  // Sort subscriptions by id (newest first - descending)
  const sortedSubscriptions = [...subscriptions].sort((a, b) => b.id - a.id);

  // Apply filters to the sorted array
  const filteredSubscriptions = sortedSubscriptions.filter((subscription) => {
    const matchesMember = filters.memberName
      ? subscription.member_details.name
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
    const matchesClubName = filters.clubName
      ? subscription.club_details.name
          .toLowerCase()
          .includes(filters.clubName.toLowerCase())
      : true;
   const matchesEntryCount = filters.entryCount
  ? subscription.entry_count === parseInt(filters.entryCount)
  : true;
    return (
      matchesMember &&
      matchesStatus &&
      matchesStartDate &&
      matchesEndDate &&
      matchesClubName &&
      matchesEntryCount
    );
  });

  // Pagination configuration
  const totalItems = filteredSubscriptions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSubscriptions = filteredSubscriptions.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Generate pagination range
  const getPaginationRange = () => {
    const maxButtons = 5; // Maximum number of page buttons to show
    const sideButtons = Math.floor(maxButtons / 2);

    let start = Math.max(1, currentPage - sideButtons);
    let end = Math.min(totalPages, currentPage + sideButtons);

    // Adjust start and end to always show maxButtons when possible
    if (end - start + 1 < maxButtons) {
      if (currentPage <= sideButtons) {
        end = Math.min(totalPages, maxButtons);
      } else {
        start = Math.max(1, totalPages - maxButtons + 1);
      }
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // Handlers
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo(0, 0); // Scroll to top on page change
    }
  };

  // Jump to first/last page
  const goToFirstPage = () => handlePageChange(1);
  const goToLastPage = () => handlePageChange(totalPages);

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
      memberName: "",
      status: "",
      startDate: "",
      endDate: "",
      clubName: "",
      entryCount: "",
    });
    setCurrentPage(1);
  };

  const handleInputChange = (e, subscriptionId) => {
    const { value } = e.target;
    // Only allow positive numbers with optional decimal
    if (/^\d*\.?\d*$/.test(value) && !value.startsWith("-")) {
      setPaymentAmounts((prev) => ({
        ...prev,
        [subscriptionId]: value,
      }));
    }
  };

  const handlePayment = (subscription) => {
    const amountStr = paymentAmounts[subscription.id] || "";
    const remainingAmount = parseFloat(subscription.remaining_amount);

    // Validate the amount
    if (!amountStr || amountStr === "0" || amountStr === "0.00") {
      alert("الرجاء إدخال مبلغ صالح للدفع");
      return;
    }

    const amount = parseFloat(amountStr);

    if (isNaN(amount)) {
      alert("المبلغ المدخل غير صالح");
      return;
    }

    if (amount <= 0) {
      alert("يجب أن يكون المبلغ أكبر من الصفر");
      return;
    }

    if (amount > remainingAmount) {
      alert("المبلغ المدخل أكبر من المبلغ المتبقي");
      return;
    }

    dispatch(
      makePayment({
        subscriptionId: subscription.id,
        amount: amount.toFixed(2),
      })
    )
      .unwrap()
      .then(() => {
        alert("تم الدفع بنجاح!");
        setPaymentAmounts((prev) => ({
          ...prev,
          [subscription.id]: "",
        }));
        dispatch(fetchSubscriptions()); // Refresh the list
      })
      .catch((error) => {
        console.error(error);
        alert(`فشل الدفع: ${error.message}`);
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
        console.error("Failed to fetch subscription details:", error);
        alert("Failed to load subscription details");
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
      if (updateStatus === "succeeded") {
        closeModal();
        dispatch(fetchSubscriptions());
      }
    });
  };

  const handleRenew = (subscriptionId) => {
    dispatch(renewSubscription({ subscriptionId }));
  };

  if (status === "loading") {
    return <div className="text-center text-xl text-gray-500">Loading...</div>;
  }

  if (status === "failed") {
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
        <button onClick={() => setCreateModalOpen(true)} className="btn">
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

        {/* Club Name Filter */}
        <div className="flex flex-col w-56">
          <label className="text-sm font-medium text-gray-700 mb-1 text-right">
            اسم النادي
          </label>
          <input
            type="text"
            name="clubName"
            value={filters.clubName}
            onChange={handleFilterChange}
            placeholder="بحث باسم النادي"
            className="border border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg px-3 py-2 text-sm text-right shadow-sm placeholder-gray-400 transition-all duration-200 ease-in-out"
          />
        </div>

        {/* Attendance Days Filter */}
     <div className="flex flex-col w-56">
  <label className="text-sm font-medium text-gray-700 mb-1 text-right">
    عدد الإدخالات
  </label>
  <input
    type="number"
    name="entryCount"
    value={filters.entryCount}
    onChange={handleFilterChange}
    placeholder="تصفية حسب عدد الإدخالات"
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
            <option value="Upcoming">قادمة</option>
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
                <th className="py-1 px-2 text-right text-sm">العضو</th>
                <th className="py-1 px-2 text-right text-sm">اسم النادي</th>
                <th className="py-1 px-2 text-right text-sm">تاريخ البدء</th>
                <th className="py-1 px-2 text-right text-sm">تاريخ الانتهاء</th>
                <th className="py-1 px-2 text-right text-sm">عدد الإدخالات</th>
                <th className="py-1 px-2 text-right text-sm">
                  الإدخالات المتبقية
                </th>
                <th className="py-1 px-2 text-right text-sm">المبلغ المدفوع</th>
                <th className="py-1 px-2 text-right text-sm">المبلغ المتبقي</th>
                <th className="py-1 px-2 text-right text-sm">الحالة</th>
                <th className="py-1 px-2 text-center text-sm">الدفع</th>
                <th className="py-1 px-2 text-right text-sm">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {currentSubscriptions.map((subscription) => (
                <tr
                  key={subscription.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="py-1 px-2 text-sm">
                    <Link
                      to={`/member-subscriptions/${subscription.member_details.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {subscription.member_details.name}
                    </Link>
                  </td>
                  <td className="py-1 px-2 text-sm">
                    {subscription.club_details.name}
                  </td>
                  <td className="py-1 px-2 text-sm">
                    {subscription.start_date}
                  </td>
                  <td className="py-1 px-2 text-sm">{subscription.end_date}</td>
                  <td className="py-1 px-2 text-sm">
                    {subscription.entry_count}
                  </td>
                  <td className="py-1 px-2 text-sm">
                    {subscription.type_details.max_entries -
                      subscription.entry_count}
                  </td>
                  <td className="py-1 px-2 text-sm">
                    ${subscription.paid_amount}
                  </td>
                  <td className="py-1 px-2 text-sm">
                    ${subscription.remaining_amount}
                  </td>
                  <td className="py-1 px-2 text-sm">
                    <span
                      className={`px-1 py-0.5 rounded text-xs font-medium
                        ${
                          subscription.status === "Active"
                            ? "bg-green-100 text-green-600"
                            : subscription.status === "Expired"
                            ? "bg-red-100 text-red-600"
                            : subscription.status === "Upcoming"
                            ? "bg-blue-100 text-blue-600"
                            : ""
                        }`}
                    >
                      {subscription.status}
                    </span>
                  </td>
                  <td className="py-1 px-2 flex items-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*\.?[0-9]*"
                      placeholder="0.00"
                      value={paymentAmounts[subscription.id] || ""}
                      onChange={(e) => handleInputChange(e, subscription.id)}
                      className="border p-0.5 rounded w-12 text-sm"
                    />
                    <button
                      onClick={() => handlePayment(subscription)}
                      className="btn text-sm px-2 py-0.5 ml-1"
                      disabled={updateStatus === "loading"}
                    >
                      {updateStatus === "loading" ? "جاري الدفع..." : "دفع"}
                    </button>
                  </td>
                  <td className="py-1 px-2">
                    <div className="flex items-center gap-1">
                      <DropdownMenu dir="rtl">
                        <DropdownMenuTrigger asChild>
                          <button className="bg-gray-200 text-gray-700 px-0.5 py-0.5 rounded-md hover:bg-gray-300 transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-32 text-sm"
                        >
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
                          {subscription.status === "Expired" && (
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
      {/* Pagination */}
      {totalItems === 0 && (
        <div className="text-center text-sm text-gray-600 mt-6">
          لا توجد اشتراكات لعرضها
        </div>
      )}
      {totalItems > 0 && (
        <div
          className="flex justify-center items-center mt-6 space-x-2"
          dir="rtl"
        >
          {/* First Page Button */}
          <button
            onClick={goToFirstPage}
            disabled={currentPage === 1 || totalItems === 0}
            className={`px-3 py-2 rounded-lg ${
              currentPage === 1 || totalItems === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            } transition`}
          >
            الأول
          </button>

          {/* Previous Page Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || totalItems === 0}
            className={`px-3 py-2 rounded-lg ${
              currentPage === 1 || totalItems === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            } transition`}
          >
            السابق
          </button>

          {/* Page Number Buttons */}
          {getPaginationRange().map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              disabled={totalItems === 0}
              className={`px-3 py-2 rounded-lg ${
                currentPage === page && totalItems > 0
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              } ${totalItems === 0 ? "cursor-not-allowed" : ""} transition`}
            >
              {page}
            </button>
          ))}

          {/* Next Page Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalItems === 0}
            className={`px-3 py-2 rounded-lg ${
              currentPage === totalPages || totalItems === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            } transition`}
          >
            التالي
          </button>

          {/* Last Page Button */}
          <button
            onClick={goToLastPage}
            disabled={currentPage === totalPages || totalItems === 0}
            className={`px-3 py-2 rounded-lg ${
              currentPage === totalPages || totalItems === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            } transition`}
          >
            الأخير
          </button>

          {/* Page Info */}
          <span className="text-sm text-gray-600 mx-2">
            صفحة {currentPage} من {totalPages} (إجمالي: {totalItems} اشتراك)
          </span>
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
            <CreateSubscription onClose={() => setCreateModalOpen(false)} />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
         <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
  <h3 className="text-2xl font-semibold mb-4 text-gray-800">تفاصيل الاشتراك</h3>
  
  <div className="space-y-3 mb-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-gray-600 font-medium">اسم العضو:</p>
        <p className="text-gray-800">{detailSubscription.member_details.name}</p>
      </div>
      <div>
        <p className="text-gray-600 font-medium">رقم العضوية:</p>
        <p className="text-gray-800">250515009</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-gray-600 font-medium">تاريخ البدء:</p>
        <p className="text-gray-800">{detailSubscription.start_date}</p>
      </div>
      <div>
        <p className="text-gray-600 font-medium">تاريخ الانتهاء:</p>
        <p className="text-gray-800">{detailSubscription.end_date}</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-gray-600 font-medium">المبلغ المدفوع:</p>
        <p className="text-green-600 font-medium">${detailSubscription.paid_amount}</p>
      </div>
      <div>
        <p className="text-gray-600 font-medium">المبلغ المتبقي:</p>
        <p className="text-red-600 font-medium">${detailSubscription.remaining_amount}</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-gray-600 font-medium">عدد الإدخالات:</p>
        <p className="text-gray-800">{detailSubscription.entry_count}</p>
      </div>
      <div>
        <p className="text-gray-600 font-medium">اسم النادي:</p>
        <p className="text-gray-800">{detailSubscription.club_details.name}</p>
      </div>
    </div>
  </div>

  <div className="border-t pt-4">
    <h4 className="text-lg font-semibold mb-2 text-gray-800">معلومات إضافية</h4>
    <div className="space-y-2">
      <p><span className="text-gray-600 font-medium">رقم الهوية:</span> 87356596775325</p>
      <p><span className="text-gray-600 font-medium">تاريخ الميلاد:</span> 1969-09-04</p>
      <p><span className="text-gray-600 font-medium">الهاتف:</span> 222222222222</p>
      <p><span className="text-gray-600 font-medium">هاتف إضافي:</span> 3333333333333</p>
      <p><span className="text-gray-600 font-medium">المهنة:</span> Telecommunications researcher</p>
      <p><span className="text-gray-600 font-medium">العنوان:</span> 97646 Whitaker Manors, New Matthew, AS 18521</p>
      <p><span className="text-gray-600 font-medium">ملاحظات:</span> Guess despite again network.</p>
    </div>
  </div>

  <button
    onClick={() => setDetailModalOpen(false)}
    className="mt-6 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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
