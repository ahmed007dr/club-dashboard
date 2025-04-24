import React, { useState } from 'react';
import { CiTrash, CiEdit } from 'react-icons/ci';
import { FaEye } from 'react-icons/fa';

const currentUser = { name: 'أحمد مصطفى', id: 1 };

const fakeInvites = [
  {
    id: 1,
    club: 'نادي الشباب',
    invited_by: 'محمد عبد الله',
    status: 'مفتوح',
    handled_by: 'سامي حسين',
    used: false,
  },
  {
    id: 2,
    club: 'نادي القمة',
    invited_by: 'هاني سالم',
    status: 'مستخدم',
    handled_by: 'هاني سالم',
    used: true,
  },
  {
    id: 3,
    club: 'نادي النجوم',
    invited_by: 'منى إبراهيم',
    status: 'مفتوح',
    handled_by: '',
    used: false,
  },
];

const FreeInvites = () => {
  const [invites, setInvites] = useState(fakeInvites);
  const handleMarkUsed = (id) => {
    setInvites((prev) =>
      prev.map((invite) =>
        invite.id === id
          ? { ...invite, status: 'مستخدم', handled_by: currentUser.name, used: true }
          : invite
      )
    );
  };

  return (
    <div dir="rtl" className="p-4">
      <h2 className="text-2xl font-semibold mb-4">الدعوات المجانية</h2>
      <button className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        إضافة دعوة مجانية
      </button>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead className="bg-blue-500 text-white">
            <tr>
              <th className="px-4 py-2 text-center">النادي</th>
              <th className="px-4 py-2 text-center">الداعي</th>
              <th className="px-4 py-2 text-center">الحالة</th>
              <th className="px-4 py-2 text-center">تمت بواسطة</th>
              <th className="px-4 py-2 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((invite) => (
              <tr key={invite.id} className="text-center border-b hover:bg-gray-100">
                <td className="px-4 py-2">{invite.club}</td>
                <td className="px-4 py-2">{invite.invited_by}</td>
                <td className="px-4 py-2">{invite.status}</td>
                <td className="px-4 py-2">{invite.handled_by || '—'}</td>
                <td className="px-4 py-2 space-x-2 space-x-reverse">
                  <button className="text-green-600 hover:text-green-800">
                    <FaEye />
                  </button>
                  <button className="text-blue-600 hover:text-blue-800">
                    <CiEdit />
                  </button>
                  <button className="text-red-600 hover:text-red-800">
                    <CiTrash />
                  </button>
                  {!invite.used && (
                    <button
                      onClick={() => handleMarkUsed(invite.id)}
                      className="text-yellow-600 hover:text-yellow-800"
                    >
                      تم الاستخدام
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FreeInvites;
