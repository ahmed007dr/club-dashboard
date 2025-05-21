import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import BASE_URL from '../../config/api';
import axios from 'axios';

// Async thunk for fetching entry logs
export const fetchEntryLogs = createAsyncThunk(
  'entryLogs/fetchEntryLogs',
  async ({ page = 1, perPage = 20 }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${BASE_URL}/attendance/api/entry-logs/`, { // Update endpoint
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: {
          page,
          per_page: perPage,
        },
      });

      const data = response.data.results || response.data || [];
      if (!Array.isArray(data)) {
        throw new Error('Unexpected response format: Expected an array of entry logs');
      }

      const sortedData = [...data].sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return isNaN(dateA) ? 1 : isNaN(dateB) ? -1 : dateB - dateA;
      });

      return {
        items: sortedData,
        count: response.data.count || data.length,
        next: response.data.next || null,
        previous: response.data.previous || null,
        page,
        perPage,
      };
    } catch (error) {
      console.error('Fetch entry logs error:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch entry logs.');
    }
  }
);


// Async thunk for adding entry log
export const addEntryLog = createAsyncThunk(
  'entryLogs/addEntryLog',
  async (newEntryLog, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token'); // Retrieve token
      const response = await fetch(`${BASE_URL}/attendance/api/entry-logs/add/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEntryLog),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to add entry log.');
      }
      return newEntryLog; // Return the added entry log for optimistic updates
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice definition

// Slice definition
const entryLogsSlice = createSlice({
  name: 'entryLogs',
  initialState: {
    items: [],  // Changed from entryLogs to items for consistency
    loading: false,
    error: null,
    count: 0,
    next: null,
    pagination: {
      count: 0,
      next: null,
      previous: null,
      page: 1,
      perPage: 20,
    },
    previous: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch entry logs
      .addCase(fetchEntryLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
   .addCase(fetchEntryLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
          page: action.payload.page,
          perPage: action.payload.perPage,
        };
      })
      .addCase(fetchEntryLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add entry log
      .addCase(addEntryLog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addEntryLog.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload); // Add new log at beginning
        state.count += 1;
      })
      .addCase(addEntryLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default entryLogsSlice;