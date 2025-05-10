import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import BASE_URL from '../../config/api';

function UserList() {
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsersGroupedByClub = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          Authorization: `Bearer ${token}`,
        };
  
        const response = await axios.get(`${BASE_URL}/accounts/api/users/`, { headers });
        const users = response.data;
        
        // RAW DATA DUMP
        console.log(users);
        
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

          clubsMap[club.id].users.push(user); // Push the entire user object
        });

        const clubArray = Object.values(clubsMap);
        console.log(clubArray); // Dump the final clubs data
        setClubs(clubArray);
        setIsLoading(false);
      } catch (error) {
        console.error(error); // Dump the complete error
        setError(error.message);
        setIsLoading(false);
      }
    };
  
    fetchUsersGroupedByClub();
  }, []);

  console.log(clubs); // Dump current state

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;
  if (clubs.length === 0) return <div>No data</div>;

  return (
       <div className="space-y-6">
      {clubs.map(club => (
        <div key={club.club_id} className="p-4 border rounded shadow">
          <h2 className="text-xl font-semibold mb-2">{club.club_name}</h2>
          <div className="space-y-1">
            {club.users.map(user => (
              <div key={user.id}>
                <Link
                  to={`/attendance/${user.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {user.name || user.username || `User ${user.id}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default UserList;