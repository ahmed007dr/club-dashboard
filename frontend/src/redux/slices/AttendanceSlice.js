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
<<<<<<< HEAD

=======
>>>>>>> 2b57248e23c7e06ae44f8edccf280ec1174605cd
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
<<<<<<< HEAD
      const response = await axios.delete(`http://127.0.0.1:8000/attendance/api/attendances/${id}/delete/`, {
=======
      await axios.delete(`http://127.0.0.1:8000/attendance/api/attendances/${id}/delete/`, {
>>>>>>> 2b57248e23c7e06ae44f8edccf280ec1174605cd
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
      return id;
    } catch (error) {
      console.error('Error deleting attendance:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'An unexpected error occurred.');
>>>>>>> 2b57248e23c7e06ae44f8edccf280ec1174605cd
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
>>>>>>> 2b57248e23c7e06ae44f8edccf280ec1174605cd
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
>>>>>>> 2b57248e23c7e06ae44f8edccf280ec1174605cd
        state.error = action.payload;
      });
  },
});

export default attendanceSlice.reducer;
