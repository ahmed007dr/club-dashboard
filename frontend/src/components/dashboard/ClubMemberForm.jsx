import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchUsers } from "../../redux/slices/memberSlice";

function ClubMemberForm() {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    club_id: '',    // Store club ID instead of name
    member_id: ''   // Store member ID
  });
  const [clubs, setClubs] = useState([]); // Stores {id, name} pairs

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const fetchedData = await dispatch(fetchUsers()).unwrap();
        setData(fetchedData.results || []);
        
        // Extract unique clubs with their IDs
        const uniqueClubs = [];
        const clubMap = new Map();
        
        fetchedData.results.forEach(member => {
          if (member.club && member.club_name && !clubMap.has(member.club)) {
            clubMap.set(member.club, true);
            uniqueClubs.push({
              id: member.club,
              name: member.club_name
            });
          }
        });
        
        setClubs(uniqueClubs);
        setLoading(false);
      } catch (error) {
        setError("Failed to fetch members: " + error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  // Filter members based on selected club ID
  const filteredMembers = formData.club_id 
    ? data.filter(member => member.club === formData.club_id)
    : [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'club_id' && { member_id: '' }) // Reset member when club changes
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Prepare payload with IDs
      const payload = {
        club_id: formData.club_id,
        member_id: formData.member_id
      };
      
      console.log('Submitting:', payload);
      
      // Here you would typically dispatch an action
      // await dispatch(someAction(payload)).unwrap();
      
      // Or call an API directly
      // const response = await axios.post('/api/submit', payload);
      
      alert(`Submitted: Club ID ${payload.club_id}, Member ID ${payload.member_id}`);
    } catch (err) {
      setError('Submission failed: ' + err.message);
    }
  };

  if (loading) return <div className="p-4">Loading members...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="form-group">
        <label htmlFor="club_id" className="block mb-2 font-medium text-gray-700">
          Club:
        </label>
        <select
          id="club_id"
          name="club_id"
          className="w-full p-2 border border-gray-300 rounded-md"
          value={formData.club_id}
          onChange={handleChange}
          required
        >
          <option value="">-- Select a Club --</option>
          {clubs.map(club => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="member_id" className="block mb-2 font-medium text-gray-700">
          Member:
        </label>
        <select
          id="member_id"
          name="member_id"
          className="w-full p-2 border border-gray-300 rounded-md"
          value={formData.member_id}
          onChange={handleChange}
          disabled={!formData.club_id}
          required
        >
          <option value="">-- Select a Member --</option>
          {filteredMembers.map(member => (
            <option key={member.id} value={member.id}>
              {member.name} (ID: {member.id})
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        disabled={!formData.club_id || !formData.member_id}
      >
        Submit
      </button>
    </form>
  );
}

export default ClubMemberForm;