import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { refreshAccessToken, logout } from '../redux/slices/authSlice';

const useTokenRefresh = () => {
  const dispatch = useDispatch();
  const { token, refreshToken, refreshing, error } = useSelector((state) => state.auth);

  useEffect(() => {
    let refreshInterval;

    // Start the refresh interval if the user is authenticated
    if (token && refreshToken) {
      refreshInterval = setInterval(() => {
        if (!refreshing) {
          dispatch(refreshAccessToken());
        }
      }, 40 * 60 * 1000); // 40 minutes in milliseconds
    }

    // Clear the interval if there's an error or the user logs out
    if (error || (!token && !refreshToken)) {
      clearInterval(refreshInterval);
      if (error) {
        dispatch(logout()); // Log out if refresh fails
      }
    }

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, [token, refreshToken, refreshing, error, dispatch]);

  return { error };
};

export default useTokenRefresh;