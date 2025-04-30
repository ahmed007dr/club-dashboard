import React, { useState } from 'react';
import img from '../../images/img.png';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Assuming you're using React Router
import BASE_URL from '../../config/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigator = useNavigate(); // Use history for redirection

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const response = await axios.post(`${BASE_URL}/accounts/api/login/`, {
        username,
        password,
      });
  
      // Get the response data containing tokens and user info
      const { access, refresh } = response.data;
  
      if (!access) {
        toast.error('Access token is missing! Please check backend.');
        return;
      }
  
      // Store access token, refresh token, and user data in localStorage
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      // localStorage.setItem('user', JSON.stringify(user));
  
      toast.success('Login successful!');
      
      navigator('/');  
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        toast.error(error.response.data.error);  // Display specific error message from the backend
      } else {
        toast.error('Login failed! Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen flex">
      {/* Left Image Section */}
      <div className="hidden sm:flex w-1/3">
        <img src={img} alt="Login visual" className="h-full w-full object-cover" />
      </div>

      {/* Right Form Section */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-6 text-center">Login to Your Account</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <button
              type="submit"
              className="btn w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
