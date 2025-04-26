import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchMemberSubscriptions } from '../../redux/slices/subscriptionsSlice';

const MemberSubscriptions = () => {
  const { memberId } = useParams(); // Get the memberId from the URL
  const dispatch = useDispatch();
  const { memberSubscriptions, status, error } = useSelector((state) => state.subscriptions);
console.log("Member Subscriptions:", memberSubscriptions); // Log the member subscriptions to the console
  // Fetch the member's subscriptions when the component mounts or memberId changes
  useEffect(() => {
    if (memberId) {
      dispatch(fetchMemberSubscriptions(memberId)); // Dispatch action to fetch subscriptions for the member
    }
  }, [dispatch, memberId]);

  if (status === 'loading') return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-center text-gray-700 mb-4">
        Subscriptions for Member {memberId}
      </h2>
     
    </div>
  );
};

export default MemberSubscriptions;

