import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addReceipt, fetchReceipts } from "../../redux/slices/receiptsSlice";
import { fetchSubscriptions } from "../../redux/slices/subscriptionsSlice";
import { fetchUsers } from "../../redux/slices/memberSlice";
import { toast } from "react-hot-toast";

function AddReceiptForm({ onClose }) {
  const dispatch = useDispatch();
  const { subscriptions, pagination: subscriptionsPagination, status: subscriptionsStatus, error: subscriptionsError } = useSelector(
    (state) => state.subscriptions
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        console.log(`Fetched members page ${currentPage} response:`, response);

        // Handle different response structures
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

      console.log("Total members fetched:", allResults.length);
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
        console.log(`Fetched subscriptions page ${currentPage} response:`, response);

        // Handle different response structures
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

      console.log("Total subscriptions fetched:", allResults.length);
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

        // Debug: Log all fetched data
        console.log("Fetched members:", membersResult.results);
        console.log("Fetched subscriptions:", subscriptionsResult);
        // Debug: Log member with name "matthew gonzalez"
        const targetMember = membersResult.results.find(
          (m) => m.name && m.name.toLowerCase().includes("matthew gonzalez")
        );
        console.log("Member search for 'matthew gonzalez':", targetMember);

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
        console.log("Clubs:", uniqueClubs);
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

  // Filter subscriptions based on selected member (by identifier)
  const filteredSubscriptions = React.useMemo(() => {
    if (!formData.identifier || !allSubscriptions || !allMembers.results) return [];

    const identifier = formData.identifier.trim().toLowerCase();
    const selectedMember = allMembers.results.find(
      (member) =>
        (member.name && member.name.toLowerCase().includes(identifier)) ||
        (member.rfid_code && member.rfid_code.toLowerCase().includes(identifier)) ||
        (member.phone && member.phone.toLowerCase().includes(identifier))
    );

    if (!selectedMember) {
      // Debug: Log when no member is found
      console.log("No member found for identifier:", identifier);
      console.log(
        "Available members:",
        allMembers.results.map((m) => ({
          id: m.id,
          name: m.name,
          rfid_code: m.rfid_code,
          phone: m.phone,
          club: m.club,
        }))
      );
      return [];
    }

    const memberSubscriptions = allSubscriptions.filter(
      (sub) => sub.member === selectedMember.id
    );
    // Debug: Log selected member and subscriptions
    console.log("Selected member:", {
      id: selectedMember.id,
      name: selectedMember.name,
      rfid_code: selectedMember.rfid_code,
      phone: selectedMember.phone,
      club: selectedMember.club,
    });
    console.log(
      "Filtered subscriptions for member",
      selectedMember.id,
      ":",
      memberSubscriptions
    );
    return memberSubscriptions;
  }, [allSubscriptions, formData.identifier, allMembers]);

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
    >
      {/* Error Display */}
      {error && <div className="mb-4 text-red-500">{error}</div>}

      {/* Club Selection (kept for receiptData) */}
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

      {/* Member Selection */}
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
          disabled={isSubmitting || loading}
        />
        {loading && (
          <div className="mt-1 text-xs text-gray-500">جاري تحميل الأعضاء...</div>
        )}
        {formData.identifier && !filteredSubscriptions.length && !loading && (
          <div className="mt-1 text-xs text-red-500">
            لا يوجد عضو متطابق مع هذا المعرف
          </div>
        )}
      </div>

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
            !formData.identifier ||
            isSubmitting ||
            filteredSubscriptions.length === 0 ||
            loading
          }
        >
          <option value="">-- اختر نوع الاشتراك (اختياري) --</option>
          {filteredSubscriptions.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.type_details?.name || "غير محدد"}
            </option>
          ))}
        </select>
        {formData.identifier && filteredSubscriptions.length === 0 && !loading && (
          <div className="mt-1 text-xs text-red-500">
            لا توجد اشتراكات متاحة لهذا العضو
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
            loading
          }
        >
          {isSubmitting ? "جاري الإضافة..." : "إضافة إيصال"}
        </button>
      </div>
    </form>
  );
}

export default AddReceiptForm;