import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { postSubscription, fetchMemberSubscriptions } from "@/redux/slices/subscriptionsSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaPlus } from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";
import BASE_URL from "@/config/api";

const AddSubscriptionModal = ({ selectedMember, userClub, coaches, setIsAddSubscriptionModalOpen }) => {
  const dispatch = useDispatch();
  const { paymentMethods, specialOffers } = useSelector((state) => state.subscriptions);
  const [newSubscription, setNewSubscription] = useState({
    type: "",
    selectedList: "",
    start_date: new Date().toISOString().split("T")[0],
    coach: "",
    coach_compensation_type: "from_subscription",
    coach_compensation_value: "0",
    special_offer: "",
    payments: [{ amount: "", payment_method_id: "", transaction_id: "", notes: "" }],
  });
  const [allSubscriptionTypes, setAllSubscriptionTypes] = useState([]);
  const [discountedTypes, setDiscountedTypes] = useState([]);
  const [regularTypes, setRegularTypes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // سجل للتحقق من طرق الدفع
  useEffect(() => {
    console.log("paymentMethods:", paymentMethods);
  }, [paymentMethods]);

  // جلب أنواع الاشتراكات
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem("token");
        let allResults = [];
        let currentPage = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await axios.get(
            `${BASE_URL}subscriptions/api/subscription-types/?page=${currentPage}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Cache-Control": "no-cache",
              },
            }
          );
          const results = Array.isArray(response.data.results) ? response.data.results : [];
          allResults = [...allResults, ...results];
          hasMore = !!response.data.next;
          currentPage += 1;
        }

        setAllSubscriptionTypes(allResults);
        setDiscountedTypes(allResults.filter(type => type.current_discount || type.name.includes('خصم')));
        setRegularTypes(allResults.filter(type => !type.current_discount && !type.name.includes('خصم')));
      } catch (error) {
        console.error("Failed to fetch subscription types:", error);
        setErrorMessage("فشل في تحميل أنواع الاشتراكات");
        setIsModalOpen(true);
      }
    };
    fetchInitialData();
  }, []);

  const handleAddSubscription = async (e) => {
    e.preventDefault();
    if (!selectedMember || !userClub) {
      setErrorMessage("الرجاء اختيار عضو وتأكد من وجود نادي مرتبط");
      setIsModalOpen(true);
      return;
    }
    const { type, start_date, coach, coach_compensation_type, coach_compensation_value, special_offer, payments } = newSubscription;
    if (!type || !start_date || !payments[0].amount || !payments[0].payment_method_id) {
      setErrorMessage("يرجى ملء جميع الحقول المطلوبة");
      setIsModalOpen(true);
      return;
    }
    const paidAmount = parseFloat(payments[0].amount) || 0;
    if (isNaN(paidAmount) || paidAmount < 0) {
      setErrorMessage("المبلغ المدفوع يجب أن يكون رقمًا صحيحًا وغير سالب");
      setIsModalOpen(true);
      return;
    }
    const paymentMethodId = parseInt(payments[0].payment_method_id);
    if (isNaN(paymentMethodId)) {
      setErrorMessage("يرجى اختيار طريقة دفع صالحة");
      setIsModalOpen(true);
      return;
    }
    const selectedType = allSubscriptionTypes.find((t) => t.id.toString() === type.toString());
    if (!selectedType) {
      setErrorMessage("نوع الاشتراك المحدد غير موجود");
      setIsModalOpen(true);
      return;
    }
    if (coach && (!coach_compensation_type || isNaN(parseFloat(coach_compensation_value)) || parseFloat(coach_compensation_value) < 0)) {
      setErrorMessage("يرجى تحديد نوع تعويض الكابتن وقيمة صالحة");
      setIsModalOpen(true);
      return;
    }
    if (coach_compensation_type === "from_subscription" && parseFloat(coach_compensation_value) > 100) {
      setErrorMessage("نسبة الكابتن لا يمكن أن تتجاوز 100%");
      setIsModalOpen(true);
      return;
    }

    setIsSubmitting(true);
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

    try {
      const response = await dispatch(postSubscription(payload)).unwrap();
      toast.success("تم إضافة الاشتراك بنجاح");
      setNewSubscription({
        type: "",
        selectedList: "",
        start_date: new Date().toISOString().split("T")[0],
        coach: "",
        coach_compensation_type: "from_subscription",
        coach_compensation_value: "0",
        special_offer: "",
        payments: [{ amount: "", payment_method_id: "", transaction_id: "", notes: "" }],
      });
      await dispatch(fetchMemberSubscriptions({ memberId: selectedMember.id, page: 1 })).unwrap();
      setIsAddSubscriptionModalOpen(false);
    } catch (error) {
      let errorData = error?.non_field_errors?.[0] || error?.message || "حدث خطأ غير متوقع";
      setErrorMessage(errorData);
      setIsModalOpen(true);
    } finally {
      setIsSubmitting(false);
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
  const handleSubscriptionInputChange = (e) => {
    const { name, value } = e.target;
  
    // الصيغة المتوقعة: payment-field-<index>-<field_name>
    if (name.startsWith("payment-field-")) {
      const parts = name.split("-");
      const index = parseInt(parts[2]);
      const field = parts.slice(3).join("-");  // يدعم أسماء مثل payment_method_id
  
      const updatedPayments = [...newSubscription.payments];
      updatedPayments[index] = {
        ...updatedPayments[index],
        [field]: field === "payment_method_id" ? (value ? parseInt(value) : "") : value,
      };
  
      setNewSubscription({ ...newSubscription, payments: updatedPayments });
    } else {
      setNewSubscription({ ...newSubscription, [name]: value });
    }
  };
    return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl shadow-2xl" dir="rtl">
        {isModalOpen && (
          <div className="fixed top-1/4 left-0 right-0 flex items-start justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full max-h-[70vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4">حدث خطأ</h3>
              <p className="text-red-600">{errorMessage}</p>
              <div className="mt-4 flex justify-end gap-2">
                <Button onClick={() => setIsModalOpen(false)} variant="destructive">
                  إغلاق
                </Button>
              </div>
            </div>
          </div>
        )}
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FaPlus className="text-blue-600" />
          إضافة اشتراك جديد
        </h3>
        <form onSubmit={handleAddSubscription} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-2">اشتراكات مخفضة</label>
              <select
                name="type"
                value={newSubscription.selectedList === "discounted" ? newSubscription.type : ""}
                onChange={(e) =>
                  setNewSubscription({
                    ...newSubscription,
                    type: e.target.value,
                    selectedList: e.target.value ? "discounted" : "",
                  })
                }
                className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting || newSubscription.selectedList === "regular"}
                required={newSubscription.selectedList === "discounted"}
              >
                <option value="">اختر اشتراك مخفض</option>
                {discountedTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} - {type.discounted_price} جنيه (خصم {type.current_discount || type.name.match(/خصم (\d+%)/)?.[1] || "0"}%)
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-2">اشتراكات عادية</label>
              <select
                name="type"
                value={newSubscription.selectedList === "regular" ? newSubscription.type : ""}
                onChange={(e) =>
                  setNewSubscription({
                    ...newSubscription,
                    type: e.target.value,
                    selectedList: e.target.value ? "regular" : "",
                  })
                }
                className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting || newSubscription.selectedList === "discounted"}
                required={newSubscription.selectedList === "regular"}
              >
                <option value="">اختر اشتراك عادي</option>
                {regularTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} - {type.price} جنيه
                  </option>
                ))}
              </select>
            </div>
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
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الكابتن</label>
            <select
              name="coach"
              value={newSubscription.coach}
              onChange={handleSubscriptionInputChange}
              className="w-full border border-gray-300 rounded-lg py-2 px-3 text-right"
              disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
              disabled={isSubmitting}
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
                  name={`payment-field-${index}-amount`}
                  value={payment.amount}
                  onChange={handleSubscriptionInputChange}
                  placeholder="المبلغ"
                  className="text-right"
                  required
                  disabled={isSubmitting}
                  />

                </div>
                <div className="flex-1">
                  <select
                    name={`payment-field-${index}-payment_method_id`}
                    value={payment.payment_method_id}
                    onChange={handleSubscriptionInputChange}
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 text-right"
                    required
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                </div>
                {newSubscription.payments.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removePaymentField(index)}
                    variant="destructive"
                    className="px-2 py-1"
                    disabled={isSubmitting}
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
              disabled={isSubmitting}
            >
              <FaPlus className="mr-2" />
              إضافة دفعة
            </Button>
          </div>
          {newSubscription.type && (
            <div className="col-span-2">
              <p className="text-sm text-gray-600">
                السعر الكلي: {allSubscriptionTypes.find((t) => t.id.toString() === newSubscription.type)?.discounted_price || allSubscriptionTypes.find((t) => t.id.toString() === newSubscription.type)?.price} جنيه
              </p>
            </div>
          )}
          <div className="col-span-2 flex justify-end gap-3">
            <Button
              type="button"
              onClick={() => setIsAddSubscriptionModalOpen(false)}
              variant="outline"
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting || !newSubscription.type}
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
                <>
                  <FaPlus className="mr-2" />
                  إضافة الاشتراك
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AddSubscriptionModal;