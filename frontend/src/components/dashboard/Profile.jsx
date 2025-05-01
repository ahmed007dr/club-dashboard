import React, { useState, useEffect } from 'react';
import { BsPersonBoundingBox } from 'react-icons/bs';
import axios from 'axios';
import BASE_URL from '../../config/api';

const Profile = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BASE_URL}/accounts/api/profile/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setData(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="p-4 overflow-x-auto" dir="rtl">
      <div className="flex items-start space-x-3">
        <BsPersonBoundingBox className='text-blue-600 h-9 w-9 text-2xl' />
        <h1 className="text-2xl font-bold mb-4">الملف الشخصي</h1>

      </div>

      {data ? (
        <>
          {/* Card layout for small screens */}
          <div className="block sm:hidden">
            <div className=" p-4 border border-gray-200 rounded-lg shadow-md space-y-4">
              <div className="flex justify-between">
                <span className="font-semibold">ID:</span>
                <span>{data.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Username:</span>
                <span>{data.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">First Name:</span>
                <span>{data.first_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Last Name:</span>
                <span>{data.last_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Email:</span>
                <span>{data.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Role:</span>
                <span className="capitalize">{data.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Club:</span>
                <span>{data.club || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Is Active:</span>
                <span>
                  {data.is_active ? (
                    <span className="bg-light-green px-2 py-1 rounded text-xs">Yes</span>
                  ) : (
                    <span className="bg-light-red px-2 py-1 rounded text-xs">No</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Table layout for larger screens */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full border border-gray-200 table-auto">
            <thead className="text-left">
  <tr>
    <th className="p-3 border-b">المعرف</th>
    <th className="p-3 border-b">اسم المستخدم</th>
    <th className="p-3 border-b">الاسم الأول</th>
    <th className="p-3 border-b">الاسم الأخير</th>
    <th className="p-3 border-b">البريد الإلكتروني</th>
    <th className="p-3 border-b">الدور</th>
    <th className="p-3 border-b">النادي</th>
    <th className="p-3 border-b">نشط</th>
  </tr>
</thead>

              <tbody>
                <tr>
                  <td className="p-3 border-b">{data.id}</td>
                  <td className="p-3 border-b">{data.username}</td>
                  <td className="p-3 border-b">{data.first_name || '-'}</td>
                  <td className="p-3 border-b">{data.last_name || '-'}</td>
                  <td className="p-3 border-b">{data.email}</td>
                  <td className="p-3 border-b capitalize">{data.role}</td>
                  <td className="p-3 border-b">{data.club || '-'}</td>
                  <td className="p-3 border-b">
                    {data.is_active ? (
                      <span className="bg-light-green px-2 py-1 rounded text-xs">Yes</span>
                    ) : (
                      <span className="bg-light-red px-2 py-1 rounded text-xs">No</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-gray-500">Loading profile...</p>
      )}
    </div>
  );
};

export default Profile;
