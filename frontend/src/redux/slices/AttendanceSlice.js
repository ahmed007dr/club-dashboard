// slices/attendanceSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Fetch attendances
export const fetchAttendances = createAsyncThunk(
  'attendance/fetchAttendances',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/attendance/api/attendances/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching attendances:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'An unexpected error occurred.');
    }
  }
);

// Add new attendance
export const addAttendance = createAsyncThunk(
  'attendance/addAttendance',
  async (newAttendance, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://127.0.0.1:8000/attendance/api/attendances/add/', newAttendance, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error adding attendance:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'An unexpected error occurred.');
    }
  }
);

// Delete attendance
export const deleteAttendance = createAsyncThunk(
  'attendance/deleteAttendance',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`http://127.0.0.1:8000/attendance/api/attendances/${id}/delete/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete attendance.');
      }

      return id;
    } catch (error) {
      console.error('Error deleting attendance:', error);
      return rejectWithValue(error.message || 'An unexpected error occurred.');
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    items: [],
    isLoading: true,
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
        state.attendances.push(action.payload);
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
        state.attendances = state.attendances.filter((attendance) => attendance.id !== action.payload);
      })
      .addCase(deleteAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default attendanceSlice.reducer;
