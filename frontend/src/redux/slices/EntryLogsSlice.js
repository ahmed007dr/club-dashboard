import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for fetching entry logs
export const fetchEntryLogs = createAsyncThunk(
  'entryLogs/fetchEntryLogs',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token'); // Retrieve token
      const response = await fetch('http://127.0.0.1:8000/attendance/api/entry-logs/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to fetch entry logs.');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for adding entry log
export const addEntryLog = createAsyncThunk(
  'entryLogs/addEntryLog',
  async (newEntryLog, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token'); // Retrieve token
      const response = await fetch('http://127.0.0.1:8000/attendance/api/entry-logs/add/', {
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
const entryLogsSlice = createSlice({
  name: 'entryLogs',
  initialState: {
    entryLogs: [],
    loading: false,
    error: null,
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
        state.entryLogs = action.payload;
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
        state.entryLogs.push(action.payload); // Optimistic update
      })
      .addCase(addEntryLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default entryLogsSlice;