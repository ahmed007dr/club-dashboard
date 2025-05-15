import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSubscriptions,
  fetchSubscriptionById,
  updateSubscription,
  renewSubscription,
  makePayment,
  postSubscription,
  fetchSubscriptionTypes,
} from "../../redux/slices/subscriptionsSlice";
import { fetchUsers } from "../../redux/slices/memberSlice";
import DeleteSubscriptionModal from "./DeleteSubscriptionModal";
import UpdateSubscriptionModal from "./UpdateSubscriptionModal";
import { Link } from "react-router-dom";
import { FaEdit, FaTrash, FaEye, FaRedo } from "react-icons/fa";
import { CiCircleList } from "react-icons/ci";
import { FaArrowRotateLeft } from "react-icons/fa6";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/DropdownMenu";
import { MoreVertical } from "lucide-react";

const SubscriptionList = () => {
  const dispatch = useDispatch();
  const { subscriptions, status, error, updateStatus, pagination, subscriptionTypes, loading: subscriptionLoading } = useSelector(
    (state) => state.subscriptions || {}
  );
  const { users, loading: usersLoading } = useSelector((state) => state.members || {});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailSubscriptionId, setDetailSubscriptionId] = useState(null);
  const [paymentAmounts, setPaymentAmounts] = useState({});
  const [detailSubscription, setDetailSubscription] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    memberName: "",
    status: "",
    startDate: "",
    endDate: "",
    clubName: "",
    attendanceDays: "",
  });
  // CreateSubscription state
  const [createFormData, setCreateFormData] = useState({
    club: "",
    member: "",
    type: "",
    start_date: "",
    paid_amount: "",
  });
  const [members, setMembers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createErrorMessage, setCreateErrorMessage] = useState("");
  const [createErrorModalOpen, setCreateErrorModalOpen] = useState(false);

  const itemsPerPage = 20;
  const totalItems = pagination?.count || 0;
  const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / itemsPerPage);
  const maxButtons = 5;

  useEffect(() => {
    console.log("SubscriptionList: useEffect triggered with filters:", filters, "currentPage:", currentPage);
    // Ensure filters is always an object
    if (!filters || typeof filters !== "object") {
      console.warn("SubscriptionList: Filters is undefined or invalid, resetting to default");
      setFilters({
        memberName: "",
        status: "",
        startDate: "",
        endDate: "",
        clubName: "",
        attendanceDays: "",
      });
      return;
    }

    const queryParams = {
      page: currentPage || 1,
      member_name: filters.memberName || undefined,
      status: filters.status || undefined,
      start_date: filters.startDate || undefined,
      end_date: filters.endDate || undefined,
      club_name: filters.clubName || undefined,
      attendance_days: filters.attendanceDays || undefined,
      sort: "-id",
    };
    console.log("SubscriptionList: Dispatching fetchSubscriptions with queryParams:", queryParams);
    dispatch(fetchSubscriptions(queryParams));
  }, [dispatch, currentPage, filters]);

  // Fetch users and subscription types when create modal opens
  useEffect(() => {
    if (createModalOpen) {
      console.log("SubscriptionList: Create modal opened, fetching users and subscription types");
      const fetchData = async () => {
        try {
          // Fetch users
          const fetchedData = await dispatch(fetchUsers()).unwrap();
          const memberList = Array.isArray(fetchedData) ? fetchedData : [];
          console.log("SubscriptionList: Fetched members:", memberList);
          setMembers(memberList);

          // Extract unique clubs
          const uniqueClubs = Array.from(
            new Map(
              memberList.map((m) => [
                m.club,
                { club_id: m.club, club_name: m.club_name || `Club ${m.club}` },
              ])
            ).values()
          );
          console.log("SubscriptionList: Extracted clubs:", uniqueClubs);
          setClubs(uniqueClubs);

          // Fetch subscription types
          await dispatch(fetchSubscriptionTypes()).unwrap();
          console.log("SubscriptionList: Fetched subscription types:", subscriptionTypes);
        } catch (err) {
          console.error("SubscriptionList: Error fetching data:", err);
          setCreateErrorMessage(err.message || "فشل تحميل بيانات الأعضاء أو أنواع الاشتراك");
          setCreateErrorModalOpen(true);
        }
      };
      fetchData();
    }
  }, [createModalOpen, dispatch]);

  // Filter members based on selected club
  useEffect(() => {
    if (createFormData.club) {
      const filtered = members.filter((m) => m.club === parseInt(createFormData.club));
      console.log("SubscriptionList: Filtered members for club", createFormData.club, ":", filtered);
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers([]);
    }
  }, [createFormData.club, members]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && totalItems > 0) {
      console.log("SubscriptionList: Changing page to:", pageNumber);
      setCurrentPage(pageNumber);
      window.scrollTo(0, 0);
    }
  };

  const goToFirstPage = () => handlePageChange(1);
  const goToLastPage = () => handlePageChange(totalPages);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    console.log("SubscriptionList: Filter changed:", { name, value });
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    console.log("SubscriptionList: Resetting filters");
    setFilters({
      memberName: "",
      status: "",
      startDate: "",
      endDate: "",
      clubName: "",
      attendanceDays: "",
    });
    setCurrentPage(1);
  };

  const handleInputChange = (e, subscriptionId) => {
    const { value } = e.target;
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
        dispatch(fetchSubscriptions({ page: currentPage, ...filters, sort: "-id" }));
      })
      .catch((error) => {
        console.error(error);
        alert(`فشل الدفع: ${error.message || "حدث خطأ"}`);
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
        alert("فشل تحميل تفاصيل الاشتراك");
      });
  };

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
        dispatch(fetchSubscriptions({ page: currentPage, ...filters, sort: "-id" }));
      }
    });
  };

  const handleRenew = (subscriptionId) => {
    dispatch(renewSubscription({ subscriptionId }))
      .unwrap()
      .then(() => {
        dispatch(fetchSubscriptions({ page: currentPage, ...filters, sort: "-id" }));
      });
  };

  // CreateSubscription handlers
  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    console.log("SubscriptionList: Create form field changed:", { name, value });
    setCreateFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    console.log("SubscriptionList: Submitting create form with data:", createFormData);
    const { club, member, type, start_date, paid_amount } = createFormData;

    if (!club || !member || !type || !start_date || !paid_amount) {
      console.warn("SubscriptionList: Missing required fields");
      setCreateErrorMessage("الرجاء ملء جميع الحقول المطلوبة");
      setCreateErrorModalOpen(true);
      return;
    }

    const amount = parseFloat(paid_amount);
    if (isNaN(amount)) {
      console.warn("SubscriptionList: Invalid paid_amount:", paid_amount);
      setCreateErrorMessage("المبلغ المدخل غير صالح");
      setCreateErrorModalOpen(true);
      return;
    }

    if (amount <= 0) {
      console.warn("SubscriptionList: Paid amount <= 0:", amount);
      setCreateErrorMessage("يجب أن يكون المبلغ أكبر من الصفر");
      setCreateErrorModalOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        club: parseInt(club),
        member: parseInt(member),
        type: parseInt(type),
        start_date,
        paid_amount: amount,
      };
      console.log("SubscriptionList: Dispatching postSubscription with payload:", payload);
      await dispatch(postSubscription(payload)).unwrap();

      console.log("SubscriptionList: Subscription created successfully");
      setCreateFormData({
        club: "",
        member: "",
        type: "",
        start_date: "",
        paid_amount: "",
      });

      setCreateModalOpen(false);
      const safeFilters = filters || {
        memberName: "",
        status: "",
        startDate: "",
        endDate: "",
        clubName: "",
        attendanceDays: "",
      };
      console.log("SubscriptionList: Dispatching fetchSubscriptions after create with safeFilters:", safeFilters);
      dispatch(fetchSubscriptions({ page: 1, ...safeFilters, sort: "-id" }));
    } catch (error) {
      console.error("SubscriptionList: Error creating subscription:", error);
      let errorMsg = "حدث خطأ أثناء إنشاء الاشتراك";
      if (error?.non_field_errors) {
        errorMsg = error.non_field_errors[0];
      } else if (error?.message) {
        errorMsg = error.message;
      } else if (typeof error === "string") {
        errorMsg = error;
      }
      setCreateErrorMessage(errorMsg);
      setCreateErrorModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeCreateErrorModal = () => {
    console.log("SubscriptionList: Closing create error modal");
    setCreateErrorModalOpen(false);
    setCreateErrorMessage("");
  };

  const closeCreateModal = () => {
    console.log("SubscriptionList: Closing create modal");
    setCreateModalOpen(false);
    const safeFilters = filters || {
      memberName: "",
      status: "",
      startDate: "",
      endDate: "",
      clubName: "",
      attendanceDays: "",
    };
    console.log("SubscriptionList: Dispatching fetchSubscriptions with safeFilters:", safeFilters);
    dispatch(fetchSubscriptions({ page: 1, ...safeFilters, sort: "-id" }));
  };

  if (status === "loading") {
    return <div className="text-center text-xl text-gray-500">جاري التحميل...</div>;
  }

  if (status === "failed") {
    const errorMessage = typeof error === "object" ? error.detail || JSON.stringify(error) : error;
    return (
      <div className="text-center text-xl text-red-500">خطأ: {errorMessage}</div>
    );
  }

  return (
    <div className="mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2 items-start">
          <CiCircleList className="text-blue-600 w-9 h-9 text-2xl" />
          <h2 className="text-2xl font-semibold text-center text-gray-700 mb-4">
            قائمة الاشتراكات
          </h2>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn bg-blue-500 text-white px-5 py-2.5 rounded-lg hover:bg-blue-600"
        >
          إضافة اشتراك
        </button>
      </div>

      <div className="flex flex-wrap gap-4 my-6 px-4" dir="rtl">
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
        <div className="flex items-end">
          <button
            onClick={resetFilters}
            className="btn bg-blue-500 text-white px-5 py-2.5 rounded-lg hover:bg-blue-600"
          >
            <FaArrowRotateLeft />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {subscriptions.length === 0 ? (
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
                <th className="py-1 px-2 text-right text-sm">الإدخالات المتبقية</th>
                <th className="py-1 px-2 text-right text-sm">المبلغ المدفوع</th>
                <th className="py-1 px-2 text-right text-sm">المبلغ المتبقي</th>
                <th className="py-1 px-2 text-right text-sm">الحالة</th>
                <th className="py-1 px-2 text-center text-sm">الدفع</th>
                <th className="py-1 px-2 text-right text-sm">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
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
                  <td className="py-1 px-2 text-sm">{subscription.club_details.name}</td>
                  <td className="py-1 px-2 text-sm">{subscription.start_date}</td>
                  <td className="py-1 px-2 text-sm">{subscription.end_date}</td>
                  <td className="py-1 px-2 text-sm">{subscription.entry_count}</td>
                  <td className="py-1 px-2 text-sm">
                    {subscription.type_details.max_entries - subscription.entry_count}
                  </td>
                  <td className="py-1 px-2 text-sm">${subscription.paid_amount}</td>
                  <td className="py-1 px-2 text-sm">${subscription.remaining_amount}</td>
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
                      className="btn text-sm px-2 py-0.5 ml-1 bg-blue-500 text-white rounded hover:bg-blue-600"
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
                        <DropdownMenuContent align="end" className="w-32 text-sm">
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

      <div className="flex justify-between items-center mt-6" dir="rtl">
        <div className="text-sm text-gray-600">
          عرض {(currentPage - 1) * itemsPerPage + (totalItems > 0 ? 1 : 0)} إلى{" "}
          {Math.min(currentPage * itemsPerPage, totalItems)} من {totalItems} اشتراك
        </div>
        <div className="flex gap-2">
          <button
            onClick={goToFirstPage}
            disabled={currentPage === 1 || totalItems === 0}
            className={`px-3 py-1 rounded text-sm ${
              currentPage === 1 || totalItems === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            الأول
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || totalItems === 0}
            className={`px-3 py-1 rounded text-sm ${
              currentPage === 1 || totalItems === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            السابق
          </button>
          {(() => {
            const sideButtons = Math.floor(maxButtons / 2);
            let start = Math.max(1, currentPage - sideButtons);
            let end = Math.min(totalPages, start + maxButtons - 1);
            if (end - start + 1 < maxButtons) {
              start = Math.max(1, end - maxButtons + 1);
            }
            return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  disabled={totalItems === 0}
                  className={`px-3 py-1 rounded text-sm ${
                    currentPage === page && totalItems > 0
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  } ${totalItems === 0 ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  {page}
                </button>
              )
            );
          })()}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalItems === 0}
            className={`px-3 py-1 rounded text-sm ${
              currentPage === totalPages || totalItems === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            التالي
          </button>
          <button
            onClick={goToLastPage}
            disabled={currentPage === totalPages || totalItems === 0}
            className={`px-3 py-1 rounded text-sm ${
              currentPage === totalPages || totalItems === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            الأخير
          </button>
        </div>
      </div>

      {createModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-40">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative">
            <button
              onClick={closeCreateModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              X
            </button>
            <h3 className="text-2xl font-semibold mb-4 text-center">
              إضافة اشتراك
            </h3>
            {createErrorModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                  <h3 className="text-lg font-bold mb-4">خطأ</h3>
                  <p className="text-red-600">{createErrorMessage}</p>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={closeCreateErrorModal}
                      className="btn bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block font-medium">النادي</label>
                <select
                  name="club"
                  value={createFormData.club}
                  onChange={handleCreateChange}
                  className="w-full p-2 border rounded"
                  required
                  disabled={isSubmitting || usersLoading}
                >
                  <option value="">اختر النادي</option>
                  {clubs.map((club) => (
                    <option key={club.club_id} value={club.club_id}>
                      {club.club_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium">العضو</label>
                <select
                  name="member"
                  value={createFormData.member}
                  onChange={handleCreateChange}
                  className="w-full p-2 border rounded"
                  required
                  disabled={isSubmitting || !createFormData.club || usersLoading}
                >
                  <option value="">اختر العضو</option>
                  {filteredMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium">نوع الاشتراك</label>
                <select
                  name="type"
                  value={createFormData.type}
                  onChange={handleCreateChange}
                  className="w-full p-2 border rounded"
                  required
                  disabled={isSubmitting || subscriptionLoading}
                >
                  <option value="">اختر نوع الاشتراك</option>
                  {subscriptionTypes?.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} - {type.price} ر.س
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium">تاريخ البداية</label>
                <input
                  type="date"
                  name="start_date"
                  value={createFormData.start_date}
                  onChange={handleCreateChange}
                  className="w-full p-2 border rounded"
                  required
                  disabled={isSubmitting}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <label className="block font-medium">المبلغ المدفوع</label>
                <input
                  type="number"
                  name="paid_amount"
                  step="0.01"
                  min="0"
                  value={createFormData.paid_amount}
                  onChange={handleCreateChange}
                  className="w-full p-2 border rounded"
                  placeholder="أدخل المبلغ المدفوع"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="submit"
                className={`btn bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                      ></path>
                    </svg>
                    جاري المعالجة...
                  </span>
                ) : (
                  "إنشاء اشتراك"
                )}
              </button>
            </form>
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