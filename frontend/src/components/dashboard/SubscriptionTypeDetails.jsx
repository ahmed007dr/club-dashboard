import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionTypeById } from '../../redux/slices/subscriptionsSlice';

const SubscriptionTypeDetails = ({ id }) => {
  const dispatch = useDispatch();
  
  // Memoized selectors to prevent unnecessary re-renders
  const subscriptionType = useSelector(
    (state) => state.subscriptions.subscriptionType
  );
  const loading = useSelector((state) => state.subscriptions.loading);
  const error = useSelector((state) => state.subscriptions.error);

  useEffect(() => {
    // Only fetch if:
    // 1. We have an ID
    // 2. We don't already have the data OR the existing data is for a different ID
    if (id && (!subscriptionType || subscriptionType.id !== parseInt(id))) {
      dispatch(fetchSubscriptionTypeById(id));
    }
  }, [id, dispatch, subscriptionType]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!subscriptionType) return <p>No data.</p>;

  return (
    <div dir="rtl" className="text-right">
    <h2 className="text-xl font-semibold mb-2">{subscriptionType.name}</h2>
    <p>السعر: {subscriptionType.price}</p>
    <p>المدة: {subscriptionType.duration_days} يوم</p>
    <p>يشمل الجيم: {subscriptionType.include_gym ? 'نعم' : 'لا'}</p>
    <p>يشمل المسبح: {subscriptionType.include_pool ? 'نعم' : 'لا'}</p>
    <p>يشمل الحصص: {subscriptionType.include_classes ? 'نعم' : 'لا'}</p>
  </div>
  
  );
};

export default SubscriptionTypeDetails;
