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
    <div className="p-4 min-h-screen flex items-start justify-center">
      {data ? (
        <div className="bg-white rounded-3xl  p-8 w-full max-w-xl text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <BsPersonBoundingBox className="text-blue-600 w-12 h-12" />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-1 capitalize">{data.username}</h2>
          <p className="text-gray-500 mb-4">{data.email}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-left mt-6">
            <ProfileItem label="ID" value={data.id} />
            <ProfileItem label="Role" value={capitalize(data.role)} />
            <ProfileItem label="First Name" value={data.first_name || '-'} />
            <ProfileItem label="Last Name" value={data.last_name || '-'} />
            <ProfileItem label="Club" value={data.club.name || '-'} />
            <ProfileItem
              label="Is Active"
              value={
                data.is_active ? (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Yes</span>
                ) : (
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">No</span>
                )
              }
            />
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-center">Loading profile...</p>
      )}
    </div>
  );
};

const ProfileItem = ({ label, value }) => (
  <div className="flex flex-col bg-gray-50 px-4 py-3 rounded-lg shadow-sm">
    <span className="text-gray-500 text-sm font-semibold">{label}</span>
    <span className="text-gray-800 mt-1">{value}</span>
  </div>
);

const capitalize = (s) => s && s.charAt(0).toUpperCase() + s.slice(1);

export default Profile;
