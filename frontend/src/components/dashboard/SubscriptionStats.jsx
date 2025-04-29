import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionStats } from '../../redux/slices/subscriptionsSlice'; 

const SubscriptionStats = () => {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector((state) => state.subscriptions);
console.log("SubscriptionStats", stats, loading, error)
  useEffect(() => {
    dispatch(fetchSubscriptionStats());
  }, [dispatch]);

  if (loading) return <div className="text-center p-4">Loading stats...</div>;
  if (error) return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  if (!stats) return null; // stats still null while loading

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg">
    <h2 className="text-2xl font-bold mb-4 text-center">Subscription Stats</h2>
    <ul className="space-y-2">
      <li className="flex justify-between">
        <span>Active Subscriptions:</span>
        <span className="font-semibold">{stats.active}</span>
      </li>
      <li className="flex justify-between">
        <span>Expired Subscriptions:</span>
        <span className="font-semibold">{stats.expired}</span>
      </li>
      <li className="flex justify-between">
        <span>Total Subscriptions:</span>
        <span className="font-semibold">{stats.total}</span>
      </li>
      <li className="flex justify-between">
        <span>Upcoming Subscriptions:</span>
        <span className="font-semibold">{stats.upcoming}</span>
      </li>
    </ul>
  </div>
  );
};

export default SubscriptionStats;
