import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchCoachProfile } from '../../redux/slices/subscriptionsSlice';
import { FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';

function CoachProfile() {
  const { coachId } = useParams();
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.subscriptions.coachProfile);

  useEffect(() => {
    dispatch(fetchCoachProfile(coachId));
  }, [dispatch, coachId]);

  // Memoized data to optimize rendering
  const upcomingSubscriptions = useMemo(() => data?.upcoming_subscriptions || [], [data]);
  const expiredSubscriptions = useMemo(() => data?.expired_subscriptions || [], [data]);
  const membersDetails = useMemo(() => data?.members_details || [], [data]);
  const revenueByType = useMemo(() => data?.revenue_by_type || [], [data]);
  const monthlyRevenue = useMemo(() => data?.monthly_revenue || [], [data]);
  const subscriptionTypes = useMemo(() => data?.subscription_types || [], [data]);

  // Retry handler for errors
  const handleRetry = () => {
    dispatch(fetchCoachProfile(coachId));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex items-center gap-3 text-xl text-gray-600 animate-pulse">
          <FiRefreshCw className="animate-spin" />
          جاري التحميل...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="p-6 bg-red-50 text-red-700 rounded-xl shadow-sm flex items-center gap-3">
          <FiAlertTriangle className="text-2xl" />
          <div>
            <p className="font-medium">خطأ: {error}</p>
            <button
              onClick={handleRetry}
              className="mt-2 flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm transition-colors"
            >
              <FiRefreshCw className="mr-2" />
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        بروفايل المدرب: {data?.coach_username || 'غير متاح'}
      </h1>

      {/* Financial and Clients Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Financial Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 transform hover:shadow-md transition-shadow duration-300">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">ملخص مالي</h2>
          <div className="space-y-4">
            <p className="flex justify-between items-center text-gray-600">
              <span className="font-medium">إجمالي قيمة التدريبات:</span>
              <span className="text-indigo-600 font-semibold">
                {data?.total_private_training_amount ? `${data.total_private_training_amount} جنيه` : '—'}
              </span>
            </p>
            <p className="flex justify-between items-center text-gray-600">
              <span className="font-medium">إجمالي المبلغ المدفوع:</span>
              <span className="text-indigo-600 font-semibold">
                {data?.total_paid_amount ? `${data.total_paid_amount} جنيه` : '—'}
              </span>
            </p>
            <p className="flex justify-between items-center text-gray-600">
              <span className="font-medium">المبالغ المتبقية:</span>
              <span className="text-indigo-600 font-semibold">
                {data?.total_remaining_amount ? `${data.total_remaining_amount} جنيه` : '—'}
              </span>
            </p>
          </div>
        </div>

        {/* Clients Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 transform hover:shadow-md transition-shadow duration-300">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">إحصائيات العملاء</h2>
          <div className="space-y-4">
            <p className="flex justify-between items-center text-gray-600">
              <span className="font-medium">العملاء النشطين:</span>
              <span className="text-indigo-600 font-semibold">{data?.active_clients ?? '—'}</span>
            </p>
            <p className="flex justify-between items-center text-gray-600">
              <span className="font-medium">عملاء الشهر السابق:</span>
              <span className="text-indigo-600 font-semibold">{data?.previous_month_clients ?? '—'}</span>
            </p>
            <p className="flex justify-between items-center text-gray-600">
              <span className="font-medium">إجمالي العملاء:</span>
              <span className="text-indigo-600 font-semibold">{data?.total_career_clients ?? '—'}</span>
            </p>
          </div>
        </div>

        {/* Subscription Types Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 transform hover:shadow-md transition-shadow duration-300">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">أنواع الاشتراكات</h2>
          <div className="space-y-4">
            {subscriptionTypes.length > 0 ? (
              subscriptionTypes.map((type, index) => (
                <p key={index} className="flex justify-between items-center text-gray-600">
                  <span className="font-medium">{type.type_name}:</span>
                  <span className="text-indigo-600 font-semibold">{type.subscription_count} اشتراك</span>
                </p>
              ))
            ) : (
              <p className="text-gray-500">لا توجد أنواع اشتراكات</p>
            )}
          </div>
        </div>
      </div>

      {/* Financial Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Revenue by Type */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-2">الإيرادات حسب نوع الاشتراك</h2>
          {revenueByType.length > 0 ? (
            <div className="space-y-4">
              {revenueByType.map((type, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-700 mb-2">{type.type_name}</p>
                  <p className="flex justify-between text-gray-600">
                    <span>المدفوع:</span>
                    <span className="text-indigo-600 font-semibold">{type.total_paid} جنيه</span>
                  </p>
                  <p className="flex justify-between text-gray-600">
                    <span>التدريب الخاص:</span>
                    <span className="text-indigo-600 font-semibold">{type.total_private_training} جنيه</span>
                  </p>
                  <p className="flex justify-between text-gray-600">
                    <span>المتبقي:</span>
                    <span className="text-indigo-600 font-semibold">{type.total_remaining} جنيه</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">لا توجد إيرادات حسب نوع الاشتراك</p>
          )}
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-2">الإيرادات الشهرية</h2>
          {monthlyRevenue.length > 0 ? (
            <div className="space-y-4">
              {monthlyRevenue.map((month, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-700 mb-2">{month.month}</p>
                  <p className="flex justify-between text-gray-600">
                    <span>المدفوع:</span>
                    <span className="text-indigo-600 font-semibold">{month.total_paid} جنيه</span>
                  </p>
                  <p className="flex justify-between text-gray-600">
                    <span>التدريب الخاص:</span>
                    <span className="text-indigo-600 font-semibold">{month.total_private_training} جنيه</span>
                  </p>
                  <p className="flex justify-between text-gray-600">
                    <span>المتبقي:</span>
                    <span className="text-indigo-600 font-semibold">{month.total_remaining} جنيه</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">لا توجد إيرادات شهرية</p>
          )}
        </div>
      </div>

      {/* Members Details */}
      {membersDetails.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-2">
            تفاصيل الأعضاء ({membersDetails.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {membersDetails.map((member) => (
              <div
                key={member.subscription_id}
                className="bg-gray-50 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="space-y-3">
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">العضو:</span>
                    <span className="text-gray-800">{member.member_name || '—'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">نوع الاشتراك:</span>
                    <span className="text-gray-800">{member.type_name || '—'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">تاريخ البدء:</span>
                    <span className="text-gray-800">
                      {member.start_date ? new Date(member.start_date).toLocaleDateString('ar-EG') : '—'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">تاريخ الانتهاء:</span>
                    <span className="text-gray-800">
                      {member.end_date ? new Date(member.end_date).toLocaleDateString('ar-EG') : '—'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">الحالة:</span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        member.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : member.status === 'Expired'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {member.status || '—'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">عدد الحضور:</span>
                    <span className="text-gray-800">{member.attendance_count || 0}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">الحصص المستخدمة:</span>
                    <span className="text-gray-800">
                      {member.entries_used}/{member.max_entries || 'غير محدود'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">مكتمل:</span>
                    <span className="text-gray-800">{member.fully_used ? 'نعم' : 'لا'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">سعر التدريب:</span>
                    <span className="text-indigo-600 font-semibold">
                      {member.private_training_price ? `${member.private_training_price} جنيه` : '—'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">المدفوع:</span>
                    <span className="text-indigo-600 font-semibold">
                      {member.paid_amount ? `${member.paid_amount} جنيه` : '—'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">المتبقي:</span>
                    <span className="text-indigo-600 font-semibold">
                      {member.remaining_amount ? `${member.remaining_amount} جنيه` : '—'}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 text-center text-gray-500">
          لا توجد بيانات أعضاء
        </div>
      )}

      {/* Upcoming Subscriptions */}
      {upcomingSubscriptions.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-2">
            الاشتراكات القادمة ({upcomingSubscriptions.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingSubscriptions.map((sub) => (
              <div
                key={sub.subscription_id}
                className="bg-gray-50 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="space-y-3">
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">العضو:</span>
                    <span className="text-gray-800">{sub.member_name || '—'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">نوع الاشتراك:</span>
                    <span className="text-gray-800">{sub.type_name || '—'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">تاريخ البدء:</span>
                    <span className="text-gray-800">
                      {sub.start_date ? new Date(sub.start_date).toLocaleDateString('ar-EG') : '—'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">تاريخ الانتهاء:</span>
                    <span className="text-gray-800">
                      {sub.end_date ? new Date(sub.end_date).toLocaleDateString('ar-EG') : '—'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">سعر التدريب:</span>
                    <span className="text-indigo-600 font-semibold">
                      {sub.private_training_price ? `${sub.private_training_price} جنيه` : '—'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">المدفوع:</span>
                    <span className="text-indigo-600 font-semibold">
                      {sub.paid_amount ? `${sub.paid_amount} جنيه` : '—'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">المتبقي:</span>
                    <span className="text-indigo-600 font-semibold">
                      {sub.remaining_amount ? `${sub.remaining_amount} جنيه` : '—'}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 text-center text-gray-500">
          لا توجد اشتراكات قادمة
        </div>
      )}

      {/* Expired Subscriptions */}
      {expiredSubscriptions.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-2">
            الاشتراكات المنتهية ({expiredSubscriptions.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {expiredSubscriptions.map((sub) => (
              <div
                key={sub.subscription_id}
                className="bg-gray-50 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="space-y-3">
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">العضو:</span>
                    <span className="text-gray-800">{sub.member_name || '—'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">نوع الاشتراك:</span>
                    <span className="text-gray-800">{sub.type_name || '—'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">تاريخ البدء:</span>
                    <span className="text-gray-800">
                      {sub.start_date ? new Date(sub.start_date).toLocaleDateString('ar-EG') : '—'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">تاريخ الانتهاء:</span>
                    <span className="text-gray-800">
                      {sub.end_date ? new Date(sub.end_date).toLocaleDateString('ar-EG') : '—'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">سعر التدريب:</span>
                    <span className="text-indigo-600 font-semibold">
                      {sub.private_training_price ? `${sub.private_training_price} جنيه` : '—'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">المدفوع:</span>
                    <span className="text-indigo-600 font-semibold">
                      {sub.paid_amount ? `${sub.paid_amount} جنيه` : '—'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">المتبقي:</span>
                    <span className="text-indigo-600 font-semibold">
                      {sub.remaining_amount ? `${sub.remaining_amount} جنيه` : '—'}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
          لا توجد اشتراكات منتهية
        </div>
      )}
    </div>
  );
}

export default CoachProfile;