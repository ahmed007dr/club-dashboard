import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addReceipt, fetchReceipts } from "../../redux/slices/receiptsSlice";

function AddReceiptForm({ onClose, clubs }) {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    club: "",
    member: "",
    subscription: "",
    amount: "",
    payment_method: "cash",
    note: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const receiptData = {
      ...formData,
      club: parseInt(formData.club) || null,
      member: parseInt(formData.member) || null,
      subscription: formData.subscription || null,
      amount: parseFloat(formData.amount) || 0,
    };

    try {
      await dispatch(addReceipt(receiptData)).unwrap();
      await dispatch(fetchReceipts());
      onClose();
    } catch (error) {
      console.error("Error adding receipt:", error);
      // Optional: Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} dir="rtl" className="space-y-4">
      {/* Club Field */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">النادي</label>
        <select
          name="club"
          value={formData.club}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        >
          <option value="">اختر النادي</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      {/* Member Field */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">العضو</label>
        <input
          type="number"
          name="member"
          value={formData.member}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      {/* Subscription Field */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">الإشتراك</label>
        <input
          type="text"
          name="subscription"
          value={formData.subscription}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* Amount Field */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">المبلغ</label>
        <input
          type="text"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      {/* Payment Method Field */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">طريقة الدفع</label>
        <select
          name="payment_method"
          value={formData.payment_method}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="cash">Cash</option>
          <option value="bank">Bank Transfer</option>
          <option value="visa">Visa</option>
        </select>
      </div>

      {/* Note Field */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">ملاحظة</label>
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows={4}
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          إلغاء
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          disabled={isSubmitting}
        >
          {isSubmitting ? "جاري الإضافة..." : "إضافة الإيصال"}
        </button>
      </div>
    </form>
  );
}

export default AddReceiptForm;