import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchCoachProfile } from '../../redux/slices/subscriptionsSlice';

function CoachProfile() {
  const { coachId } = useParams();
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.subscriptions.coachProfile);

  useEffect(() => {
    dispatch(fetchCoachProfile(coachId));
  }, [dispatch, coachId]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="text-xl text-gray-600 animate-pulse">جاري التحميل...</div>
    </div>
  );
  if (error) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="text-red-500 text-xl">خطأ: {error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">بروفايل المدرب: {data?.coach_username}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Financial Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-300">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">ملخص مالي</h2>
          <div className="space-y-4">
            <p className="flex justify-between items-center text-gray-600">
              <span className="font-medium">إجمالي قيمة التدريبات:</span>
              <span className="text-indigo-600 font-semibold">{data?.total_private_training_amount} جنيه</span>
            </p>
            <p className="flex justify-between items-center text-gray-600">
              <span className="font-medium">إجمالي المبلغ المدفوع:</span>
              <span className="text-indigo-600 font-semibold">{data?.total_paid_amount} جنيه</span>
            </p>
          </div>
        </div>

        {/* Clients Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-300">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">العمليات</h2>
          <div className="space-y-4">
            <p className="flex justify-between items-center text-gray-600">
              <span className="font-medium">العملاء النشطين:</span>
              <span className="text-indigo-600 font-semibold">{data?.active_clients}</span>
            </p>
            <p className="flex justify-between items-center text-gray-600">
              <span className="font-medium">عملاء الشهر السابق:</span>
              <span className="text-indigo-600 font-semibold">{data?.previous_month_clients}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Active Subscriptions */}
      {data?.subscriptions?.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-2">
            الاشتراكات النشطة ({data.subscriptions.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.subscriptions.map((sub) => (
              <div 
                key={sub.subscription_id} 
                className="bg-gray-50 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="space-y-3">
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">العضو:</span>
                    <span className="text-gray-800">{sub.member_name}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">تاريخ البدء:</span>
                    <span className="text-gray-800">{sub.start_date}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">تاريخ الانتهاء:</span>
                    <span className="text-gray-800">{sub.end_date}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">الحالة:</span>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      {sub.status}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">السعر:</span>
                    <span className="text-indigo-600 font-semibold">{sub.private_training_price} جنيه</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">المدفوع:</span>
                    <span className="text-indigo-600 font-semibold">{sub.paid_amount} جنيه</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Subscriptions */}
      {data?.completed_subscriptions?.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-2">
            الاشتراكات المنتهية ({data.completed_subscriptions.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.completed_subscriptions.map((sub) => (
              <div 
                key={sub.subscription_id} 
                className="bg-gray-50 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="space-y-3">
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">العضو:</span>
                    <span className="text-gray-800">{sub.member_name}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">تاريخ البدء:</span>
                    <span className="text-gray-800">{sub.start_date}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">تاريخ الانتهاء:</span>
                    <span className="text-gray-800">{sub.end_date}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">الحالة:</span>
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                      {sub.status}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">السعر:</span>
                    <span className="text-indigo-600 font-semibold">{sub.private_training_price} جنيه</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-600">المدفوع:</span>
                    <span className="text-indigo-600 font-semibold">{sub.paid_amount} جنيه</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CoachProfile;