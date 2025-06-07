import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { getStaffById } from '@/redux/slices/staff';
import { RiUserLine, RiPhoneLine, RiFileTextLine, RiBankCardLine, RiHomeLine } from 'react-icons/ri';

const StaffProfile = () => {
  const dispatch = useDispatch();
  const { id } = useParams();
  const shifts = useSelector((state) => state.staff.user || []);
  const { isloading, error } = useSelector((state) => state.staff || {});

  useEffect(() => {
    if (id) {
      dispatch(getStaffById(id));
    }
  }, [dispatch, id]);

  if (isloading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 text-lg font-medium text-gray-700" dir="rtl">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mr-3"></div>
        جاري التحميل...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 text-lg font-medium text-red-600" dir="rtl">
        <div className="bg-red-100 p-4 rounded-lg shadow-md">
          خطأ: {error}
        </div>
      </div>
    );
  }

  if (!shifts.length) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 text-lg font-medium text-gray-500" dir="rtl">
        <div className="bg-gray-100 p-4 rounded-lg shadow-md">
          لا توجد بيانات لهذا المستخدم
        </div>
      </div>
    );
  }

  const user = shifts[0].staff_details;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 space-x-reverse mb-8">
          <RiUserLine className="text-blue-600 w-8 h-8" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">ملف الموظف</h2>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-full">
                  <RiUserLine className="text-blue-600 w-16 h-16" />
                </div>
              </div>

              <div className="text-center space-y-3">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                  {user.first_name} {user.last_name}
                </h3>
                <p className="text-sm text-gray-600">اسم المستخدم: {user.username}</p>
                <p className="text-sm text-gray-600">الدور: {user.role}</p>
              </div>

              {/* قسم المعلومات الإضافية */}
              <div className="w-full border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">معلومات إضافية</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RiPhoneLine className="text-blue-600 w-5 h-5" />
                    <p>
                      <strong>رقم الهاتف:</strong>{' '}
                      {user.phone_number || 'غير متوفر'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RiBankCardLine className="text-blue-600 w-5 h-5" />
                    <p>
                      <strong>رقم البطاقة:</strong>{' '}
                      {user.card_number ? `****${user.card_number.slice(-4)}` : 'غير متوفر'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RiHomeLine className="text-blue-600 w-5 h-5" />
                    <p>
                      <strong>العنوان:</strong>{' '}
                      {user.address || 'غير متوفر'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RiFileTextLine className="text-blue-600 w-5 h-5" />
                    <p>
                      <strong>ملاحظات:</strong>{' '}
                      {user.notes || 'غير متوفر'}
                    </p>
                  </div>
                </div>
              </div>

              {/* قسم الورديات */}
              <div className="w-full border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">الورديات</h4>
                <ul className="space-y-4">
                  {shifts.map((shift) => {
                    const startTime = shift.shift_start?.split('T')[1]?.split('.')[0] || shift.shift_start;
                    const endTime = shift.shift_end?.split('T')[1]?.split('.')[0] || shift.shift_end;

                    const formattedStart = new Date(`1970-01-01T${startTime}`).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const formattedEnd = new Date(`1970-01-01T${endTime}`).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <li
                        key={shift.id}
                        className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                          <p><strong>التاريخ:</strong> {new Date(shift.date).toLocaleDateString('ar-EG')}</p>
                          <p><strong>من:</strong> {formattedStart}</p>
                          <p><strong>النادي:</strong> {shift.club_details?.name}</p>
                          <p><strong>إلى:</strong> {formattedEnd}</p>
                          <p><strong>الموقع:</strong> {shift.club_details?.location}</p>
                          <p>
                            <strong>تمت الموافقة من:</strong>{' '}
                            {shift.approved_by_details ? shift.approved_by_details.username : 'لم تتم الموافقة بعد'}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
            >
              العودة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;