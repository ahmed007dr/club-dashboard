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
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedData = await dispatch(fetchUsers()).unwrap();
        const memberList = Array.isArray(fetchedData) ? fetchedData : [];
        setMembers(memberList);

        const uniqueClubs = Array.from(
          new Map(
            memberList.map((m) => [
              m.club,
              { club_id: m.club, club_name: m.club_name },
            ])
          ).values()
        );
        setClubs(uniqueClubs);
      } catch (err) {
        setErrorMessage(err.message || "Failed to load member data");
        setIsModalOpen(true);
      }
    };

    fetchData();
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchSubscriptionTypes());
  }, [dispatch]);

  useEffect(() => {
    if (formData.club) {
      const filtered = members.filter((m) => m.club === parseInt(formData.club));
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers([]);
    }
  }, [formData.club, members]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { club, member, type, start_date, paid_amount } = formData;

    if (!club || !member || !type || !start_date || !paid_amount) {
      setErrorMessage("الرجاء ملء جميع الحقول المطلوبة");
      setIsModalOpen(true);
      return;
    }

    const amount = parseFloat(paid_amount);
    if (isNaN(amount)) {
      setErrorMessage("المبلغ المدخل غير صالح");
      setIsModalOpen(true);
      return;
    }

    if (amount <= 0) {
      setErrorMessage("يجب أن يكون المبلغ أكبر من الصفر");
      setIsModalOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        club: parseInt(club),
        member: parseInt(member),
        type: parseInt(type),
        start_date,
        paid_amount: amount,
      };

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
      let errorMsg = "حدث خطأ أثناء إنشاء الاشتراك";
      if (error?.non_field_errors) {
        errorMsg = error.non_field_errors[0];
      } else if (error?.message) {
        errorMsg = error.message;
      } else if (typeof error === "string") {
        errorMsg = error;
      }

      setErrorMessage(errorMsg);
      setIsModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setErrorMessage("");
  };

  return (
    <div className="container mx-auto p-4" dir="rtl">
      <h2 className="text-xl font-bold mb-4">إنشاء اشتراك</h2>

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
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

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

        <button
          type="submit"
          className={`btn bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                ></path>
              </svg>
              جاري المعالجة...
            </span>
          ) : (
            "إنشاء اشتراك"
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateSubscription;

