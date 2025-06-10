import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from '../../redux/slices/memberSlice';
import { fetchSubscriptionTypes, updateSubscription } from '../../redux/slices/subscriptionsSlice';
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
    end_date: '',
    paid_amount: '',
    coach: '',
    private_training_price: '',
  });

  const [clubs, setClubs] = useState([]);
  const [allMembers, setAllMembers] = useState({ results: [] });
  const [allCoaches, setAllCoaches] = useState([]);
  const [foundMember, setFoundMember] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false); // Fixed typo here
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch all coaches
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
      
      return allCoaches.filter(user => user.role === 'coach');
    } catch (error) {
      console.error('Failed to fetch all coaches:', error);
      toast.error('فشل في تحميل بيانات المدربين');
      throw error;
    }
  };

  // Fetch all members across pages
  const fetchAllUsers = async () => {
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
      console.error("Failed to fetch all users:", error.message);
      throw error;
    }
  };

  // Fetch users, clubs, and coaches on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersResult, coachesResult] = await Promise.all([
          fetchAllUsers(),
          fetchAllCoaches(),
        ]);

        // Extract unique clubs
        const uniqueClubs = Array.from(
          new Map(
            membersResult.results.map((m) => [
              m.club,
              { club_id: m.club, club_name: m.club_name || `Club ${m.club}` },
            ])
          ).values()
        );
        setClubs(uniqueClubs);
        setAllMembers(membersResult);
        setAllCoaches(coachesResult);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load data");
        setLoading(false);
      }
    };

    fetchData();
    dispatch(fetchSubscriptionTypes());
  }, [dispatch]);

  // Populate form data when subscription prop changes
  useEffect(() => {
    if (subscription) {
      setFormData({
        club: subscription.club?.toString() || '',
        identifier: subscription.member_details?.rfid_code || subscription.member_details?.phone || subscription.member_details?.name || '',
        type: subscription.type?.toString() || '',
        start_date: subscription.start_date || '',
        end_date: subscription.end_date || '',
        paid_amount: subscription.paid_amount || '',
        coach: subscription.coach?.toString() || '',
        private_training_price: subscription.private_training_price || '',
      });

      if (subscription.member_details) {
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
      }
    }
  }, [subscription]);

  // Handle member search when identifier changes
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
        national_id: member.national_id,
      });
    }

    setSearchLoading(false);
  }, [formData.identifier, formData.club, allMembers.results]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.club || !formData.identifier || !formData.type || !formData.start_date || !formData.end_date || !formData.paid_amount) {
      setErrorMessage("يرجى ملء جميع الحقول المطلوبة");
      setIsModalOpen(true);
      return;
    }

    if (isNaN(parseFloat(formData.paid_amount))) {
      setErrorMessage("المبلغ المدفوع يجب أن يكون رقمًا صحيحًا");
      setIsModalOpen(true);
      return;
    }

    if (formData.private_training_price && isNaN(parseFloat(formData.private_training_price))) {
      setErrorMessage("سعر التدريب الخاص يجب أن يكون رقمًا صحيحًا");
      setIsModalOpen(true);
      return;
    }

    if (!foundMember) {
      setErrorMessage("يرجى اختيار عضو صالح");
      setIsModalOpen(true);
      return;
    }

    const payload = {
      club: parseInt(formData.club),
      member: foundMember.id,
      type: parseInt(formData.type),
      start_date: formData.start_date,
      end_date: formData.end_date,
      paid_amount: parseFloat(formData.paid_amount),
      coach: formData.coach ? parseInt(formData.coach) : null,
      private_training_price: formData.private_training_price ? parseFloat(formData.private_training_price) : null,
      id: subscription.id,
    };

    try {
      await dispatch(updateSubscription(payload)).unwrap();
      toast.success('تم تحديث الاشتراك بنجاح');
      if (onSubmit) onSubmit(payload);
      onClose();
    } catch (error) {
      let errorData = error.payload || error.data || error.response || error;
      if (errorData?.non_field_errors && Array.isArray(errorData.non_field_errors)) {
        setErrorMessage(errorData.non_field_errors[0]);
      } else {
        setErrorMessage(errorData?.message || error.message || "حدث خطأ غير متوقع");
      }
      setIsModalOpen(true);
    }
  };

  if (!isOpen) return null;

  if (typesStatus === 'loading' || loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
          <p>جاري تحميل...</p>
        </div>
      </div>
    );
  }

  if (typesError || error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
          <p className="text-red-500">{typesError || error}</p>
          <button
            className="mt-4 px-4 py-2 bg-gray-200 rounded"
            onClick={onClose}
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md relative" dir="rtl">
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">حدث خطأ</h3>
              <p className="text-red-600">{errorMessage}</p>
              <div className="mt-4 flex justify-end">
                <button
                  className="px-4 py-2 bg-gray-200 rounded"
                  onClick={() => setIsModalOpen(false)}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          className="absolute top-2 left-2 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          X
        </button>
        <h2 className="text-xl font-bold mb-4">تعديل الاشتراك</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Club & Identifier Inputs */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-2">النادي</label>
              <select
                name="club"
                value={formData.club}
                onChange={(e) => {
                  handleInputChange(e);
                  setFormData((prev) => ({ ...prev, identifier: '' }));
                }}
                className="w-full p-2 border border-gray-300 rounded"
                required
              >
                <option value="">اختر النادي</option>
                {clubs.map((club) => (
                  <option key={club.club_id} value={club.club_id}>
                    {club.club_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-2">RFID أو الاسم أو رقم الهاتف</label>
              <input
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="أدخل RFID أو الاسم أو رقم الهاتف"
                disabled={!formData.club}
                required
              />
            </div>
          </div>

          {/* Loading and Errors */}
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

          {/* Member Info Display */}
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
                    {foundMember.birth_date && (
                      <p>
                        <span className="font-medium">تاريخ الميلاد:</span>{" "}
                        {new Date(foundMember.birth_date).toLocaleDateString("ar-EG")}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">المهنة:</span> {foundMember.job || "غير متوفر"}
                    </p>
                    <p>
                      <span className="font-medium">الرقم القومي:</span> {foundMember.national_id || "غير متوفر"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Type & Coach */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-2">نوع الاشتراك</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                disabled={!foundMember}
                required
              >
                <option value="">اختر نوع الاشتراك</option>
                {subscriptionTypes?.results
                  ?.filter((type) => type.club_details.id.toString() === formData.club?.toString())
                  .map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} - {type.price} جنيها
                    </option>
                  ))}
              </select>
            </div>

            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-2">المدرب</label>
              <select
                name="coach"
                value={formData.coach}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                disabled={!foundMember}
              >
                <option value="">اختر مدربًا</option>
                {allCoaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.username}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Date & End Date */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-2">تاريخ البداية</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                disabled={!foundMember}
                required
              />
            </div>
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-2">تاريخ النهاية</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                disabled={!foundMember}
                required
              />
            </div>
          </div>

          {/* Paid Amount & Private Training Price */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-2">المبلغ المدفوع</label>
              <input
                type="number"
                name="paid_amount"
                step="0.01"
                value={formData.paid_amount}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="0.00"
                disabled={!foundMember}
                required
              />
            </div>
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-2">سعر التدريب الخاص</label>
              <input
                type="number"
                name="private_training_price"
                step="0.01"
                value={formData.private_training_price}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="0.00"
                disabled={!foundMember}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={!foundMember}
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
