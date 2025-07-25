import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkInStaff } from '../../redux/slices/AttendanceSlice';
import toast from 'react-hot-toast';

const CheckInForm = () => {
  const [rfidCode, setRfidCode] = useState('');
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.attendance);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rfidCode.trim()) {
      toast.error('يرجى إدخال رمز RFID');
      return;
    }

    const result = await dispatch(checkInStaff(rfidCode));
    if (checkInStaff.fulfilled.match(result)) {
      toast.success('تم تسجيل الدخول بنجاح');
      setRfidCode('');
    } else {
      toast.error(result.payload?.error || 'فشل في تسجيل الدخول');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 shadow-md rounded-md mb-6 text-right"
      dir="rtl"
    >
      <h2 className="text-xl font-semibold mb-4">تسجيل دخول الموظف</h2>
      <input
        type="text"
        value={rfidCode}
        onChange={(e) => setRfidCode(e.target.value)}
        placeholder="أدخل رمز RFID"
        className="w-full p-2 border border-gray-300 rounded mb-4 text-right"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full btn"
      >
        {loading ? 'جارٍ التسجيل...' : 'تسجيل الدخول'}
      </button>
    </form>
  );
};

export default CheckInForm;

