import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { postSubscription, fetchMemberSubscriptions } from "@/redux/slices/subscriptionsSlice";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaPlus } from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const AddSubscriptionModal = ({ selectedMember, userClub, coaches, setIsAddSubscriptionModalOpen }) => {
  const dispatch = useDispatch();
  const { activeSubscriptionTypes, paymentMethods, specialOffers } = useSelector((state) => state.subscriptions);
  const [newSubscription, setNewSubscription] = useState({
    type: "",
    start_date: new Date().toISOString().split("T")[0],
    coach: "",
    coach_compensation_type: "",
    coach_compensation_value: "",
    special_offer: "",
    payments: [{ amount: "", payment_method_id: "", transaction_id: "", notes: "" }],
  });

  const handleAddSubscription = async (e) => {
    e.preventDefault();
    console.log("handleAddSubscription - Input Data:", newSubscription);
    console.log("handleAddSubscription - selectedMember:", selectedMember);
    console.log("handleAddSubscription - userClub:", userClub);

    if (!selectedMember || !userClub) {
      toast.error("الرجاء اختيار عضو وتأكد من وجود نادي مرتبط");
      console.error("handleAddSubscription - Validation Failed: No selectedMember or userClub");
      return;
    }
    const { type, start_date, coach, coach_compensation_type, coach_compensation_value, special_offer, payments } = newSubscription;
    if (!type || !start_date || !payments[0].amount || !payments[0].payment_method_id) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      console.error("handleAddSubscription - Validation Failed: Missing required fields", { type, start_date, payments });
      return;
    }
    const paidAmount = parseFloat(payments[0].amount) || 0;
    if (isNaN(paidAmount) || paidAmount < 0) {
      toast.error("المبلغ المدفوع يجب أن يكون رقمًا صحيحًا وغير سالب");
      console.error("handleAddSubscription - Validation Failed: Invalid paidAmount", paidAmount);
      return;
    }
    const paymentMethodId = parseInt(payments[0].payment_method_id);
    if (isNaN(paymentMethodId)) {
      toast.error("يرجى اختيار طريقة دفع صالحة");
      console.error("handleAddSubscription - Validation Failed: Invalid paymentMethodId", paymentMethodId);
      return;
    }
    const selectedType = activeSubscriptionTypes.find((t) => t.id.toString() === type.toString());
    if (!selectedType) {
      toast.error("نوع الاشتراك المحدد غير موجود");
      console.error("handleAddSubscription - Validation Failed: Invalid subscription type", type);
      return;
    }
    if (coach && (!coach_compensation_type || isNaN(parseFloat(coach_compensation_value)) || parseFloat(coach_compensation_value) < 0)) {
      toast.error("يرجى تحديد نوع تعويض الكابتن وقيمة صالحة");
      console.error("handleAddSubscription - Validation Failed: Invalid coach compensation", { coach_compensation_type, coach_compensation_value });
      return;
    }
    if (coach_compensation_type === "from_subscription" && parseFloat(coach_compensation_value) > 100) {
      toast.error("نسبة الكابتن لا يمكن أن تتجاوز 100%");
      console.error("handleAddSubscription - Validation Failed: Coach compensation percentage exceeds 100%", coach_compensation_value);
      return;
    }
    const payload = {
      club: userClub.id,
      identifier: selectedMember.rfid_code || selectedMember.phone || selectedMember.name,
      type: parseInt(type),
      start_date,
      coach: coach ? parseInt(coach) : null,
      coach_compensation_type: coach ? coach_compensation_type : null,
      coach_compensation_value: coach ? parseFloat(coach_compensation_value).toFixed(2) : "0.00",
      special_offer: special_offer ? parseInt(special_offer) : null,
      payments: payments.map((payment) => ({
        amount: parseFloat(payment.amount).toFixed(2),
        payment_method_id: parseInt(payment.payment_method_id),
        transaction_id: payment.transaction_id || "",
        notes: payment.notes || "",
      })),
    };
    console.log("handleAddSubscription - Payload to postSubscription:", payload);

    try {
      const response = await dispatch(postSubscription(payload)).unwrap();
      console.log("handleAddSubscription - Success Response:", response);
      toast.success("تم إضافة الاشتراك بنجاح");
      setNewSubscription({
        type: "",
        start_date: new Date().toISOString().split("T")[0],
        coach: "",
        coach_compensation_type: "",
        coach_compensation_value: "",
        special_offer: "",
        payments: [{ amount: "", payment_method_id: "", transaction_id: "", notes: "" }],
      });
      setIsAddSubscriptionModalOpen(false);
      const fetchResponse = await dispatch(fetchMemberSubscriptions({ memberId: selectedMember.id, page: 1 })).unwrap();
      console.log("handleAddSubscription - fetchMemberSubscriptions Response:", fetchResponse);
    } catch (error) {
      const errorMessage = error?.message || Object.values(error).flat().join(", ") || "حدث خطأ غير متوقع";
      console.error("handleAddSubscription - Error:", error);
      toast.error(`فشل في إضافة الاشتراك: ${errorMessage}`);
    }
  };

  const addPaymentField = () => {
    setNewSubscription({
      ...newSubscription,
      payments: [...newSubscription.payments, { amount: "", payment_method_id: "", transaction_id: "", notes: "" }],
    });
  };

  const removePaymentField = (index) => {
    setNewSubscription({
      ...newSubscription,
      payments: newSubscription.payments.filter((_, i) => i !== index),
    });
  };

  const handleSubscriptionInputChange = (e, index) => {
    const { name, value } = e.target;
    if (name.startsWith("payment_")) {
      const paymentField = name.split("_")[1];
      const updatedPayments = [...newSubscription.payments];
      updatedPayments[index] = { ...updatedPayments[index], [paymentField]: value };
      setNewSubscription({ ...newSubscription, payments: updatedPayments });
    } else {
      setNewSubscription({ ...newSubscription, [name]: value });
    }
    console.log("handleSubscriptionInputChange - Updated newSubscription:", newSubscription);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl shadow-2xl" dir="rtl">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FaPlus className="text-blue-600" />
          إضافة اشتراك جديد
        </h3>
        <form onSubmit={handleAddSubscription} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">نوع الاشتراك</label>
            <select
              name="type"
              value={newSubscription.type}
              onChange={handleSubscriptionInputChange}
              className="w-full border border-gray-300 rounded-lg py-2 px-3 text-right"
              required
            >
              <option value="">اختر نوع الاشتراك</option>
              {activeSubscriptionTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} - {type.discounted_price || type.price} ج.م
                </option>
              ))}
            </select>
            {newSubscription.type && (
              <p className="text-sm text-gray-600 mt-1">
                السعر الكلي: {activeSubscriptionTypes.find((t) => t.id.toString() === newSubscription.type)?.discounted_price || activeSubscriptionTypes.find((t) => t.id.toString() === newSubscription.type)?.price} ج.م
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">تاريخ البدء</label>
            <Input
              type="date"
              name="start_date"
              value={newSubscription.start_date}
              onChange={handleSubscriptionInputChange}
              min={new Date().toISOString().split("T")[0]}
              className="text-right"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الكابتن</label>
            <select
              name="coach"
              value={newSubscription.coach}
              onChange={handleSubscriptionInputChange}
              className="w-full border border-gray-300 rounded-lg py-2 px-3 text-right"
            >
              <option value="">بدون كابتن</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.first_name && coach.last_name ? `${coach.first_name} ${coach.last_name}` : coach.username}
                </option>
              ))}
            </select>
          </div>
          {newSubscription.coach && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">نوع تعويض الكابتن</label>
                <select
                  name="coach_compensation_type"
                  value={newSubscription.coach_compensation_type}
                  onChange={handleSubscriptionInputChange}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 text-right"
                >
                  <option value="">اختر نوع التعويض</option>
                  <option value="from_subscription">من الاشتراك (نسبة %)</option>
                  <option value="external">خارجي (ج.م)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {newSubscription.coach_compensation_type === "from_subscription" ? "نسبة الكابتن (%)" : "مبلغ الكابتن (ج.م)"}
                </label>
                <Input
                  type="number"
                  step={newSubscription.coach_compensation_type === "from_subscription" ? "0.1" : "0.01"}
                  min="0"
                  name="coach_compensation_value"
                  value={newSubscription.coach_compensation_value}
                  onChange={handleSubscriptionInputChange}
                  placeholder="0.00"
                  className="text-right"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">العرض الخاص</label>
            <select
              name="special_offer"
              value={newSubscription.special_offer}
              onChange={handleSubscriptionInputChange}
              className="w-full border border-gray-300 rounded-lg py-2 px-3 text-right"
            >
              <option value="">بدون عرض خاص</option>
              {specialOffers.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.name} ({offer.discount_percentage}% خصم)
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">الدفعات</label>
            {newSubscription.payments.map((payment, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    name={`payment_amount_${index}`}
                    value={payment.amount}
                    onChange={(e) => handleSubscriptionInputChange(e, index)}
                    placeholder="المبلغ"
                    className="text-right"
                    required
                  />
                </div>
                <div className="flex-1">
                  <select
                    name={`payment_method_id_${index}`}
                    value={payment.payment_method_id}
                    onChange={(e) => handleSubscriptionInputChange(e, index)}
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 text-right"
                    required
                  >
                    <option value="">اختر طريقة الدفع</option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <Input
                    type="text"
                    name={`payment_transaction_id_${index}`}
                    value={payment.transaction_id}
                    onChange={(e) => handleSubscriptionInputChange(e, index)}
                    placeholder="معرف المعاملة (اختياري)"
                    className="text-right"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="text"
                    name={`payment_notes_${index}`}
                    value={payment.notes}
                    onChange={(e) => handleSubscriptionInputChange(e, index)}
                    placeholder="ملاحظات (اختياري)"
                    className="text-right"
                  />
                </div>
                {newSubscription.payments.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removePaymentField(index)}
                    variant="destructive"
                    className="px-2 py-1"
                  >
                    إزالة
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              onClick={addPaymentField}
              variant="outline"
              className="mt-2"
            >
              <FaPlus className="mr-2" />
              إضافة دفعة
            </Button>
          </div>
          <div className="col-span-2 flex justify-end gap-3">
            <Button
              type="button"
              onClick={() => setIsAddSubscriptionModalOpen(false)}
              variant="outline"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FaPlus className="mr-2" />
              إضافة الاشتراك
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AddSubscriptionModal;