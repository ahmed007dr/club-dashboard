import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserById } from '../../redux/slices/memberSlice';
import { 
  fetchMemberSubscriptions, 
  requestSubscriptionFreeze, 
  cancelSubscriptionFreeze, 
  clearFreezeFeedback 
} from '../../redux/slices/subscriptionsSlice';
import * as Tabs from '@radix-ui/react-tabs';
import { 
  FaUser, FaCalendarAlt, FaMoneyBillAlt, FaCheck, FaExclamation, 
  FaClock, FaDumbbell, FaSwimmer, FaUsers, FaBoxOpen, FaSnowflake,
} from 'react-icons/fa';
import { CiShoppingTag } from 'react-icons/ci';
import axios from 'axios';
import BASE_URL from '../../config/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import toast from 'react-hot-toast';

const Member = () => {
  const { id: memberId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [attendancePage, setAttendancePage] = useState(1);
  const [modalOpen, setModalOpen] = useState(null);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(null);
  const [freezeDays, setFreezeDays] = useState('');
  const [startDate, setStartDate] = useState('');
  const [attendanceData, setAttendanceData] = useState({ results: [], count: 0, next: null, previous: null });
  const [subscriptionTypes, setSubscriptionTypes] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [filters, setFilters] = useState({
    attendance_date: '',
    subscription_type: '',
    coach: '',
    status: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userClub, setUserClub] = useState(null);
  const [newSubscription, setNewSubscription] = useState({
    type: '',
    start_date: new Date().toISOString().split('T')[0],
    payment_amount: '',
    payment_method: '',
    coach: '',
  });
  const [editSubscription, setEditSubscription] = useState({
    type: '',
    start_date: '',
    payment_amount: '',
    payment_method: '',
    coach: '',
  });
  const itemsPerPage = 20;

  const { user, isloading: memberLoading, error: memberError } = useSelector((state) => state.member);
  const { 
    memberSubscriptions = { results: [], count: 0, next: null, previous: null },
    status: subscriptionsStatus, 
    error: subscriptionsError,
    freezeStatus = {},
    freezeError = {},
    freezeSuccess = {},
    cancelStatus = {},
    cancelError = {},
    cancelSuccess = {},
  } = useSelector((state) => state.subscriptions);

  // Get auth headers
  const getAuthHeaders = useCallback(async () => {
    const token = localStorage.getItem('token');
    console.log('Token:', token);
    
    if (!token) {
      toast.error('يرجى تسجيل الدخول أولاً');
      navigate('/login');
      return {};
    }
    
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
      },
    };
  }, [navigate]);

  // Fetch user club
  const fetchUserClub = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      if (!headers.headers?.Authorization) {
        toast.error('يرجى تسجيل الدخول');
        navigate('/login');
        return;
      }
      const response = await axios.get(`${BASE_URL}/accounts/api/profile/`, headers);
      setUserClub({
        id: response.data.club.id,
        name: response.data.club.name,
      });
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      toast.error('فشل في تحميل بيانات النادي');
      navigate('/login');
    }
  }, [navigate, getAuthHeaders]);

  // Fetch subscription types
  const fetchAllSubscriptionTypes = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      if (!headers.headers) return [];
      let allResults = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await axios.get(
          `${BASE_URL}/subscriptions/api/subscription-types/?page=${currentPage}`,
          headers
        );
        const results = Array.isArray(response.data.results) ? response.data.results : [];
        allResults = [...allResults, ...results];
        hasMore = !!response.data.next;
        currentPage += 1;
      }
      return allResults.filter(type => type.id != null && type.id !== '');
    } catch (error) {
      console.error('Failed to fetch subscription types:', error);
      toast.error(`فشل في جلب أنواع الاشتراكات: ${error.response?.data?.error || 'خطأ غير معروف'}`);
      setErrorMessage(`فشل في جلب أنواع الاشتراكات: ${error.response?.data?.error || 'خطأ غير معروف'}`);
      setIsModalOpen(true);
      return [];
    }
  }, [getAuthHeaders]);

  // Fetch payment methods
  const fetchAllPaymentMethods = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      if (!headers.headers) return [];
      const response = await axios.get(`${BASE_URL}/subscriptions/api/payment-methods/`, headers);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      toast.error(`فشل في جلب طرق الدفع: ${error.response?.data?.error || 'خطأ غير معروف'}`);
      setErrorMessage(`فشل في جلب طرق الدفع: ${error.response?.data?.error || 'خطأ غير معروف'}`);
      setIsModalOpen(true);
      return [];
    }
  }, [getAuthHeaders]);

  // Fetch coaches
  const fetchAllCoaches = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      if (!headers.headers) return [];
      let allCoaches = [];
      let nextUrl = `${BASE_URL}/accounts/api/users/`;
      
      while (nextUrl) {
        const response = await axios.get(nextUrl, headers);
        allCoaches = [...allCoaches, ...response.data.results];
        nextUrl = response.data.next;
      }
      
      return allCoaches.filter(user => user.role === 'coach');
    } catch (error) {
      console.error('Failed to fetch coaches:', error);
      toast.error(`فشل في جلب المدربين: ${error.response?.data?.error || 'خطأ غير معروف'}`);
      setErrorMessage(`فشل في جلب المدربين: ${error.response?.data?.error || 'خطأ غير معروف'}`);
      setIsModalOpen(true);
      return [];
    }
  }, [getAuthHeaders]);

  // Fetch attendance data
  const fetchAttendanceData = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      if (!headers.headers) return;
      const queryParams = new URLSearchParams({
        member_id: memberId,
        page: attendancePage,
        ...(filters.attendance_date && { attendance_date: filters.attendance_date }),
        ...(filters.subscription_type && { subscription_type: filters.subscription_type }),
        ...(filters.coach && { coach: filters.coach }),
        ...(filters.status && { status: filters.status }),
      });
      const response = await axios.get(`${BASE_URL}/attendance/api/attendances/?${queryParams}`, headers);
      setAttendanceData(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error(`فشل في جلب سجل الحضور: ${error.response?.data?.error || 'خطأ غير معروف'}`);
      setErrorMessage(`فشل في جلب سجل الحضور: ${error.response?.data?.error || 'خطأ غير معروف'}`);
      setIsModalOpen(true);
    }
  }, [getAuthHeaders, memberId, attendancePage, filters]);

  // Initial data fetch
  useEffect(() => {
    if (!memberId || memberId === 'undefined') {
      console.error('Invalid memberId:', memberId);
      navigate('/members');
      return;
    }

    const fetchInitialData = async () => {
      try {
        await fetchUserClub();
        dispatch(fetchUserById(memberId));
        dispatch(fetchMemberSubscriptions({ memberId, page: currentPage }));
        const [subscriptionTypesResult, paymentMethodsResult, coachesResult] = await Promise.all([
          fetchAllSubscriptionTypes(),
          fetchAllPaymentMethods(),
          fetchAllCoaches(),
        ]);
        setSubscriptionTypes(subscriptionTypesResult);
        setPaymentMethods(paymentMethodsResult);
        setCoaches(coachesResult);
        await fetchAttendanceData();
      } catch (error) {
        setErrorMessage('فشل في تحميل البيانات الأولية');
        setIsModalOpen(true);
      }
    };

    fetchInitialData();
  }, [dispatch, memberId, currentPage, fetchUserClub, fetchAllSubscriptionTypes, fetchAllPaymentMethods, fetchAllCoaches, fetchAttendanceData, navigate]);

  const openModal = (type, subscriptionId = null) => {
    setModalOpen(type);
    setSelectedSubscriptionId(subscriptionId);
    if (type === 'edit' && subscriptionId) {
      const sub = memberSubscriptions.results.find(s => s.id === subscriptionId);
      if (sub) {
        setEditSubscription({
          type: sub.type.id,
          start_date: sub.start_date,
          payment_amount: sub.paid_amount || '',
          payment_method: sub.payments?.[0]?.payment_method || '',
          coach: sub.coach?.id || '',
        });
      }
    }
    if (type === 'freeze') {
      setFreezeDays('');
      setStartDate(new Date().toISOString().split('T')[0]);
    }
  };

  const closeModal = () => {
    setModalOpen(null);
    setSelectedSubscriptionId(null);
    setFreezeDays('');
    setStartDate('');
    setNewSubscription({
      type: '',
      start_date: new Date().toISOString().split('T')[0],
      payment_amount: '',
      payment_method: '',
      coach: '',
    });
    setEditSubscription({
      type: '',
      start_date: '',
      payment_amount: '',
      payment_method: '',
      coach: '',
    });
    setIsModalOpen(false);
    setErrorMessage('');
  };

  const handleFreezeSubmission = async () => {
    if (!freezeDays || freezeDays <= 0) {
      setErrorMessage('يجب أن يكون عدد الأيام أكبر من 0');
      setIsModalOpen(true);
      return;
    }
    if (!startDate) {
      setErrorMessage('يجب اختيار تاريخ البدء');
      setIsModalOpen(true);
      return;
    }
    try {
      setIsSubmitting(true);
      const headers = await getAuthHeaders();
      if (!headers.headers) return;
      await axios.post(`${BASE_URL}/subscriptions/api/subscriptions/${selectedSubscriptionId}/freeze/`, {
        requested_days: parseInt(freezeDays, 10),
        start_date: startDate,
      }, headers);
      dispatch(fetchMemberSubscriptions({ memberId, page: currentPage }));
      toast.success('تم طلب التجميد بنجاح');
      closeModal();
    } catch (error) {
      setErrorMessage(`فشل في طلب التجميد: ${error.response?.data?.error || 'خطأ غير معروف'}`);
      setIsModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelFreeze = async (freezeRequestId) => {
    try {
      setIsSubmitting(true);
      const headers = await getAuthHeaders();
      if (!headers.headers) return;
      await axios.post(`${BASE_URL}/subscriptions/api/subscriptions/freeze/${freezeRequestId}/cancel/`, {}, headers);
      dispatch(fetchMemberSubscriptions({ memberId, page: currentPage }));
      toast.success('تم إلغاء التجميد بنجاح');
      closeModal();
    } catch (error) {
      setErrorMessage(`فشل في إلغاء التجميد: ${error.response?.data?.error || 'خطأ غير معروف'}`);
      setIsModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubscription = async () => {
    if (!newSubscription.type || !newSubscription.payment_amount || !newSubscription.payment_method) {
      setErrorMessage('يرجى ملء جميع الحقول المطلوبة');
      setIsModalOpen(true);
      return;
    }
    const paidAmount = parseFloat(newSubscription.payment_amount) || 0;
    if (isNaN(paidAmount) || paidAmount < 0) {
      setErrorMessage('المبلغ المدفوع يجب أن يكون رقمًا صحيحًا وغير سالب');
      setIsModalOpen(true);
      return;
    }
    const paymentMethodId = parseInt(newSubscription.payment_method);
    if (isNaN(paymentMethodId)) {
      setErrorMessage('يرجى اختيار طريقة دفع صالحة');
      setIsModalOpen(true);
      return;
    }
    const selectedType = subscriptionTypes.find(t => t.id.toString() === newSubscription.type.toString());
    if (!selectedType) {
      setErrorMessage('نوع الاشتراك المحدد غير موجود');
      setIsModalOpen(true);
      return;
    }
    try {
      setIsSubmitting(true);
      const headers = await getAuthHeaders();
      if (!headers.headers) return;
      await axios.post(`${BASE_URL}/subscriptions/api/subscriptions/`, {
        member: memberId,
        type: parseInt(newSubscription.type),
        start_date: newSubscription.start_date,
        payments: [{ amount: paidAmount.toFixed(2), payment_method: paymentMethodId }],
        coach: newSubscription.coach ? parseInt(newSubscription.coach) : null,
      }, headers);
      dispatch(fetchMemberSubscriptions({ memberId, page: currentPage }));
      toast.success('تم إنشاء الاشتراك بنجاح');
      closeModal();
    } catch (error) {
      setErrorMessage(`فشل في إنشاء الاشتراك: ${error.response?.data?.error || 'خطأ غير معروف'}`);
      setIsModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubscription = async () => {
    if (!editSubscription.type || !editSubscription.payment_amount || !editSubscription.payment_method) {
      setErrorMessage('يرجى ملء جميع الحقول المطلوبة');
      setIsModalOpen(true);
      return;
    }
    const paidAmount = parseFloat(editSubscription.payment_amount) || 0;
    if (isNaN(paidAmount) || paidAmount < 0) {
      setErrorMessage('المبلغ المدفوع يجب أن يكون رقمًا صحيحًا وغير سالب');
      setIsModalOpen(true);
      return;
    }
    const paymentMethodId = parseInt(editSubscription.payment_method);
    if (isNaN(paymentMethodId)) {
      setErrorMessage('يرجى اختيار طريقة دفع صالحة');
      setIsModalOpen(true);
      return;
    }
    const selectedType = subscriptionTypes.find(t => t.id.toString() === editSubscription.type.toString());
    if (!selectedType) {
      setErrorMessage('نوع الاشتراك المحدد غير موجود');
      setIsModalOpen(true);
      return;
    }
    try {
      setIsSubmitting(true);
      const headers = await getAuthHeaders();
      if (!headers.headers) return;
      await axios.put(`${BASE_URL}/subscriptions/api/subscriptions/${selectedSubscriptionId}/`, {
        type: parseInt(editSubscription.type),
        start_date: editSubscription.start_date,
        payments: [{ amount: paidAmount.toFixed(2), payment_method: paymentMethodId }],
        coach: editSubscription.coach ? parseInt(editSubscription.coach) : null,
      }, headers);
      dispatch(fetchMemberSubscriptions({ memberId, page: currentPage }));
      toast.success('تم تعديل الاشتراك بنجاح');
      closeModal();
    } catch (error) {
      setErrorMessage(`فشل في تعديل الاشتراك: ${error.response?.data?.error || 'خطأ غير معروف'}`);
      setIsModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsSubmitting(true);
      const headers = await getAuthHeaders();
      if (!headers.headers) return;
      await axios.post(`${BASE_URL}/subscriptions/api/subscriptions/${selectedSubscriptionId}/cancel/`, {}, headers);
      dispatch(fetchMemberSubscriptions({ memberId, page: currentPage }));
      toast.success('تم إلغاء الاشتراك بنجاح');
      closeModal();
    } catch (error) {
      setErrorMessage(`فشل في إلغاء الاشتراك: ${error.response?.data?.error || 'خطأ غير معروف'}`);
      setIsModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenewSubscription = async () => {
    try {
      setIsSubmitting(true);
      const headers = await getAuthHeaders();
      if (!headers.headers) return;
      await axios.post(`${BASE_URL}/subscriptions/api/subscriptions/${selectedSubscriptionId}/renew/`, {
        start_date: new Date().toISOString().split('T')[0],
      }, headers);
      dispatch(fetchMemberSubscriptions({ memberId, page: currentPage }));
      toast.success('تم تجديد الاشتراك بنجاح');
      closeModal();
    } catch (error) {
      setErrorMessage(`فشل في تجديد الاشتراك: ${error.response?.data?.error || 'خطأ غير معروف'}`);
      setIsModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setAttendancePage(1);
  };

  const resetFilters = () => {
    setFilters({
      attendance_date: '',
      subscription_type: '',
      coach: '',
      status: '',
    });
    setAttendancePage(1);
  };

  const safeCount = memberSubscriptions?.count || 0;
  const results = memberSubscriptions?.results || [];
  const totalPages = Math.ceil(safeCount / itemsPerPage);
  const attendanceTotalPages = Math.ceil((attendanceData?.count || 0) / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const paginateAttendance = (pageNumber) => {
    setAttendancePage(pageNumber);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return dateString ? new Date(dateString).toLocaleDateString('ar-EG', options) : 'غير متوفر';
  };

  const getErrorMessage = (error) => {
    if (typeof error !== 'object' || !error) return error || 'حدث خطأ';
    if (error.error?.includes('exceeds maximum allowed')) return 'عدد أيام التجميد يتجاوز الحد الأقصى المسموح';
    if (error.error?.includes('not active')) return 'طلب التجميد غير نشط';
    if (error.error?.includes('permission')) return 'ليس لديك الصلاحية لإلغاء التجميد';
    return error.error || 'حدث خطأ';
  };

  const getStatusText = (status) => {
    switch ((status || '').trim().toLowerCase()) {
      case 'upcoming': return 'قادم';
      case 'active': return 'نشط';
      case 'expired': return 'منتهي';
      case 'cancelled': return 'ملغي';
      case 'frozen': return 'مجمد';
      default: return 'غير معروف';
    }
  };

  if (!memberId || memberId === 'undefined') {
    return (
      <div className="p-4 text-red-500 text-center" dir="rtl">
        <p>معرف العضو غير صالح.</p>
      </div>
    );
  }

  if (memberLoading || subscriptionsStatus === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen" dir="rtl">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (memberError || subscriptionsError) {
    return (
      <div className="p-4 text-red-500 text-center" dir="rtl">
        <p>{memberError || getErrorMessage(subscriptionsError)}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 text-gray-600 text-center" dir="rtl">
        <p>لم يتم العثور على العضو.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg min-h-screen" dir="rtl">
      {isModalOpen && (
        <div className="fixed top-1/4 left-0 right-0 flex items-start justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full max-h-[70vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">حدث خطأ</h3>
            <p className="text-red-600">{errorMessage}</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                onClick={closeModal}
                className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}

      <header className="mb-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-3">
          <FaUser className="text-blue-600 text-3xl" />
          ملف العضو: {user.name || 'العضو'}
        </h2>
      </header>

      <Tabs.Root defaultValue="profile" className="space-y-6">
        <Tabs.List className="flex border-b border-gray-200 dark:border-gray-700 justify-end">
          <Tabs.Trigger
            value="profile"
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-400 transition-colors"
          >
            المعلومات الأساسية
          </Tabs.Trigger>
          <Tabs.Trigger
            value="subscriptions"
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-400 transition-colors"
          >
            الاشتراكات
          </Tabs.Trigger>
          <Tabs.Trigger
            value="attendance"
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-400 transition-colors"
          >
            الحضور
          </Tabs.Trigger>
          <Tabs.Trigger
            value="manage"
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-400 transition-colors"
          >
            إدارة الاشتراكات
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="profile">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md mx-auto">
            <div className="flex items-center gap-6 mb-8">
              <img
                src={user.photo || "/images/default-user.png"}
                alt="الصورة الشخصية"
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 shadow-md"
              />
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{user.name || "لا يوجد اسم"}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">النادي: {user.club_name || "غير متوفر"}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span className="font-medium text-gray-700 dark:text-gray-300">رقم العضوية:</span>
                <span className="text-gray-600 dark:text-gray-400">{user.membership_number || "غير متوفر"}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="font-medium text-gray-700 dark:text-gray-300">الرقم القومي:</span>
                <span className="text-gray-600 dark:text-gray-400">{user.national_id || "غير متوفر"}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-1.26 1.26a1 1 0 00-.707.293l-3.147 3.147a1 1 0 01-1.414-1.414l1.498-1.498a1 1 0 00.707-.293l1.26-1.26a1 1 0 011.21-.502z" />
                </svg>
                <span className="font-medium text-gray-700 dark:text-gray-300">رقم الهاتف:</span>
                <span className="text-gray-600 dark:text-gray-400">{user.phone || "غير متوفر"}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h2l.6 2.5M7 8.5h10l1-4H6.6" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 8.5L6 14h12l-1 5H8L7 8.5z" />
                </svg>
                <span className="font-medium text-gray-700 dark:text-gray-300">هاتف إضافي:</span>
                <span className="text-gray-600 dark:text-gray-400">{user.phone2 || "غير متوفر"}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium text-gray-700 dark:text-gray-300">تاريخ الميلاد:</span>
                <span className="text-gray-600 dark:text-gray-400">{user.birth_date || "غير متوفر"}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="font-medium text-gray-700 dark:text-gray-300">الوظيفة:</span>
                <span className="text-gray-600 dark:text-gray-400">{user.job || "غير متوفر"}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium text-gray-700 dark:text-gray-300">العنوان:</span>
                <span className="text-gray-600 dark:text-gray-400">{user.address || "غير متوفر"}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-gray-700 dark:text-gray-300">تم الترشيح من:</span>
                <span className="text-gray-600 dark:text-gray-400">{user.referred_by || "غير متوفر"}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h6M13 8h2M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14l-4-4H5V5a2 2 0 012-2h12a2 2 0 012 2v4" />
                </svg>
                <span className="font-medium text-gray-700 dark:text-gray-300">ملاحظات:</span>
                <span className="text-gray-600 dark:text-gray-400">{user.note || "لا توجد ملاحظات"}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4V4zm4 4h8v8H8V8z" />
                </svg>
                <span className="font-medium text-gray-700 dark:text-gray-300">كود RFID:</span>
                <span className="text-gray-600 dark:text-gray-400">{user.rfid_code || "غير متوفر"}</span>
              </div>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="subscriptions">
          <div className="space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <FaBoxOpen className="text-blue-600" />
              اشتراكات العضو
            </h3>
            {results.length > 0 ? (
              <>
                {modalOpen === 'freeze' && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm sm:max-w-md shadow-2xl" dir="rtl">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <FaSnowflake className="text-blue-500" />
                        طلب تجميد الاشتراك
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">عدد أيام التجميد</label>
                          <Input
                            type="number"
                            min="1"
                            value={freezeDays}
                            onChange={(e) => setFreezeDays(e.target.value ? parseInt(e.target.value, 10) : '')}
                            placeholder="أدخل عدد الأيام"
                            className="w-full text-right"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ البدء</label>
                          <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full text-right"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-6">
                        <Button
                          onClick={closeModal}
                          className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                          disabled={isSubmitting}
                        >
                          إلغاء
                        </Button>
                        <Button
                          onClick={handleFreezeSubmission}
                          className="bg-blue-600 text-white hover:bg-blue-700"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'جاري الحفظ...' : 'تأكيد'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">الاشتراك</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">المدرب</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">حالة التجميد</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">التواريخ</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">الدفع</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">التفاصيل</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {results.map((sub) => {
                        const activeFreeze = Array.isArray(sub.freeze_requests) ? 
                          sub.freeze_requests.find(fr => fr.is_active) : null;

                        return (
                          <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    <CiShoppingTag className="text-blue-500" />
                                    {sub.type_details?.name || 'غير معروف'}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub.type_details?.duration_days} يوم</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">RFID: {sub.member_details?.rfid_code || 'غير متوفر'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {sub.coach_details ? (
                                <div className="text-sm">
                                  <div className="font-medium text-gray-900 dark:text-white">{sub.coach_details.username}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">الحد: {sub.coach_details.max_trainees} متدرب</div>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500 dark:text-gray-400">بدون مدرب</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {activeFreeze ? (
                                <div className="text-sm space-y-1">
                                  <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                    <FaSnowflake className="text-sm" />
                                    مجمد ({activeFreeze.requested_days} يوم)
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">من {formatDate(activeFreeze.start_date)}</div>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500 dark:text-gray-400">غير مجمد</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm space-y-1">
                                <div className="flex items-center gap-1">
                                  <FaCalendarAlt className="text-gray-400 text-sm" />
                                  {formatDate(sub.start_date)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <FaCalendarAlt className="text-gray-400 text-sm" />
                                  {formatDate(sub.end_date)}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm space-y-1">
                                <div className="flex items-center gap-1">
                                  <FaMoneyBillAlt className="text-gray-400 text-sm" />
                                  السعر: {sub.type_details?.price || 0} ج.م
                                </div>
                                <div className="flex items-center gap-1">
                                  <FaCheck className="text-gray-400 text-sm" />
                                  المدفوع: {sub.paid_amount || 0} ج.م
                                </div>
                                <div className={`flex items-center gap-1 ${parseFloat(sub.remaining_amount || 0) < 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                                  <FaExclamation className="text-sm" />
                                  المتبقي: {sub.remaining_amount || 0} ج.م
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-2 text-sm">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                                  <FaClock className="ml-1 text-sm" />
                                  الدخول: {sub.entry_count || 0}/{sub.type_details?.max_entries || 'غير محدود'}
                                </span>
                                {sub.type_details?.includes_pool && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                                    <FaSwimmer className="ml-1 text-sm" />
                                    حمام السباحة
                                  </span>
                                )}
                                {sub.type_details?.includes_gym && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300">
                                    <FaDumbbell className="ml-1 text-sm" />
                                    صالة الألعاب
                                  </span>
                                )}
                                {sub.type_details?.includes_classes && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
                                    <FaUsers className="ml-1 text-sm" />
                                    الحصص التدريبية
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-2">
                                {!activeFreeze ? (
                                  <Button
                                    onClick={() => openModal('freeze', sub.id)}
                                    disabled={freezeStatus[sub.id] === 'loading' || isSubmitting}
                                    className={`text-sm ${freezeStatus[sub.id] === 'loading' || isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                  >
                                    {freezeStatus[sub.id] === 'loading' ? 'جاري التجميد...' : 'تجميد'}
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => handleCancelFreeze(activeFreeze.id)}
                                    disabled={cancelStatus[activeFreeze.id] === 'loading' || isSubmitting}
                                    className={`text-sm ${cancelStatus[activeFreeze.id] === 'loading' || isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                                  >
                                    {cancelStatus[activeFreeze.id] === 'loading' ? 'جاري الإلغاء...' : 'إلغاء التجميد'}
                                  </Button>
                                )}
                                <Button
                                  onClick={() => openModal('edit', sub.id)}
                                  className="bg-yellow-600 hover:bg-yellow-700 text-sm"
                                  disabled={isSubmitting}
                                >
                                  تعديل
                                </Button>
                                <Button
                                  onClick={() => openModal('cancel', sub.id)}
                                  className="bg-red-600 hover:bg-red-700 text-sm"
                                  disabled={isSubmitting}
                                >
                                  إلغاء الاشتراك
                                </Button>
                                <Button
                                  onClick={() => openModal('renew', sub.id)}
                                  className="bg-green-600 hover:bg-green-700 text-sm"
                                  disabled={isSubmitting}
                                >
                                  تجديد
                                </Button>
                                {freezeSuccess[sub.id] && (
                                  <p className="text-green-600 dark:text-green-400 text-xs mt-1">{freezeSuccess[sub.id]}</p>
                                )}
                                {freezeError[sub.id] && (
                                  <p className="text-red-600 dark:text-red-400 text-xs mt-1">خطأ: {getErrorMessage(freezeError[sub.id])}</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-4 mb-6">
                  {results.map((sub) => {
                    const activeFreeze = Array.isArray(sub.freeze_requests) ? 
                      sub.freeze_requests.find(fr => fr.is_active) : null;

                    return (
                      <div key={sub.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-3">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {getStatusText(sub.status)}
                          </span>
                          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
                            <CiShoppingTag className="text-lg" />
                            {sub.type_details?.name || 'غير معروف'}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">RFID</p>
                            <p>{sub.member_details?.rfid_code || 'غير متوفر'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">المدة</p>
                            <p>{sub.type_details?.duration_days} يوم</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">المدرب</p>
                            {sub.coach_details ? (
                              <div>
                                <p>{sub.coach_details.username}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">الحد: {sub.coach_details.max_trainees}</p>
                              </div>
                            ) : (
                              <p className="text-gray-500 dark:text-gray-400">بدون مدرب</p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">حالة التجميد</p>
                            {activeFreeze ? (
                              <div className="text-yellow-600 dark:text-yellow-400">
                                <p className="flex items-center gap-1">
                                  <FaSnowflake className="text-sm" />
                                  {activeFreeze.requested_days} يوم
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">من {formatDate(activeFreeze.start_date)}</p>
                              </div>
                            ) : (
                              <p className="text-gray-500 dark:text-gray-400">غير مجمد</p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">تاريخ البدء</p>
                            <p className="flex items-center gap-1">
                              <FaCalendarAlt className="text-gray-400 text-sm" />
                              {formatDate(sub.start_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">تاريخ الانتهاء</p>
                            <p className="flex items-center gap-1">
                              <FaCalendarAlt className="text-gray-400 text-sm" />
                              {formatDate(sub.end_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">السعر</p>
                            <p>{sub.type_details?.price || 0} ج.م</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">المدفوع</p>
                            <p>{sub.paid_amount || 0} ج.م</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">الرصيد</p>
                            <p className={parseFloat(sub.remaining_amount || 0) < 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}>
                              {sub.remaining_amount || 0} ج.م
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">التفاصيل</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                              <FaClock className="ml-1 text-sm" />
                              الدخول: {sub.entry_count || 0}/{sub.type_details?.max_entries || 'غير محدود'}
                            </span>
                            {sub.type_details?.includes_pool && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                                <FaSwimmer className="ml-1 text-sm" />
                                حمام السباحة
                              </span>
                            )}
                            {sub.type_details?.includes_gym && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300">
                                <FaDumbbell className="ml-1 text-sm" />
                                صالة الألعاب
                              </span>
                            )}
                            {sub.type_details?.includes_classes && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
                                <FaUsers className="ml-1 text-sm" />
                                الحصص التدريبية
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t dark:border-gray-700">
                          <div className="flex flex-col gap-2">
                            {!activeFreeze ? (
                              <Button
                                onClick={() => openModal('freeze', sub.id)}
                                disabled={freezeStatus[sub.id] === 'loading' || isSubmitting}
                                className={`w-full text-sm ${freezeStatus[sub.id] === 'loading' || isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                              >
                                {freezeStatus[sub.id] === 'loading' ? 'جاري التجميد...' : 'تجميد'}
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleCancelFreeze(activeFreeze.id)}
                                disabled={cancelStatus[activeFreeze.id] === 'loading' || isSubmitting}
                                className={`w-full text-sm ${cancelStatus[activeFreeze.id] === 'loading' || isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                              >
                                {cancelStatus[activeFreeze.id] === 'loading' ? 'جاري الإلغاء...' : 'إلغاء التجميد'}
                              </Button>
                            )}
                            <Button
                              onClick={() => openModal('edit', sub.id)}
                              className="w-full bg-yellow-600 hover:bg-yellow-700 text-sm"
                              disabled={isSubmitting}
                            >
                              تعديل
                            </Button>
                            <Button
                              onClick={() => openModal('cancel', sub.id)}
                              className="w-full bg-red-600 hover:bg-red-700 text-sm"
                              disabled={isSubmitting}
                            >
                              إلغاء الاشتراك
                            </Button>
                            <Button
                              onClick={() => openModal('renew', sub.id)}
                              className="w-full bg-green-600 hover:bg-green-700 text-sm"
                              disabled={isSubmitting}
                            >
                              تجديد
                            </Button>
                            {freezeSuccess[sub.id] && (
                              <p className="text-green-600 dark:text-green-400 text-xs mt-1">{freezeSuccess[sub.id]}</p>
                            )}
                            {freezeError[sub.id] && (
                              <p className="text-red-600 dark:text-red-400 text-xs mt-1">خطأ: {getErrorMessage(freezeError[sub.id])}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {safeCount > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6" dir="rtl">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      عرض {(currentPage - 1) * itemsPerPage + 1} إلى {Math.min(currentPage * itemsPerPage, safeCount)} من {safeCount}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => paginate(1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 text-sm ${currentPage === 1 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        الأول
                      </Button>
                      <Button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={!memberSubscriptions.previous}
                        className={`px-3 py-1 text-sm ${!memberSubscriptions.previous ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        السابق
                      </Button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const start = Math.max(1, currentPage - 2);
                        const page = start + i;
                        if (page > totalPages) return null;
                        return (
                          <Button
                            key={page}
                            onClick={() => paginate(page)}
                            className={`px-3 py-1 text-sm ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200'}`}
                          >
                            {page}
                          </Button>
                        );
                      })}
                      <Button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={!memberSubscriptions.next}
                        className={`px-3 py-1 text-sm ${!memberSubscriptions.next ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        التالي
                      </Button>
                      <Button
                        onClick={() => paginate(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 text-sm ${currentPage === totalPages ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        الأخير
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[50vh]" dir="rtl">
                <FaBoxOpen className="text-gray-300 dark:text-gray-600 text-6xl mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">لم يتم العثور على اشتراكات لهذا العضو</p>
              </div>
            )}
          </div>
        </Tabs.Content>

        <Tabs.Content value="attendance">
          <div className="space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <FaCalendarAlt className="text-blue-500" />
              حضور العضو
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ الحضور</label>
                <Input
                  type="date"
                  value={filters.attendance_date}
                  onChange={(e) => handleFilterChange('attendance_date', e.target.value)}
                  className="w-full text-right"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع الاشتراك</label>
                <Select
                  value={filters.subscription_type}
                  onValueChange={(value) => handleFilterChange('subscription_type', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full text-right">
                    <SelectValue placeholder="اختر نوع الاشتراك" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">الكل</SelectItem>
                    {subscriptionTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المدرب</label>
                <Select
                  value={filters.coach}
                  onValueChange={(value) => handleFilterChange('coach', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full text-right">
                    <SelectValue placeholder="اختر المدرب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">الكل</SelectItem>
                    {coaches.map((coach) => (
                      <SelectItem key={coach.id} value={coach.id}>
                        {coach.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">حالة الاشتراك</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full text-right">
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">الكل</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="frozen">مجمد</SelectItem>
                    <SelectItem value="expired">منتهي</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                    <SelectItem value="upcoming">قادم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={resetFilters}
                className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                disabled={isSubmitting}
              >
                إعادة تعيين
              </Button>
            </div>
            {attendanceData.results.length > 0 ? (
              <>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">تاريخ ووقت الحضور</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">اسم الاشتراك</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">المدرب</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">المبلغ المدفوع</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">حالة الاشتراك</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {attendanceData.results.map((att) => (
                        <tr key={att.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{formatDate(att.attendance_date)}</td>
                          <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{att.subscription_details?.type_details?.name || 'غير معروف'}</td>
                          <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{att.subscription_details?.coach_details?.username || 'بدون مدرب'}</td>
                          <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{att.subscription_details?.paid_amount || 0} ج.م</td>
                          <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{getStatusText(att.subscription_details?.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {attendanceData.count > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6" dir="rtl">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      عرض {(attendancePage - 1) * itemsPerPage + 1} إلى {Math.min(attendancePage * itemsPerPage, attendanceData.count)} من {attendanceData.count}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => paginateAttendance(1)}
                        disabled={attendancePage === 1 || isSubmitting}
                        className={`px-3 py-1 text-sm ${attendancePage === 1 || isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        الأول
                      </Button>
                      <Button
                        onClick={() => paginateAttendance(attendancePage - 1)}
                        disabled={!attendanceData.previous || isSubmitting}
                        className={`px-3 py-1 text-sm ${!attendanceData.previous || isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        السابق
                      </Button>
                      {Array.from({ length: Math.min(5, attendanceTotalPages) }, (_, i) => {
                        const start = Math.max(1, attendancePage - 2);
                        const page = start + i;
                        if (page > attendanceTotalPages) return null;
                        return (
                          <Button
                            key={page}
                            onClick={() => paginateAttendance(page)}
                            className={`px-3 py-1 text-sm ${attendancePage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200'}`}
                            disabled={isSubmitting}
                          >
                            {page}
                          </Button>
                        );
                      })}
                      <Button
                        onClick={() => paginateAttendance(attendancePage + 1)}
                        disabled={!attendanceData.next || isSubmitting}
                        className={`px-3 py-1 text-sm ${!attendanceData.next || isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        التالي
                      </Button>
                      <Button
                        onClick={() => paginateAttendance(attendanceTotalPages)}
                        disabled={attendancePage === attendanceTotalPages || isSubmitting}
                        className={`px-3 py-1 text-sm ${attendancePage === attendanceTotalPages || isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        الأخير
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[50vh]" dir="rtl">
                <FaCalendarAlt className="text-gray-300 dark:text-gray-600 text-6xl mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">لم يتم العثور على سجل حضور لهذا العضو</p>
              </div>
            )}
          </div>
        </Tabs.Content>
        {/* Manage Subscriptions Tab */}
        <Tabs.Content value="manage">
          <div className="space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <FaBoxOpen className="text-blue-500" />
              إدارة الاشتراكات
            </h3>
            <Button
              onClick={() => openModal('create')}
              className="bg-green-600 hover:bg-green-700 text-sm"
            >
              إنشاء اشتراك جديد
            </Button>
            {modalOpen === 'create' && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm sm:max-w-md shadow-2xl" dir="rtl">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <FaBoxOpen className="text-blue-500" />
                    إنشاء اشتراك جديد
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع الاشتراك</label>
                      <Select
                        value={newSubscription.type}
                        onValueChange={(value) => setNewSubscription({ ...newSubscription, type: value })}
                      >
                        <SelectTrigger className="w-full text-right">
                          <SelectValue placeholder="اختر نوع الاشتراك" />
                        </SelectTrigger>
                        <SelectContent>
                          {subscriptionTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name} ({type.price} ج.م)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ البدء</label>
                      <Input
                        type="date"
                        value={newSubscription.start_date}
                        onChange={(e) => setNewSubscription({ ...newSubscription, start_date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ المدفوع</label>
                      <Input
                        type="number"
                        value={newSubscription.payment_amount}
                        onChange={(e) => setNewSubscription({ ...newSubscription, payment_amount: e.target.value })}
                        placeholder="أدخل المبلغ المدفوع"
                        className="w-full text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">طريقة الدفع</label>
                      <Select
                        value={newSubscription.payment_method}
                        onValueChange={(value) => setNewSubscription({ ...newSubscription, payment_method: value })}
                      >
                        <SelectTrigger className="w-full text-right">
                          <SelectValue placeholder="اختر طريقة الدفع" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id}>
                              {method.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المدرب (اختياري)</label>
                      <Select
                        value={newSubscription.coach}
                        onValueChange={(value) => setNewSubscription({ ...newSubscription, coach: value })}
                      >
                        <SelectTrigger className="w-full text-right">
                          <SelectValue placeholder="اختر المدرب" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">بدون مدرب</SelectItem>
                          {coaches.map((coach) => (
                            <SelectItem key={coach.id} value={coach.id}>
                              {coach.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <Button
                      onClick={closeModal}
                      className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={handleCreateSubscription}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      إنشاء
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {modalOpen === 'edit' && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm sm:max-w-md shadow-2xl" dir="rtl">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <FaBoxOpen className="text-blue-500" />
                    تعديل الاشتراك
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع الاشتراك</label>
                      <Select
                        value={editSubscription.type}
                        onValueChange={(value) => setEditSubscription({ ...editSubscription, type: value })}
                      >
                        <SelectTrigger className="w-full text-right">
                          <SelectValue placeholder="اختر نوع الاشتراك" />
                        </SelectTrigger>
                        <SelectContent>
                          {subscriptionTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name} ({type.price} ج.م)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ البدء</label>
                      <Input
                        type="date"
                        value={editSubscription.start_date}
                        onChange={(e) => setEditSubscription({ ...editSubscription, start_date: e.target.value })}
                        className="w-full text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ المدفوع</label>
                      <Input
                        type="number"
                        value={editSubscription.payment_amount}
                        onChange={(e) => setEditSubscription({ ...editSubscription, payment_amount: e.target.value })}
                        placeholder="أدخل المبلغ المدفوع"
                        className="w-full text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">طريقة الدفع</label>
                      <Select
                        value={editSubscription.payment_method}
                        onValueChange={(value) => setEditSubscription({ ...editSubscription, payment_method: value })}
                      >
                        <SelectTrigger className="w-full text-right">
                          <SelectValue placeholder="اختر طريقة الدفع" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id}>
                              {method.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المدرب (اختياري)</label>
                      <Select
                        value={editSubscription.coach}
                        onValueChange={(value) => setEditSubscription({ ...editSubscription, coach: value })}
                      >
                        <SelectTrigger className="w-full text-right">
                          <SelectValue placeholder="اختر المدرب" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">بدون مدرب</SelectItem>
                          {coaches.map((coach) => (
                            <SelectItem key={coach.id} value={coach.id}>
                              {coach.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <Button
                      onClick={closeModal}
                      className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={handleEditSubscription}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      تعديل
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

export default Member;