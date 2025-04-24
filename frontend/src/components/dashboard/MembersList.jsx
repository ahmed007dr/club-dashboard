import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MembersList = () => {
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }

        const response = await fetch('http://127.0.0.1:8000/members/api/members/', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-CSRFTOKEN': 'yZsNqk1vJzCbgjuVS5GXBotOPAadvZmHxOWWIEH7a19vYSC6apFlkpma8qG1uFu5', // Replace with dynamic CSRF token if needed
          },
        });

        const data = await response.json();
        console.log('Members response data:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch members');
        }

        setMembers(data);
      } catch (err) {
        setError(err.message);
        if (err.message.includes('Please log in')) {
          navigate('/login'); // Redirect to login if not authenticated
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [navigate]);

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold mb-6 text-center">Members List</h2>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {members.length === 0 && !error ? (
          <p className="text-center text-gray-600">No members found.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Club</th>
                <th className="border px-4 py-2">Membership Number</th>
                <th className="border px-4 py-2">National ID</th>
                <th className="border px-4 py-2">Birth Date</th>
                <th className="border px-4 py-2">Phone</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{member.name}</td>
                  <td className="border px-4 py-2">{member.club_name}</td>
                  <td className="border px-4 py-2">{member.membership_number}</td>
                  <td className="border px-4 py-2">{member.national_id}</td>
                  <td className="border px-4 py-2">{member.birth_date}</td>
                  <td className="border px-4 py-2">{member.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MembersList;





