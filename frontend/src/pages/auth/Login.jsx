import React, { useState } from 'react';
import img from '../../images/img.png';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../redux/slices/authSlice';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rfidCode, setRfidCode] = useState('');
  const [useRfid, setUseRfid] = useState(false);
  const navigator = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const resultAction = await dispatch(
      loginUser({ username, password, rfidCode, useRfid })
    );
    
    if (loginUser.fulfilled.match(resultAction)) {
      toast.success('Login successful!');
      navigator('/');
    } else if (loginUser.rejected.match(resultAction)) {
      toast.error(resultAction.payload || 'Login failed!');
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
          
          {/* Login Method Toggle */}
          <div className="flex justify-center mb-6">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={useRfid}
                onChange={() => setUseRfid(!useRfid)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-900"></div>
              <span className="ml-3 text-sm font-medium">
                {useRfid ? 'RFID Login' : 'Password Login'}
              </span>
            </label>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {useRfid ? (
              <div>
                <label className="block text-sm font-medium mb-1">RFID Code</label>
                <input
                  type="password"
                  value={rfidCode}
                  onChange={(e) => setRfidCode(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-900"
                  required
                  placeholder="Scan your RFID card"
                  autoFocus
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-900"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-900"
                    required
                  />
                </div>
              </>
            )}
            
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