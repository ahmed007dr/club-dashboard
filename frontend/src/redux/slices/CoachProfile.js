import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchCoachProfile } from '../../redux/slices/subscriptionsSlice';
import { FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';
import { Button } from '@/components/ui/button';

function CoachProfile() {
  const { coachId } = useParams();
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.subscriptions.coachProfile);

  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    dispatch(fetchCoachProfile({ coachId, startDate, endDate }));
  }, [dispatch, coachId, startDate, endDate]);

  const upcomingSubscriptions = useMemo(() => data?.upcoming_subscriptions || [], [data]);
  const expiredSubscriptions = useMemo(() => data?.expired_subscriptions || [], [data]);
  const membersDetails = useMemo(() => data?.members_details || [], [data]);
  const revenueByType = useMemo(() => data?.revenue_by_type || [], [data]);
  const monthlyRevenue = useMemo(() => data?.monthly_revenue || [], [data]);
  const subscriptionTypes = useMemo(() => data?.subscription_types || [], [data]);

  const paginatedMembersDetails = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return membersDetails.slice(startIndex, startIndex + itemsPerPage);
  }, [membersDetails, page, itemsPerPage]);

  const totalPages = Math.ceil(membersDetails.length / itemsPerPage);

  const handleRetry = () => {
    dispatch(fetchCoachProfile({ coachId, startDate, endDate }));
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleFilterChange = () => {
    dispatch(fetchCoachProfile({ coachId, startDate, endDate }));
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
            <Button
              onClick={handleRetry}
              variant="outline"
              className="mt-2 flex items-center text-red-700 hover:bg-red-100"
            >
              <FiRefreshCw className="mr-2" />
              إعادة المحاولة
            </Button>
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

      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">تصفية حسب التاريخ</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">تاريخ البدء</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">تاريخ الانتهاء</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleFilterChange} className="bg-blue-600 hover:bg-blue-700">
              تطبيق التصفية
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 transform hover:shadow-md transition-shadow duration-300">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">ملخص مالي</h2>
          <div className="space-y-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-2">الإيرادات حسب نوع الاشتراك</h2>
          {revenueByType.length > 0 ? (
            <div className="space-y-4">
              {revenueByType.map((type, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-700 mb-2">{type.type_name}</p>
                  <p className="flex justify-between text-gray-600">
                    <span>المدفوع:</span>
                    <span className="text-indigo-600 font-semibold">{type.total_paid || 0} جنيه</span>
                  </p>
                  <p className="flex justify-between text-gray-600">
                    <span>المتبقي:</span>
                    <span className="text-indigo-600 font-semibold">{type.total_remaining || 0} جنيه</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">لا توجد إيرادات حسب نوع الاشتراك</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-2">الإيرادات الشهرية</h2>
          {monthlyRevenue.length > 0 ? (
            <div className="space-y-4">
              {monthlyRevenue.map((month, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-700 mb-2">{month.month}</p>
                  <p className="flex justify-between text-gray-600">
                    <span>المدفوع:</span>
                    <span className="text-indigo-600 font-semibold">{month.total_paid || 0} جنيه</span>
                  </p>
                  <p className="flex justify-between text-gray-600">
                    <span>المتبقي:</span>
                    <span className="text-indigo-600 font-semibold">{month.total_remaining || 0} جنيه</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">لا توجد إيرادات شهرية</p>
          )}
        </div>
      </div>

      {membersDetails.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-2">
            تفاصيل الأعضاء ({membersDetails.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedMembersDetails.map((member) => (
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
                      {member.status === 'Active' ? 'نشط' : member.status === 'Expired' ? 'منتهي' : 'قادم' || '—'}
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
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">نوع تعويض الكابتن:</span>
                    <span className="text-gray-800">
                      {member.coach_compensation_type === 'from_subscription'
                        ? 'من الاشتراك (نسبة)'
                        : member.coach_compensation_type === 'external'
                        ? 'مبلغ خارجي'
                        : '—'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">قيمة تعويض الكابتن:</span>
                    <span className="text-indigo-600 font-semibold">
                      {member.coach_compensation_value
                        ? `${member.coach_compensation_value} ${
                            member.coach_compensation_type === 'from_subscription' ? '%' : 'جنيه'
                          }`
                        : '—'}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <Button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                variant="outline"
              >
                السابق
              </Button>
              {[...Array(totalPages).keys()].map((p) => (
                <Button
                  key={p + 1}
                  onClick={() => handlePageChange(p + 1)}
                  variant={page === p + 1 ? 'default' : 'outline'}
                >
                  {p + 1}
                </Button>
              ))}
              <Button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                variant="outline"
              >
                التالي
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 text-center text-gray-500">
          لا توجد بيانات أعضاء
        </div>
      )}

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
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">نوع تعويض الكابتن:</span>
                    <span className="text-gray-800">
                      {sub.coach_compensation_type === 'from_subscription'
                        ? 'من الاشتراك (نسبة)'
                        : sub.coach_compensation_type === 'external'
                        ? 'مبلغ خارجي'
                        : '—'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">قيمة تعويض الكابتن:</span>
                    <span className="text-indigo-600 font-semibold">
                      {sub.coach_compensation_value
                        ? `${sub.coach_compensation_value} ${
                            sub.coach_compensation_type === 'from_subscription' ? '%' : 'جنيه'
                          }`
                        : '—'}
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
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">نوع تعويض الكابتن:</span>
                    <span className="text-gray-800">
                      {sub.coach_compensation_type === 'from_subscription'
                        ? 'من الاشتراك (نسبة)'
                        : sub.coach_compensation_type === 'external'
                        ? 'مبلغ خارجي'
                        : '—'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">قيمة تعويض الكابتن:</span>
                    <span className="text-indigo-600 font-semibold">
                      {sub.coach_compensation_value
                        ? `${sub.coach_compensation_value} ${
                            sub.coach_compensation_type === 'from_subscription' ? '%' : 'جنيه'
                          }`
                        : '—'}
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