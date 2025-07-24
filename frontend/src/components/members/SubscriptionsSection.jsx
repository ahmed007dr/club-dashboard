import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMemberSubscriptions,
  requestSubscriptionFreeze,
  cancelSubscriptionFreeze,
  clearFreezeFeedback,
  renewSubscription,
  updateSubscription,
  deleteSubscriptionById,
  makePayment,
} from "@/redux/slices/subscriptionsSlice";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaBoxOpen, FaCalendarAlt, FaMoneyBillAlt, FaCheck, FaPlus, FaExclamation, FaClock, FaDumbbell, FaSwimmer, FaUsers, FaSnowflake } from "react-icons/fa";
import { CiShoppingTag } from "react-icons/ci";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import axios from "axios";
import BASE_URL from "@/config/api";

// إضافة statusStyles لعرض الحالة
const statusStyles = {
  نشط: "bg-green-100 text-green-600",
  منتهي: "bg-red-100 text-red-600",
  قادم: "bg-blue-100 text-blue-600",
  مجمد: "bg-yellow-100 text-yellow-600",
  ملغي: "bg-gray-100 text-gray-600",
  متبقي: "bg-orange-100 text-orange-600",
  "قريب من الانتهاء": "bg-purple-100 text-purple-600",
  "غير معروف": "bg-gray-100 text-gray-600",
};

// Fetch all subscription types (نفس منطق CreateSubscription)
const fetchAllSubscriptionTypes = async () => {
  try {
    const token = localStorage.getItem('token');
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
    return allResults;
  } catch (error) {
    console.error("Failed to fetch all subscription types:", error.message);
    throw error;
  }
};

// Fetch payment methods (نفس منطق CreateSubscription)
const fetchAllPaymentMethods = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${BASE_URL}subscriptions/api/payment-methods/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
      },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Failed to fetch payment methods:', error);
    throw error;
  }
};

// نافذة تجميد الاشتراك
const FreezeModal = ({ subscriptionId, closeModal, dispatch, selectedMember, currentPage }) => {
  const [freezeDays, setFreezeDays] = useState("");
  const [startDate, setStartDate] = useState("");

  const handleFreezeSubmission = () => {
    if (!freezeDays || freezeDays <= 0) {
      dispatch(clearFreezeFeedback(subscriptionId));
      dispatch({
        type: "subscriptions/requestFreeze/rejected",
        payload: { subscriptionId, error: "يجب أن يكون عدد الأيام أكبر من 0" },
      });
      return;
    }
    if (!startDate) {
      dispatch(clearFreezeFeedback(subscriptionId));
      dispatch({
        type: "subscriptions/requestFreeze/rejected",
        payload: { subscriptionId, error: "يجب اختيار تاريخ البدء" },
      });
      return;
    }
    dispatch(
      requestSubscriptionFreeze({
        subscriptionId,
        requestedDays: parseInt(freezeDays, 10),
        startDate,
      })
    ).then(() => {
      dispatch(fetchMemberSubscriptions({ memberId: selectedMember.id, page: currentPage }));
      toast.success("تم تقديم طلب التجميد بنجاح");
    });
    setTimeout(() => {
      dispatch(clearFreezeFeedback(subscriptionId));
    }, 5000);
    closeModal();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" dir="rtl">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FaSnowflake className="text-blue-600" />
          طلب تجميد الاشتراك
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">عدد أيام التجميد</label>
            <Input
              type="number"
              min="1"
              value={freezeDays}
              onChange={(e) => setFreezeDays(e.target.value ? parseInt(e.target.value, 10) : "")}
              placeholder="أدخل عدد الأيام"
              className="text-right"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">تاريخ البدء</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="text-right"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={closeModal} variant="outline">إلغاء</Button>
          <Button onClick={handleFreezeSubmission} className="bg-blue-600 hover:bg-blue-700">تأكيد</Button>
        </div>
      </div>
    </motion.div>
  );
};

