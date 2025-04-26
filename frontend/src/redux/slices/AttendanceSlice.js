<<<<<<< HEAD
// slices/attendanceSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Fetch attendances
=======
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for fetching attendances
>>>>>>> df365259624ad42779b807e7ba4db94bd9d12439
export const fetchAttendances = createAsyncThunk(
  'attendance/fetchAttendances',
  async (_, { rejectWithValue }) => {
    try {
<<<<<<< HEAD
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/attendance/api/attendances/', {
=======
      const token = localStorage.getItem('token'); // Retrieve token
      const response = await fetch('http://127.0.0.1:8000/attendance/api/attendances/', {
        method: 'GET',
>>>>>>> df365259624ad42779b807e7ba4db94bd9d12439
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
<<<<<<< HEAD

      return response.data;
    } catch (error) {
      console.error('Error fetching attendances:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'An unexpected error occurred.');
=======
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to fetch attendances.');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
>>>>>>> df365259624ad42779b807e7ba4db94bd9d12439
    }
  }
);

<<<<<<< HEAD
// Add new attendance
=======
// Async thunk for adding attendance
>>>>>>> df365259624ad42779b807e7ba4db94bd9d12439
export const addAttendance = createAsyncThunk(
  'attendance/addAttendance',
  async (newAttendance, { rejectWithValue }) => {
    try {
<<<<<<< HEAD
      const token = localStorage.getItem('token');
      const response = await axios.post('http://127.0.0.1:8000/attendance/api/attendances/add/', newAttendance, {
=======
      const token = localStorage.getItem('token'); // Retrieve token
      const response = await fetch('http://127.0.0.1:8000/attendance/api/attendances/add/', {
        method: 'POST',
>>>>>>> df365259624ad42779b807e7ba4db94bd9d12439
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
<<<<<<< HEAD
      });

      return response.data;
    } catch (error) {
      console.error('Error adding attendance:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'An unexpected error occurred.');
=======
        body: JSON.stringify(newAttendance),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to add attendance.');
      }
      return newAttendance; // Return the added attendance for optimistic updates
    } catch (error) {
      return rejectWithValue(error.message);
>>>>>>> df365259624ad42779b807e7ba4db94bd9d12439
    }
  }
);

<<<<<<< HEAD
// Delete attendance
=======
// Async thunk for deleting attendance
>>>>>>> df365259624ad42779b807e7ba4db94bd9d12439
export const deleteAttendance = createAsyncThunk(
  'attendance/deleteAttendance',
  async (id, { rejectWithValue }) => {
    try {
<<<<<<< HEAD
      const token = localStorage.getItem('token');
      const response = await axios.delete(`http://127.0.0.1:8000/attendance/api/attendances/${id}/delete/`, {
=======
      const token = localStorage.getItem('token'); // Retrieve token
      const response = await fetch(`http://127.0.0.1:8000/attendance/api/attendances/${id}/delete/`, {
        method: 'DELETE',
>>>>>>> df365259624ad42779b807e7ba4db94bd9d12439
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
<<<<<<< HEAD

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete attendance.');
      }

      return id;
    } catch (error) {
      console.error('Error deleting attendance:', error);
      return rejectWithValue(error.message || 'An unexpected error occurred.');
=======
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to delete attendance.');
      }
      return id; // Return the ID of the deleted attendance for optimistic updates
    } catch (error) {
      return rejectWithValue(error.message);
>>>>>>> df365259624ad42779b807e7ba4db94bd9d12439
    }
  }
);

<<<<<<< HEAD
const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    items: [],
    isLoading: true,
=======
// Slice definition
const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    attendances: [],
    loading: false,
>>>>>>> df365259624ad42779b807e7ba4db94bd9d12439
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
<<<<<<< HEAD
      // Fetch Attendances
      .addCase(fetchAttendances.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAttendances.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchAttendances.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Add Attendance
      .addCase(addAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addAttendance.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(addAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Delete Attendance
      .addCase(deleteAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAttendance.fulfilled, (state, action) => {
        state.items = state.items.filter((att) => att.id !== action.payload);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(deleteAttendance.rejected, (state, action) => {
        state.isLoading = false;
=======
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
        state.attendances.push(action.payload); // Optimistic update
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
        state.attendances = state.attendances.filter((attendance) => attendance.id !== deletedId); // Remove deleted attendance
      })
      .addCase(deleteAttendance.rejected, (state, action) => {
        state.loading = false;
>>>>>>> df365259624ad42779b807e7ba4db94bd9d12439
        state.error = action.payload;
      });
  },
});

export default attendanceSlice;