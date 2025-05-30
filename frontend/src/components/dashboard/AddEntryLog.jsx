import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addEntryLog } from "@/redux/slices/EntryLogsSlice";
import toast from 'react-hot-toast';
import BASE_URL from "@/config/api";

const EntryForm = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.entryLogs); // Updated to use entryLogs state

  const [formData, setFormData] = useState({
    club: '',
    membership_number: '',
  });
  const [userClub, setUserClub] = useState(null); // State for user club
  const [errors, setErrors] = useState({});

  // Fetch user profile to get club details
  useEffect(() => {
    fetch(`${BASE_URL}/accounts/api/profile/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setUserClub({
          id: data.club.id,
          name: data.club.name,
        });
        setFormData((prev) => ({ ...prev, club: data.club.id.toString() }));
      })
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
        setErrors((prev) => ({ ...prev, club: "فشل في تحميل بيانات النادي" }));
        toast.error("فشل في تحميل بيانات النادي");
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: value 
    });
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = {};
    if (!formData.club || isNaN(parseInt(formData.club))) {
      validationErrors.club = "النادي مطلوب.";
    }
    if (!formData.membership_number) {
      validationErrors.membership_number = "رقم العضوية مطلوب.";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const loadingToast = toast.loading("جارٍ الإرسال...");

    try {
      const resultAction = await dispatch(addEntryLog({
        club: Number(formData.club),
        membership_number: Number(formData.membership_number),
      }));

      if (addEntryLog.fulfilled.match(resultAction)) {
        toast.success('تم إضافة سجل الدخول بنجاح!', { id: loadingToast });
        setFormData({ 
          club: userClub?.id?.toString() || '', 
          membership_number: '' 
        });
        setErrors({});
        onSuccess?.();
      } else {
        throw new Error(resultAction.payload || 'فشل في إضافة سجل الدخول');
      }
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4 border rounded" dir="rtl">
      <div>
        <label htmlFor="club-input" className="block text-sm font-medium text-right">
          النادي *
        </label>
        <select
          id="club-input"
          name="club"
          value={formData.club}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right text-sm"
          disabled
          required
          aria-describedby="club-help"
        >
          {userClub ? (
            <option value={userClub.id}>{userClub.name}</option>
          ) : (
            <option value="">جاري التحميل...</option>
          )}
        </select>
        <span id="club-help" className="sr-only">
          النادي المرتبط بسجل الدخول - هذا الحقل معطل ويتم ملؤه تلقائيًا
        </span>
        {errors.club && (
          <p className="text-red-500 text-xs text-right mt-1">
            {errors.club}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="membership-number-input" className="block text-sm font-medium text-right">
          رقم العضوية *
        </label>
        <input
          id="membership-number-input"
          type="number"
          name="membership_number"
          placeholder="أدخل رقم العضوية"
          value={formData.membership_number}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded text-right"
          aria-describedby="membership-number-help"
        />
        <span id="membership-number-help" className="sr-only">
          أدخل رقم العضوية - هذا الحقل مطلوب
        </span>
        {errors.membership_number && (
          <p className="text-red-500 text-xs text-right mt-1">
            {errors.membership_number}
          </p>
        )}
      </div>
      <button
        type="submit"
        className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition duration-150"
        disabled={loading || !userClub}
      >
        {loading ? 'جارٍ الإرسال...' : 'إرسال سجل الدخول'}
      </button>
    </form>
  );
};

export default EntryForm;

