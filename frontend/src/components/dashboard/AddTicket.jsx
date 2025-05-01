import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addTicket, fetchTickets } from "../../redux/slices/ticketsSlice";

const AddTicket = ({ onClose, clubs }) => {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    club: "",
    buyer_name: "",
    ticket_type: "",
    price: "",
    used: false,
    used_by: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "club" || name === "used_by" || name === "price"
          ? Number(value) || ""
          : value,
    }));
    setErrors({ ...errors, [name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.club ||
      !formData.buyer_name ||
      !formData.ticket_type ||
      !formData.price ||
      (formData.used && !formData.used_by)
    ) {
      setErrors({
        club: !formData.club ? "النادي مطلوب" : "",
        buyer_name: !formData.buyer_name ? "اسم المشتري مطلوب" : "",
        ticket_type: !formData.ticket_type ? "نوع التذكرة مطلوب" : "",
        price: !formData.price ? "السعر مطلوب" : "",
        used_by: formData.used && !formData.used_by ? "معرف العضو مطلوب" : "",
      });
      return;
    }

    const ticketData = {
      club: Number(formData.club),
      buyer_name: formData.buyer_name,
      ticket_type: formData.ticket_type,
      price: parseFloat(formData.price),
      used: formData.used,
      used_by: formData.used ? Number(formData.used_by) || null : null,
    };

    try {
      await dispatch(addTicket(ticketData)).unwrap();
      await dispatch(fetchTickets()); // Refresh tickets
      onClose(); // Close modal
    } catch (error) {
      setErrors({
        club: error.club?.[0] || "",
        buyer_name: error.buyer_name?.[0] || "",
        ticket_type: error.ticket_type?.[0] || "",
        price: error.price?.[0] || "",
        used_by: error.used_by?.[0] || "",
        general: error.message || "فشل إضافة التذكرة",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <div>
        <label className="block text-gray-700 font-medium mb-2">النادي</label>
        <select
          name="club"
          value={formData.club}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        >
          <option value="">اختر النادي</option>
          {clubs.length === 0 ? (
            <option value="" disabled>
              لا توجد أندية متاحة
            </option>
          ) : (
            clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))
          )}
        </select>
        {errors.club && (
          <p className="text-red-500 text-xs mt-1">{errors.club}</p>
        )}
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">
          اسم المشتري
        </label>
        <input
          type="text"
          name="buyer_name"
          value={formData.buyer_name}
          onChange={handleChange}
          placeholder="اسم المشتري"
          className="w-full border p-2 rounded"
          required
        />
        {errors.buyer_name && (
          <p className="text-red-500 text-xs mt-1">{errors.buyer_name}</p>
        )}
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">
          نوع التذكرة
        </label>
        <select
          name="ticket_type"
          value={formData.ticket_type}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        >
          <option value="">اختر نوع التذكرة</option>
          <option value="session">جلسة</option>
          <option value="day_pass">تصريح يومي</option>
          <option value="monthly">شهري</option>
        </select>
        {errors.ticket_type && (
          <p className="text-red-500 text-xs mt-1">{errors.ticket_type}</p>
        )}
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">السعر</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          placeholder="السعر"
          className="w-full border p-2 rounded"
          step="0.01"
          required
        />
        {errors.price && (
          <p className="text-red-500 text-xs mt-1">{errors.price}</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="used"
          checked={formData.used}
          onChange={handleChange}
          className="mr-2"
        />
        <label className="text-gray-700 font-medium">مستخدمة</label>
      </div>

      {formData.used && (
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            معرف العضو
          </label>
          <input
            type="number"
            name="used_by"
            value={formData.used_by}
            onChange={handleChange}
            placeholder="معرف العضو"
            className="w-full border p-2 rounded"
            required
          />
          {errors.used_by && (
            <p className="text-red-500 text-xs mt-1">{errors.used_by}</p>
          )}
        </div>
      )}

      {errors.general && (
        <p className="text-red-500 text-sm mt-2">{errors.general}</p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          إلغاء
        </button>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          إضافة التذكرة
        </button>
      </div>
    </form>
  );
};

export default AddTicket;