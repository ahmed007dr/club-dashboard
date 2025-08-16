import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUpcomingSubscriptions }  from '../../redux/slices/subscriptionsSlice'; 

const UpcomingSubscriptions = () => {
  const dispatch = useDispatch();
  const { upcomingSubscriptions, loading, error } = useSelector((state) => state.subscriptions);
console.log(upcomingSubscriptions, loading, error)
  useEffect(() => {
    dispatch(fetchUpcomingSubscriptions());
  }, [dispatch]);

  if (loading) return <div className="text-center p-4">Loading upcoming subscriptions...</div>;
  if (error) return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  if (!upcomingSubscriptions.length) return <div className="text-center p-4">No upcoming subscriptions.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg">
    <h2 className="text-2xl font-bold mb-6 text-center">Upcoming Subscriptions</h2>
    <ul className="space-y-4">
      {upcomingSubscriptions.map((sub) => (
        <li key={sub.id} className="p-4 border rounded-lg flex justify-between items-center">
          <div>
            <p className="text-lg font-semibold">Member Name: {sub.member_name}</p>
            <p className="text-gray-500 text-sm">Club Name: {sub.club_name}</p>
            <p className="text-gray-500 text-sm">Start Date: {sub.start_date}</p>
            <p className="text-gray-500 text-sm">End Date: {sub.end_date}</p>
            <p className="text-gray-500 text-sm">Type: {sub.type}</p>
          </div>
          <div className="text-sm text-green-600 font-semibold">Upcoming</div>
        </li>
      ))}
    </ul>
  </div>
  );
};

export default UpcomingSubscriptions;
