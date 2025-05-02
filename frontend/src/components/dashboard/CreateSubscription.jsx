import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { postSubscription } from "../../redux/slices/subscriptionsSlice";
import { fetchUsers } from "../../redux/slices/memberSlice";
import { fetchSubscriptionTypes } from "../../redux/slices/subscriptionsSlice";

const CreateSubscription = () => {
  const dispatch = useDispatch();
  const { subscriptionTypes, loading, error: subscriptionError } = useSelector(
    (state) => state.subscriptions
  );
  const [formData, setFormData] = useState({
    club: "",
    member: "",
    type: "",
    start_date: "",
    end_date: "",
    paid_amount: "",
  });

  const [members, setMembers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [error, setError] = useState("");

  // Fetch users (members) and clubs on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedData = await dispatch(fetchUsers()).unwrap();
        const memberList = fetchedData.results;

        setMembers(memberList);

        // Get unique clubs from members
        const uniqueClubs = Array.from(
          new Map(
            memberList.map((m) => [m.club, { club_id: m.club, club_name: m.club_name }])
          ).values()
        );

        setClubs(uniqueClubs);
      } catch (err) {
        setError("Failed to fetch members. Please try again later: " + err.message);
      }
    };

    fetchData();
  }, [dispatch]);

  // Fetch subscription types on mount
  useEffect(() => {
    dispatch(fetchSubscriptionTypes());
  }, [dispatch]);

  // Update members dropdown when a club is selected
  useEffect(() => {
    if (formData.club) {
      const filtered = members.filter((m) => m.club === parseInt(formData.club));
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers([]);
    }
  }, [formData.club, members]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    const { club, member, type, start_date, end_date, paid_amount } = formData;

    if (!club || !member || !type || !start_date || !end_date || !paid_amount) {
      alert("Please fill in all fields.");
      return;
    }

    const payload = {
      club: parseInt(club),
      member: parseInt(member),
      type: parseInt(type),
      start_date,
      end_date,
      paid_amount: parseFloat(paid_amount),
    };

    dispatch(postSubscription(payload));
  };

  return (
    <div className="container mx-auto p-4" dir="rtl">
      <h2 className="text-xl font-bold mb-4">إنشاء اشتراك</h2>

      {error && <p className="text-red-500">{error}</p>}
      {subscriptionError && <p className="text-red-500">{subscriptionError}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Club Select */}
        <div>
          <label className="block font-medium">النادي</label>
          <select
            name="club"
            value={formData.club}
            onChange={handleChange}
            className="w-full p-2 border rounded"
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

        {/* Member Select */}
        <div>
          <label className="block font-medium">العضو</label>
          <select
            name="member"
            value={formData.member}
            onChange={handleChange}
            className="w-full p-2 border rounded"
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

        {/* Subscription Type Select */}
        <div>
          <label className="block font-medium">نوع الاشتراك</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full p-2 border rounded"
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
        <div>
          <label className="block font-medium">تاريخ البداية</label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block font-medium">تاريخ النهاية</label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Paid Amount */}
        <div>
          <label className="block font-medium">المبلغ المدفوع</label>
          <input
            type="number"
            name="paid_amount"
            step="0.01"
            value={formData.paid_amount}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="أدخل المبلغ المدفوع"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          إنشاء اشتراك
        </button>
      </form>
    </div>
  );
};

export default CreateSubscription;





