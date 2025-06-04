import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchMemberSubscriptions, requestSubscriptionFreeze, cancelSubscriptionFreeze, clearFreezeFeedback } from '../../redux/slices/subscriptionsSlice';
import { 
  FaUser, FaCalendarAlt, FaMoneyBillAlt, FaCheck, FaExclamation, 
  FaClock, FaDumbbell, FaSwimmer, FaUsers, FaBoxOpen, FaSnowflake,
} from 'react-icons/fa';
import { CiShoppingTag } from 'react-icons/ci';

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
    cancelStatus = {},
    cancelError = {},
    cancelSuccess = {},
  } = useSelector((state) => state.subscriptions);

  useEffect(() => {
    if (memberId) {
      dispatch(fetchMemberSubscriptions({ memberId, page: currentPage }));
    }
  }, [dispatch, memberId, currentPage]);

  const openModal = (subscriptionId) => {
    setSelectedSubscriptionId(subscriptionId);
    setFreezeDays('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedSubscriptionId(null);
    setFreezeDays('');
    setStartDate('');
  };

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
      dispatch(fetchMemberSubscriptions({ memberId, page: currentPage }));
    });
    setTimeout(() => {
      dispatch(clearFreezeFeedback(selectedSubscriptionId));
    }, 5000);
    closeModal();
  };

  const handleCancelFreeze = (freezeRequestId) => {
    dispatch(cancelSubscriptionFreeze({ freezeRequestId })).then((action) => {
      if (cancelSubscriptionFreeze.fulfilled.match(action)) {
        dispatch(fetchMemberSubscriptions({ memberId, page: currentPage }));
      }
    });
    setTimeout(() => {
      dispatch(clearFreezeFeedback(freezeRequestId));
    }, 5000);
  };

  const safeCount = memberSubscriptions?.count || 0;
  const results = memberSubscriptions?.results || [];
  const totalPages = Math.ceil(safeCount / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return dateString ? new Date(dateString).toLocaleDateString('ar-EG', options) : 'غير متوفر';
  };

  const getStatusDisplay = (status) => {
    const normalizedStatus = (status || '').trim().toLowerCase();
    switch (normalizedStatus) {
      case 'upcoming':
        return { text: 'قادم', className: 'bg-blue-100 text-blue-600' };
      case 'active':
        return { text: 'نشط', className: 'bg-green-100 text-green-600' };
      case 'expired':
        return { text: 'منتهي', className: 'bg-red-100 text-red-600' };
      default:
        return { text: 'غير معروف', className: 'bg-gray-100 text-gray-600' };
    }
  };

  const getErrorMessage = (error) => {
    if (typeof error !== 'object' || !error) return error || 'حدث خطأ';
    if (error.error?.includes('exceeds maximum allowed')) return 'عدد أيام التجميد يتجاوز الحد الأقصى المسموح';
    if (error.error?.includes('not active')) return 'طلب التجميد غير نشط';
    if (error.error?.includes('permission')) return 'ليس لديك الصلاحية لإلغاء التجميد';
    return error.error || 'حدث خطأ';
  };

  if (status === 'loading') return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]" dir="rtl">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      <p className="mt-4 text-gray-600 text-lg">جاري تحميل الاشتراكات...</p>
    </div>
  );

  if (error) {
    const errorMessage = typeof error === 'object' ? error.error || error.message || 'حدث خطأ' : error;
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]" dir="rtl">
        <FaExclamation className="text-red-500 text-5xl mb-4" />
        <p className="text-red-600 text-lg font-medium mb-4">خطأ: {errorMessage}</p>
        <button
          onClick={() => dispatch(fetchMemberSubscriptions({ memberId, page: currentPage }))}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6" dir="rtl">
      <header className="mb-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
          <FaBoxOpen className="text-blue-600 text-3xl" />
          اشتراكات العضو: {results[0]?.member_details?.name || 'العضو'}
        </h2>
      </header>

      {results.length > 0 ? (
        <>
          {/* Modal */}
          {modalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm sm:max-w-md shadow-2xl" dir="rtl">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaSnowflake className="text-blue-500" />
                  طلب تجميد الاشتراك
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">عدد أيام التجميد</label>
                    <input
                      type="number"
                      min="1"
                      value={freezeDays}
                      onChange={(e) => setFreezeDays(e.target.value ? parseInt(e.target.value, 10) : '')}
                      placeholder="أدخل عدد الأيام"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ البدء</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleFreezeSubmission}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    تأكيد
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table View (Desktop) */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 shadow-sm mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">الاشتراك</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">المدرب</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">حالة التجميد</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">التواريخ</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">الدفع</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">التفاصيل</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.map((sub) => {
                  const activeFreeze = Array.isArray(sub.freeze_requests) ? 
                    sub.freeze_requests.find(fr => fr.is_active) : null;
                  const statusDisplay = getStatusDisplay(sub.status);

                  return (
                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.className}`}>
                            {statusDisplay.text}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              <CiShoppingTag className="text-blue-500" />
                              {sub.type_details?.name || 'غير معروف'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{sub.type_details?.duration_days} يوم</div>
                            <div className="text-xs text-gray-500 mt-1">رقم العضوية: {sub.member_details?.membership_number || 'غير متوفر'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {sub.coach_details ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{sub.coach_details.username}</div>
                            <div className="text-xs text-gray-500">الحد: {sub.coach_details.max_trainees} متدرب</div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">بدون مدرب</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {activeFreeze ? (
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1 text-yellow-600">
                              <FaSnowflake className="text-sm" />
                              مجمد ({activeFreeze.requested_days} يوم)
                            </div>
                            <div className="text-xs text-gray-500">من {formatDate(activeFreeze.start_date)}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">غير مجمد</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-1">
                            <FaCalendarAlt className="text-gray-400 text-sm" />
                            {formatDate(sub.start_date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <FaCalendarAlt className="text-gray-400 text-sm" />
                            {formatDate(sub.end_date)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-1">
                            <FaMoneyBillAlt className="text-gray-400 text-sm" />
                            السعر: {sub.type_details?.price} ج.م
                          </div>
                          <div className="flex items-center gap-1">
                            <FaCheck className="text-gray-400 text-sm" />
                            المدفوع: {sub.paid_amount} ج.م
                          </div>
                          <div className={`flex items-center gap-1 ${parseFloat(sub.remaining_amount) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            <FaExclamation className="text-sm" />
                            المتبقي: {sub.remaining_amount} ج.م
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2 text-sm">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                            <FaClock className="ml-1 text-sm" />
                            الدخول: {sub.entry_count || 0}/{sub.type_details?.max_entries || '∞'}
                          </span>
                          {sub.type_details?.includes_pool && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                              <FaSwimmer className="ml-1 text-sm" />
                              حمام السباحة
                            </span>
                          )}
                          {sub.type_details?.includes_gym && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                              <FaDumbbell className="ml-1 text-sm" />
                              صالة الألعاب
                            </span>
                          )}
                          {sub.type_details?.includes_classes && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
                              <FaUsers className="ml-1 text-sm" />
                              الحصص التدريبية
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          {!activeFreeze ? (
                            <button
                              onClick={() => openModal(sub.id)}
                              disabled={freezeStatus[sub.id] === 'loading'}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                freezeStatus[sub.id] === 'loading'
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {freezeStatus[sub.id] === 'loading' ? 'جاري التجميد...' : 'تجميد'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCancelFreeze(activeFreeze.id)}
                              disabled={cancelStatus[activeFreeze.id] === 'loading'}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                cancelStatus[activeFreeze.id] === 'loading'
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-red-600 text-white hover:bg-red-700'
                              }`}
                            >
                              {cancelStatus[activeFreeze.id] === 'loading' ? 'جاري الإلغاء...' : 'إلغاء التجميد'}
                            </button>
                          )}
                          {freezeSuccess[sub.id] && (
                            <p className="text-green-600 text-xs mt-1">{freezeSuccess[sub.id]}</p>
                          )}
                          {freezeError[sub.id] && (
                            <p className="text-red-600 text-xs mt-1">خطأ: {getErrorMessage(freezeError[sub.id])}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Card View (Mobile) */}
          <div className="md:hidden space-y-4 mb-6">
            {results.map((sub) => {
              const activeFreeze = Array.isArray(sub.freeze_requests) ? 
                sub.freeze_requests.find(fr => fr.is_active) : null;
              const statusDisplay = getStatusDisplay(sub.status);

              return (
                <div key={sub.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusDisplay.className}`}>
                      {statusDisplay.text}
                    </span>
                    <div className="flex items-center gap-2 text-blue-600 font-medium">
                      <CiShoppingTag className="text-lg" />
                      {sub.type_details?.name || 'غير معروف'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">رقم العضوية</p>
                      <p>{sub.member_details?.membership_number || 'غير متوفر'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">المدة</p>
                      <p>{sub.type_details?.duration_days} يوم</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">المدرب</p>
                      {sub.coach_details ? (
                        <div>
                          <p>{sub.coach_details.username}</p>
                          <p className="text-xs text-gray-500">الحد: {sub.coach_details.max_traines}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500">بدون مدرب</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">حالة التجميد</p>
                      {activeFreeze ? (
                        <div className="text-yellow-600">
                          <p className="flex items-center gap-1">
                            <FaSnowflake className="text-sm" />
                            {activeFreeze.requested_days} يوم
                          </p>
                          <p className="text-xs text-gray-500">من {formatDate(activeFreeze.start_date)}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500">غير مجمد</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">تاريخ البدء</p>
                      <p className="flex items-center gap-1">
                        <FaCalendarAlt className="text-gray-400 text-sm" />
                        {formatDate(sub.start_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">تاريخ الانتهاء</p>
                      <p className="flex items-center gap-1">
                        <FaCalendarAlt className="text-gray-400 text-sm" />
                        {formatDate(sub.end_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">السعر</p>
                      <p>{sub.type_details?.price} ج.م</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">المدفوع</p>
                      <p>{sub.paid_amount} ج.م</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-1">الرصيد</p>
                      <p className={parseFloat(sub.remaining_amount) < 0 ? 'text-red-500' : 'text-green-500'}>
                        {sub.remaining_amount} ج.م
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-2">التفاصيل</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                        <FaClock className="ml-1 text-sm" />
                        الدخول: {sub.entry_count || 0}/{sub.type_details?.max_entries || '∞'}
                      </span>
                      {sub.type_details?.includes_pool && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                          <FaSwimmer className="ml-1 text-sm" />
                          حمام السباحة
                        </span>
                      )}
                      {sub.type_details?.includes_gym && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                          <FaDumbbell className="ml-1 text-sm" />
                          صالة الألعاب
                        </span>
                      )}
                      {sub.type_details?.includes_classes && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
                          <FaUsers className="ml-1 text-sm" />
                          الحصص التدريبية
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex flex-col gap-2">
                      {!activeFreeze ? (
                        <button
                          onClick={() => openModal(sub.id)}
                          disabled={freezeStatus[sub.id] === 'loading'}
                          className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            freezeStatus[sub.id] === 'loading'
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {freezeStatus[sub.id] === 'loading' ? 'جاري التجميد...' : 'تجميد'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCancelFreeze(activeFreeze.id)}
                          disabled={cancelStatus[activeFreeze.id] === 'loading'}
                          className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            cancelStatus[activeFreeze.id] === 'loading'
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          {cancelStatus[activeFreeze.id] === 'loading' ? 'جاري الإلغاء...' : 'إلغاء التجميد'}
                        </button>
                      )}
                      {freezeSuccess[sub.id] && (
                        <p className="text-green-600 text-xs mt-1">{freezeSuccess[sub.id]}</p>
                      )}
                      {freezeError[sub.id] && (
                        <p className="text-red-600 text-xs mt-1">خطأ: {getErrorMessage(freezeError[sub.id])}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {safeCount > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6" dir="rtl">
              <div className="text-sm text-gray-600">
                عرض {(currentPage - 1) * itemsPerPage + 1} إلى {Math.min(currentPage * itemsPerPage, safeCount)} من {safeCount}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => paginate(1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  aria-label="الصفحة الأولى"
                >
                  الأول
                </button>
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={!memberSubscriptions.previous}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    !memberSubscriptions.previous ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
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
                  if (end - start + 1 < maxButtons && start > 1) {
                    start = Math.max(1, end - maxButtons + 1);
                  }
                  return Array.from({ length: end - start + 1 }, (_, i) => start + i).map((page) => (
                    <button
                      key={page}
                      onClick={() => paginate(page)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
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
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    !memberSubscriptions.next ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  aria-label="الصفحة التالية"
                >
                  التالي
                </button>
                <button
                  onClick={() => paginate(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  aria-label="الصفحة الأخيرة"
                >
                  الأخير
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[50vh]" dir="rtl">
          <FaBoxOpen className="text-gray-300 text-6xl mb-4" />
          <p className="text-gray-500 text-lg">لم يتم العثور على اشتراكات لهذا العضو</p>
        </div>
      )}
    </div>
  );
};

export default MemberSubscriptions;