import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from '../../redux/slices/memberSlice';
import { fetchSubscriptionTypes } from '../../redux/slices/subscriptionsSlice';

const UpdateSubscriptionModal = ({ isOpen, onClose, subscription, onSubmit }) => {
  const dispatch = useDispatch();
  const { subscriptionTypes } = useSelector((state) => state.subscriptions);

  const [formData, setFormData] = useState({
    club: '',
    member: '',
    type: '',
    start_date: '',
    end_date: '',
    paid_amount: '',
  });

  const [members, setMembers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch users (members) and clubs on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedData = await dispatch(fetchUsers()).unwrap();
        
        // Handle both array response and { results: [] } response
        const memberList = Array.isArray(fetchedData) ? fetchedData : 
                         fetchedData.results ? fetchedData.results : 
                         [];
        
        setMembers(memberList);

        // Get unique clubs from members
        const uniqueClubs = Array.from(
          new Map(
            memberList
              .filter(m => m.club) // Only include members with clubs
              .map((m) => [m.club, { club_id: m.club, club_name: m.club_name || `Club ${m.club}` }])
          ).values()
        );

        setClubs(uniqueClubs);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch members:", err);
        setError("Failed to load members data");
        setLoading(false);
      }
    };

    fetchData();
    dispatch(fetchSubscriptionTypes());
  }, [dispatch]);

  // Update members dropdown when a club is selected
  useEffect(() => {
    if (formData.club && Array.isArray(members)) {
      const filtered = members.filter((m) => m.club === parseInt(formData.club));
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers([]);
    }
  }, [formData.club, members]);

  // Populate the form data when the subscription prop changes
  useEffect(() => {
    if (subscription) {
      setFormData({
        club: subscription.club?.toString() || '',
        member: subscription.member?.toString() || '',
        type: subscription.type?.toString() || '',
        start_date: subscription.start_date || '',
        end_date: subscription.end_date || '',
        paid_amount: subscription.paid_amount || '',
      });
      
      // If we have a club in the subscription, filter members immediately
      if (subscription.club && Array.isArray(members)) {
        const filtered = members.filter((m) => m.club === parseInt(subscription.club));
        setFilteredMembers(filtered);
      }
    }
  }, [subscription, members]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({
        ...formData,
        club: parseInt(formData.club),
        member: parseInt(formData.member),
        type: parseInt(formData.type),
        paid_amount: parseFloat(formData.paid_amount),
        id: subscription.id,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
          <p className="text-red-500">{error}</p>
          <button
            className="mt-4 px-4 py-2 bg-gray-200 rounded"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          X
        </button>
        <h2 className="text-xl font-bold mb-4">تعديل الاشتراك</h2>
        <form onSubmit={handleSubmit}>
          {/* Club */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">النادي</label>
            <select
              name="club"
              value={formData.club || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            >
              <option value="">اختر النادي</option>
              {clubs.map((club) => (
                <option key={club.club_id} value={club.club_id}>
                  {club.club_name}
                </option>
              ))}
            </select>
          </div>

          {/* Member */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">العضو</label>
            <select
              name="member"
              value={formData.member || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            >
              <option value="">اختر العضو</option>
              {filteredMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">النوع</label>
            <select
              name="type"
              value={formData.type || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            >
              <option value="">اختر نوع الاشتراك</option>
              {subscriptionTypes?.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">تاريخ البداية</label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>

          {/* End Date */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">تاريخ النهاية</label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>

          {/* Paid Amount */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">المبلغ المدفوع</label>
            <input
              type="number"
              name="paid_amount"
              step="0.01"
              value={formData.paid_amount || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn"
            >
              تحديث الاشتراك
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateSubscriptionModal;
