import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSubscriptionTypes, postSubscription } from "../../redux/slices/subscriptionsSlice";
import { fetchUsers } from "../../redux/slices/memberSlice";
import { Button } from "@/components/ui/button";

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
  });

  // Data state
  const [clubs, setClubs] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await dispatch(fetchSubscriptionTypes()).unwrap();
        const membersResult = await dispatch(fetchUsers()).unwrap();

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
      } catch (error) {
        handleError(error, "Failed to load initial data");
      } finally {
        setIsInitialLoad(false);
      }
    };

    fetchInitialData();
  }, [dispatch]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { club, identifier, type, start_date, paid_amount } = formData;

    // Client-side validation
    if (!club || !identifier || !type || !start_date || !paid_amount) {
      setErrorMessage("يرجى ملء جميع الحقول المطلوبة");
      setIsModalOpen(true);
      return;
    }

    if (isNaN(parseFloat(paid_amount)) || parseFloat(paid_amount) <= 0) {
      setErrorMessage("المبلغ المدفوع يجب أن يكون رقمًا إيجابيًا");
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
    };

    try {
      await dispatch(postSubscription(payload)).unwrap();
      setFormData({
        club: "",
        identifier: "",
        type: "",
        start_date: "",
        paid_amount: "",
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
    <div className="container mx-auto p-4" dir="rtl">
      <h2 className="text-xl font-bold mb-6">إنشاء اشتراك جديد</h2>

      {/* Error Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">حدث خطأ</h3>
            <p className="text-red-600">{errorMessage}</p>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => setIsModalOpen(false)}
                variant="destructive"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Club Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">النادي</label>
          <select
            value={formData.club}
            onChange={(e) =>
              setFormData({
                ...formData,
                club: e.target.value,
                identifier: "", // Reset identifier on club change
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

        {/* Identifier Input */}
        <div>
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

        {/* Subscription Type */}
        <div>
          <label className="block text-sm font-medium mb-2">نوع الاشتراك</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value="">اختر النوع</option>
            {subscriptionTypes.results
              .filter(
                (type) =>
                  type.club_details.id.toString() === formData.club.toString()
              )
              ?.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} - {type.price} جنيها
                </option>
              ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium mb-2">تاريخ البدء</label>
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) =>
              setFormData({ ...formData, start_date: e.target.value })
            }
            className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
            min={new Date().toISOString().split("T")[0]}
            disabled={isSubmitting}
          />
        </div>

        {/* Paid Amount */}
        <div>
          <label className="block text-sm font-medium mb-2">
            المبلغ المدفوع
          </label>
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
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
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