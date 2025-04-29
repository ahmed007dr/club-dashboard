import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchMemberSubscriptions } from '../../redux/slices/subscriptionsSlice';

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
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-lg rounded-lg" dir="rtl">
      <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">
        الاشتراكات للعضو {memberId}
      </h2>

      {memberSubscriptions && memberSubscriptions.length > 0 ? (
        <ul className="space-y-6">
          {memberSubscriptions.map((sub) => (
            <li key={sub.id} className="p-5 border border-gray-300 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-green-700 mb-2">{sub.type_details.name}</h3>
              <p><strong>النادي:</strong> {sub.club_name}</p>
              <p><strong>العضو:</strong> {sub.member_name}</p>
              <p><strong>تاريخ البداية:</strong> {new Date(sub.start_date).toLocaleDateString()}</p>
              <p><strong>تاريخ النهاية:</strong> {new Date(sub.end_date).toLocaleDateString()}</p>
              <p><strong>المدة:</strong> {sub.type_details.duration_days} يوم</p>
              <p><strong>السعر:</strong> ${sub.type_details.price}</p>
              <p><strong>المدفوع:</strong> ${sub.paid_amount}</p>
              <p><strong>المتبقي:</strong> ${sub.remaining_amount}</p>
              <p><strong>أيام الحضور:</strong> {sub.attendance_days}</p>
              <div className="mt-2">
                <p><strong>يشمل:</strong></p>
                <ul className="list-disc list-inside text-sm ml-2">
                  {sub.type_details.includes_gym && <li>صالات الألعاب</li>}
                  {sub.type_details.includes_pool && <li>المسبح</li>}
                  {sub.type_details.includes_classes && <li>الصفوف الجماعية</li>}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500">لا توجد اشتراكات حالياً.</p>
      )}
    </div>
  );
};

export default MemberSubscriptions;


