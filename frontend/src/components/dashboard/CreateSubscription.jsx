import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { postSubscription } from "../../redux/slices/subscriptionsSlice";
import { fetchUsers } from "../../redux/slices/memberSlice";
import { fetchSubscriptionTypes } from "../../redux/slices/subscriptionsSlice";

const CreateSubscription = ({ onClose }) => {
  const dispatch = useDispatch();
  const { subscriptionTypes, loading } = useSelector(
    (state) => state.subscriptions
  );

  const [formData, setFormData] = useState({
    club: "",
    member: "",
    type: "",
    start_date: "",
    paid_amount: "",
  });

  const [members, setMembers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // State for modal error message
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility

  // Fetch users (members) and clubs on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedData = await dispatch(fetchUsers()).unwrap();
        console.log("Fetched member data:", fetchedData);
        const memberList = Array.isArray(fetchedData.results)
          ? fetchedData.results
          : [];
        setMembers(memberList);

        // Get unique clubs from members
        const uniqueClubs = Array.from(
          new Map(
            memberList.map((m) => [
              m.club,
              { club_id: m.club, club_name: m.club_name },
            ])
          ).values()
        );
        console.log('Unique clubs:', uniqueClubs);
        setClubs(uniqueClubs);
      } catch (err) {
        console.error("Error fetching member data:", err);
        setErrorMessage(err.message || "Failed to load member data");
        setIsModalOpen(true);
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
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { club, member, type, start_date, paid_amount } = formData;

    // Client-side validation
    if (!club || !member || !type || !start_date || !paid_amount) {
      setErrorMessage("Please fill in all required fields");
      setIsModalOpen(true);
      return;
    }

    if (isNaN(parseFloat(paid_amount)) || parseFloat(paid_amount) <= 0) {
      setErrorMessage("Paid amount must be a positive number");
      setIsModalOpen(true);
      return;
    }

    setIsSubmitting(true);

    const payload = {
      club: parseInt(club),
      member: parseInt(member),
      type: parseInt(type),
      start_date,
      paid_amount: parseFloat(paid_amount),
    };

    try {
      await dispatch(postSubscription(payload)).unwrap();
      setFormData({
        club: "",
        member: "",
        type: "",
        start_date: "",
        paid_amount: "",
      });
      if (onClose) onClose();
    } catch (error) {
      console.log("Full error object:", JSON.stringify(error, null, 2)); // Debug entire error
      console.log("Error payload:", JSON.stringify(error.payload, null, 2)); // Debug payload
      console.log("Error data:", JSON.stringify(error.data, null, 2)); // Debug data (if exists)
      console.log("Error response:", JSON.stringify(error.response, null, 2)); // Debug response (if exists)

      // Try multiple possible error locations
      let errorData = error.payload || error.data || error.response || error;

      console.log("Final errorData:", JSON.stringify(errorData, null, 2)); // Debug final errorData

      if (errorData?.non_field_errors && Array.isArray(errorData.non_field_errors)) {
        console.log("Handling non_field_errors:", errorData.non_field_errors); // Debug
        setErrorMessage(errorData.non_field_errors[0]); // Use raw error message
        setIsModalOpen(true);
      } else {
        console.log("Fallback error:", errorData); // Debug fallback
        setErrorMessage(
          errorData?.message || error.message || "An unexpected error occurred"
        );
        setIsModalOpen(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setErrorMessage("");
  };

  return (
    <div className="container mx-auto p-4" dir="rtl">
      <h2 className="text-xl font-bold mb-4">إنشاء اشتراك</h2>

      {/* Error Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">خطأ</h3>
            <p className="text-red-600">{errorMessage}</p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={closeModal}
                className="btn bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

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
            disabled={isSubmitting}
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
            disabled={isSubmitting || !formData.club}
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
            disabled={isSubmitting}
          >
            <option value="">اختر نوع الاشتراك</option>
            {subscriptionTypes?.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} - {type.price} ر.س
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
            disabled={isSubmitting}
            min={new Date().toISOString().split("T")[0]} // Prevent past dates
          />
        </div>

        {/* Paid Amount */}
        <div>
          <label className="block font-medium">المبلغ المدفوع</label>
          <input
            type="number"
            name="paid_amount"
            step="0.01"
            min="0"
            value={formData.paid_amount}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="أدخل المبلغ المدفوع"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`btn ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? "جاري المعالجة..." : "إنشاء اشتراك"}
        </button>
      </form>
    </div>
  );
};

export default CreateSubscription;




