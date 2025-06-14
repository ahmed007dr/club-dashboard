
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSubscriptionTypes, postSubscription, fetchSubscriptions } from "../../redux/slices/subscriptionsSlice";
import { fetchUsers } from "../../redux/slices/memberSlice";
import { Button } from "@/components/ui/button";
import { FaUser } from 'react-icons/fa';
import axios from 'axios';
import BASE_URL from '../../config/api';
import { toast } from "react-hot-toast";

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
    coach: "",
    coach_compensation_type: "from_subscription",
    coach_compensation_value: "0",
    payment_method: "",
    feature: "", // لتحديد الميزة (جيم، ألعاب قتالية، سباحة)
  });

  // Data state
  const [clubs, setClubs] = useState([]);
  const [allMembers, setAllMembers] = useState({ results: [] });
  const [allSubscriptionTypes, setAllSubscriptionTypes] = useState([]);
  const [filteredSubscriptionTypes, setFilteredSubscriptionTypes] = useState([]); // لفلترة أنواع الاشتراكات بناءً على الميزة
  const [allCoaches, setAllCoaches] = useState([]);
  const [allPaymentMethods, setAllPaymentMethods] = useState([]);
  const [allFeatures, setAllFeatures] = useState([]);
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
        setFormData(prev => ({
          ...prev,
          club: data.club.id.toString()
        }));
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

  // Fetch features
  const fetchAllFeatures = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}subscriptions/api/features/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('❌ Failed to fetch features:', error);
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

  const fetchAllMembers = async () => {
    try {
      let allResults = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await dispatch(fetchUsers({ page: currentPage })).unwrap();
        const results = Array.isArray(response) ? response : response.results || [];
        allResults = [...allResults, ...results];
        hasMore = !!response.next;
        currentPage += 1;
      }

      return { results: allResults };
    } catch (error) {
      console.error("Failed to fetch all members:", error.message);
      throw error;
    }
  };

  const fetchAllSubscriptionTypes = async () => {
    try {
      let allResults = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await dispatch(fetchSubscriptionTypes({ page: currentPage })).unwrap();
        const results = Array.isArray(response.results) ? response.results : [];
        allResults = [...allResults, ...results];
        hasMore = !!response.next;
        currentPage += 1;
      }

      return allResults;
    } catch (error) {
      console.error("Failed to fetch all subscription types:", error.message);
      throw error;
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [membersResult, subscriptionTypesResult, coachesResult, paymentMethodsResult, featuresResult] = await Promise.all([
          fetchAllMembers(),
          fetchAllSubscriptionTypes(),
          fetchAllCoaches(),
          fetchAllPaymentMethods(),
          fetchAllFeatures(),
        ]);

        const uniqueClubs = Array.from(
          new Map(
            membersResult.results.map((m) => [
              m.club,
              { club_id: m.club, club_name: m.club_name },
            ])
          ).values()
        );

        setClubs(uniqueClubs);
        setAllMembers(membersResult);
        setAllSubscriptionTypes(subscriptionTypesResult);
        setFilteredSubscriptionTypes(subscriptionTypesResult); // تعيين القائمة الأولية
        setAllCoaches(coachesResult);
        setAllPaymentMethods(paymentMethodsResult);
        setAllFeatures(featuresResult);
      } catch (error) {
        setErrorMessage("فشل في تحميل البيانات الأولية");
        setIsModalOpen(true);
      } finally {
        setIsInitialLoad(false);
      }
    };

    fetchInitialData();
  }, [dispatch]);

  // Filter subscription types based on selected feature
  useEffect(() => {
    if (formData.feature) {
      const filteredTypes = allSubscriptionTypes.filter(type =>
        type.features.some(feature => feature.id.toString() === formData.feature)
      );
      setFilteredSubscriptionTypes(filteredTypes);
      // إعادة تعيين نوع الاشتراك إذا لم يكن موجودًا في القائمة المفلترة
      if (formData.type && !filteredTypes.find(type => type.id.toString() === formData.type)) {
        setFormData(prev => ({ ...prev, type: "" }));
      }
    } else {
      setFilteredSubscriptionTypes(allSubscriptionTypes);
    }
  }, [formData.feature, allSubscriptionTypes]);

  useEffect(() => {
    if (!formData.identifier || !formData.club) {
      setFoundMember(null);
      return;
    }

    const searchValue = formData.identifier.trim().toUpperCase();
    setSearchLoading(true);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { club, identifier, type, start_date, paid_amount, coach, coach_compensation_type, coach_compensation_value, payment_method } = formData;

    if (!club || !identifier || !type || !start_date || !paid_amount || !payment_method) {
      setErrorMessage("يرجى ملء جميع الحقول المطلوبة");
      setIsModalOpen(true);
      return;
    }

    if (isNaN(parseFloat(paid_amount))) {
      setErrorMessage("المبلغ المدفوع يجب أن يكون رقمًا صحيحًا");
      setIsModalOpen(true);
      return;
    }

    const selectedType = allSubscriptionTypes.find(t => t.id.toString() === type.toString());
    if (!selectedType) {
      setErrorMessage("نوع الاشتراك المحدد غير موجود");
      setIsModalOpen(true);
      return;
    }
    if (parseFloat(paid_amount) > parseFloat(selectedType.price)) {
      setErrorMessage("المبلغ المدفوع لا يمكن أن يتجاوز سعر الاشتراك");
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
      club: parseInt(club),
      identifier,
      type: parseInt(type),
      start_date,
      paid_amount: parseFloat(paid_amount),
      coach: coach ? parseInt(coach) : null,
      coach_compensation_type: coach ? coach_compensation_type : null,
      coach_compensation_value: coach ? parseFloat(coach_compensation_value) : 0,
      payments: [{
        amount: parseFloat(paid_amount),
        payment_method: parseInt(payment_method),
      }],
    };

    try {
      await dispatch(postSubscription(payload)).unwrap();
      toast.success("تم إنشاء الاشتراك بنجاح!");

      await dispatch(
        fetchSubscriptions({
          page: 1,
          pageSize: 20,
          searchTerm: "",
          clubName: "",
          startDate: "",
          endDate: "",
          entryCount: "",
          status: ""
        })
      ).unwrap();

      setFormData({
        club: userClub?.id?.toString() || "",
        identifier: "",
        type: "",
        start_date: "",
        paid_amount: "",
        coach: "",
        coach_compensation_type: "from_subscription",
        coach_compensation_value: "0",
        payment_method: "",
        feature: "",
      });
      setFoundMember(null);
      onClose();
    } catch (error) {
      console.error("Error creating subscription:", JSON.stringify(error, null, 2));
      const errorData = error || {};
      setErrorMessage(
        errorData?.non_field_errors?.[0] ||
        errorData?.message ||
        error.message ||
        "حدث خطأ غير متوقع"
      );
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
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setIsModalOpen(false)} variant="destructive">
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 w-full">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full flex-1">
            <div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium mb-2">النادي</label>
                  <select
                    name="club"
                    value={formData.club}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        club: e.target.value,
                        identifier: "",
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right text-sm"
                    disabled={!userClub || isSubmitting}
                    required
                  >
                    {userClub ? (
                      <option value={userClub.id}>{userClub.name}</option>
                    ) : (
                      <option value="">جاري التحميل...</option>
                    )}
                  </select>
                </div>

                <div className="w-full md:w-1/2">
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
                    required
                  />
                </div>
              </div>

              {searchLoading && (
                <div className="text-center py-2">
                  <p>جاري البحث عن العضو...</p>
                </div>
              )}

              {formData.identifier && !foundMember && !searchLoading && (
                <div className="text-red-500 text-sm">
                  <p>
                    {formData.identifier.match(/[A-Za-z]/)
                      ? "لا يوجد عضو مسجل بهذا الكود RFID في النادي المحدد"
                      : "لا يوجد عضو مسجل بهذا الرقم أو الاسم في النادي المحدد"}
                  </p>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium mb-2">نوع النشاط</label>
                  <select
                    value={formData.feature}
                    onChange={(e) => setFormData({ ...formData, feature: e.target.value })}
                    className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting || !foundMember}
                  >
                    <option value="">اختر نوع النشاط</option>
                    {allFeatures.map((feature) => (
                      <option key={feature.id} value={feature.id}>
                        {feature.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium mb-2">نوع الاشتراك</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting || !foundMember}
                    required
                  >
                    <option value="">اختر النوع</option>
                    {filteredSubscriptionTypes
                      .filter((type) => type.club_details.id.toString() === formData.club?.toString())
                      .map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name} - {type.price} جنيها
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
          <div>
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
                      <p>
                        <span className="font-medium">الرقم القومي:</span> {foundMember.national_id || "غير متوفر"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full mt-6"
          disabled={isSubmitting || !foundMember}
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
