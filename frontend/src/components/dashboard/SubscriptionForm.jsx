import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptions } from '../../redux/slices/subscriptionsSlice';

const SubscriptionForm = () => {
  const dispatch = useDispatch();
  const { subscriptions } = useSelector((state) => state.subscriptions);

  const [selectedClub, setSelectedClub] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedSubscription, setSelectedSubscription] = useState('');

  useEffect(() => {
    dispatch(fetchSubscriptions());
  }, [dispatch]);

  const uniqueClubs = [...new Set(subscriptions.map(sub => sub.club_name))];

  const filteredMembers = selectedClub
    ? subscriptions.filter(sub => sub.club_name === selectedClub)
    : subscriptions;

  const uniqueMembers = [
    ...new Map(filteredMembers.map(sub => [sub.member, sub.member_name])).entries()
  ];

  const filteredSubscriptions = selectedMember
    ? subscriptions.filter(sub => sub.member === Number(selectedMember))
    : [];

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow-md space-y-4">
      {/* Club Dropdown */}
      <div>
        <label className="block mb-1 font-medium text-gray-700">اختر النادي</label>
        <select
          value={selectedClub}
          onChange={(e) => {
            setSelectedClub(e.target.value);
            setSelectedMember('');
            setSelectedSubscription('');
          }}
          className="w-full border px-3 py-2 rounded-md"
        >
          <option value="">-- اختر نادي --</option>
          {uniqueClubs.map(clubName => (
            <option key={clubName} value={clubName}>
              {clubName}
            </option>
          ))}
        </select>
      </div>

      {/* Member Dropdown */}
      <div>
        <label className="block mb-1 font-medium text-gray-700">اختر العضو</label>
        <select
          value={selectedMember}
          onChange={(e) => {
            setSelectedMember(e.target.value);
            setSelectedSubscription('');
          }}
          className="w-full border px-3 py-2 rounded-md"
        >
          <option value="">-- اختر عضو --</option>
          {uniqueMembers.map(([memberId, memberName]) => (
            <option key={memberId} value={memberId}>
              {memberName}
            </option>
          ))}
        </select>
      </div>

      {/* Subscription Dropdown */}
      <div>
        <label className="block mb-1 font-medium text-gray-700">اختر الاشتراك</label>
        <select
          value={selectedSubscription}
          onChange={(e) => setSelectedSubscription(e.target.value)}
          className="w-full border px-3 py-2 rounded-md"
        >
          <option value="">-- اختر اشتراك --</option>
          {filteredSubscriptions.map(sub => (
            <option key={sub.id} value={sub.id}>
              {sub?.type_details?.name || 'نوع غير معروف'}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SubscriptionForm;
