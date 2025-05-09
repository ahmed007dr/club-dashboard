import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkInStaff, checkOutStaff } from '../../redux/slices/AttendanceSlice';
import toast from 'react-hot-toast';

const AttendanceForm = () => {
  const [rfidCodeCheckIn, setRfidCodeCheckIn] = useState('');
  const [rfidCodeCheckOut, setRfidCodeCheckOut] = useState('');
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.attendance);

  // Handle Check-In
  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!rfidCodeCheckIn.trim()) {
      toast.error('يرجى إدخال رمز RFID لتسجيل الدخول');
      return;
    }

    const result = await dispatch(checkInStaff(rfidCodeCheckIn));
    if (checkInStaff.fulfilled.match(result)) {
      toast.success('تم تسجيل الدخول بنجاح');
      setRfidCodeCheckIn('');
    } else {
      toast.error(result.payload?.error || 'فشل في تسجيل الدخول');
    }
  };

  // Handle Check-Out
  const handleCheckOutSubmit = async (e) => {
    e.preventDefault();
    if (!rfidCodeCheckOut.trim()) {
      toast.error('يرجى إدخال رمز RFID لتسجيل الخروج');
      return;
    }

    const result = await dispatch(checkOutStaff(rfidCodeCheckOut));
    if (checkOutStaff.fulfilled.match(result)) {
      toast.success('تم تسجيل الخروج بنجاح');
      setRfidCodeCheckOut('');
    } else {
      toast.error(result.payload?.error || 'فشل في تسجيل الخروج');
    }
  };

  return (
    <div className="space-y-6">
      {/* Check-In Form */}
      <div className="bg-white p-6 shadow-md rounded-md text-right" dir="rtl">
        <h2 className="text-xl font-semibold mb-4">تسجيل دخول الموظف</h2>
        <form onSubmit={handleCheckInSubmit}>
          <input
            type="text"
            value={rfidCodeCheckIn}
            onChange={(e) => setRfidCodeCheckIn(e.target.value)}
            placeholder="أدخل رمز RFID لتسجيل الدخول"
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
      </div>

      {/* Check-Out Form */}
      <div className="bg-white p-6 shadow-md rounded-md text-right" dir="rtl">
        <h2 className="text-xl font-semibold mb-4">تسجيل خروج الموظف</h2>
        <form onSubmit={handleCheckOutSubmit}>
          <input
            type="text"
            value={rfidCodeCheckOut}
            onChange={(e) => setRfidCodeCheckOut(e.target.value)}
            placeholder="أدخل رمز RFID لتسجيل الخروج"
            className="w-full p-2 border border-gray-300 rounded mb-4 text-right"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full btn"
          >
            {loading ? 'جارٍ تسجيل الخروج...' : 'تسجيل الخروج'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AttendanceForm;

