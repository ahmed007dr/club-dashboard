import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BASE_URL from '../../config/api';

const ClubUserSelector = () => {
  const [clubs, setClubs] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [selectedClubUsers, setSelectedClubUsers] = useState([]);

  useEffect(() => {
    const fetchUsersGroupedByClub = async () => {
      try {
        // Get token from localStorage and add it to the Authorization header
        const token = localStorage.getItem('token'); // Replace 'token' with the actual key if different
        const headers = {
          Authorization: `Bearer ${token}`,
        };
  
        const response = await axios.get(`${BASE_URL}/accounts/api/users/`, { headers });
        const users = response.data;
  
        const clubsMap = {};
  
        users.forEach(user => {
          const { club } = user;
          if (!club) return;
  
          if (!clubsMap[club.id]) {
            clubsMap[club.id] = {
              club_id: club.id,
              club_name: club.name,
              club_logo: club.logo,
              users: []
            };
          }
  
          clubsMap[club.id].users.push({
            id: user.id,
            username: user.username
          });
        });
  
        const clubArray = Object.values(clubsMap);
        console.log('Grouped Club Data:', clubArray); // 👈 Console log here
        setClubs(clubArray);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };
  
    fetchUsersGroupedByClub();
  }, []);
  

  const handleClubChange = (e) => {
    const clubId = e.target.value;
    setSelectedClubId(clubId);
    const selected = clubs.find(c => c.club_id.toString() === clubId);
    setSelectedClubUsers(selected ? selected.users : []);
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block mb-1 font-semibold">Select Club:</label>
        <select
          value={selectedClubId}
          onChange={handleClubChange}
          className="border p-2 rounded w-full"
        >
          <option value="">-- Choose a club --</option>
          {clubs.map(club => (
            <option key={club.club_id} value={club.club_id}>
              {club.club_name}
            </option>
          ))}
        </select>
      </div>

      {selectedClubUsers.length > 0 && (
        <div>
          <label className="block mb-1 font-semibold">Users in this club:</label>
          <select className="border p-2 rounded w-full">
            <option value="">-- Choose a user --</option>
            {selectedClubUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default ClubUserSelector;

