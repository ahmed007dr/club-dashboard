import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionTypes } from '../../redux/slices/subscriptionsSlice'; 

const ActiveSubscriptionTypes = () => {
  const dispatch = useDispatch();
  const { subscriptionTypes, loading, error } = useSelector((state) => state.subscriptions);
  console.log('Subscription Types:', subscriptionTypes); // Debugging line to check the subscription types data
  useEffect(() => {
    dispatch(fetchSubscriptionTypes());
  }, [dispatch]);

  const activeSubscriptions = subscriptionTypes.filter((sub) => sub.isActive);
  const inactiveSubscriptions = subscriptionTypes.filter((sub) => !sub.isActive);

  if (loading) {
    return <div className="text-center text-gray-500 mt-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-4">Error: {error}</div>;
  }

  return (
    <div className="p-6">
    <h1 className="text-3xl font-bold mb-6 text-center">Subscription Types</h1>
  
    {loading ? (
      <div className="text-center text-gray-500 mt-4">Loading...</div>
    ) : error ? (
      <div className="text-center text-red-500 mt-4">Error: {error}</div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Name</th>
              <th className="py-3 px-6 text-left">Price</th>
              <th className="py-3 px-6 text-left">Duration (days)</th>
              <th className="py-3 px-6 text-left">Includes Gym</th>
              <th className="py-3 px-6 text-left">Includes Classes</th>
              <th className="py-3 px-6 text-left">Is Active</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {subscriptionTypes.map((sub) => (
              <tr key={sub.id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left">{sub.name}</td>
                <td className="py-3 px-6 text-left">${sub.price}</td>
                <td className="py-3 px-6 text-left">{sub.duration_days}</td>
                <td className="py-3 px-6 text-left">
                  {sub.includes_gym ? (
                    <span className="text-green-500 font-semibold">Yes</span>
                  ) : (
                    <span className="text-red-500 font-semibold">No</span>
                  )}
                </td>
                <td className="py-3 px-6 text-left">
                  {sub.includes_classes ? (
                    <span className="text-green-500 font-semibold">Yes</span>
                  ) : (
                    <span className="text-red-500 font-semibold">No</span>
                  )}
                </td>
                <td className="py-3 px-6 text-left">
                  {sub.is_active ? (
                    <span className="text-green-500 font-semibold">Yes</span>
                  ) : (
                    <span className="text-red-500 font-semibold">No</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
  
  
  );
};

export default ActiveSubscriptionTypes;
