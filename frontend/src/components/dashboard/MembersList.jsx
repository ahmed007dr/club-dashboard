import React, { useEffect, useState } from "react";
import axios from "axios";

const MemberList = () => {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const token = localStorage.getItem('token'); // make sure the token is stored under 'token'
    
        const response = await axios.get('http://127.0.0.1:8000/members/api/members/', {
          headers: {
            Authorization: `Token ${token}`, // Use Token prefix for Django REST Framework
          },
        });
    
        console.log(response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    };

    fetchMembers();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Member List</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <div key={member.id} className="p-4 bg-white shadow rounded-lg">
            <h2 className="text-xl font-semibold">{member.name}</h2>
            <p className="text-gray-600">Membership #: {member.membership_number}</p>
            <p className="text-gray-600">National ID: {member.national_id}</p>
            <p className="text-gray-600">Phone: {member.phone}</p>
            <p className="text-gray-600">Birth Date: {member.birth_date}</p>
            <p className="text-gray-600">Club: {member.club_name}</p>
            {member.referred_by_name && (
              <p className="text-gray-500 text-sm">Referred by: {member.referred_by_name}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemberList;





