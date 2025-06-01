import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSubscriptionTypes, postSubscription } from "../../redux/slices/subscriptionsSlice";
import { fetchUsers } from "../../redux/slices/memberSlice";
import { Button } from "@/components/ui/button";
import { FaUser } from 'react-icons/fa';

const CreateSubscription = ({ onClose }) => {
  const dispatch = useDispatch();
  const { subscriptionTypes } = useSelector((state) => state.subscriptions);

  // Form state
  const [formData, setFormData] = useState({
    club: "",
    identifier: "",
    type: "",
    start_date: "",
    paid_amount: "",
    coach: "", // New field for coach selection
  });

  // Data state
  const [clubs, setClubs] = useState([]);
  const [allMembers, setAllMembers] = useState({ results: [] });
  const [allSubscriptionTypes, setAllSubscriptionTypes] = useState([]);
  const [allCoaches, setAllCoaches] = useState([]); // New state for all coaches
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [foundMember, setFoundMember] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch all users across pages with role filter
  const fetchAllUsers = async (roleFilter = null) => {
    try {
      let allResults = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const params = {};
        if (roleFilter) {
          params.role = roleFilter;
        }
        
        const response = await dispatch(fetchUsers({ page: currentPage, ...params })).unwrap();
        const results = Array.isArray(response) ? response : response.results || [];
        allResults = [...allResults, ...results];
        hasMore = !!response.next;
        currentPage += 1;
      }

      return { results: allResults };
    } catch (error) {
      console.error("Failed to fetch all users:", error.message);
      throw error;
    }
  };

  // Fetch all subscription types across pages
  const fetchAllSubscriptionTypes = async () => {
    try {
      let allResults = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await dispatch(fetchSubscriptionTypes({ page: currentPage })).unwrap();
        const results = Array.isArray(response) ? response : response.results || [];
        allResults = [...allResults, ...results];
        hasMore = !!response.next;
        currentPage += 1;
      }

      return allResults;
    } catch (error) {
      console.error("Failed to fetch all subscription types:", error.message);
      throw error;
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [membersResult, subscriptionTypesResult, coachesResult] = await Promise.all([
          fetchAllUsers(),
          fetchAllSubscriptionTypes(),
          fetchAllUsers('coach'), // Fetch only coaches
        ]);

        // Extract unique clubs
        const uniqueClubs = Array.from(
          new Map(
            membersResult.results.map((m) => [
              m.club,
              { club_id: m.club, club_name: m.club_name },
            ])
          ).values()
        );

        setClubs(uniqueClubs);
        setAllMembers(membersResult);
        setAllSubscriptionTypes(subscriptionTypesResult);
        setAllCoaches(coachesResult.results); // Set coaches data
      } catch (error) {
        handleError(error, "Failed to load initial data");
      } finally {
        setIsInitialLoad(false);
      }
    };

    fetchInitialData();
  }, [dispatch]);

  // Handle member search when identifier changes
  useEffect(() => {
    if (!formData.identifier || !formData.club) {
      setFoundMember(null);
      return;
    }

    const searchValue = formData.identifier.trim().toUpperCase();
    setSearchLoading(true);

    // Search through members of the selected club
    const member = allMembers.results.find(m => 
      m.club.toString() === formData.club.toString() && (
        (m.rfid_code && m.rfid_code.toUpperCase() === searchValue) ||
        (m.phone && m.phone.trim() === searchValue) ||
        (m.name && m.name.trim().toUpperCase() === searchValue.toUpperCase())
      )
    );

    if (member) {
      setFoundMember({
        id: member.id,
        name: member.name,
        photo: member.photo,
        membership_number: member.membership_number,
        phone: member.phone,
        rfid_code: member.rfid_code,
        club_id: member.club,
        club_name: member.club_name,
        address: member.address,
        birth_date: member.birth_date,
        job: member.job,
        national_id: member.national_id
      });
    }

    setSearchLoading(false);
  }, [formData.identifier, formData.club, allMembers.results]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { club, identifier, type, start_date, paid_amount, coach } = formData;

    // Client-side validation
    if (!club || !identifier || !type || !start_date || !paid_amount) {
      setErrorMessage("يرجى ملء جميع الحقول المطلوبة");
      setIsModalOpen(true);
      return;
    }

    if (isNaN(parseFloat(paid_amount))) {
      setErrorMessage("المبلغ المدفوع يجب أن يكون رقمًا صحيحًا");
      setIsModalOpen(true);
      return;
    }

    setIsSubmitting(true);

    const payload = {
      club: parseInt(club),
      identifier,
      type: parseInt(type),
      start_date,
      paid_amount: parseFloat(paid_amount),
      coach: coach ? parseInt(coach) : null, // Add coach to payload if selected
    };

    try {
      await dispatch(postSubscription(payload)).unwrap();
      setFormData({
        club: "",
        identifier: "",
        type: "",
        start_date: "",
        paid_amount: "",
        coach: "",
      });
      if (onClose) onClose();
    } catch (error) {
      console.log("Full error object:", JSON.stringify(error, null, 2));
      let errorData = error.payload || error.data || error.response || error;
      if (
        errorData?.non_field_errors &&
        Array.isArray(errorData.non_field_errors)
      ) {
        setErrorMessage(errorData.non_field_errors[0]);
        setIsModalOpen(true);
      } else {
        setErrorMessage(
          errorData?.message || error.message || "حدث خطأ غير متوقع"
        );
        setIsModalOpen(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Error handling
  const handleError = (error, defaultMessage) => {
    const errorMessage =
      error?.payload?.message || error?.message || defaultMessage;
    setErrorMessage(errorMessage);
    setIsModalOpen(true);
  };

  return (
    <div className="container max-w-xl mx-auto p-4" dir="rtl">
      <h2 className="text-xl font-bold mb-6">إنشاء اشتراك جديد</h2>

      {isModalOpen && (
        <div className="fixed top-1/4 left-0 right-0 bg-black bg-opacity-50 flex items-start justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full max-h-[70vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">حدث خطأ</h3>
            <p className="text-red-600">{errorMessage}</p>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setIsModalOpen(false)} variant="destructive">
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Club & Identifier Inputs in Flex */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium mb-2">النادي</label>
            <select
              value={formData.club}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  club: e.target.value,
                  identifier: "",
                })
              }
              className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
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

          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium mb-2">RFID أو الاسم أو رقم الهاتف</label>
            <input
              type="text"
              value={formData.identifier}
              onChange={(e) =>
                setFormData({ ...formData, identifier: e.target.value })
              }
              className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="أدخل RFID أو الاسم أو رقم الهاتف"
              disabled={!formData.club || isSubmitting}
            />
          </div>
        </div>

        {/* Loading and Errors */}
        {searchLoading && (
          <div className="text-center py-2">
            <p>جاري البحث عن العضو...</p>
          </div>
        )}

        {formData.identifier && !foundMember && !searchLoading && (
          <div className="text-red-500 text-sm">
            <p>
              {formData.identifier.match(/[A-Za-z]/)
                ? "لا يوجد عضو مسجل بهذا الكود RFID في النادي المحدد"
                : "لا يوجد عضو مسجل بهذا الرقم أو الاسم في النادي المحدد"}
            </p>
          </div>
        )}

        {/* Member Info Display */}
        {foundMember && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-start gap-4">
              {foundMember.photo ? (
                <img
                  src={foundMember.photo}
                  alt="Member"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl">
                  <FaUser />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-bold text-lg">{foundMember.name}</h3>
                <p className="text-gray-600">#{foundMember.membership_number}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <p>
                    <span className="font-medium">الهاتف:</span> {foundMember.phone || "غير متوفر"}
                  </p>
                  <p>
                    <span className="font-medium">RFID:</span> {foundMember.rfid_code || "غير مسجل"}
                  </p>
                  <p>
                    <span className="font-medium">النادي:</span> {foundMember.club_name}
                  </p>
                  <p>
                    <span className="font-medium">العنوان:</span> {foundMember.address || "غير متوفر"}
                  </p>
                  <p>
                    <span className="font-medium">الرقم القومي:</span> {foundMember.national_id || "غير متوفر"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Type & Coach */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium mb-2">نوع الاشتراك</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting || !foundMember}
            >
              <option value="">اختر النوع</option>
              {allSubscriptionTypes
                .filter((type) => type.club_details.id.toString() === formData.club?.toString())
                .map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} - {type.price} جنيها
                  </option>
                ))}
            </select>
          </div>
          
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium mb-2">المدرب (اختياري)</label>
            <select
              value={formData.coach}
              onChange={(e) => setFormData({ ...formData, coach: e.target.value })}
              className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting || !foundMember}
            >
              <option value="">اختر مدربًا</option>
              {allCoaches
                .filter(coach => coach.club?.toString() === formData.club?.toString())
                .map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.name} 
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Start Date & Paid Amount */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium mb-2">تاريخ البدء</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
              }
              className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
              min={new Date().toISOString().split("T")[0]}
              disabled={isSubmitting || !foundMember}
            />
          </div>

          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium mb-2">المبلغ المدفوع</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.paid_amount}
              onChange={(e) =>
                setFormData({ ...formData, paid_amount: e.target.value })
              }
              className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              disabled={isSubmitting || !foundMember}
            />
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full mt-6"
          disabled={isSubmitting || !foundMember}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              جاري الحفظ...
            </span>
          ) : (
            "إنشاء اشتراك"
          )}
        </Button>
      </form>
    </div>
  );
};

export default CreateSubscription;