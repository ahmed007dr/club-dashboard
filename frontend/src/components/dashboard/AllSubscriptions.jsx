import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllSubscriptions } from '../../redux/slices/subscriptionsSlice';

function AllSubscriptions() {
  const dispatch = useDispatch();
  const { allsubscriptions, loading, error } = useSelector((state) => state.subscriptions);

  useEffect(() => {
    dispatch(fetchAllSubscriptions());
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <table className="min-w-full bg-white">
      <thead>
        <tr>
          <th className="py-2">ID</th>
          <th className="py-2">Member Name</th>
          <th className="py-2">Club Name</th>
          <th className="py-2">Start Date</th>
          <th className="py-2">End Date</th>
          <th className="py-2">Paid Amount</th>
          <th className="py-2">Remaining Amount</th>
          <th className="py-2">Attendance Days</th>
          <th className="py-2">Status</th>
        </tr>
      </thead>
      <tbody>
        {allsubscriptions.map((sub) => (
          <tr key={sub.id}>
            <td className="py-2">{sub.id}</td>
            <td className="py-2">{sub.member_name}</td>
            <td className="py-2">{sub.club_name}</td>
            <td className="py-2">{sub.start_date}</td>
            <td className="py-2">{sub.end_date}</td>
            <td className="py-2">${sub.paid_amount}</td>
            <td className="py-2">${sub.remaining_amount}</td>
            <td className="py-2">{sub.attendance_days}</td>
            <td className="py-2">{sub.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default AllSubscriptions;