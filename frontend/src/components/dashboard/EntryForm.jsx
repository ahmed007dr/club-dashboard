import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchClubs } from '../../redux/slices/clubSlice';
import { fetchSubscriptions } from "../../redux/slices/subscriptionsSlice";
import { FaUser } from 'react-icons/fa';
import toast from 'react-hot-toast';
import BASE_URL from '../../config/api';

const EntryForm = ({ onSuccess }) => {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    club: '',
    identifier: '',
  });

  const [clubs, setClubs] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [foundMember, setFoundMember] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const getClubs = async () => {
      try {
        const res = await dispatch(fetchClubs()).unwrap();
        setClubs(res);
      } catch (error) {
        console.error('خطأ في جلب الأندية:', error);
        toast.error('فشل في جلب قائمة الأندية');
      }
    };

    const getSubscriptions = async () => {
      try {
        const res = await dispatch(fetchSubscriptions()).unwrap();
        setSubscriptions(res);
      } catch (error) {
        console.error('خطأ في جلب الاشتراكات:', error);
      }
    };

    getClubs();
    getSubscriptions();
  }, [dispatch]);

  const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData({ 
    ...formData, 
    [name]: value 
  });

  // Search for member when identifier changes
  if (name === 'identifier') {
    setFoundMember(null);
    
    if (!value.trim()) return;
    
    setSearchLoading(true);
    
    setTimeout(() => {
      const subscription = subscriptions.find(sub => 
        sub.member_details?.membership_number == value || // Membership number
        sub.member_details?.rfid_code == value ||        // RFID code
        sub.member_details?.national_id == value        // National ID
      );
      
      if (subscription) {
        setFoundMember({
          // Member details
          ...subscription.member_details,
          id: subscription.member_details?.id,
          name: subscription.member_details?.name,
          photo: subscription.member_details?.photo,
          membership_number: subscription.member_details?.membership_number,
          phone: subscription.member_details?.phone,
          rfid_code: subscription.member_details?.rfid_code,
          national_id: subscription.member_details?.national_id,
          
          // Subscription details
          subscription_id: subscription.id,
          club_id: subscription.club_details?.id,
          club_name: subscription.club_details?.name,
          subscription_status: subscription.status,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
          remaining_amount: subscription.remaining_amount,
          
          // Entry details
          entry_count: subscription.entry_count,
          max_entries: subscription.type_details?.max_entries,
          remaining_entries: subscription.type_details?.max_entries - subscription.entry_count,
          
          // Type details
          subscription_type: subscription.type_details?.name,
          price: subscription.type_details?.price
        });
        
        // Auto-fill club if not already set
        if (!formData.club && subscription.club_details) {
          setFormData(prev => ({
            ...prev,
            club: subscription.club_details.id
          }));
        }
      }
      
      setSearchLoading(false);
    }, 300);
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!foundMember) {
      toast.error('الرجاء إدخال معرّف صحيح');
      return;
    }

    try {
      const token = localStorage.getItem('token');
  
      const requestBody = {
        club: Number(formData.club),
        identifier: formData.identifier,
        member_id: foundMember.id // Include member ID
      };
  
      const response = await fetch(`${BASE_URL}/attendance/api/entry-logs/add/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error('تفاصيل الخطأ من السيرفر:', data);
        throw new Error(data.message || 'فشل في إضافة سجل الدخول');
      }
  
      toast.success('تم إضافة سجل الدخول بنجاح!');
      setFormData({ club: '', identifier: '' });
      setFoundMember(null);
  
      if (onSuccess) {
        onSuccess();
      }
  
    } catch (error) {
      console.error('خطأ أثناء إرسال السجل:', error);
      toast.error(error.message || 'حدث خطأ أثناء إضافة السجل');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-6 border rounded-lg shadow-md" dir="rtl">
      <h2 className="text-xl font-semibold mb-4 text-center">سجل الدخول للنادي</h2>
      
      <div>
        <label className="block text-sm mb-1">النادي</label>
        <select
          name="club"
          value={formData.club}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          required
        >
          <option value="">اختر ناديًا</option>
          {clubs.map((club) => (
            <option key={club.id || club._id} value={club.id || club._id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1">المعرّف (رقم العضوية أو RFID)</label>
        <input
          type="text"
          name="identifier"
          placeholder="أدخل رقم العضوية أو كود RFID"
          value={formData.identifier}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded"
        />
      </div>

      {searchLoading && (
        <div className="text-center py-2">
          <p>جاري البحث عن العضو...</p>
        </div>
      )}

      {formData.identifier && !foundMember && !searchLoading && (
        <div className="text-red-500 text-sm text-center">
          <p>لا يوجد عضو بهذا المعرّف</p>
        </div>
      )}

{foundMember && (
  <div className="border-t pt-5 mt-5 space-y-4">
    <h4 className="font-semibold text-gray-700">بيانات الاشتراك:</h4>
    <div className="flex items-start gap-4">
      {foundMember.photo ? (
        <img
          src={foundMember.photo}
          alt="Member"
          className="w-12 h-12 rounded-full object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl">
          <FaUser />
        </div>
      )}
      <div className="flex-1 space-y-1">
        <p className="font-medium text-gray-800">
          {foundMember.name || "غير متوفر"}
        </p>
        <p className="text-sm text-gray-500">
          #{foundMember.membership_number || "غير متوفر"}
        </p>
        <p className="text-sm text-red-500">
          <span className="font-medium text-gray-700">المبلغ المتبقي: </span>
          {foundMember.remaining_amount || "غير متوفر"}
        </p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
      <p>
        <span className="font-medium">النادي: </span>
        {foundMember.club_name || "غير متوفر"}
      </p>
      <p>
        <span className="font-medium">الحالة: </span>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            foundMember.subscription_status === "Active"
              ? "bg-green-100 text-green-600"
              : foundMember.subscription_status === "Expired"
              ? "bg-red-100 text-red-600"
              : "bg-blue-100 text-blue-600"
          }`}
        >
          {foundMember.subscription_status || "غير متوفر"}
        </span>
      </p>
      <p>
        <span className="font-medium">الهاتف: </span>
        {foundMember.phone || "غير متوفر"}
      </p>
      <p>
        <span className="font-medium">RFID: </span>
        {foundMember.rfid_code || "غير مسجل"}
      </p>
      <p>
        <span className="font-medium">تاريخ البدء: </span>
        {foundMember.start_date 
          ? new Date(foundMember.start_date).toLocaleDateString("ar-EG") 
          : "غير متوفر"}
      </p>
      <p>
        <span className="font-medium">تاريخ الانتهاء: </span>
        {foundMember.end_date 
          ? new Date(foundMember.end_date).toLocaleDateString("ar-EG") 
          : "غير متوفر"}
      </p>
      <p className="col-span-2">
        <span className="font-medium">الإدخالات المتبقية: </span>
        {foundMember.max_entries !== undefined && foundMember.remaining_entries !== undefined ? (
          <>
            <span
              className={`font-bold ${
                foundMember.remaining_entries <= 0
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {foundMember.remaining_entries}
            </span>
            <span className="text-xs text-gray-500">
              / {foundMember.max_entries}
            </span>
          </>
        ) : (
          "غير متوفر"
        )}
      </p>
    </div>
  </div>
)}
      {foundMember && (
        <div className="text-sm text-center text-gray-500 mt-2">
          <p>الرجاء التأكد من صحة المعلومات قبل المتابعة.</p>
        </div>
      )}

      <button
        type="submit"
        className={`w-full btn py-2 mt-4 ${
          !foundMember ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        } text-white rounded`}
        disabled={!foundMember}
      >
        تسجيل الدخول
      </button>
    </form>
  );
};

export default EntryForm;






