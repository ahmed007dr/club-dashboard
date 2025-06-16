import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSubscriptionTypes, postSubscription, fetchSubscriptions } from "../../redux/slices/subscriptionsSlice";
import { Button } from "@/components/ui/button";
import { FaUser } from 'react-icons/fa';
import axios from 'axios';
import BASE_URL from '../../config/api';
import { toast } from "react-hot-toast";
import debounce from 'lodash/debounce';

const CreateSubscription = ({ onClose }) => {
  const dispatch = useDispatch();
  const { subscriptionTypes } = useSelector((state) => state.subscriptions);

  // Form state
  const [formData, setFormData] = useState({
    identifier: "",
    type: "",
    selectedList: "",
    start_date: "",
    paid_amount: "",
    coach: "",
    coach_compensation_type: "from_subscription",
    coach_compensation_value: "0",
    payment_method: "",
    transaction_id: "",
    notes: "",
  });

  // Data state
  const [allSubscriptionTypes, setAllSubscriptionTypes] = useState([]);
  const [discountedTypes, setDiscountedTypes] = useState([]);
  const [regularTypes, setRegularTypes] = useState([]);
  const [allCoaches, setAllCoaches] = useState([]);
  const [allPaymentMethods, setAllPaymentMethods] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [foundMember, setFoundMember] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userClub, setUserClub] = useState(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch user club
  useEffect(() => {
    fetch(`${BASE_URL}accounts/api/profile/`, {
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
      })
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
        toast.error("فشل في تحميل بيانات النادي");
      });
  }, []);

  // Fetch payment methods
  const fetchAllPaymentMethods = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}subscriptions/api/payment-methods/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('❌ Failed to fetch payment methods:', error);
      throw error;
    }
  };

  const fetchAllCoaches = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      let allCoaches = [];
      let nextUrl = `${BASE_URL}accounts/api/users/`;
      
      while (nextUrl) {
        const response = await axios.get(nextUrl, { headers });
        allCoaches = [...allCoaches, ...response.data.results];
        nextUrl = response.data.next;
      }
      
      const coaches = allCoaches.filter(user => user.role === 'coach');
      return coaches;
    } catch (error) {
      console.error('❌ Failed to fetch all coaches:', error);
      throw error;
    }
  };

  const fetchAllSubscriptionTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      let allResults = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await axios.get(
          `${BASE_URL}subscriptions/api/subscription-types/?page=${currentPage}`,
          { headers: { Authorization: `Bearer ${token}` } }
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

  // دالة البحث عن عضو بناءً على identifier
  const searchMember = useCallback(async (identifier, clubId) => {
    if (!identifier || !clubId) {
      setFoundMember(null);
      setSearchLoading(false);
      return;
    }

    try {
      setSearchLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BASE_URL}members/api/members/?search=${encodeURIComponent(identifier)}&club=${clubId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const members = Array.isArray(response.data.results) ? response.data.results : [];
      const member = members.length > 0 ? members[0] : null;

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
          national_id: member.national_id,
        });
      } else {
        setFoundMember(null);
      }
    } catch (error) {
      console.error("Failed to search member:", error.message);
      toast.error("فشل في البحث عن العضو");
      setFoundMember(null);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounce لتأخير البحث
  const debouncedSearch = useCallback(
    debounce((identifier, clubId) => {
      searchMember(identifier, clubId);
    }, 500),
    [searchMember]
  );

  // البحث عن العضو بناءً على identifier
  useEffect(() => {
    if (!formData.identifier || !userClub) {
      setFoundMember(null);
      return;
    }

    debouncedSearch(formData.identifier.trim(), userClub.id);
  }, [formData.identifier, userClub, debouncedSearch]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [subscriptionTypesResult, coachesResult, paymentMethodsResult] = await Promise.all([
          fetchAllSubscriptionTypes(),
          fetchAllCoaches(),
          fetchAllPaymentMethods(),
        ]);

        setAllSubscriptionTypes(subscriptionTypesResult);
        const discounted = subscriptionTypesResult.filter(type => type.current_discount);
        const regular = subscriptionTypesResult.filter(type => !type.current_discount);

        setDiscountedTypes(discounted);
        setRegularTypes(regular);
        setAllCoaches(coachesResult);
        setAllPaymentMethods(paymentMethodsResult);
      } catch (error) {
        setErrorMessage("فشل في تحميل البيانات الأولية");
        setIsModalOpen(true);
      } finally {
        setIsInitialLoad(false);
      }
    };

    fetchInitialData();
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { identifier, type, start_date, paid_amount, coach, coach_compensation_type, coach_compensation_value, payment_method, transaction_id, notes } = formData;

    if (!userClub || !identifier || !type || !start_date || !paid_amount || !payment_method) {
      setErrorMessage("يرجى ملء جميع الحقول المطلوبة، بما في ذلك طريقة الدفع");
      setIsModalOpen(true);
      return;
    }

    const paidAmount = parseFloat(paid_amount) || 0;
    if (isNaN(paidAmount) || paidAmount < 0) {
      setErrorMessage("المبلغ المدفوع يجب أن يكون رقمًا صحيحًا وغير سالب");
      setIsModalOpen(true);
      return;
    }

    const paymentMethodId = parseInt(payment_method);
    if (isNaN(paymentMethodId)) {
      setErrorMessage("يرجى اختيار طريقة دفع صالحة");
      setIsModalOpen(true);
      return;
    }

    const selectedType = allSubscriptionTypes.find(t => t.id.toString() === type.toString());
    if (!selectedType) {
      setErrorMessage("نوع الاشتراك المحدد غير موجود");
      setIsModalOpen(true);
      return;
    }

    if (coach && (!coach_compensation_type || isNaN(parseFloat(coach_compensation_value)) || parseFloat(coach_compensation_value) < 0)) {
      setErrorMessage("يرجى تحديد نوع تعويض الكابتن وقيمة صالحة غير سالبة");
      setIsModalOpen(true);
      return;
    }

    if (coach_compensation_type === 'from_subscription' && parseFloat(coach_compensation_value) > 100) {
      setErrorMessage("نسبة الكابتن لا يمكن أن تتجاوز 100%");
      setIsModalOpen(true);
      return;
    }

    setIsSubmitting(true);

    const payload = {
      club: userClub.id,
      identifier,
      type: parseInt(type),
      start_date,
      coach: coach ? parseInt(coach) : null,
      coach_compensation_type: coach ? coach_compensation_type : null,
      coach_compensation_value: coach ? parseFloat(coach_compensation_value).toFixed(2) : "0.00",
      payments: [{
        amount: paidAmount.toFixed(2),
        payment_method_id: paymentMethodId,
        transaction_id: transaction_id || "",
        notes: notes || "",
      }],
    };

    try {
      const response = await dispatch(postSubscription(payload)).unwrap();
      toast.success("تم إنشاء الاشتراك بنجاح!");
      await dispatch(fetchSubscriptions({ page: 1, pageSize: 20, searchTerm: "", clubName: "", startDate: "", endDate: "", entryCount: "", status: "" })).unwrap();
      setFormData({
        identifier: "",
        type: "",
        selectedList: "",
        start_date: "",
        paid_amount: "",
        coach: "",
        coach_compensation_type: "from_subscription",
        coach_compensation_value: "0",
        payment_method: "",
        transaction_id: "",
        notes: "",
      });
      setFoundMember(null);
      setIsModalOpen(false); // إغلاق الـ pop-up إذا كان مفتوحًا
      onClose();
    } catch (error) {
      console.log('Error:', error); // للتصحيح
      const errorMsg = error.payload?.message || "حدث خطأ غير متوقع أثناء إنشاء الاشتراك";
      setErrorMessage(errorMsg);
      setIsModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container w-full mx-auto p-4" dir="rtl">
      <h2 className="text-xl font-bold mb-6">إنشاء اشتراك جديد</h2>

      {isModalOpen && (
        <div className="fixed top-1/4 left-0 right-0 flex items-start justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full max-h-[70vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">حدث خطأ</h3>
            <p className="text-red-600">{errorMessage}</p>
            <div className="mt-4 flex justify-end gap-2">
              {errorMessage.includes("مدفوعات مستحقة") && foundMember && (
                <Button
                  onClick={() => window.location.href = `/member/${foundMember.id}/payments`}
                  variant="outline"
                >
                  تسوية المدفوعات
                </Button>
              )}
              <Button onClick={() => setIsModalOpen(false)} variant="destructive">
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-2/3 min-w-0">
            <div className="space-y-4">
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
                  disabled={isSubmitting}
                  required
                />
              </div>

              {searchLoading && (
                <div className="text-center py-2">
                  <p>جاري البحث عن العضو...</p>
                </div>
              )}

              {formData.identifier && !foundMember && !searchLoading && (
                <div className="text-red-500 text-sm">
                  <p>لا يوجد عضو مسجل بهذا الاسم، الهاتف، أو RFID</p>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium mb-2">اشتراكات مخفضة</label>
                  <select
                    value={formData.selectedList === "discounted" ? formData.type : ""}
                    onChange={(e) => 
                      setFormData({ 
                        ...formData, 
                        type: e.target.value, 
                        selectedList: e.target.value ? "discounted" : ""
                      })
                    }
                    className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting || !foundMember || formData.selectedList === "regular"}
                    required={formData.selectedList === "discounted"}
                  >
                    <option value="">اختر اشتراك مخفض</option>
                    {discountedTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} - {type.discounted_price} جنيه (خصم {type.current_discount}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium mb-2">اشتراكات عادية</label>
                  <select
                    value={formData.selectedList === "regular" ? formData.type : ""}
                    onChange={(e) => 
                      setFormData({ 
                        ...formData, 
                        type: e.target.value, 
                        selectedList: e.target.value ? "regular" : ""
                      })
                    }
                    className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting || !foundMember || formData.selectedList === "discounted"}
                    required={formData.selectedList === "regular"}
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

              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium mb-2">المدرب</label>
                  <select
                    value={formData.coach}
                    onChange={(e) => setFormData({ ...formData, coach: e.target.value })}
                    className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting || !foundMember}
                  >
                    <option value="">اختر مدربًا</option>
                    {allCoaches.map((coach) => (
                      <option key={coach.id} value={coach.id}>
                        {coach.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium mb-2">طريقة الدفع</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting || !foundMember}
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
              </div>

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
                    required
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
                    required
                  />
                  {formData.type && (
                    (() => {
                      const type = allSubscriptionTypes.find(t => t.id.toString() === formData.type);
                      return type ? (
                        <p className="text-sm text-gray-600 mt-1">
                          السعر الكلي: {type.discounted_price || type.price} جنيه
                        </p>
                      ) : null;
                    })()
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium mb-2">رقم العملية (اختياري)</label>
                  <input
                    type="text"
                    value={formData.transaction_id || ""}
                    onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                    className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل رقم العملية"
                    disabled={isSubmitting || !foundMember}
                  />
                </div>
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium mb-2">ملاحظات (اختياري)</label>
                  <input
                    type="text"
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل ملاحظات"
                    disabled={isSubmitting || !foundMember}
                  />
                </div>
              </div>

              {formData.coach && (
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/2">
                    <label className="block text-sm font-medium mb-2">نوع تعويض الكابتن</label>
                    <select
                      value={formData.coach_compensation_type}
                      onChange={(e) =>
                        setFormData({ ...formData, coach_compensation_type: e.target.value })
                      }
                      className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting || !foundMember}
                    >
                      <option value="from_subscription">من داخل قيمة الاشتراك (نسبة %)</option>
                      <option value="external">مبلغ خارجي (جنيه)</option>
                    </select>
                  </div>

                  <div className="w-full md:w-1/2">
                    <label className="block text-sm font-medium mb-2">
                      {formData.coach_compensation_type === 'from_subscription' ? 'نسبة الكابتن (%)' : 'مبلغ الكابتن (جنيه)'}
                    </label>
                    <input
                      type="number"
                      step={formData.coach_compensation_type === 'from_subscription' ? "0.1" : "0.01"}
                      min="0"
                      value={formData.coach_compensation_value}
                      onChange={(e) =>
                        setFormData({ ...formData, coach_compensation_value: e.target.value })
                      }
                      className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      disabled={isSubmitting || !foundMember}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="w-full lg:w-1/3 max-w-xs shrink-0">
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
                  <div className="flex-1 space-y-1 text-sm">
                    <h3 className="font-bold text-lg">{foundMember.name}</h3>
                    <p className="text-gray-600">#{foundMember.membership_number}</p>
                    <p><span className="font-medium">الهاتف:</span> {foundMember.phone || "غير متوفر"}</p>
                    <p><span className="font-medium">RFID:</span> {foundMember.rfid_code || "غير مسجل"}</p>
                    <p><span className="font-medium">النادي:</span> {foundMember.club_name}</p>
                    <p><span className="font-medium">العنوان:</span> {foundMember.address || "غير متوفر"}</p>
                    <p><span className="font-medium">الرقم القومي:</span> {foundMember.national_id || "غير متوفر"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full mt-6"
          disabled={isSubmitting || !foundMember || !formData.type || !formData.payment_method}
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
