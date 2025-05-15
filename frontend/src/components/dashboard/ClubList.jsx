import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClubList } from '../../redux/slices/clubSlice'; // Adjust the path as needed

const ClubList = () => {
  const dispatch = useDispatch();

  // Extract clubs data and loading/error state from Redux
  const { clubList, isLoading, error } = useSelector((state) => state.clubs);

  // Dispatch fetchClubList when the component mounts
  useEffect(() => {
    dispatch(fetchClubList());
  }, [dispatch]);

  // Handle loading and error states
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="club-list">
      <h2 className="text-2xl font-semibold">List of Clubs</h2>
      <ul className="space-y-4 mt-4">
        {clubList.map((club) => (
          <li key={club.id} className="p-4 border rounded-md shadow-md">
            <h3 className="text-xl font-semibold">{club.name}</h3>
            <p className="text-gray-600">{club.location}</p>
            {/* Add more details here if necessary */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClubList;

