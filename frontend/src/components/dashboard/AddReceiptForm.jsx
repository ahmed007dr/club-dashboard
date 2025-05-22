import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addReceipt, fetchReceipts } from "../../redux/slices/receiptsSlice";
import { fetchSubscriptions } from "../../redux/slices/subscriptionsSlice";
import { fetchUsers } from "../../redux/slices/memberSlice";
import { toast } from "react-hot-toast";
import { FaUser } from 'react-icons/fa';

function AddReceiptForm({ onClose }) {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [foundMember, setFoundMember] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    club: "",
    identifier: "",
    subscription: "",
    amount: "",
    payment_method: "cash",
    note: "",
  });

  // Data state
  const [allMembers, setAllMembers] = useState({ results: [] });
  const [allSubscriptions, setAllSubscriptions] = useState([]);
  const [clubs, setClubs] = useState([]);

  // Fetch all members across all pages
  const fetchAllUsers = async () => {
    try {
      let allResults = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await dispatch(fetchUsers({ page: currentPage })).unwrap();
        const results = Array.isArray(response)
          ? response
          : response.results || response.data || response.members || [];
        if (!Array.isArray(results)) {
          console.error(`Invalid results for members page ${currentPage}:`, results);
          throw new Error("Members results is not an array");
        }

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

  // Fetch all subscriptions across all pages
  const fetchAllSubscriptions = async () => {
    try {
      let allResults = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await dispatch(fetchSubscriptions({ page: currentPage })).unwrap();
        const results = Array.isArray(response)
          ? response
          : response.results || response.data || response.subscriptions || [];
        if (!Array.isArray(results)) {
          console.error(`Invalid results for subscriptions page ${currentPage}:`, results);
          throw new Error("Subscriptions results is not an array");
        }

        allResults = [...allResults, ...results];
        hasMore = !!response.next;
        currentPage += 1;
      }

      return allResults;
    } catch (error) {
      console.error("Failed to fetch all subscriptions:", error.message);
      throw error;
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [subscriptionsResult, membersResult] = await Promise.all([
          fetchAllSubscriptions(),
          fetchAllUsers(),
        ]);
        setAllMembers(membersResult);
        setAllSubscriptions(subscriptionsResult);

        // Extract unique clubs
        const uniqueClubs = Array.from(
          new Map(
            membersResult.results?.map((m) => [
              m.club,
              { club_id: m.club, club_name: m.club_name },
            ]) || []
          ).values()
        );
        setClubs(uniqueClubs);
      } catch (error) {
        console.error("Failed to fetch initial data:", error.message);
        setError("Failed to fetch data. Please try again later: " + error.message);
        toast.error("فشل في تحميل البيانات الأولية");
      } finally {
        setLoading(false);
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

    // Search through all members
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

  // Filter subscriptions based on selected member
  const filteredSubscriptions = React.useMemo(() => {
    if (!foundMember) return [];
    return allSubscriptions.filter(sub => sub.member === foundMember.id);
  }, [allSubscriptions, foundMember]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const receiptData = {
      ...formData,
      club: parseInt(formData.club),
      amount: parseFloat(formData.amount),
      subscription: formData.subscription || null,
    };

    try {
      await dispatch(addReceipt(receiptData)).unwrap();
      await dispatch(fetchReceipts());
      toast.success("تمت إضافة الإيصال بنجاح!");
      onClose();
    } catch (error) {
      console.error("Error adding receipt:", error);
      toast.error(error.message || "حدث خطأ أثناء إضافة الإيصال");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-6 bg-white rounded-lg shadow-md"
      dir="rtl"
    >
      {/* Error Display */}
      {error && <div className="mb-4 text-red-500">{error}</div>}

      {/* Club Selection */}
      <div>
        <label className="block mb-1 font-medium">النادي</label>
        <select
          name="club"
          value={formData.club}
          onChange={(e) =>
            setFormData({
              ...formData,
              club: e.target.value,
              identifier: "",
              subscription: "",
            })
          }
          className="w-full border px-3 py-2 rounded-md"
          required
          disabled={isSubmitting || loading}
        >
          <option value="">-- اختر النادي --</option>
          {clubs.map((club) => (
            <option key={club.club_id} value={club.club_id}>
              {club.club_name}
            </option>
          ))}
        </select>
      </div>

      {/* Member Search */}
      <div>
        <label className="block text-sm font-medium mb-2">
          RFID أو الاسم أو رقم الهاتف
        </label>
        <input
          type="text"
          value={formData.identifier}
          onChange={(e) =>
            setFormData({
              ...formData,
              identifier: e.target.value,
              subscription: "",
            })
          }
          className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="أدخل RFID أو الاسم أو رقم الهاتف"
          disabled={!formData.club || isSubmitting || loading}
        />
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
              ? "لا يوجد عضو مسجل بهذا الكود RFID"
              : "لا يوجد عضو مسجل بهذا الرقم أو الاسم"}
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
                {foundMember.birth_date && (
                  <p>
                    <span className="font-medium">تاريخ الميلاد:</span>{" "}
                    {new Date(foundMember.birth_date).toLocaleDateString("ar-EG")}
                  </p>
                )}
                <p>
                  <span className="font-medium">المهنة:</span> {foundMember.job || "غير متوفر"}
                </p>
                <p>
                  <span className="font-medium">الرقم القومي:</span> {foundMember.national_id || "غير متوفر"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Selection */}
      <div>
        <label className="block mb-1 font-medium">نوع الاشتراك (اختياري)</label>
        <select
          name="subscription"
          value={formData.subscription}
          onChange={(e) =>
            setFormData({ ...formData, subscription: e.target.value })
          }
          className="w-full border px-3 py-2 rounded-md"
          disabled={
            !foundMember ||
            isSubmitting ||
            loading
          }
        >
          <option value="">-- اختر نوع الاشتراك (اختياري) --</option>
          {filteredSubscriptions.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.type_details?.name || "غير محدد"} - {sub.type_details?.price || "0"} جنيها
            </option>
          ))}
        </select>
        {foundMember && filteredSubscriptions.length === 0 && (
          <div className="mt-1 text-xs text-gray-500">
            لا توجد اشتراكات مسجلة لهذا العضو
          </div>
        )}
      </div>

      {/* Amount */}
      <div>
        <label className="block mb-1 font-medium">المبلغ</label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className="w-full border px-3 py-2 rounded-md"
          required
          step="0.01"
          min="0"
          disabled={isSubmitting}
        />
      </div>

      {/* Payment Method */}
      <div>
        <label className="block mb-1 font-medium">طريقة الدفع</label>
        <select
          name="payment_method"
          value={formData.payment_method}
          onChange={(e) =>
            setFormData({ ...formData, payment_method: e.target.value })
          }
          className="w-full border px-3 py-2 rounded-md"
          disabled={isSubmitting}
        >
          <option value="cash">نقدي</option>
          <option value="bank">تحويل بنكي</option>
          <option value="visa">فيزا</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block mb-1 font-medium">ملاحظات</label>
        <textarea
          name="note"
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          rows={3}
          className="w-full border px-3 py-2 rounded-md"
          disabled={isSubmitting}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 space-x-reverse">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
          disabled={isSubmitting}
        >
          إلغاء
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          disabled={
            isSubmitting ||
            !formData.club ||
            !formData.identifier ||
            !formData.amount ||
            loading ||
            !foundMember
          }
        >
          {isSubmitting ? "جاري الإضافة..." : "إضافة إيصال"}
        </button>
      </div>
    </form>
  );
}

export default AddReceiptForm;