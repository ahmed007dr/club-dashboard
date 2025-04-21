// src/pages/Member.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const fakeMembers = [
  {
    id: 1,
    photo: "https://i.pravatar.cc/100?img=11",
    name: "Ahmed El-Zahrani",
    membership_number: "1001",
    national_id: "102030405060",
    phone: "0101234567",
    club_name: "Sports Club",
  },
  {
    id: 2,
    photo: "https://i.pravatar.cc/100?img=12",
    name: "Sara Al-Otaibi",
    membership_number: "1002",
    national_id: "112233445566",
    phone: "0109876543",
    club_name: "Sports Club",
  },
];

const Member = () => {
  const { id } = useParams();
  const [member, setMember] = useState(null);

  useEffect(() => {
    const found = fakeMembers.find((m) => m.id === parseInt(id));
    setMember(found);
  }, [id]);

  if (!member) return <div className="p-4">Member not found.</div>;

  return (
    <div className="p-6 max-w-xl mx-auto bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Member Details</h2>
      <div className="flex items-center gap-4 mb-4">
        <img
          src={member.photo}
          alt="Profile"
          className="w-20 h-20 rounded-full object-cover"
        />
        <div>
          <h3 className="text-xl font-semibold">{member.name}</h3>
          <p className="text-gray-600">Club: {member.club_name}</p>
        </div>
      </div>
      <ul className="space-y-2">
        <li><strong>Membership Number:</strong> {member.membership_number}</li>
        <li><strong>National ID:</strong> {member.national_id}</li>
        <li><strong>Phone:</strong> {member.phone}</li>
      </ul>
    </div>
  );
};

export default Member;
