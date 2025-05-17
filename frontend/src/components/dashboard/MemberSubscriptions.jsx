import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchMemberSubscriptions } from '../../redux/slices/subscriptionsSlice';
import { 
  FaUser, FaCalendarAlt, FaMoneyBillAlt, FaCheck, FaExclamation, 
  FaClock, FaDumbbell, FaSwimmer, FaUsers, FaListUl, FaCalendarCheck,
} from 'react-icons/fa';
import { CiShoppingTag } from 'react-icons/ci';

const MemberSubscriptions = () => {
  const { memberId } = useParams();
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { 
    memberSubscriptions = { results: [], count: 0, next: null, previous: null },
    status, 
    error
  } = useSelector((state) => state.subscriptions);
  console.log('MemberSubscriptions:', memberSubscriptions);

  useEffect(() => {
    if (memberId) {
      dispatch(fetchMemberSubscriptions({ memberId, page: currentPage }));
    }
  }, [dispatch, memberId, currentPage]);

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
    return new Date(dateString).toLocaleDateString('ar-EG', options);
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
        <FaListUl className="text-green-600" />
        اشتراكات العضو: {results[0]?.member_details?.name || 'العضو'}
      </h2>

      {results.length > 0 ? (
        <>
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاشتراك</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">النادي</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التواريخ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الدفع</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((sub) => {
                  const statusDisplay = getStatusDisplay(sub.status);
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
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
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">{sub.club_details?.name || 'غير معروف'}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">{sub.club_details?.location}</div>
                      </td>
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
                              <FaUsers className="text-xs" /> الفصول الدراسية
                            </div>
                          )}
                        </div>
                      </td>
                     
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4" dir="rtl">
            {safeCount === 0 && (
              <div className="text-sm text-gray-600">لا توجد اشتراكات لعرضها</div>
            )}
            {safeCount > 0 && (
              <>
                <div className="text-sm text-gray-600">
                  عرض {(currentPage - 1) * itemsPerPage + 1} إلى{" "}
                  {Math.min(currentPage * itemsPerPage, safeCount)} من{" "}
                  {safeCount}
                </div>
                <div className="flex gap-2">
                  {/* First Page Button */}
                  <button
                    onClick={() => paginate(1)}
                    disabled={currentPage === 1 || safeCount === 0}
                    className={`px-3 py-1 rounded ${
                      currentPage === 1 || safeCount === 0
                        ? "bg-gray-200 opacity-50 cursor-not-allowed"
                        : "bg-blue-700 text-white hover:bg-blue-800"
                    }`}
                  >
                    الأول
                  </button>

                  {/* Previous Page Button */}
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={!memberSubscriptions.previous || safeCount === 0}
                    className={`px-3 py-1 rounded ${
                      !memberSubscriptions.previous || safeCount === 0
                        ? "bg-gray-200 opacity-50 cursor-not-allowed"
                        : "bg-blue-700 text-white hover:bg-blue-800"
                    }`}
                  >
                    السابق
                  </button>

                  {/* Page Number Buttons */}
                  {(() => {
                    const maxButtons = 5;
                    const sideButtons = Math.floor(maxButtons / 2);
                    let start = Math.max(1, currentPage - sideButtons);
                    let end = Math.min(totalPages, currentPage + sideButtons);

                    if (end - start + 1 < maxButtons) {
                      if (currentPage <= sideButtons) {
                        end = Math.min(totalPages, maxButtons);
                      } else {
                        start = Math.max(1, totalPages - maxButtons + 1);
                      }
                    }

                    return Array.from(
                      { length: end - start + 1 },
                      (_, i) => start + i
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => paginate(page)}
                        disabled={safeCount === 0}
                        className={`px-3 py-1 rounded ${
                          currentPage === page && safeCount > 0
                            ? "bg-blue-700 text-white"
                            : "bg-gray-200 hover:bg-gray-300"
                        } ${
                          safeCount === 0
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {page}
                      </button>
                    ));
                  })()}

                  {/* Next Page Button */}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={!memberSubscriptions.next || safeCount === 0}
                    className={`px-3 py-1 rounded ${
                      !memberSubscriptions.next || safeCount === 0
                        ? "bg-gray-200 opacity-50 cursor-not-allowed"
                        : "bg-blue-700 text-white hover:bg-blue-800"
                    }`}
                  >
                    التالي
                  </button>

                  {/* Last Page Button */}
                  <button
                    onClick={() => paginate(totalPages)}
                    disabled={currentPage === totalPages || safeCount === 0}
                    className={`px-3 py-1 rounded ${
                      currentPage === totalPages || safeCount === 0
                        ? "bg-gray-200 opacity-50 cursor-not-allowed"
                        : "bg-blue-700 text-white hover:bg-blue-800"
                    }`}
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