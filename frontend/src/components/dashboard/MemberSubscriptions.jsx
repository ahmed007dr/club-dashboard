import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchMemberSubscriptions } from '../../redux/slices/subscriptionsSlice';
import {
  FaUser,
  FaCalendarAlt,
  FaMoneyBillAlt,
  FaCheck,
  FaExclamation,
  FaClock,
  FaDumbbell,
  FaSwimmer,
  FaUsers,
  FaUniversity,
  FaListUl,
  FaCalendarCheck,
} from 'react-icons/fa';
import { CiShoppingTag } from 'react-icons/ci';

const MemberSubscriptions = () => {
  const { memberId } = useParams();
  const dispatch = useDispatch();

  const { memberSubscriptions, status, error, subscriptionStatus } = useSelector(
    (state) => state.subscriptions
  );
  console.log('Member Subscriptions:', memberSubscriptions); // Debugging line to check the subscriptions data

  // Fetch member subscriptions when component mounts or memberId changes
  useEffect(() => {
    if (memberId) {
        dispatch(fetchMemberSubscriptions(memberId));
    }
  }, [dispatch, memberId]);

  if (status === 'loading')
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-3 text-gray-600">جاري تحميل الاشتراكات...</p>
      </div>
    );

  if (error)
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-4xl mb-3">!</div>
        <p className="text-red-600 font-medium">حدث خطأ: {error}</p>
        <button
          onClick={() => dispatch(fetchMemberSubscriptions(memberId))}
          className="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          إعادة المحاولة
        </button>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-2xl rounded-2xl" dir="rtl">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-10 flex items-center justify-center gap-3">
        <FaListUl className="text-green-600" />
        الاشتراكات للعضو {memberSubscriptions?.[0]?.member_details.name || 'غير معروف'}
      </h2>

      {memberSubscriptions?.length > 0 ? (
        <ul className="space-y-6">
          {memberSubscriptions.map((sub) => (
            <li
              key={sub.id}
              className="p-6 border border-gray-200 rounded-xl shadow-md bg-gray-50 hover:bg-gray-100 transition"
            >
              <h3 className="text-2xl font-semibold text-purple-600 flex items-center gap-2">
                <CiShoppingTag />
                {sub.type_details?.name || 'اشتراك غير معروف'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700 text-[15px] mt-4">
                <p className="flex items-center gap-2">
                  <FaUniversity /> <strong>النادي:</strong> {sub.club_details.name}
                </p>
                <p className="flex items-center gap-2">
                  <FaUser /> <strong>العضو:</strong> {sub.member_details.name}
                </p>
                <p className="flex items-center gap-2">
                  <FaCalendarAlt /> <strong>تاريخ البداية:</strong>{' '}
                  {new Date(sub.start_date).toLocaleDateString('ar-EG')}
                </p>
                <p className="flex items-center gap-2">
                  <FaCalendarAlt /> <strong>تاريخ النهاية:</strong>{' '}
                  {new Date(sub.end_date).toLocaleDateString('ar-EG')}
                </p>
                <p className="flex items-center gap-2">
                  <FaClock /> <strong>المدة:</strong> {sub.type_details?.duration_days} يوم
                </p>
                <p className="flex items-center gap-2">
                  <FaMoneyBillAlt /> <strong>السعر:</strong>{' '}
                  {sub.type_details?.price?.toLocaleString()} ج.م
                </p>
                <p className="flex items-center gap-2">
                  <FaCheck /> <strong>المدفوع:</strong> {sub.paid_amount?.toLocaleString()} ج.م
                </p>
                <p className="flex items-center gap-2">
                  <FaExclamation /> <strong>المتبقي:</strong>{' '}
                  {sub.remaining_amount?.toLocaleString()} ج.م
                </p>
                <p className="flex items-center gap-2">
                  <FaCalendarCheck />
                  <strong>عدد مرات الدخول</strong>
                  <span className="font-bold text-green-600 mr-1">{sub.entry_count || 0}</span>
                </p>

                {sub.attendance_dates?.length > 0 && (
                  <div className="col-span-2 mt-2">
                    <p className="font-medium mb-2 flex items-center gap-2">
                      <FaCalendarAlt />
                      <strong>تواريخ الحضور:</strong>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sub.attendance_dates.map((date, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center"
                        >
                          {date}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {sub.type_details && (
                <div className="mt-4">
                  <p className="font-medium mb-2 flex items-center gap-2">
                    <FaListUl /> يشمل:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 pr-4">
                    {sub.type_details.includes_gym && (
                      <li className="flex items-center gap-2">
                        <FaDumbbell /> صالات الألعاب
                      </li>
                    )}
                    {sub.type_details.includes_pool && (
                      <li className="flex items-center gap-2">
                        <FaSwimmer /> المسبح
                      </li>
                    )}
                    {sub.type_details.includes_classes && (
                      <li className="flex items-center gap-2">
                        <FaUsers /> الصفوف الجماعية
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">?</div>
          <p className="text-gray-500 text-lg">لا توجد اشتراكات مسجلة لهذا العضو</p>
        </div>
      )}
    </div>
  );
};

export default MemberSubscriptions;