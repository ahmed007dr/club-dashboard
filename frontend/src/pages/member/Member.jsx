import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserById } from "../../redux/slices/memberSlice";

const Member = () => {
  const { id } = useParams(); // Get the member ID from the URL
  const dispatch = useDispatch();

  // Access the user data and loading/error states from Redux
  const user = useSelector((state) => state.member.user); // Ensure 'member' matches the key in store.js
  const isLoading = useSelector((state) => state.member.isloading);
  const error = useSelector((state) => state.member.error);

  // Fetch the user when the component mounts or when the ID changes
  useEffect(() => {
    dispatch(fetchUserById(id)); // Dispatch the fetch action
  }, [dispatch, id]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="p-4 text-red-500 text-center">
        <p>{error}</p>
      </div>
    );
  }

  // Handle case where user is not found
  if (!user) {
    return (
      <div className="p-4 text-gray-600 text-center">
        <p>Member not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        {/* Profile Section */}
        <div className="flex items-center gap-6 mb-8">
          <img
            src={user.photo || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU-rxXTrx4QdTdwIpw938VLL8EuJiVhCelkQ&s"} // Fallback image if no photo exists
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 shadow-md"
          />
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{user.name}</h3>
            <p className="text-sm text-gray-500">Club: {user.club_name || "N/A"}</p>
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            <span className="font-medium text-gray-700">Membership Number:</span>
            <span className="text-gray-600">{user.membership_number}</span>
          </div>

          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span className="font-medium text-gray-700">National ID:</span>
            <span className="text-gray-600">{user.national_id}</span>
          </div>

          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-1.26 1.26a1 1 0 00-.707.293l-3.147 3.147a1 1 0 01-1.414-1.414l1.498-1.498a1 1 0 00.707-.293l1.26-1.26a1 1 0 011.21-.502z"
              />
            </svg>
            <span className="font-medium text-gray-700">Phone:</span>
            <span className="text-gray-600">{user.phone}</span>
          </div>

          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="font-medium text-gray-700">Date of Birth:</span>
            <span className="text-gray-600">{user.birth_date || "N/A"}</span>
          </div>

          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium text-gray-700">Referred By:</span>
            <span className="text-gray-600">{user.referred_by || "N/A"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Member;