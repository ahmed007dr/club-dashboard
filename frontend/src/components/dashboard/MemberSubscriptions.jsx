import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchMemberSubscriptions } from '../../redux/slices/subscriptionsSlice';
import {
  FaUser,
  FaCalendarAlt,
  FaMoneyBillAlt,
  FaCheck,
  FaExclamation,
  FaClock,
  FaDumbbell,
  FaSwimmer,
  FaUsers,
  FaUniversity,
  FaListUl
} from 'react-icons/fa';
import { CiShoppingTag } from "react-icons/ci";

const MemberSubscriptions = () => {
  const { memberId } = useParams();
  const dispatch = useDispatch();

  const { memberSubscriptions, status, error } = useSelector(
    (state) => state.subscriptions
  );

  useEffect(() => {
    if (memberId) {
      dispatch(fetchMemberSubscriptions(memberId));
    }
  }, [dispatch, memberId]);

  if (status === 'loading') return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-2xl rounded-2xl" dir="rtl">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-10 flex items-center justify-center gap-3">
        <FaListUl className="text-green-600" />
        الاشتراكات للعضو {memberSubscriptions?.[0]?.member_name || "غير معروف"}
      </h2>
  
      {memberSubscriptions && memberSubscriptions.length > 0 ? (
        <ul className="space-y-6">
          {memberSubscriptions.map((sub) => (
            <li key={sub.id} className="p-6 border border-gray-200 rounded-xl shadow-md bg-gray-50 hover:bg-gray-100 transition">
              <h3 className="text-2xl font-semibold text-green-700 mb-4 flex items-center gap-2">
              <CiShoppingTag />
                {sub.type_details.name}
              </h3>
  
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700 text-[15px]">
                <p className="flex items-center gap-2"><FaUniversity /> <strong>النادي:</strong> {sub.club_name}</p>
                <p className="flex items-center gap-2"><FaUser /> <strong>العضو:</strong> {sub.member_name}</p>
                <p className="flex items-center gap-2"><FaCalendarAlt /> <strong>تاريخ البداية:</strong> {new Date(sub.start_date).toLocaleDateString()}</p>
                <p className="flex items-center gap-2"><FaCalendarAlt /> <strong>تاريخ النهاية:</strong> {new Date(sub.end_date).toLocaleDateString()}</p>
                <p className="flex items-center gap-2"><FaClock /> <strong>المدة:</strong> {sub.type_details.duration_days} يوم</p>
                <p className="flex items-center gap-2"><FaMoneyBillAlt /> <strong>السعر:</strong> ${sub.type_details.price}</p>
                <p className="flex items-center gap-2"><FaCheck /> <strong>المدفوع:</strong> ${sub.paid_amount}</p>
                <p className="flex items-center gap-2"><FaExclamation /> <strong>المتبقي:</strong> ${sub.remaining_amount}</p>
                <p className="flex items-center gap-2"><FaCalendarAlt /> <strong>أيام الحضور:</strong> {sub.attendance_days}</p>
              </div>
  
              <div className="mt-4">
                <p className="font-medium mb-2 flex items-center gap-2"><FaListUl /> يشمل:</p>
                <ul className="list-disc list-inside text-sm text-gray-600 ml-3 space-y-1">
                  {sub.type_details.includes_gym && <li className="flex items-center gap-2"><FaDumbbell /> صالات الألعاب</li>}
                  {sub.type_details.includes_pool && <li className="flex items-center gap-2"><FaSwimmer /> المسبح</li>}
                  {sub.type_details.includes_classes && <li className="flex items-center gap-2"><FaUsers /> الصفوف الجماعية</li>}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500 text-lg">لا توجد اشتراكات حالياً.</p>
      )}
    </div>
  );
  
};

export default MemberSubscriptions;


