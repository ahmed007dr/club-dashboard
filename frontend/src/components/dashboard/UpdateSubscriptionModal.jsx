
import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionTypes, updateSubscription, fetchSubscriptions } from '../../redux/slices/subscriptionsSlice';
import { FaUser } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import BASE_URL from '../../config/api';

const UpdateSubscriptionModal = ({ isOpen, onClose, subscription, onSubmit }) => {
  const dispatch = useDispatch();
  const { subscriptionTypes, status: typesStatus, error: typesError } = useSelector(
    (state) => state.subscriptions
  );

  const [formData, setFormData] = useState({
    club: '',
    identifier: '',
    type: '',
    start_date: '',
    paid_amount: '',
    coach: '',
    coach_compensation_type: 'from_subscription',
    coach_compensation_value: '0',
    private_training_price: '',
  });

  const [clubs, setClubs] = useState([]);
  const [allCoaches, setAllCoaches] = useState([]);
  const [foundMember, setFoundMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchAllCoaches = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      let allCoaches = [];
      let nextUrl = `${BASE_URL}/accounts/api/users/`;
      while (nextUrl) {
        const response = await axios.get(nextUrl, { headers });
        allCoaches = [...allCoaches, ...response.data.results];
        nextUrl = response.data.next;
      }
      return allCoaches.filter(user => user.role === 'coach');
    } catch (error) {
      toast.error('فشل في تحميل بيانات المدربين');
      throw error;
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${BASE_URL}/members/api/members/`, { headers });
        const uniqueClubs = Array.from(
          new Map(
            response.data.results.map((m) => [
              m.club,
              { club_id: m.club, club_name: m.club_name || `Club ${m.club}` },
            ])
          ).values()
        );
        setClubs(uniqueClubs);
        const coachesResult = await fetchAllCoaches();
        setAllCoaches(coachesResult);
        setLoading(false);
      } catch (err) {
        setError('فشل في تحميل البيانات');
        setLoading(false);
      }
    };

    fetchData();
    dispatch(fetchSubscriptionTypes());
  }, [dispatch, fetchAllCoaches]);

  useEffect(() => {
    if (subscription && subscription.member_details) {
      setFormData({
        club: subscription.club?.toString() || '',
        identifier: subscription.member_details?.rfid_code || subscription.member_details?.phone || subscription.member_details?.name || '',
        type: subscription.type?.toString() || '',
        start_date: subscription.start_date || '',
        paid_amount: subscription.paid_amount || '0.00',
        coach: subscription.coach?.toString() || '',
        coach_compensation_type: subscription.coach_compensation_type || 'from_subscription',
        coach_compensation_value: subscription.coach_compensation_value?.toString() || '0.00',
        private_training_price: subscription.private_training_price || '',
      });

      setFoundMember({
        id: subscription.member_details.id,
        name: subscription.member_details.name,
        photo: subscription.member_details.photo,
        membership_number: subscription.member_details.membership_number,
        phone: subscription.member_details.phone,
        rfid_code: subscription.member_details.rfid_code,
        club_id: subscription.member_details.club,
        club_name: subscription.member_details.club_name,
        address: subscription.member_details.address,
        birth_date: subscription.member_details.birth_date,
        job: subscription.member_details.job,
        national_id: subscription.member_details.national_id,
      });
    } else {
      setFoundMember(null);
    }
  }, [subscription]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'coach' && !value ? {
        coach_compensation_type: 'from_subscription',
        coach_compensation_value: '0.00',
      } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
//     console.log('handleSubmit triggered', { formData, foundMember });

    if (!formData.club || !formData.type || !formData.start_date || !formData.paid_amount) {
      setErrorMessage('يرجى ملء جميع الحقول المطلوبة');
      setErrorModal(true);
      return;
    }

    if (isNaN(parseFloat(formData.paid_amount)) || parseFloat(formData.paid_amount) < 0) {
      setErrorMessage('المبلغ المدفوع يجب أن يكون رقمًا صحيحًا غير سالب');
      setErrorModal(true);
      return;
    }

    if (formData.private_training_price && (isNaN(parseFloat(formData.private_training_price)) || parseFloat(formData.private_training_price) < 0)) {
      setErrorMessage('سعر التدريب الخاص يجب أن يكون رقمًا صحيحًا غير سالب');
      setErrorModal(true);
      return;
    }

    if (formData.coach && (!formData.coach_compensation_type || isNaN(parseFloat(formData.coach_compensation_value)) || parseFloat(formData.coach_compensation_value) < 0)) {
      setErrorMessage('يرجى تحديد نوع تعويض المدرب وقيمة صالحة غير سالبة');
      setErrorModal(true);
      return;
    }

    if (formData.coach_compensation_type === 'from_subscription' && parseFloat(formData.coach_compensation_value) > 100) {
      setErrorMessage('نسبة المدرب لا يمكن أن تتجاوز 100%');
      setErrorModal(true);
      return;
    }

    if (!foundMember) {
      setErrorMessage('يرجى اختيار عضو صالح');
      setErrorModal(true);
      return;
    }

    const payload = {
      club: parseInt(formData.club),
      member: foundMember.id,
      type: parseInt(formData.type),
      start_date: formData.start_date,
      paid_amount: parseFloat(formData.paid_amount).toFixed(2),
      coach: formData.coach ? parseInt(formData.coach) : null,
      coach_compensation_type: formData.coach ? formData.coach_compensation_type : null,
      coach_compensation_value: formData.coach ? parseFloat(formData.coach_compensation_value).toFixed(2) : '0.00',
      private_training_price: formData.private_training_price ? parseFloat(formData.private_training_price).toFixed(2) : null,
      id: subscription.id,
    };

    try {
      await dispatch(updateSubscription({ id: subscription.id, subscriptionData: payload })).unwrap();
      toast.success('تم تحديث الاشتراك بنجاح');
      await dispatch(fetchSubscriptions({ page: 1, pageSize: 20, searchTerm: '', clubName: '', startDate: '', endDate: '', entryCount: '', status: '' })).unwrap();
      if (onSubmit) onSubmit(payload);
      onClose();
    } catch (error) {
      const errorMsg = error?.coach_compensation_value?.[0] || error?.message || 'حدث خطأ غير متوقع';
      setErrorMessage(errorMsg);
      setErrorModal(true);
    }
  };

  if (!isOpen) return null;

  if (typesStatus === 'loading' || loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-sm">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (typesError || error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-sm">
          <p className="text-red-500 text-center text-xs">{typesError || error}</p>
          <button
            className="mt-3 px-4 py-1 bg-gray-200 rounded hover:bg-gray-300 text-xs"
            onClick={onClose}
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-xl" dir="rtl">
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm w-full">
              <h3 className="text-base font-bold mb-3 text-right">حدث خطأ</h3>
              <p className="text-red-600 text-right text-xs">{errorMessage}</p>
              <div className="mt-3 flex justify-end">
                <button
                  className="px-4 py-1 bg-gray-200 rounded hover:bg-gray-300 text-xs"
                  onClick={() => setErrorModal(false)}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          className="absolute top-2 left-2 text-gray-500 hover:text-gray-800 text-sm"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-lg font-bold mb-3 text-right text-blue-600">تعديل الاشتراك</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">النادي</label>
              <select
                name="club"
                value={formData.club}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-gray-100 cursor-not-allowed"
                required
                disabled
              >
                <option value="none">{foundMember?.club_name || 'اختر النادي'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">RFID أو الاسم أو رقم الهاتف</label>
              <input
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-gray-100 cursor-not-allowed"
                placeholder="أدخل RFID أو الاسم أو رقم الهاتف"
                disabled
              />
            </div>
            <div className="col-span-2">
              {foundMember && (
                <div className="border border-gray-200 rounded p-3 bg-blue-50">
                  <div className="flex items-start gap-3">
                    {foundMember.photo ? (
                      <img
                        src={foundMember.photo}
                        alt="Member"
                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border-2 border-blue-500">
                        <FaUser />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-base text-blue-600">{foundMember.name}</h3>
                      <p className="text-gray-600 text-xs">#{foundMember.membership_number}</p>
                      <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                        <p><span className="font-medium">الهاتف:</span> {foundMember.phone || "غير متوفر"}</p>
                        <p><span className="font-medium">RFID:</span> {foundMember.rfid_code || "غير مسجل"}</p>
                        <p><span className="font-medium">النادي:</span> {foundMember.club_name}</p>
                        <p><span className="font-medium">العنوان:</span> {foundMember.address || "غير متوفر"}</p>
                        {foundMember.birth_date && (
                          <p><span className="font-medium">تاريخ الميلاد:</span> {new Date(foundMember.birth_date).toLocaleDateString("ar-EG")}</p>
                        )}
                        <p><span className="font-medium">المهنة:</span> {foundMember.job || "غير متوفر"}</p>
                        <p><span className="font-medium">الرقم القومي:</span> {foundMember.national_id || "غير متوفر"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">نوع الاشتراك</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="none">اختر نوع الاشتراك</option>
                {subscriptionTypes?.results
                  ?.filter((type) => type.club_details.id.toString() === formData.club?.toString())
                  .map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} - {type.price} جنيه (مدة: {type.duration_days} يوم)
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">المدرب</label>
              <select
                name="coach"
                value={formData.coach}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              >
                <option value="none">بدون مدرب</option>
                {allCoaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.username}
                  </option>
                ))}
              </select>
            </div>
            {formData.coach && (
              <>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700">نوع تعويض المدرب</label>
                  <select
                    name="coach_compensation_type"
                    value={formData.coach_compensation_type}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="from_subscription">من داخل قيمة الاشتراك (نسبة %)</option>
                    <option value="external">مبلغ خارجي (جنيه)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700">
                    {formData.coach_compensation_type === 'from_subscription' ? 'نسبة المدرب (%)' : 'مبلغ المدرب (جنيه)'}
                  </label>
                  <input
                    type="number"
                    step={formData.coach_compensation_type === 'from_subscription' ? "0.1" : "0.01"}
                    min="0"
                    name="coach_compensation_value"
                    value={formData.coach_compensation_value}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">تاريخ البداية</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">المبلغ المدفوع</label>
              <input
                type="number"
                name="paid_amount"
                step="0.01"
                min="0"
                value={formData.paid_amount}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="0.00"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1 text-gray-700">سعر التدريب الخاص (اختياري)</label>
              <input
                type="number"
                name="private_training_price"
                step="0.01"
                min="0"
                value={formData.private_training_price}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            {formData.type && subscriptionTypes?.results?.find((type) => type.id.toString() === formData.type) && (
              <div className="col-span-2 text-xs text-gray-600 text-right">
                <p>تاريخ النهاية المتوقع: {
                  new Date(
                    new Date(formData.start_date).getTime() +
                    subscriptionTypes.results.find((type) => type.id.toString() === formData.type).duration_days * 24 * 60 * 60 * 1000
                  ).toLocaleDateString('ar-EG')
                }</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              className="px-4 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs"
              onClick={onClose}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={!foundMember || loading}
            >
              تحديث الاشتراك
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateSubscriptionModal;