// نافذة تجديد الاشتراك
const RenewSubscriptionModal = ({ subscriptionId, closeModal, dispatch, selectedMember, currentPage }) => {
  const [renewData, setRenewData] = useState({
    type: "",
    selectedList: "",
    start_date: "",
    paid_amount: "",
    payment_method: "",
    transaction_id: "",
    notes: "",
  });
  const [allSubscriptionTypes, setAllSubscriptionTypes] = useState([]);
  const [discountedTypes, setDiscountedTypes] = useState([]);
  const [regularTypes, setRegularTypes] = useState([]);
  const [allPaymentMethods, setAllPaymentMethods] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // جلب أنواع الاشتراكات وطرق الدفع
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [subscriptionTypesResult, paymentMethodsResult] = await Promise.all([
          fetchAllSubscriptionTypes(),
          fetchAllPaymentMethods(),
        ]);
        setAllSubscriptionTypes(subscriptionTypesResult);
        setDiscountedTypes(subscriptionTypesResult.filter(type => type.current_discount || type.name.includes('خصم')));
        setRegularTypes(subscriptionTypesResult.filter(type => !type.current_discount && !type.name.includes('خصم')));
        setAllPaymentMethods(paymentMethodsResult);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        toast.error("فشل في تحميل البيانات الأولية");
      }
    };
    fetchInitialData();
  }, []);

  const handleRenewSubmission = async (e) => {
    e.preventDefault();
    if (!renewData.start_date) {
      toast.error("يجب اختيار تاريخ البدء");
      return;
    }
    if (!renewData.paid_amount || parseFloat(renewData.paid_amount) <= 0) {
      toast.error("يجب إدخال مبلغ مدفوع صحيح");
      return;
    }
    if (!renewData.type) {
      toast.error("يجب اختيار نوع الاشتراك");
      return;
    }
    if (!renewData.payment_method) {
      toast.error("يجب اختيار طريقة الدفع");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type: parseInt(renewData.type),
        start_date: renewData.start_date,
        payments: [
          {
            amount: parseFloat(renewData.paid_amount).toFixed(2),
            payment_method_id: parseInt(renewData.payment_method),
            transaction_id: renewData.transaction_id || "",
            notes: renewData.notes || "",
          },
        ],
      };
      const response = await dispatch(
        renewSubscription({ subscriptionId, renewData: payload })
      ).unwrap();
      console.log("handleRenewSubmission - Success Response:", response);
      await dispatch(fetchMemberSubscriptions({ memberId: selectedMember.id, page: currentPage })).unwrap();
      toast.success("تم تجديد الاشتراك بنجاح");
      closeModal();
    } catch (error) {
      console.error("handleRenewSubmission - Error:", error);
      const errorMessage = error?.non_field_errors?.[0] || error?.message || "حدث خطأ أثناء التجديد";
      toast.error(`فشل في تجديد الاشتراك: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRenewData({ ...renewData, [name]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" dir="rtl">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FaCalendarAlt className="text-green-600" />
          تجديد الاشتراك
        </h3>
        <form onSubmit={handleRenewSubmission} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-2">اشتراكات مخفضة</label>
              <select
                name="type"
                value={renewData.selectedList === "discounted" ? renewData.type : ""}
                onChange={(e) =>
                  setRenewData({
                    ...renewData,
                    type: e.target.value,
                    selectedList: e.target.value ? "discounted" : "",
                  })
                }
                className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting || renewData.selectedList === "regular"}
                required={renewData.selectedList === "discounted"}
              >
                <option value="">اختر اشتراك مخفض</option>
                {discountedTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} - {type.discounted_price} جنيه (خصم {type.current_discount || type.name.match(/خصم (\d+%)/)?.[1] || '0'}%)
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-2">اشتراكات عادية</label>
              <select
                name="type"
                value={renewData.selectedList === "regular" ? renewData.type : ""}
                onChange={(e) =>
                  setRenewData({
                    ...renewData,
                    type: e.target.value,
                    selectedList: e.target.value ? "regular" : "",
                  })
                }
                className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting || renewData.selectedList === "discounted"}
                required={renewData.selectedList === "regular"}
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
              value={renewData.start_date}
              onChange={handleInputChange}
              min={new Date().toISOString().split("T")[0]}
              className="text-right"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">المبلغ المدفوع (ج.م)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              name="paid_amount"
              value={renewData.paid_amount}
              onChange={handleInputChange}
              placeholder="أدخل المبلغ المدفوع"
              className="text-right"
              required
            />
            {renewData.type && (
              (() => {
                const type = allSubscriptionTypes.find((t) => t.id.toString() === renewData.type);
                return type ? (
                  <p className="text-sm text-gray-600 mt-1">
                    السعر الكلي: {type.discounted_price || type.price} جنيه
                  </p>
                ) : null;
              })()
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">طريقة الدفع</label>
            <select
              name="payment_method"
              value={renewData.payment_method}
              onChange={handleInputChange}
              className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
              required
            >
              <option value="">اختر طريقة الدفع</option>
              {allPaymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">رقم العملية (اختياري)</label>
            <Input
              type="text"
              name="transaction_id"
              value={renewData.transaction_id}
              onChange={handleInputChange}
              placeholder="أدخل رقم العملية"
              className="text-right"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ملاحظات (اختياري)</label>
            <Input
              type="text"
              name="notes"
              value={renewData.notes}
              onChange={handleInputChange}
              placeholder="أدخل ملاحظات"
              className="text-right"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={closeModal} variant="outline">إلغاء</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
              {isSubmitting ? "جاري التجديد..." : "تأكيد"}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

// نافذة تعديل الاشتراك
const UpdateSubscriptionModal = ({ subscription, closeModal, dispatch, selectedMember, currentPage, coaches }) => {
  const [updatedData, setUpdatedData] = useState({
    type: subscription.type.toString(),
    selectedList: subscription.type_details?.name.includes('خصم') ? "discounted" : "regular",
    start_date: subscription.start_date,
    coach: subscription.coach ? subscription.coach.toString() : "",
    coach_compensation_type: subscription.coach_compensation_type || "",
    coach_compensation_value: subscription.coach_compensation_value || "",
  });
  const [allSubscriptionTypes, setAllSubscriptionTypes] = useState([]);
  const [discountedTypes, setDiscountedTypes] = useState([]);
  const [regularTypes, setRegularTypes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // جلب أنواع الاشتراكات
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const subscriptionTypesResult = await fetchAllSubscriptionTypes();
        setAllSubscriptionTypes(subscriptionTypesResult);
        setDiscountedTypes(subscriptionTypesResult.filter(type => type.current_discount || type.name.includes('خصم')));
        setRegularTypes(subscriptionTypesResult.filter(type => !type.current_discount && !type.name.includes('خصم')));
      } catch (error) {
        console.error("Failed to fetch subscription types:", error);
        toast.error("فشل في تحميل أنواع الاشتراكات");
      }
    };
    fetchInitialData();
  }, []);

  const handleUpdateSubmission = async (e) => {
    e.preventDefault();
    if (!updatedData.type) {
      toast.error("يجب اختيار نوع الاشتراك");
      return;
    }
    if (!updatedData.start_date) {
      toast.error("يجب اختيار تاريخ البدء");
      return;
    }
    if (updatedData.coach && (!updatedData.coach_compensation_type || !updatedData.coach_compensation_value)) {
      toast.error("يجب تحديد نوع وقيمة تعويض الكابتن");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      type: parseInt(updatedData.type),
      start_date: updatedData.start_date,
      coach: updatedData.coach ? parseInt(updatedData.coach) : null,
      coach_compensation_type: updatedData.coach ? updatedData.coach_compensation_type : null,
      coach_compensation_value: updatedData.coach ? parseFloat(updatedData.coach_compensation_value).toFixed(2) : "0.00",
    };
    try {
      const response = await dispatch(updateSubscription({ id: subscription.id, subscriptionData: payload })).unwrap();
      console.log("handleUpdateSubmission - Success Response:", response);
      await dispatch(fetchMemberSubscriptions({ memberId: selectedMember.id, page: currentPage })).unwrap();
      toast.success("تم تعديل الاشتراك بنجاح");
      closeModal();
    } catch (error) {
      console.error("handleUpdateSubmission - Error:", error);
      const errorMessage = error?.non_field_errors?.[0] || error?.message || "حدث خطأ";
      toast.error(`فشل في تعديل الاشتراك: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedData({ ...updatedData, [name]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" dir="rtl">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FaBoxOpen className="text-blue-600" />
          تعديل الاشتراك
        </h3>
        <form onSubmit={handleUpdateSubmission} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-2">اشتراكات مخفضة</label>
              <select
                name="type"
                value={updatedData.selectedList === "discounted" ? updatedData.type : ""}
                onChange={(e) =>
                  setUpdatedData({
                    ...updatedData,
                    type: e.target.value,
                    selectedList: e.target.value ? "discounted" : "",
                  })
                }
                className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting || updatedData.selectedList === "regular"}
                required={updatedData.selectedList === "discounted"}
              >
                <option value="">اختر اشتراك مخفض</option>
                {discountedTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} - {type.discounted_price} جنيه (خصم {type.current_discount || type.name.match(/خصم (\d+%)/)?.[1] || '0'}%)
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-2">اشتراكات عادية</label>
              <select
                name="type"
                value={updatedData.selectedList === "regular" ? updatedData.type : ""}
                onChange={(e) =>
                  setUpdatedData({
                    ...updatedData,
                    type: e.target.value,
                    selectedList: e.target.value ? "regular" : "",
                  })
                }
                className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting || updatedData.selectedList === "discounted"}
                required={updatedData.selectedList === "regular"}
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
              value={updatedData.start_date}
              onChange={handleInputChange}
              className="text-right"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الكابتن</label>
            <select
              name="coach"
              value={updatedData.coach}
              onChange={handleInputChange}
              className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
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
          {updatedData.coach && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">نوع تعويض الكابتن</label>
                <select
                  name="coach_compensation_type"
                  value={updatedData.coach_compensation_type}
                  onChange={handleInputChange}
                  className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="">اختر نوع التعويض</option>
                  <option value="from_subscription">من الاشتراك (نسبة %)</option>
                  <option value="external">خارجي (ج.م)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {updatedData.coach_compensation_type === "from_subscription" ? "نسبة الكابتن (%)" : "مبلغ الكابتن (ج.م)"}
                </label>
                <Input
                  type="number"
                  step={updatedData.coach_compensation_type === "from_subscription" ? "0.1" : "0.01"}
                  min="0"
                  name="coach_compensation_value"
                  value={updatedData.coach_compensation_value}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="text-right"
                  disabled={isSubmitting}
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">الحالة</label>
            <span
              className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusStyles[subscription.status] || statusStyles["غير معروف"]}`}
            >
              {subscription.status}
            </span>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={closeModal} variant="outline">إلغاء</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
              {isSubmitting ? "جاري التعديل..." : "تأكيد"}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

// نافذة إلغاء الاشتراك
const CancelSubscriptionModal = ({ subscription, closeModal, dispatch, selectedMember, currentPage }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancelSubmission = async () => {
    setIsSubmitting(true);
    try {
      const response = await dispatch(deleteSubscriptionById(subscription.id)).unwrap();
      console.log("handleCancelSubmission - Success Response:", response);
      await dispatch(fetchMemberSubscriptions({ memberId: selectedMember.id, page: currentPage })).unwrap();
      toast.success(`تم إلغاء الاشتراك بنجاح. المبلغ المسترد: ${subscription.refund_amount || "0.00"} ج.م`);
      closeModal();
    } catch (error) {
      console.error("handleCancelSubmission - Error:", error);
      const errorMessage = error?.non_field_errors?.[0] || error?.message || "حدث خطأ";
      toast.error(`فشل في إلغاء الاشتراك: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" dir="rtl">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FaExclamation className="text-red-600" />
          تأكيد إلغاء الاشتراك
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          هل أنت متأكد من إلغاء الاشتراك "{subscription.type_details?.name}"؟ <br />
          المبلغ المسترد: {subscription.refund_amount || "0.00"} ج.م
        </p>
        <div className="flex justify-end gap-3">
          <Button onClick={closeModal} variant="outline">إلغاء</Button>
          <Button
            onClick={handleCancelSubmission}
            className="bg-red-600 hover:bg-red-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// المكون الرئيسي
const SubscriptionsSection = ({ selectedMember, setIsAddSubscriptionModalOpen, subscriptionStatus, subscriptionError, coaches }) => {
  const dispatch = useDispatch();
  const { memberSubscriptions, freezeStatus, freezeError, freezeSuccess, cancelStatus } = useSelector((state) => state.subscriptions);
  const [modalOpen, setModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return dateString ? new Date(dateString).toLocaleDateString("ar-EG", options) : "غير متوفر";
  };

  const openFreezeModal = (subscriptionId) => {
    setSelectedSubscriptionId(subscriptionId);
    setModalOpen(true);
  };

  const closeFreezeModal = () => {
    setModalOpen(false);
    setSelectedSubscriptionId(null);
  };

  const openUpdateModal = (subscription) => {
    setSelectedSubscription(subscription);
    setUpdateModalOpen(true);
  };

  const closeUpdateModal = () => {
    setUpdateModalOpen(false);
    setSelectedSubscription(null);
  };

  const openCancelModal = (subscription) => {
    setSelectedSubscription(subscription);
    setCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setCancelModalOpen(false);
    setSelectedSubscription(null);
  };

  const openRenewModal = (subscription) => {
    setSelectedSubscriptionId(subscription.id);
    setRenewModalOpen(true);
  };

  const closeRenewModal = () => {
    setRenewModalOpen(false);
    setSelectedSubscriptionId(null);
  };

  const handleCancelFreeze = (freezeRequestId) => {
    console.log("handleCancelFreeze - Freeze Request ID:", freezeRequestId);
    dispatch(cancelSubscriptionFreeze({ freezeRequestId })).then((action) => {
      if (cancelSubscriptionFreeze.fulfilled.match(action)) {
        dispatch(fetchMemberSubscriptions({ memberId: selectedMember.id, page: currentPage }));
        toast.success("تم إلغاء التجميد بنجاح");
      } else {
        console.error("handleCancelFreeze - Error:", action.payload);
        const errorMessage = action.payload?.non_field_errors?.[0] || action.payload?.message || "حدث خطأ";
        toast.error(`فشل في إلغاء التجميد: ${errorMessage}`);
      }
    });
    setTimeout(() => {
      dispatch(clearFreezeFeedback(freezeRequestId));
    }, 5000);
  };

  const handleMakePayment = (subscriptionId, amount) => {
    const paymentMethodId = prompt("أدخل معرف طريقة الدفع:"); // يمكن استبدالها بنموذج
    console.log("handleMakePayment - Subscription ID:", subscriptionId, "Amount:", amount, "Payment Method ID:", paymentMethodId);
    if (paymentMethodId) {
      dispatch(makePayment({ subscriptionId, amount, paymentMethodId: parseInt(paymentMethodId) })).then((action) => {
        if (makePayment.fulfilled.match(action)) {
          dispatch(fetchMemberSubscriptions({ memberId: selectedMember.id, page: currentPage }));
          toast.success("تم سداد المديونية بنجاح");
        } else {
          console.error("handleMakePayment - Error:", action.payload);
          const errorMessage = action.payload?.non_field_errors?.[0] || action.payload?.message || "حدث خطأ";
          toast.error(`فشل في سداد المديونية: ${errorMessage}`);
        }
      });
    }
  };

  const handleChangeCoach = (subscriptionId) => {
    const newCoachId = prompt("أدخل معرف الكابتن الجديد:"); // يمكن استبدالها بنموذج
    console.log("handleChangeCoach - Subscription ID:", subscriptionId, "New Coach ID:", newCoachId);
    if (newCoachId) {
      dispatch(updateSubscription({ id: subscriptionId, subscriptionData: { coach: parseInt(newCoachId) } })).then((action) => {
        if (updateSubscription.fulfilled.match(action)) {
          dispatch(fetchMemberSubscriptions({ memberId: selectedMember.id, page: currentPage }));
          toast.success("تم تغيير الكابتن بنجاح");
        } else {
          console.error("handleChangeCoach - Error:", action.payload);
          const errorMessage = action.payload?.non_field_errors?.[0] || action.payload?.message || "حدث خطأ";
          toast.error(`فشل في تغيير الكابتن: ${errorMessage}`);
        }
      });
    }
  };

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= Math.ceil((memberSubscriptions?.count || 0) / itemsPerPage)) {
      setCurrentPage(pageNumber);
      dispatch(fetchMemberSubscriptions({ memberId: selectedMember.id, page: pageNumber }));
    }
  };

  const showSubscriptionAttendance = (subscriptionId) => {
    console.log("showSubscriptionAttendance - Subscription ID:", subscriptionId);
    // يمكن إضافة منطق لعرض الحضور هنا
  };

  return (
    <>
      {modalOpen && (
        <FreezeModal
          subscriptionId={selectedSubscriptionId}
          closeModal={closeFreezeModal}
          dispatch={dispatch}
          selectedMember={selectedMember}
          currentPage={currentPage}
        />
      )}
      {updateModalOpen && (
        <UpdateSubscriptionModal
          subscription={selectedSubscription}
          closeModal={closeUpdateModal}
          dispatch={dispatch}
          selectedMember={selectedMember}
          currentPage={currentPage}
          coaches={coaches}
        />
      )}
      {cancelModalOpen && (
        <CancelSubscriptionModal
          subscription={selectedSubscription}
          closeModal={closeCancelModal}
          dispatch={dispatch}
          selectedMember={selectedMember}
          currentPage={currentPage}
        />
      )}
      {renewModalOpen && (
        <RenewSubscriptionModal
          subscriptionId={selectedSubscriptionId}
          closeModal={closeRenewModal}
          dispatch={dispatch}
          selectedMember={selectedMember}
          currentPage={currentPage}
        />
      )}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <FaBoxOpen className="text-blue-600" />
            الاشتراكات
          </CardTitle>
          <Button
            onClick={() => setIsAddSubscriptionModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!selectedMember}
          >
            <FaPlus className="mr-2" />
            إضافة اشتراك
          </Button>
        </CardHeader>
        <CardContent>
          {subscriptionStatus === "loading" ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
            </div>
          ) : subscriptionError ? (
            <div className="bg-red-50 p-4 rounded-lg text-red-600 flex items-center gap-2">
              <FaExclamation />
              خطأ: {subscriptionError}
            </div>
          ) : memberSubscriptions?.results?.length > 0 ? (
            <>
              <div className="space-y-4">
                {memberSubscriptions.results.map((sub) => {
                  const activeFreeze = Array.isArray(sub.freeze_requests)
                    ? sub.freeze_requests.find((fr) => fr.is_active)
                    : null;
                  const today = new Date().toISOString().split("T")[0];
                  const isActive = sub.start_date <= today && sub.end_date >= today && !sub.is_cancelled && sub.status !== "مجمد" && sub.status !== "ملغي";
                  return (
                    <motion.div
                      key={sub.id}
                      className="border rounded-lg p-4 bg-white shadow-sm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">الاشتراك</p>
                          <p className="font-medium flex items-center gap-2">
                            <CiShoppingTag className="text-blue-600" />
                            {sub.type_details?.name || "غير معروف"}
                          </p>
                          <p className="text-sm text-gray-500">RFID: {sub.member_details?.rfid_code || "غير متوفر"}</p>
                          <p className="text-sm text-gray-500">المدة: {sub.type_details?.duration_days} يوم</p>
                          <p className="text-sm text-gray-500">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusStyles[sub.status] || statusStyles["غير معروف"]}`}>
                              {sub.status}
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">التواريخ</p>
                          <p className="flex items-center gap-2">
                            <FaCalendarAlt className="text-blue-600" />
                            بداية: {formatDate(sub.start_date)}
                          </p>
                          <p className="flex items-center gap-2">
                            <FaCalendarAlt className="text-blue-600" />
                            نهاية: {formatDate(sub.end_date)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">الدفع</p>
                          <p className="flex items-center gap-2">
                            <FaMoneyBillAlt className="text-blue-600" />
                            السعر: {sub.type_details?.price || 0} ج.م
                          </p>
                          <p className="flex items-center gap-2">
                            <FaCheck className="text-blue-600" />
                            المدفوع: {sub.paid_amount || 0} ج.م
                          </p>
                          <p className={`flex items-center gap-2 ${parseFloat(sub.remaining_amount || 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                            <FaExclamation className="text-blue-600" />
                            المتبقي: {sub.remaining_amount || 0} ج.م
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">التفاصيل</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-600">
                              <FaClock className="ml-1" />
                              الدخول: {sub.entry_count || 0}/{sub.type_details?.max_entries || "∞"}
                            </span>
                            {sub.type_details?.includes_pool && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-600">
                                <FaSwimmer className="ml-1" />
                                حمام السباحة
                              </span>
                            )}
                            {sub.type_details?.includes_gym && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-600">
                                <FaDumbbell className="ml-1" />
                                صالة الألعاب
                              </span>
                            )}
                            {sub.type_details?.includes_classes && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-600">
                                <FaUsers className="ml-1" />
                                الحصص التدريبية
                              </span>
                            )}
                          </div>
                          {activeFreeze ? (
                            <div className="mt-2 text-yellow-600 flex items-center gap-2">
                              <FaSnowflake />
                              مجمد ({activeFreeze.requested_days} يوم) من {formatDate(activeFreeze.start_date)}
                            </div>
                          ) : (
                            <p className="mt-2 text-gray-500">غير مجمد</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button
                          onClick={() => showSubscriptionAttendance(sub.id)}
                          className="bg-gray-600 hover:bg-gray-700"
                        >
                          عرض مرات الدخول
                        </Button>
                        {isActive && !activeFreeze && (
                          <Button
                            onClick={() => openFreezeModal(sub.id)}
                            disabled={freezeStatus[sub.id] === "loading"}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {freezeStatus[sub.id] === "loading" ? "جاري التجميد..." : "تجميد"}
                          </Button>
                        )}
                        {activeFreeze && (
                          <Button
                            onClick={() => handleCancelFreeze(activeFreeze.id)}
                            disabled={cancelStatus[activeFreeze.id] === "loading"}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {cancelStatus[activeFreeze.id] === "loading" ? "جاري الإلغاء..." : "إلغاء التجميد"}
                          </Button>
                        )}
                        {isActive && (
                          <>
                            <Button
                              onClick={() => openRenewModal(sub)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              تجديد الاشتراك
                            </Button>
                            <Button
                              onClick={() => openUpdateModal(sub)}
                              className="bg-yellow-600 hover:bg-yellow-700"
                            >
                              تعديل الاشتراك
                            </Button>
                            <Button
                              onClick={() => openCancelModal(sub)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              إلغاء الاشتراك
                            </Button>
                            {parseFloat(sub.remaining_amount) > 0 && (
                              <Button
                                onClick={() => handleMakePayment(sub.id, parseFloat(sub.remaining_amount))}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                سداد المديونية
                              </Button>
                            )}
                            {sub.coach && (
                              <Button
                                onClick={() => handleChangeCoach(sub.id)}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                تغيير الكابتن
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                      {freezeSuccess[sub.id] && (
                        <p className="text-green-600 text-sm mt-2">{freezeSuccess[sub.id]}</p>
                      )}
                      {freezeError[sub.id] && (
                        <p className="text-red-600 text-sm mt-2">خطأ: {freezeError[sub.id].error || "حدث خطأ"}</p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              {memberSubscriptions?.count > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                  <div className="text-sm text-gray-600">
                    عرض {(currentPage - 1) * itemsPerPage + 1} إلى{" "}
                    {Math.min(currentPage * itemsPerPage, memberSubscriptions.count)} من {memberSubscriptions.count}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="outline"
                    >
                      السابق
                    </Button>
                    {Array.from({ length: Math.ceil((memberSubscriptions?.count || 0) / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        onClick={() => paginate(page)}
                        variant={currentPage === page ? "default" : "outline"}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === Math.ceil((memberSubscriptions?.count || 0) / itemsPerPage)}
                      variant="outline"
                    >
                      التالي
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center py-6">
              <FaBoxOpen className="text-gray-300 text-6xl mb-4" />
              <p className="text-gray-500">لم يتم العثور على اشتراكات لهذا العضو</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default SubscriptionsSection;
