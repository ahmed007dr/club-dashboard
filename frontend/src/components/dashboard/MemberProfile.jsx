import React, { useEffect, useState } from 'react';
   import { useParams } from 'react-router-dom';
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
   import MemberAttendanceChart from './MemberAttendanceChart';

   const MemberProfile = () => {
     const { id: memberId } = useParams();
     const dispatch = useDispatch();
     const [currentPage, setCurrentPage] = useState(1);
     const [modalOpen, setModalOpen] = useState(false);
     const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(null);
     const [freezeDays, setFreezeDays] = useState('');
     const [startDate, setStartDate] = useState('');
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

     useEffect(() => {
       if (!memberId || memberId === 'undefined') {
         console.error('Invalid memberId:', memberId);
         return;
       }
       dispatch(fetchUserById(memberId));
       dispatch(fetchMemberSubscriptions({ memberId, page: currentPage }));
     }, [dispatch, memberId, currentPage]);

     const openModal = (subscriptionId) => {
       setSelectedSubscriptionId(subscriptionId);
       setFreezeDays('');
       setStartDate(new Date().toISOString().split('T')[0]);
       setModalOpen(true);
     };

     const closeModal = () => {
       setModalOpen(false);
       setSelectedSubscriptionId(null);
       setFreezeDays('');
       setStartDate('');
     };

     const handleFreezeSubmission = () => {
       if (!freezeDays || freezeDays <= 0) {
         dispatch(clearFreezeFeedback(selectedSubscriptionId));
         dispatch({
           type: 'subscriptions/requestFreeze/rejected',
           payload: { subscriptionId: selectedSubscriptionId, error: 'يجب أن يكون عدد الأيام أكبر من 0' },
         });
         return;
       }
       if (!startDate) {
         dispatch(clearFreezeFeedback(selectedSubscriptionId));
         dispatch({
           type: 'subscriptions/requestFreeze/rejected',
           payload: { subscriptionId: selectedSubscriptionId, error: 'يجب اختيار تاريخ البدء' },
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
         dispatch(fetchMemberSubscriptions({ memberId, page: currentPage }));
       });
       setTimeout(() => {
         dispatch(clearFreezeFeedback(selectedSubscriptionId));
       }, 5000);
       closeModal();
     };

     const handleCancelFreeze = (freezeRequestId) => {
       dispatch(cancelSubscriptionFreeze({ freezeRequestId })).then((action) => {
         if (cancelSubscriptionFreeze.fulfilled.match(action)) {
           dispatch(fetchMemberSubscriptions({ memberId, page: currentPage }));
         }
       });
       setTimeout(() => {
         dispatch(clearFreezeFeedback(freezeRequestId));
       }, 5000);
     };

     const safeCount = memberSubscriptions?.count || 0;
     const results = memberSubscriptions?.results || [];
     const totalPages = Math.ceil(safeCount / itemsPerPage);

     const paginate = (pageNumber) => {
       setCurrentPage(pageNumber);
     };

     const formatDate = (dateString) => {
       const options = { year: 'numeric', month: 'long', day: 'numeric' };
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
       const normalizedStatus = (status || '').trim().toLowerCase();
       switch (normalizedStatus) {
         case 'upcoming': return 'قادم';
         case 'active': return 'نشط';
         case 'expired': return 'منتهي';
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
         <header className="mb-8 text-center">
           <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-3">
             <FaUser className="text-blue-600 text-3xl" />
             ملف العضو: {user.name || 'العضو'}
           </h2>
         </header>

         <Tabs.Root defaultValue="profile" className="space-y-6">
           <Tabs.List className="flex border-b border-gray-200 dark:border-gray-700">
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
           </Tabs.List>

           {/* Profile Tab */}
           <Tabs.Content value="profile">
             <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md mx-auto">
               <div className="flex items-center gap-6 mb-8">
                 <img
                   src={user.photo || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU-rxXTrx4QdTdwIpw938VLL8EuJiVhCelkQ&s"}
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

           {/* Subscriptions Tab */}
           <Tabs.Content value="subscriptions">
             <div className="space-y-6">
               <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                 <FaBoxOpen className="text-blue-600" />
                 اشتراكات العضو
               </h3>
               {results.length > 0 ? (
                 <>
                   {modalOpen && (
                     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300">
                       <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm sm:max-w-md shadow-2xl" dir="rtl">
                         <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                           <FaSnowflake className="text-blue-500" />
                           طلب تجميد الاشتراك
                         </h3>
                         <div className="space-y-4">
                           <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">عدد أيام التجميد</label>
                             <input
                               type="number"
                               min="1"
                               value={freezeDays}
                               onChange={(e) => setFreezeDays(e.target.value ? parseInt(e.target.value, 10) : '')}
                               placeholder="أدخل عدد الأيام"
                               className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                             />
                           </div>
                           <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ البدء</label>
                             <input
                               type="date"
                               value={startDate}
                               onChange={(e) => setStartDate(e.target.value)}
                               min={new Date().toISOString().split('T')[0]}
                               className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                             />
                           </div>
                         </div>
                         <div className="flex justify-end gap-3 mt-6">
                           <button
                             onClick={closeModal}
                             className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                           >
                             إلغاء
                           </button>
                           <button
                             onClick={handleFreezeSubmission}
                             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                           >
                             تأكيد
                           </button>
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
                                     الدخول: {sub.entry_count || 0}/{sub.type_details?.max_entries || '∞'}
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
                                     <button
                                       onClick={() => openModal(sub.id)}
                                       disabled={freezeStatus[sub.id] === 'loading'}
                                       className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                         freezeStatus[sub.id] === 'loading'
                                           ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-400 cursor-not-allowed'
                                           : 'bg-blue-600 text-white hover:bg-blue-700'
                                       }`}
                                     >
                                       {freezeStatus[sub.id] === 'loading' ? 'جاري التجميد...' : 'تجميد'}
                                     </button>
                                   ) : (
                                     <button
                                       onClick={() => handleCancelFreeze(activeFreeze.id)}
                                       disabled={cancelStatus[activeFreeze.id] === 'loading'}
                                       className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                         cancelStatus[activeFreeze.id] === 'loading'
                                           ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-400 cursor-not-allowed'
                                           : 'bg-red-600 text-white hover:bg-red-700'
                                       }`}
                                     >
                                       {cancelStatus[activeFreeze.id] === 'loading' ? 'جاري الإلغاء...' : 'إلغاء التجميد'}
                                     </button>
                                   )}
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
                                 الدخول: {sub.entry_count || 0}/{sub.type_details?.max_entries || '∞'}
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
                                 <button
                                   onClick={() => openModal(sub.id)}
                                   disabled={freezeStatus[sub.id] === 'loading'}
                                   className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                     freezeStatus[sub.id] === 'loading'
                                       ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-400 cursor-not-allowed'
                                       : 'bg-blue-600 text-white hover:bg-blue-700'
                                   }`}
                                 >
                                   {freezeStatus[sub.id] === 'loading' ? 'جاري التجميد...' : 'تجميد'}
                                 </button>
                               ) : (
                                 <button
                                   onClick={() => handleCancelFreeze(activeFreeze.id)}
                                   disabled={cancelStatus[activeFreeze.id] === 'loading'}
                                   className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                     cancelStatus[activeFreeze.id] === 'loading'
                                       ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-400 cursor-not-allowed'
                                       : 'bg-red-600 text-white hover:bg-red-700'
                                   }`}
                                 >
                                   {cancelStatus[activeFreeze.id] === 'loading' ? 'جاري الإلغاء...' : 'إلغاء التجميد'}
                                 </button>
                               )}
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
                         <button
                           onClick={() => paginate(1)}
                           disabled={currentPage === 1}
                           className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                             currentPage === 1 ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                           }`}
                           aria-label="الصفحة الأولى"
                         >
                           الأول
                         </button>
                         <button
                           onClick={() => paginate(currentPage - 1)}
                           disabled={!memberSubscriptions.previous}
                           className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                             !memberSubscriptions.previous ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                           }`}
                           aria-label="الصفحة السابقة"
                         >
                           السابق
                         </button>
                         {(() => {
                           const maxButtons = 5;
                           const sideButtons = Math.floor(maxButtons / 2);
                           let start = Math.max(1, currentPage - sideButtons);
                           let end = Math.min(totalPages, start + maxButtons - 1);
                           if (end - start + 1 < maxButtons && start > 1) {
                             start = Math.max(1, end - maxButtons + 1);
                           }
                           return Array.from({ length: end - start + 1 }, (_, i) => start + i).map((page) => (
                             <button
                               key={page}
                               onClick={() => paginate(page)}
                               className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                 currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200'
                               }`}
                               aria-label={`الصفحة ${page}`}
                             >
                               {page}
                             </button>
                           ));
                         })()}
                         <button
                           onClick={() => paginate(currentPage + 1)}
                           disabled={!memberSubscriptions.next}
                           className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                             !memberSubscriptions.next ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                           }`}
                           aria-label="الصفحة التالية"
                         >
                           التالي
                         </button>
                         <button
                           onClick={() => paginate(totalPages)}
                           disabled={currentPage === totalPages}
                           className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                             currentPage === totalPages ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                           }`}
                           aria-label="الصفحة الأخيرة"
                         >
                           الأخير
                         </button>
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

           {/* Attendance Tab */}
           <Tabs.Content value="attendance">
             <div className="space-y-6">
               <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                 <FaCalendarAlt className="text-blue-500" />
                 حضور العضو
               </h3>
               <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                 <MemberAttendanceChart memberId={memberId} />
               </div>
             </div>
           </Tabs.Content>
         </Tabs.Root>
       </div>
     );
   };

   export default MemberProfile;