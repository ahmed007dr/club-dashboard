import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchMemberSubscriptions, requestSubscriptionFreeze, cancelSubscriptionFreeze, clearFreezeFeedback } from '../../redux/slices/subscriptionsSlice';
import { 
  FaUser, FaCalendarAlt, FaMoneyBillAlt, FaCheck, FaExclamation, 
  FaClock, FaDumbbell, FaSwimmer, FaUsers, FaListUl, FaCalendarCheck,
} from 'react-icons/fa';
import { CiShoppingTag } from 'react-icons/ci';
import { FaSnowflake } from "react-icons/fa";
import { FaBoxOpen } from "react-icons/fa";
const MemberSubscriptions = () => {
  const { memberId } = useParams();
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(null);
  const [freezeDays, setFreezeDays] = useState('');
  const [startDate, setStartDate] = useState('');
  const itemsPerPage = 20;

  const { 
    memberSubscriptions = { results: [], count: 0, next: null, previous: null },
    status, 
    error,
    freezeStatus = {},
    freezeError = {},
    freezeSuccess = {},
    cancelStatus = {}, // Default to empty object
    cancelError = {},
    cancelSuccess = {},
  } = useSelector((state) => state.subscriptions);
  console.log('MemberSubscriptions:', { memberSubscriptions, cancelStatus });

  useEffect(() => {
    if (memberId) {
      dispatch(fetchMemberSubscriptions({ memberId, page: currentPage }));
    }
  }, [dispatch, memberId, currentPage]);

  // Open modal and set subscription ID
  const openModal = (subscriptionId) => {
    setSelectedSubscriptionId(subscriptionId);
    setFreezeDays('');
    setStartDate(new Date().toISOString().split('T')[0]); // Default to today
    setModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
    setSelectedSubscriptionId(null);
    setFreezeDays('');
    setStartDate('');
  };

  // Handle freeze submission
  const handleFreezeSubmission = () => {
    if (!freezeDays || freezeDays <= 0) {
      dispatch(clearFreezeFeedback(selectedSubscriptionId));
      dispatch({
        type: 'subscriptions/requestFreeze/rejected',
        payload: { subscriptionId: selectedSubscriptionId, error: 'يجب أن يكون عدد الأيام أكبر من 0' },
      });
      return;
    }
    if (!startDate) {
      dispatch(clearFreezeFeedback(selectedSubscriptionId));
      dispatch({
        type: 'subscriptions/requestFreeze/rejected',
        payload: { subscriptionId: selectedSubscriptionId, error: 'يجب اختيار تاريخ البدء' },
      });
      return;
    }
    dispatch(
      requestSubscriptionFreeze({
        subscriptionId: selectedSubscriptionId,
        requestedDays: parseInt(freezeDays, 10),
        startDate,
      })
    ).then(() => {
      dispatch(fetchMemberSubscriptions({ memberId, page: currentPage })); // Refetch
    });
    setTimeout(() => {
      dispatch(clearFreezeFeedback(selectedSubscriptionId));
    }, 5000);
    closeModal();
  };

  // Handle cancel freeze
  const handleCancelFreeze = (freezeRequestId) => {
    dispatch(cancelSubscriptionFreeze({ freezeRequestId })).then((action) => {
      if (cancelSubscriptionFreeze.fulfilled.match(action)) {
        dispatch(fetchMemberSubscriptions({ memberId, page: currentPage })); // Refetch
      }
    });
    setTimeout(() => {
      dispatch(clearFreezeFeedback(freezeRequestId));
    }, 5000);
  };

  // Safely get count and results
  const safeCount = memberSubscriptions?.count || 0;
  const results = memberSubscriptions?.results || [];
  
  // Pagination calculations
  const totalPages = Math.ceil(safeCount / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return dateString ? new Date(dateString).toLocaleDateString('ar-EG', options) : 'غير متوفر';
  };

  // Status mapping function
  const getStatusDisplay = (status) => {
    const normalizedStatus = (status || '').trim().toLowerCase();
    switch (normalizedStatus) {
      case 'upcoming':
        return { text: 'قادم', className: 'bg-blue-100 text-blue-800' };
      case 'active':
        return { text: 'نشط', className: 'bg-green-100 text-green-800' };
      case 'expired':
        return { text: 'منتهي', className: 'bg-red-100 text-red-800' };
      default:
        return { text: 'غير معروف', className: 'bg-gray-100 text-gray-800' };
    }
  };

  // Error message mapping
  const getErrorMessage = (error) => {
    if (typeof error !== 'object' || !error) return error || 'حدث خطأ';
    if (error.error?.includes('exceeds maximum allowed')) return 'عدد أيام التجميد يتجاوز الحد الأقصى المسموح';
    if (error.error?.includes('not active')) return 'طلب التجميد غير نشط';
    if (error.error?.includes('permission')) return 'ليس لديك الصلاحية لإلغاء التجميد';
    return error.error || 'حدث خطأ';
  };

  if (status === 'loading') return (
    <div className="text-center py-8" dir="rtl">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
      <p className="mt-3 text-gray-600">جاري تحميل الاشتراكات...</p>
    </div>
  );

  if (error) {
    const errorMessage = typeof error === 'object' ? error.error || error.message || 'حدث خطأ' : error;
    return (
      <div className="text-center py-8" dir="rtl">
        <div className="text-red-500 text-4xl mb-3">!</div>
        <p className="text-red-600 font-medium">خطأ: {errorMessage}</p>
        <button
          onClick={() => dispatch(fetchMemberSubscriptions({ memberId, page: currentPage }))}
          className="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-white shadow-lg rounded-xl" dir="rtl">
      <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-6 sm:mb-10 flex items-center justify-center gap-3">
        <FaBoxOpen className="text-[26px] text-blue-700 " />
        اشتراكات العضو: {results[0]?.member_details?.name || 'العضو'}
      </h2>

      {results.length > 0 ? (
        <>
          {/* Modal */}
          {modalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md" dir="rtl">
                <h3 className="text-lg font-bold mb-4">طلب تجميد الاشتراك</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">عدد أيام التجميد</label>
                  <input
                    type="number"
                    min="1"
                    value={freezeDays}
                    onChange={(e) => setFreezeDays(e.target.value ? parseInt(e.target.value, 10) : '')}
                    placeholder="أدخل عدد الأيام"
                    className="w-full px-3 py-2 border rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ البدء</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]} // Prevent past dates
                    className="w-full px-3 py-2 border rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleFreezeSubmission}
                    className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
                  >
                    تأكيد
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table view - for larger screens */}
          <div className="hidden md:block overflow-x-auto mb-6">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاشتراك</th>
        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المدرب</th>
        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">حالة التجميد</th>
        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التواريخ</th>
        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الدفع</th>
        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التفاصيل</th>
        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {results.map((sub) => {
        const activeFreeze = Array.isArray(sub.freeze_requests) ? 
          sub.freeze_requests.find(fr => fr.is_active) : null;
        
        return (
          <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
            {/* Subscription Info */}
            <td className="px-4 py-4">
              <div className="flex items-center justify-end">
                <div className="mr-2">
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <CiShoppingTag className="text-blue-500" />
                    {sub.type_details?.name || 'غير معروف'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {sub.type_details?.duration_days} يوم
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    رقم العضوية: {sub.member_details?.membership_number || 'غير متوفر'}
                  </div>
                </div>
              </div>
            </td>
            
            {/* Coach Info */}
            <td className="px-4 py-4">
              {sub.coach_details ? (
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{sub.coach_details.username}</div>
                  <div className="text-xs text-gray-500">الحد الأقصى: {sub.coach_details.max_trainees} متدرب</div>
                </div>
              ) : (
                <span className="text-xs text-gray-500">بدون مدرب</span>
              )}
            </td>
            
            {/* Freeze Status */}
            <td className="px-4 py-4">
              {activeFreeze ? (
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-1 text-yellow-600">
                    <FaSnowflake />
                    مجمد ({activeFreeze.requested_days} يوم)
                  </div>
                  <div className="text-xs text-gray-500">
                    من {formatDate(activeFreeze.start_date)}
                  </div>
                </div>
              ) : (
                <span className="text-sm text-gray-500">نشط</span>
              )}
            </td>
            
            {/* Dates */}
            <td className="px-4 py-4">
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-1">
                  <FaCalendarAlt className="text-gray-400 text-xs" />
                  {formatDate(sub.start_date)}
                </div>
                <div className="flex items-center gap-1">
                  <FaCalendarCheck className="text-gray-400 text-xs" />
                  {formatDate(sub.end_date)}
                </div>
              </div>
            </td>
            
            {/* Payment */}
            <td className="px-4 py-4">
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-1">
                  <FaMoneyBillAlt className="text-gray-400 text-xs" />
                  السعر: ${sub.type_details?.price}
                </div>
                <div className="flex items-center gap-1">
                  <FaCheck className="text-gray-400 text-xs" />
                  المدفوع: ${sub.paid_amount}
                </div>
                <div className={`flex items-center gap-1 ${parseFloat(sub.remaining_amount) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  <FaExclamation className="text-xs" />
                  الرصيد: ${sub.remaining_amount}
                </div>
              </div>
            </td>
            
            {/* Details */}
            <td className="px-4 py-4">
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex items-center gap-1">
                  <FaClock className="text-gray-400 text-xs" />
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    الدخول: {sub.entry_count || 0}/{sub.type_details?.max_entries || '∞'}
                  </span>
                </div>
                {sub.type_details?.includes_pool && (
                  <div className="flex items-center gap-1 text-blue-600">
                    <FaSwimmer className="text-xs" /> حمام السباحة
                  </div>
                )}
                {sub.type_details?.includes_gym && (
                  <div className="flex items-center gap-1 text-green-600">
                    <FaDumbbell className="text-xs" /> صالة الألعاب الرياضية
                  </div>
                )}
                {sub.type_details?.includes_classes && (
                  <div className="flex items-center gap-1 text-purple-600">
                    <FaUsers className="text-xs" /> الحصص التدريبية
                  </div>
                )}
              </div>
            </td>
            
            {/* Actions */}
            <td className="px-4 py-4">
              <div className="flex flex-col gap-2">
                {!activeFreeze ? (
                  <button
                    onClick={() => openModal(sub.id)}
                    disabled={freezeStatus[sub.id] === 'loading'}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      freezeStatus[sub.id] === 'loading'
                        ? 'bg-gray-200 opacity-50 cursor-not-allowed'
                        : 'bg-blue-700 text-white hover:bg-blue-800'
                    }`}
                  >
                    {freezeStatus[sub.id] === 'loading' ? 'جاري التجميد...' : 'جمّد الاشتراك'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleCancelFreeze(activeFreeze.id)}
                    disabled={cancelStatus[activeFreeze.id] === 'loading'}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      cancelStatus[activeFreeze.id] === 'loading'
                        ? 'bg-gray-200 opacity-50 cursor-not-allowed'
                        : 'bg-red-700 text-white hover:bg-red-800'
                    }`}
                  >
                    {cancelStatus[activeFreeze.id] === 'loading' ? 'جاري الإلغاء...' : 'إلغاء التجميد'}
                  </button>
                )}
                {freezeSuccess[sub.id] && (
                  <p className="text-green-600 text-xs">{freezeSuccess[sub.id]}</p>
                )}
                {freezeError[sub.id] && (
                  <p className="text-red-600 text-xs">خطأ: {getErrorMessage(freezeError[sub.id])}</p>
                )}
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>

{/* Mobile Card View */}
<div className="md:hidden space-y-4 mb-6">
  {results.length > 0 ? (
    results.map((sub) => {
      const activeFreeze = Array.isArray(sub.freeze_requests) ? 
        sub.freeze_requests.find(fr => fr.is_active) : null;

      return (
        <div key={sub.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-3 mb-3">
            <div>
              <div className="text-xs text-gray-500">رقم العضوية</div>
              <div className="text-sm">{sub.member_details?.membership_number || 'غير متوفر'}</div>
            </div>
            <div className="flex items-center gap-2 text-blue-500">
              <CiShoppingTag className="text-lg" />
              <span className="font-medium">{sub.type_details?.name || 'غير معروف'}</span>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Coach */}
            <div>
              <div className="text-xs text-gray-500">المدرب</div>
              {sub.coach_details ? (
                <div className="text-sm">
                  <div>{sub.coach_details.username}</div>
                  <div className="text-xs text-gray-500">الحد: {sub.coach_details.max_trainees}</div>
                </div>
              ) : (
                <div className="text-xs text-gray-500">بدون مدرب</div>
              )}
            </div>
            
            {/* Freeze Status */}
            <div>
              <div className="text-xs text-gray-500">حالة التجميد</div>
              {activeFreeze ? (
                <div className="text-sm text-yellow-600">
                  <div className="flex items-center gap-1">
                    <FaSnowflake className="text-xs" />
                    {activeFreeze.requested_days} يوم
                  </div>
                  <div className="text-xs text-gray-500">
                    من {formatDate(activeFreeze.start_date)}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">نشط</div>
              )}
            </div>
            
            {/* Dates */}
            <div>
              <div className="text-xs text-gray-500">التواريخ</div>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-1">
                  <FaCalendarAlt className="text-xs" />
                  {formatDate(sub.start_date)}
                </div>
                <div className="flex items-center gap-1">
                  <FaCalendarCheck className="text-xs" />
                  {formatDate(sub.end_date)}
                </div>
              </div>
            </div>
            
            {/* Payment */}
            <div>
              <div className="text-xs text-gray-500">الدفع</div>
              <div className="text-sm space-y-1">
                <div>السعر: ${sub.type_details?.price}</div>
                <div>المدفوع: ${sub.paid_amount}</div>
                <div className={parseFloat(sub.remaining_amount) < 0 ? 'text-red-500' : 'text-green-500'}>
                  الرصيد: ${sub.remaining_amount}
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-4 pt-3 border-t">
            <div className="text-xs text-gray-500 mb-2">التفاصيل</div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                الدخول: {sub.entry_count || 0}/{sub.type_details?.max_entries || '∞'}
              </span>
              {sub.type_details?.includes_pool && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <FaSwimmer className="mr-1" /> حمام السباحة
                </span>
              )}
              {sub.type_details?.includes_gym && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <FaDumbbell className="mr-1" /> الجيم
                </span>
              )}
              {sub.type_details?.includes_classes && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <FaUsers className="mr-1" /> الفصول
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 pt-3 border-t">
            <div className="flex flex-col gap-2">
              {!activeFreeze ? (
                <button
                  onClick={() => openModal(sub.id)}
                  disabled={freezeStatus[sub.id] === 'loading'}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    freezeStatus[sub.id] === 'loading'
                      ? 'bg-gray-200 opacity-50 cursor-not-allowed'
                      : 'bg-blue-700 text-white hover:bg-blue-800'
                  }`}
                >
                  {freezeStatus[sub.id] === 'loading' ? 'جاري التجميد...' : 'جمّد الاشتراك'}
                </button>
              ) : (
                <button
                  onClick={() => handleCancelFreeze(activeFreeze.id)}
                  disabled={cancelStatus[activeFreeze.id] === 'loading'}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    cancelStatus[activeFreeze.id] === 'loading'
                      ? 'bg-gray-200 opacity-50 cursor-not-allowed'
                      : 'bg-red-700 text-white hover:bg-red-800'
                  }`}
                >
                  {cancelStatus[activeFreeze.id] === 'loading' ? 'جاري الإلغاء...' : 'إلغاء التجميد'}
                </button>
              )}
              {freezeSuccess[sub.id] && (
                <p className="text-green-600 text-xs">{freezeSuccess[sub.id]}</p>
              )}
              {freezeError[sub.id] && (
                <p className="text-red-600 text-xs">خطأ: {getErrorMessage(freezeError[sub.id])}</p>
              )}
            </div>
          </div>
        </div>
      );
    })
  ) : (
    <div className="text-center py-8 text-gray-500">
      لا توجد نتائج متاحة
    </div>
  )}
</div>

          {/* Pagination */}
        <div className="flex justify-between items-center mt-4" dir="rtl">
  {safeCount === 0 && (
    <div className="text-sm text-gray-600">لا توجد اشتراكات لعرضها</div>
  )}
  {safeCount > 0 && (
    <>
      <div className="text-sm text-gray-600">
        عرض {(currentPage - 1) * itemsPerPage + 1} إلى{" "}
        {Math.min(currentPage * itemsPerPage, safeCount)} من {safeCount}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => paginate(1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded text-sm font-medium ${
            currentPage === 1
              ? "bg-gray-200 opacity-50 cursor-not-allowed"
              : "bg-blue-700 text-white hover:bg-blue-800"
          }`}
          aria-label="الصفحة الأولى"
        >
          الأول
        </button>
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={!memberSubscriptions.previous}
          className={`px-3 py-1 rounded text-sm font-medium ${
            !memberSubscriptions.previous
              ? "bg-gray-200 opacity-50 cursor-not-allowed"
              : "bg-blue-700 text-white hover:bg-blue-800"
          }`}
          aria-label="الصفحة السابقة"
        >
          السابق
        </button>
        {(() => {
          const maxButtons = 5;
          const sideButtons = Math.floor(maxButtons / 2);
          let start = Math.max(1, currentPage - sideButtons);
          let end = Math.min(totalPages, start + maxButtons - 1);

          // Adjust start if end is at totalPages to show maxButtons
          if (end - start + 1 < maxButtons && start > 1) {
            start = Math.max(1, end - maxButtons + 1);
          }

          return Array.from(
            { length: end - start + 1 },
            (_, i) => start + i
          ).map((page) => (
            <button
              key={page}
              onClick={() => paginate(page)}
              className={`px-4 py-1 rounded text-sm font-medium ${
                currentPage === page
                  ? "bg-blue-700 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              aria-label={`الصفحة ${page}`}
            >
              {page}
            </button>
          ));
        })()}
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={!memberSubscriptions.next}
          className={`px-3 py-1 rounded text-sm font-medium ${
            !memberSubscriptions.next
              ? "bg-gray-200 opacity-50 cursor-not-allowed"
              : "bg-blue-700 text-white hover:bg-blue-800"
          }`}
          aria-label="الصفحة التالية"
        >
          التالي
        </button>
        <button
          onClick={() => paginate(totalPages)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded text-sm font-medium ${
            currentPage === totalPages
              ? "bg-gray-200 opacity-50 cursor-not-allowed"
              : "bg-blue-700 text-white hover:bg-blue-800"
          }`}
          aria-label="الصفحة الأخيرة"
        >
          الأخير
        </button>
      </div>
    </>
  )}
</div>
        </>
      ) : (
        <div className="text-center py-12" dir="rtl">
          <div className="text-gray-400 text-5xl mb-4">؟</div>
          <p className="text-gray-500 text-lg">لم يتم العثور على اشتراكات لهذا العضو</p>
        </div>
      )}
    </div>
  );
};

export default MemberSubscriptions;