import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserById } from "../../redux/slices/memberSlice";

const Member = () => {
  const { id } = useParams(); // Get the member ID from the URL
  const dispatch = useDispatch();

  // Access the user data and loading/error states from Redux
  const user = useSelector((state) => state.member.user); // Ensure 'member' matches the key in store.js
  const isLoading = useSelector((state) => state.member.isloading);
  const error = useSelector((state) => state.member.error);
 console.log(user); // Log the user data for debugging
  console.log(isLoading); // Log the loading state for debugging
  // Fetch the user when the component mounts or when the ID changes
  useEffect(() => {
    dispatch(fetchUserById(id)); // Dispatch the fetch action
  }, [dispatch, id]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="p-4 text-red-500 text-center">
        <p>{error}</p>
      </div>
    );
  }

  // Handle case where user is not found
  if (!user) {
    return (
      <div className="p-4 text-gray-600 text-center">
        <p>Member not found.</p>
      </div>
    );
  }

  return (
  <div className="min-h-screen flex items-center justify-center" dir="rtl">
  <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
    {/* Profile section */}
    <div className="flex items-center gap-6 mb-8">
      <img
        src={user.photo || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU-rxXTrx4QdTdwIpw938VLL8EuJiVhCelkQ&s"}
        alt="الصورة الشخصية"
        className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 shadow-md"
      />
      <div>
        <h3 className="text-2xl font-bold text-gray-800">{user.name || "لا يوجد اسم"}</h3>
        <p className="text-sm text-gray-500">النادي: {user.club_name || "غير متوفر"}</p>
      </div>
    </div>

    {/* Details section */}
    <div className="space-y-4">
      {/* Membership number */}
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        <span className="font-medium text-gray-700">رقم العضوية:</span>
        <span className="text-gray-600">{user.membership_number || "غير متوفر"}</span>
      </div>

      {/* National ID */}
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span className="font-medium text-gray-700">الرقم القومي:</span>
        <span className="text-gray-600">{user.national_id || "غير متوفر"}</span>
      </div>

      {/* Phone number */}
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-1.26 1.26a1 1 0 00-.707.293l-3.147 3.147a1 1 0 01-1.414-1.414l1.498-1.498a1 1 0 00.707-.293l1.26-1.26a1 1 0 011.21-.502z" />
        </svg>
        <span className="font-medium text-gray-700">رقم الهاتف:</span>
        <span className="text-gray-600">{user.phone || "غير متوفر"}</span>
      </div>

      {/* Secondary phone */}
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h2l.6 2.5M7 8.5h10l1-4H6.6" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 8.5L6 14h12l-1 5H8L7 8.5z" />
        </svg>
        <span className="font-medium text-gray-700">هاتف إضافي:</span>
        <span className="text-gray-600">{user.phone2 || "غير متوفر"}</span>
      </div>

      {/* Birth date */}
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="font-medium text-gray-700">تاريخ الميلاد:</span>
        <span className="text-gray-600">{user.birth_date || "غير متوفر"}</span>
      </div>

      {/* Job */}
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="font-medium text-gray-700">الوظيفة:</span>
        <span className="text-gray-600">{user.job || "غير متوفر"}</span>
      </div>

      {/* Address */}
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="font-medium text-gray-700">العنوان:</span>
        <span className="text-gray-600">{user.address || "غير متوفر"}</span>
      </div>

      {/* Referred by */}
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium text-gray-700">تم الترشيح من:</span>
        <span className="text-gray-600">{user.referred_by || "غير متوفر"}</span>
      </div>

      {/* Notes */}
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h6M13 8h2M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14l-4-4H5V5a2 2 0 012-2h12a2 2 0 012 2v4" />
        </svg>
        <span className="font-medium text-gray-700">ملاحظات:</span>
        <span className="text-gray-600">{user.note || "لا توجد ملاحظات"}</span>
      </div>

      {/* RFID code */}
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4V4zm4 4h8v8H8V8z" />
        </svg>
        <span className="font-medium text-gray-700">كود RFID:</span>
        <span className="text-gray-600">{user.rfid_code || "غير متوفر"}</span>
      </div>
    </div>
  </div>
</div>

  
  );
};

export default Member;