import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import BASE_URL from '../../config/api';
import axios from 'axios';

// Async thunk for fetching attendances
export const fetchAttendances = createAsyncThunk(
  'attendance/fetchAttendances',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/attendance/api/attendances/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      // Sort by attendance_date (newest first)
      const sortedData = [...response.data].sort((a, b) => 
        new Date(b.attendance_date) - new Date(a.attendance_date)
      );
      
      return sortedData;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendances.');
    }
  }
);


// Async thunk for adding attendance
export const addAttendance = createAsyncThunk(
  'attendance/addAttendance',
  async (newAttendance, { rejectWithValue }) => {
    try {
      console.log('Sending attendance data:', newAttendance); // Log the data being sent

      const token = localStorage.getItem('token');
      const response = await axios.post(`${BASE_URL}/attendance/api/attendances/add/`, newAttendance, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Attendance response data:', response.data); // Log the response data

      return response.data; // Use response.data instead of newAttendance for consistency
    } catch (error) {
      console.error('Error adding attendance:', error); // Log the error if it occurs
      return rejectWithValue(error.response?.data?.message || 'Failed to add attendance.');
    }
  }
);


// Async thunk for deleting attendance
export const deleteAttendance = createAsyncThunk(
  'attendance/deleteAttendance',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${BASE_URL}/attendance/api/attendances/${id}/delete/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Delete successful:', response.data); // Log successful response
      return id; // Return the ID for optimistic updates
    } catch (error) {
      console.error('Delete failed:', error.response?.data || error.message); // Log error details
      return rejectWithValue(error.response?.data?.message || 'Failed to delete attendance.');
    }
  }
);

// Slice definition
const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    attendances: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch attendances
      .addCase(fetchAttendances.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendances.fulfilled, (state, action) => {
        state.loading = false;
        state.attendances = action.payload;
      })
      .addCase(fetchAttendances.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add attendance
      .addCase(addAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.attendances.push(action.payload); // Update with response.data
      })
      .addCase(addAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete attendance
      .addCase(deleteAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAttendance.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.payload;
        state.attendances = state.attendances.filter((attendance) => attendance.id !== deletedId);
      })
      .addCase(deleteAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default attendanceSlice;