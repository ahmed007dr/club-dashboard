// slices/entryLogSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import BASE_URL from '../../config/api';

// Fetch entry logs
export const fetchEntryLogs = createAsyncThunk(
  'entryLog/fetchEntryLogs',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}attendance/api/entry-logs/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching entry logs:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'An unexpected error occurred.');
    }
  }
);

// Add new entry log
export const addEntryLog = createAsyncThunk(
  'entryLog/addEntryLog',
  async (newEntryLog, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${BASE_URL}attendance/api/entry-logs/add/`, newEntryLog, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add entry log.');
      }

      return response.data;
    } catch (error) {
      console.error('Error adding entry log:', error);
      return rejectWithValue(error.message || 'An unexpected error occurred.');
    }
  }
);

const entryLogSlice = createSlice({
  name: 'entryLog',
  initialState: {
    items: [],
    isLoading: true,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Entry Logs
      .addCase(fetchEntryLogs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEntryLogs.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchEntryLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Add Entry Log
      .addCase(addEntryLog.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addEntryLog.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(addEntryLog.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default entryLogSlice;