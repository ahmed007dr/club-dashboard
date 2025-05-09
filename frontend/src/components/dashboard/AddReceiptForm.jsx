import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addReceipt, fetchReceipts } from '../../redux/slices/receiptsSlice';
import { fetchSubscriptions } from '../../redux/slices/subscriptionsSlice';
import { toast } from 'react-hot-toast';

function AddReceiptForm({ onClose }) {
  const dispatch = useDispatch();
  const { subscriptions } = useSelector((state) => state.subscriptions);

  const [formData, setFormData] = useState({
    club: '',
    member: '',
    subscription: '',
    amount: '',
    payment_method: 'cash',
    note: '',
  });

  const [selectedClubName, setSelectedClubName] = useState('');

  useEffect(() => {
    dispatch(fetchSubscriptions());
  }, [dispatch]);

  // Get unique clubs with their IDs and names from club_details
  const uniqueClubs = Array.from(
    new Map(
      subscriptions.map(sub => [
        sub.club, 
        { 
          id: sub.club, 
          name: sub.club_details?.name || 'Unknown Club' 
        }
      ])
    ).values()
  );

  // Filter members based on selected club
  const filteredMembers = formData.club
    ? subscriptions.filter(sub => sub.club === parseInt(formData.club))
    : subscriptions;

  // Get unique members with their IDs and names from member_details
  const uniqueMembers = Array.from(
    new Map(
      filteredMembers.map(sub => [
        sub.member, 
        { 
          id: sub.member, 
          name: sub.member_details?.name || 'Unknown Member' 
        }
      ])
    ).values()
  );

  // Filter subscriptions based on selected member
  const filteredSubscriptions = formData.member
    ? subscriptions.filter(sub => sub.member === parseInt(formData.member))
    : [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const receiptData = {
      ...formData,
      club: parseInt(formData.club),
      member: parseInt(formData.member),
      subscription: parseInt(formData.subscription),
      amount: parseFloat(formData.amount),
    };
  
    try {
      await dispatch(addReceipt(receiptData)).unwrap();
      await dispatch(fetchReceipts());
  
      toast.success('تمت إضافة الإيصال بنجاح!'); // Arabic success toast
      onClose();
    } catch (error) {
      console.error("Error adding receipt:", error);
      toast.error('حدث خطأ أثناء إضافة الإيصال'); // Arabic error toast
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow-md">
      {/* Club Dropdown */}
      <div>
        <label className="block mb-1 font-medium">النادي</label>
        <select
          name="club"
          value={formData.club}
          onChange={(e) => {
            handleChange(e);
            setSelectedClubName(
              uniqueClubs.find(club => club.id === parseInt(e.target.value))?.name || ''
            );
            setFormData(prev => ({ 
              ...prev, 
              member: '', 
              subscription: '' 
            }));
          }}
          className="w-full border px-3 py-2 rounded-md"
          required
        >
          <option value="">-- اختر النادي --</option>
          {uniqueClubs.map(club => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      {/* Member Dropdown */}
      <div>
        <label className="block mb-1 font-medium">العضو</label>
        <select
          name="member"
          value={formData.member}
          onChange={(e) => {
            handleChange(e);
            setFormData(prev => ({ ...prev, subscription: '' }));
          }}
          className="w-full border px-3 py-2 rounded-md"
          required
          disabled={!formData.club}
        >
          <option value="">-- اختر العضو --</option>
          {uniqueMembers.map(member => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subscription Dropdown */}
      <div>
        <label className="block mb-1 font-medium">الاشتراك</label>
        <select
          name="subscription"
          value={formData.subscription}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md"
          required
          disabled={!formData.member}
        >
          <option value="">-- اختر الاشتراك --</option>
          {filteredSubscriptions.map(sub => (
            <option key={sub.id} value={sub.id}>
              {sub.type_details?.name || 'نوع غير معروف'} 
            </option>
          ))}
        </select>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block mb-1 font-medium">المبلغ</label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md"
          required
          step="0.01"
          min="0"
        />
      </div>

      {/* Payment Method */}
      <div>
        <label className="block mb-1 font-medium">طريقة الدفع</label>
        <select
          name="payment_method"
          value={formData.payment_method}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md"
        >
          <option value="cash">نقدي</option>
          <option value="bank">تحويل بنكي</option>
          <option value="visa">فيزا</option>
        </select>
      </div>

      {/* Note */}
      <div>
        <label className="block mb-1 font-medium">ملاحظات</label>
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          rows={3}
          className="w-full border px-3 py-2 rounded-md"
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-3 space-x-reverse">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
        >
          إلغاء
        </button>
        <button
          type="submit"
          className="btn"
          disabled={!formData.club || !formData.member || !formData.subscription || !formData.amount}
        >
          إضافة إيصال
        </button>
      </div>
    </form>
  );
}

export default AddReceiptForm;