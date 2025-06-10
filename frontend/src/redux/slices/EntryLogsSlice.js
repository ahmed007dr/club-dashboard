import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import BASE_URL from '../../config/api';
import axios from 'axios';


// Async thunk for fetching entry logs
export const fetchEntryLogs = createAsyncThunk(
  "entryLogs/fetchEntryLogs",
  async ({ page, pageSize, ...filters }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}attendance/api/entry-logs/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          params: {
            page,
            page_size: pageSize,
            club: filters.club, 
            rfid: filters.rfid, 
            member: filters.member, 
            timestamp: filters.timestamp, 
          },
        }
      );

      return {
        data: response.data.results,
        count: response.data.count,
        page,
        pageSize,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch entry logs."
      );
    }
  }
);


// Async thunk for adding entry log
export const addEntryLog = createAsyncThunk(
  "entryLogs/addEntryLog",
  async (newEntryLog, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BASE_URL}attendance/api/entry-logs/add/`,
        newEntryLog,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data; // Use response data instead of input
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

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
        state.data = action.payload.data; // Changed from results to data
        state.count = action.payload.count;
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
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
        state.data.unshift(action.payload);
        state.count += 1;
      })
      .addCase(addEntryLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default entryLogsSlice;