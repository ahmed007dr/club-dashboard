
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  searchMember,
  addMember,
} from "@/redux/slices/memberSlice";
import {
  fetchMemberSubscriptions,
  requestSubscriptionFreeze,
  cancelSubscriptionFreeze,
  clearFreezeFeedback,
  fetchActiveSubscriptionTypes,
  fetchPaymentMethods,
  fetchSpecialOffers,
  postSubscription,
} from "@/redux/slices/subscriptionsSlice";
import { fetchAttendances } from "@/redux/slices/AttendanceSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FaUser,
  FaCalendarAlt,
  FaCheck,
  FaExclamation,
  FaMoneyBillAlt ,
  FaClock,
  FaDumbbell,
  FaSwimmer,
  FaUsers,
  FaSnowflake,
  FaBoxOpen,
  FaSearch,
  FaPlus,
} from "react-icons/fa";
import { CiShoppingTag } from "react-icons/ci";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import usePermission from "@/hooks/usePermission";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import BASE_URL from "@/config/api";

// دالة debounce لتأخير البحث
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const MemberProfile = () => {
  const dispatch = useDispatch();
  const canViewMembers = usePermission("view_member");
  const canAddSubscription = usePermission("add_subscription");
  const canAddMember = usePermission("add_member");
  const { 
    member: { items: members, pagination }, 
    subscriptions: { 
      memberSubscriptions, 
      activeSubscriptionTypes, 
      paymentMethods, 
      specialOffers, 
      status: subscriptionStatus, 
      error: subscriptionError, 
      freezeStatus, 
      freezeError, 
      freezeSuccess, 
      cancelStatus 
    },
    attendance: { data: attendances, loading: attendanceLoading, error: attendanceError, count: attendanceCount }
  } = useSelector((state) => state);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(null);
  const [freezeDays, setFreezeDays] = useState("");
  const [startDate, setStartDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [attendancePage, setAttendancePage] = useState(1);
  const [isAddSubscriptionModalOpen, setIsAddSubscriptionModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [selectedSubscriptionAttendance, setSelectedSubscriptionAttendance] = useState(null);
  const [newSubscription, setNewSubscription] = useState({
    type: "",
    start_date: new Date().toISOString().split("T")[0],
    coach: "",
    coach_compensation_type: "",
    coach_compensation_value: "",
    special_offer: "",
    payments: [{ amount: "", payment_method_id: "" }],
  });
  const [newMember, setNewMember] = useState({
    name: "",
    phone: "",
    club: "",
    national_id: "",
    birth_date: "",
    referred_by: "",
    rfid_code: "",
    job: "",
    address: "",
    note: "",
    photo: null,
    gender: "",
  });
  const [coaches, setCoaches] = useState([]);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [memberErrors, setMemberErrors] = useState(null);
  const [userClub, setUserClub] = useState(null);
  const itemsPerPage = 20;

  // جلب بيانات النادي
  useEffect(() => {
    const fetchUserClub = async () => {
      try {
        const response = await axios.get(`${BASE_URL}accounts/api/profile/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setUserClub({ id: response.data.club.id, name: response.data.club.name });
        setNewMember((prev) => ({ ...prev, club: response.data.club.id }));
      } catch (err) {
        toast.error("فشل في جلب بيانات النادي");
      }
    };
    fetchUserClub();
  }, []);

  // جلب أنواع الاشتراكات، طرق الدفع، العروض الخاصة، والكباتن
  useEffect(() => {
    if (canAddSubscription) {
      dispatch(fetchActiveSubscriptionTypes());
      dispatch(fetchPaymentMethods());
      dispatch(fetchSpecialOffers());
      const fetchCoaches = async () => {
        try {
          const response = await axios.get(`${BASE_URL}accounts/api/users/`, {
            params: { role: "coach", is_active: true },
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
          setCoaches(response.data.results || []);
        } catch (error) {
          toast.error("فشل في جلب قائمة الكباتن");
        }
      };
      fetchCoaches();
    }
  }, [dispatch, canAddSubscription]);

  // البحث عن عضو مع تأخير
  const searchMemberDebounced = useCallback(
    debounce(async (query) => {
      setIsLoading(true);
      try {
        if (query.trim() === "") {
          setSelectedMember(null);
          await dispatch(fetchUsers({ page: 1 })).unwrap();
        } else {
          const result = await dispatch(searchMember({ query, page: 1 })).unwrap();
          if (result.results.length > 0) {
            setSelectedMember(result.results[0]);
            dispatch(fetchMemberSubscriptions({ memberId: result.results[0].id, page: 1 }));
            dispatch(fetchAttendances({ 
              page: 1, 
              pageSize: itemsPerPage, 
              member_name: result.results[0].name,
              rfid_code: result.results[0].rfid_code 
            }));
          } else {
            toast.error("لم يتم العثور على عضو مطابق");
            setSelectedMember(null);
          }
        }
      } catch (err) {
        toast.error(`فشل في البحث: ${err.message || "حدث خطأ"}`);
      } finally {
        setIsLoading(false);
      }
    }, 1000),
    [dispatch]
  );

  // التعامل مع تغيير حقل البحث
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchMemberDebounced(query);
  };

  // إعادة تعيين البحث
  const handleReset = () => {
    setSearchQuery("");
    setSelectedMember(null);
    setCurrentPage(1);
    setAttendancePage(1);
    setShowAttendance(false);
    setSelectedSubscriptionAttendance(null);
    dispatch(fetchUsers({ page: 1 }));
  };

  // فتح/إغلاق نافذة التجميد
  const openModal = (subscriptionId) => {
    setSelectedSubscriptionId(subscriptionId);
    setFreezeDays("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedSubscriptionId(null);
    setFreezeDays("");
    setStartDate("");
  };

  // تقديم طلب التجميد
  const handleFreezeSubmission = () => {
    if (!freezeDays || freezeDays <= 0) {
      dispatch(clearFreezeFeedback(selectedSubscriptionId));
      dispatch({
        type: "subscriptions/requestFreeze/rejected",
        payload: { subscriptionId: selectedSubscriptionId, error: "يجب أن يكون عدد الأيام أكبر من 0" },
      });
      return;
    }
    if (!startDate) {
      dispatch(clearFreezeFeedback(selectedSubscriptionId));
      dispatch({
        type: "subscriptions/requestFreeze/rejected",
        payload: { subscriptionId: selectedSubscriptionId, error: "يجب اختيار تاريخ البدء" },
      });
      return;
    }
    dispatch(
      requestSubscriptionFreeze({
        subscriptionId: selectedSubscriptionId,
        requestedDays: parseInt(freezeDays, 10),
        startDate,
      })
    ).then(() => {
      dispatch(fetchMemberSubscriptions({ memberId: selectedMember.id, page: currentPage }));
      toast.success("تم تقديم طلب التجميد بنجاح");
    });
    setTimeout(() => {
      dispatch(clearFreezeFeedback(selectedSubscriptionId));
    }, 5000);
    closeModal();
  };

  // إلغاء التجميد
  const handleCancelFreeze = (freezeRequestId) => {
    dispatch(cancelSubscriptionFreeze({ freezeRequestId })).then((action) => {
      if (cancelSubscriptionFreeze.fulfilled.match(action)) {
        dispatch(fetchMemberSubscriptions({ memberId: selectedMember.id, page: currentPage }));
        toast.success("تم إلغاء التجميد بنجاح");
      }
    });
    setTimeout(() => {
      dispatch(clearFreezeFeedback(freezeRequestId));
    }, 5000);
  };

  // التعامل مع إضافة اشتراك جديد
  const handleAddSubscription = async (e) => {
    e.preventDefault();
    if (!selectedMember || !userClub) {
      toast.error("الرجاء اختيار عضو وتأكد من وجود نادي مرتبط");
      return;
    }
    const { type, start_date, paid_amount, coach, coach_compensation_type, coach_compensation_value, payment_method, transaction_id, notes, special_offer } = newSubscription;
    if (!type || !start_date || !paid_amount || !payment_method) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    const paidAmount = parseFloat(paid_amount) || 0;
    if (isNaN(paidAmount) || paidAmount < 0) {
      toast.error("المبلغ المدفوع يجب أن يكون رقمًا صحيحًا وغير سالب");
      return;
    }
    const paymentMethodId = parseInt(payment_method);
    if (isNaN(paymentMethodId)) {
      toast.error("يرجى اختيار طريقة دفع صالحة");
      return;
    }
    const selectedType = activeSubscriptionTypes.find((t) => t.id.toString() === type.toString());
    if (!selectedType) {
      toast.error("نوع الاشتراك المحدد غير موجود");
      return;
    }
    if (coach && (!coach_compensation_type || isNaN(parseFloat(coach_compensation_value)) || parseFloat(coach_compensation_value) < 0)) {
      toast.error("يرجى تحديد نوع تعويض الكابتن وقيمة صالحة");
      return;
    }
    if (coach_compensation_type === 'from_subscription' && parseFloat(coach_compensation_value) > 100) {
      toast.error("نسبة الكابتن لا يمكن أن تتجاوز 100%");
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
      payments: [
        {
          amount: paidAmount.toFixed(2),
          payment_method_id: paymentMethodId,
          transaction_id: transaction_id || "",
          notes: notes || "",
        },
      ],
    };
    try {
      await dispatch(postSubscription(payload)).unwrap();
      toast.success("تم إضافة الاشتراك بنجاح");
      setNewSubscription({
        type: "",
        start_date: new Date().toISOString().split("T")[0],
        coach: "",
        coach_compensation_type: "",
        coach_compensation_value: "",
        special_offer: "",
        payments: [{ amount: "", payment_method_id: "" }],
      });
      setIsAddSubscriptionModalOpen(false);
      dispatch(fetchMemberSubscriptions({ memberId: selectedMember.id, page: 1 }));
    } catch (error) {
      toast.error(`فشل في إضافة الاشتراك: ${error.message || "حدث خطأ"}`);
    }
  };

  // إضافة دفعة جديدة في النموذج
  const addPaymentField = () => {
    setNewSubscription({
      ...newSubscription,
      payments: [...newSubscription.payments, { amount: "", payment_method_id: "" }],
    });
  };

  // إزالة دفعة من النموذج
  const removePaymentField = (index) => {
    setNewSubscription({
      ...newSubscription,
      payments: newSubscription.payments.filter((_, i) => i !== index),
    });
  };

  // تحديث بيانات نموذج الاشتراك
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
  };

  // تحديث بيانات نموذج العضو
  const handleMemberInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      const file = files[0] || null;
      setNewMember((prev) => ({ ...prev, photo: file }));
      if (file) {
        const reader = new FileReader();
        reader.onload = () => setPhotoPreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setPhotoPreview(null);
      }
    } else {
      setNewMember((prev) => ({ ...prev, [name]: value }));

    }
  };

  // إزالة صورة العضو
  const handleRemovePhoto = () => {
    setNewMember((prev) => ({ ...prev, photo: null }));
    setPhotoPreview(null);
  };

  // إرسال نموذج إضافة عضو
  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberErrors(null);
    if (!newMember.name || !newMember.phone || !newMember.club || !newMember.gender) {
      setMemberErrors({ form: ["الاسم، رقم الهاتف، النادي، والجنس مطلوبة."] });
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    const form = new FormData();
    form.append("name", newMember.name);
    form.append("phone", newMember.phone);
    form.append("club", newMember.club);
    form.append("gender", newMember.gender);
    if (newMember.national_id) form.append("national_id", newMember.national_id);
    if (newMember.birth_date) form.append("birth_date", newMember.birth_date);
    if (newMember.referred_by) form.append("referred_by", newMember.referred_by);
    if (newMember.rfid_code) form.append("rfid_code", newMember.rfid_code);
    if (newMember.job) form.append("job", newMember.job);
    if (newMember.address) form.append("address", newMember.address);
    if (newMember.note) form.append("note", newMember.note);
    if (newMember.photo) form.append("photo", newMember.photo);
    try {
      const result = await dispatch(addMember(form)).unwrap();
      toast.success("تم إضافة العضو بنجاح!");
      setIsAddMemberModalOpen(false);
      setNewMember({
        name: "",
        phone: "",
        club: userClub?.id || "",
        national_id: "",
        birth_date: "",
        referred_by: "",
        rfid_code: "",
        job: "",
        address: "",
        note: "",
        photo: null,
        gender: "",
      });
      setPhotoPreview(null);
      dispatch(fetchUsers({ page: 1 }));
    } catch (error) {
      setMemberErrors(error);
      toast.error(
        typeof error === "string"
          ? error
          : Object.values(error).flat().join(", ") || "فشل في إضافة العضو"
      );
    }
  };

  // عرض حضور اشتراك معين
  const showSubscriptionAttendance = (subscriptionId) => {
    setSelectedSubscriptionAttendance(subscriptionId);
    setShowAttendance(true);
    setAttendancePage(1);
    dispatch(fetchAttendances({ 
      page: 1, 
      pageSize: itemsPerPage, 
      member_name: selectedMember.name,
      rfid_code: selectedMember.rfid_code,
      subscription: subscriptionId 
    }));
  };

  // تنسيق التاريخ
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return dateString ? new Date(dateString).toLocaleDateString("ar-EG", options) : "غير متوفر";
  };

  // تنسيق الساعة
  const formatTime = (timeString) => {
    return timeString ? new Date(`1970-01-01T${timeString}`).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) : "غير متوفر";
  };

  // التصفح
  const totalPages = Math.ceil((memberSubscriptions?.count || 0) / itemsPerPage);
  const totalAttendancePages = Math.ceil((attendanceCount || 0) / itemsPerPage);
  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      if (selectedMember) {
        dispatch(fetchMemberSubscriptions({ memberId: selectedMember.id, page: pageNumber }));
      }
    }
  };
  const paginateAttendance = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalAttendancePages) {
      setAttendancePage(pageNumber);
      if (selectedMember) {
        dispatch(fetchAttendances({ 
          page: pageNumber, 
          pageSize: itemsPerPage, 
          member_name: selectedMember.name,
          rfid_code: selectedMember.rfid_code,
          subscription: selectedSubscriptionAttendance 
        }));
      }
    }
  };

  // التحقق من الصلاحيات
  if (!canViewMembers) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-6" dir="rtl">
        <FaExclamation className="text-red-600 text-5xl mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">لا يوجد صلاحية</h2>
        <p className="text-gray-600 max-w-md">
          ليس لديك الصلاحيات اللازمة لعرض بيانات الأعضاء. تواصل مع المسؤول.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 max-w-7xl mx-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* حقل البحث */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <FaSearch className="text-blue-600" />
              البحث عن عضو
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="ابحث بالاسم، رقم العضوية، أو كود RFID"
                  className="pr-10 py-2 text-right"
                />
              </div>
              {canAddMember && (
                <Button
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <FaPlus className="mr-2" />
                  إضافة عضو جديد
                </Button>
              )}
              <Button onClick={handleReset} variant="outline">
                إعادة تعيين
              </Button>
            </div>
            {isLoading && (
              <div className="flex justify-center mt-4">
                <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* عرض البيانات إذا تم العثور على عضو */}
        <AnimatePresence>
          {selectedMember && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* السيرة الذاتية */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <FaUser className="text-blue-600" />
                    السيرة الذاتية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <img
                      src={selectedMember.photo || "https://via.placeholder.com/150"}
                      alt="member"
                      className="w-32 h-32 rounded-full object-cover shadow-md"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                      {[
                        { label: "الاسم", value: selectedMember.name },
                        { label: "رقم العضوية", value: selectedMember.membership_number },
                        { label: "كود RFID", value: selectedMember.rfid_code || "غير متوفر" },
                        { label: "الرقم القومي", value: selectedMember.national_id },
                        { label: "رقم الهاتف", value: selectedMember.phone },
                        { label: "رقم الهاتف الثانوي", value: selectedMember.phone2 || "غير متوفر" },
                        { label: "الجنس", value: selectedMember.gender === "M" ? "ذكر" : selectedMember.gender === "F" ? "أنثى" : "غير محدد" },
                        { label: "الوظيفة", value: selectedMember.job || "غير متوفر" },
                        { label: "العنوان", value: selectedMember.address || "غير متوفر" },
                        { label: "اسم النادي", value: selectedMember.club_name },
                        { label: "ملاحظات", value: selectedMember.note || "لا توجد ملاحظات" },
                        { label: "عدد الاشتراكات", value: memberSubscriptions?.count || 0 },
                      ].map((field, index) => (
                        <div key={index} className="flex flex-col">
                          <span className="text-sm text-gray-500">{field.label}</span>
                          <span className="font-medium">{field.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* جدول الحضور */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <FaCalendarAlt className="text-blue-600" />
                    سجل الحضور
                  </CardTitle>
                  <Button
                    onClick={() => {
                      setShowAttendance(!showAttendance);
                      if (!showAttendance) {
                        setSelectedSubscriptionAttendance(null);
                        dispatch(fetchAttendances({ 
                          page: 1, 
                          pageSize: itemsPerPage, 
                          member_name: selectedMember.name,
                          rfid_code: selectedMember.rfid_code 
                        }));
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {showAttendance ? "إخفاء الحضور" : "إظهار الحضور"}
                  </Button>
                </CardHeader>
                <CardContent>
                  {showAttendance && (
                    <>
                      {attendanceLoading ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
                        </div>
                      ) : attendanceError ? (
                        <div className="bg-red-50 p-4 rounded-lg text-red-600 flex items-center gap-2">
                          <FaExclamation />
                          خطأ: {attendanceError}
                        </div>
                      ) : attendances?.length > 0 ? (
                        <>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    نوع الاشتراك
                                  </th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    تاريخ الحضور
                                  </th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ساعة الحضور
                                  </th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    اسم الكابتن
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {attendances.slice((attendancePage - 1) * itemsPerPage, attendancePage * itemsPerPage).map((attendance) => (
                                  <tr key={attendance.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {attendance.subscription_details?.type_details?.name || "غير متوفر"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {formatDate(attendance.attendance_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {formatTime(attendance.entry_time)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {attendance.subscription_details?.coach_details?.username || "غير متوفر"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {totalAttendancePages > 1 && (
                            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                              <div className="text-sm text-gray-600">
                                عرض {(attendancePage - 1) * itemsPerPage + 1} إلى{" "}
                                {Math.min(attendancePage * itemsPerPage, attendanceCount)} من {attendanceCount}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => paginateAttendance(attendancePage - 1)}
                                  disabled={attendancePage === 1}
                                  variant="outline"
                                >
                                  السابق
                                </Button>
                                {Array.from({ length: totalAttendancePages }, (_, i) => i + 1).map((page) => (
                                  <Button
                                    key={page}
                                    onClick={() => paginateAttendance(page)}
                                    variant={attendancePage === page ? "default" : "outline"}
                                  >
                                    {page}
                                  </Button>
                                ))}
                                <Button
                                  onClick={() => paginateAttendance(attendancePage + 1)}
                                  disabled={attendancePage === totalAttendancePages}
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
                          <p className="text-gray-500">لم يتم العثور على سجلات حضور لهذا العضو</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* الاشتراكات */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <FaBoxOpen className="text-blue-600" />
                    الاشتراكات
                  </CardTitle>
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
                          const isActive = sub.start_date <= today && sub.end_date >= today && !sub.is_cancelled;
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
                                  <p className={`flex items-center gap-2 ${parseFloat(sub.remaining_amount || 0) < 0 ? "text-red-600" : "text-green-600"}`}>
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
                                    onClick={() => openModal(sub.id)}
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
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                              disabled={currentPage === totalPages}
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

              {/* نموذج إضافة اشتراك */}
              {canAddSubscription && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <FaPlus className="text-blue-600" />
                      إضافة اشتراك جديد
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setIsAddSubscriptionModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 mb-4"
                      disabled={!selectedMember}
                    >
                      <FaPlus className="mr-2" />
                      إضافة اشتراك
                    </Button>
                    {isAddSubscriptionModalOpen && (
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
                    )}
                  </CardContent>
                </Card>
              )}

              {/* نموذج إضافة عضو جديد */}
              {isAddMemberModalOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                >
                  <div className="bg-white rounded-xl p-6 w-full max-w-4xl shadow-2xl" dir="rtl">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <FaPlus className="text-blue-600" />
                      إضافة عضو جديد
                    </h3>
                    {memberErrors && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {memberErrors.form ? (
                          <p>{memberErrors.form.join(", ")}</p>
                        ) : (
                          Object.keys(memberErrors).map((key) => (
                            <p key={key}>
                              {key}: {Array.isArray(memberErrors[key]) ? memberErrors[key].join(", ") : memberErrors[key]}
                            </p>
                          ))
                        )}
                      </div>
                    )}
                    <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { id: "name", label: "الاسم الكامل", type: "text", placeholder: "أدخل الاسم الكامل", required: true },
                        { id: "phone", label: "رقم الهاتف", type: "text", placeholder: "أدخل رقم الهاتف", required: true },
                        { id: "national_id", label: "رقم الهوية", type: "text", placeholder: "أدخل رقم الهوية" },
                        { id: "birth_date", label: "تاريخ الميلاد", type: "date" },
                        { id: "rfid_code", label: "رمز RFID", type: "text", placeholder: "أدخل رمز RFID" },
                        { id: "job", label: "الوظيفة", type: "text", placeholder: "أدخل الوظيفة" },
                        { id: "address", label: "العنوان", type: "text", placeholder: "أدخل العنوان" },
                        { id: "note", label: "ملاحظة", type: "textarea", placeholder: "أدخل ملاحظة" },
                        {
                          id: "gender",
                          label: "الجنس",
                          type: "select",
                          options: [
                            { value: "", label: "اختر الجنس" },
                            { value: "M", label: "ذكر" },
                            { value: "F", label: "أنثى" },
                          ],
                          required: true,
                        },
                      ].map((field) => (
                        <div key={field.id} className="flex flex-col">
                          <label htmlFor={field.id} className="text-sm font-medium text-gray-700 mb-2 text-right">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          {field.type === "select" ? (
                            <select
                              id={field.id}
                              name={field.id}
                              value={newMember[field.id]}
                              onChange={handleMemberInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                              required={field.required}
                            >
                              {field.options.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : field.type === "textarea" ? (
                            <textarea
                              id={field.id}
                              name={field.id}
                              value={newMember[field.id]}
                              onChange={handleMemberInputChange}
                              placeholder={field.placeholder}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                              rows={4}
                            />
                          ) : (
                            <input
                              id={field.id}
                              name={field.id}
                              type={field.type}
                              value={newMember[field.id]}
                              onChange={handleMemberInputChange}
                              placeholder={field.placeholder}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                              required={field.required}
                            />
                          )}
                        </div>
                      ))}
                      <div className="col-span-2 flex flex-col">
                        <label htmlFor="photo" className="text-sm font-medium text-gray-700 mb-2 text-right">
                          صورة
                        </label>
                        <input
                          id="photo"
                          name="photo"
                          type="file"
                          accept="image/*"
                          onChange={handleMemberInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-right"
                        />
                        {photoPreview && (
                          <div className="mt-4 flex items-center gap-4">
                            <img
                              src={photoPreview}
                              alt="Preview"
                              className="w-24 h-24 rounded-lg object-cover shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={handleRemovePhoto}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              إزالة الصورة
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 flex justify-end gap-3">
                        <Button
                          type="button"
                          onClick={() => setIsAddMemberModalOpen(false)}
                          variant="outline"
                        >
                          إلغاء
                        </Button>
                        <Button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <FaPlus className="mr-2" />
                          إضافة العضو
                        </Button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* نافذة التجميد */}
        {modalOpen && (
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
                <Button
                  onClick={closeModal}
                  variant="outline"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleFreezeSubmission}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  تأكيد
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default MemberProfile;
