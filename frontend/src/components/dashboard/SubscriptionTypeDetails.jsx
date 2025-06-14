
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionTypeById } from '../../redux/slices/subscriptionsSlice';

const SubscriptionTypeDetails = ({ id }) => {
  const dispatch = useDispatch();
  const subscriptionType = useSelector((state) => state.subscriptions.subscriptionType);
  const loading = useSelector((state) => state.subscriptions.loading);
  const error = useSelector((state) => state.subscriptions.error);

  useEffect(() => {
    if (id && (!subscriptionType || subscriptionType.id !== parseInt(id))) {
      dispatch(fetchSubscriptionTypeById(id));
    }
  }, [id, dispatch, subscriptionType]);

  if (loading) return <p className="text-right">جاري التحميل...</p>;
  if (error) return <p className="text-right text-red-600">خطأ: {error}</p>;
  if (!subscriptionType) return <p className="text-right">لا توجد بيانات.</p>;

  return (
    <div dir="rtl" className="text-right">
      <h2 className="text-xl font-semibold mb-4">{subscriptionType.name}</h2>
      <div className="space-y-2">
        <p>
          <span className="font-medium">السعر:</span> {subscriptionType.price} جنيه
        </p>
        <p>
          <span className="font-medium">المدة:</span> {subscriptionType.duration_days} يوم
        </p>
        <p>
          <span className="font-medium">الميزات:</span>{' '}
          {subscriptionType.features && subscriptionType.features.length > 0
            ? subscriptionType.features.map((f) => f.name).join(', ')
            : 'لا توجد ميزات'}
        </p>
        <p>
          <span className="font-medium">تدريب خاص:</span>{' '}
          {subscriptionType.is_private_training ? 'نعم' : 'لا'}
        </p>
        <p>
          <span className="font-medium">الحالة:</span>{' '}
          {subscriptionType.is_active ? 'نشط' : 'غير نشط'}
        </p>
        <p>
          <span className="font-medium">الحد الأقصى للدخول:</span>{' '}
          {subscriptionType.max_entries || 'غير محدود'}
        </p>
        <p>
          <span className="font-medium">أيام التجميد القصوى:</span>{' '}
          {subscriptionType.max_freeze_days}
        </p>
        <p>
          <span className="font-medium">عدد المشتركين:</span>{' '}
          {subscriptionType.subscriptions_count || 0}
        </p>
      </div>
    </div>
  );
};

export default SubscriptionTypeDetails;
