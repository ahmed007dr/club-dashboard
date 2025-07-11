import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import BASE_URL from '../../config/api';
import axios from 'axios';

const getToken = () => {
  const token = localStorage.getItem('token');
  return token ? `Bearer ${token}` : '';
};

export const fetchAttendances = createAsyncThunk(
  "attendance/fetchAttendances",
  async ({ page, pageSize, member_name, rfid_code, subscription_id }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const params = { page, page_size: pageSize };
      if (member_name) params.member_name = member_name;
      if (rfid_code) params.rfid_code = rfid_code;
      if (subscription_id) params.subscription = subscription_id; 
      const response = await axios.get(`${BASE_URL}attendance/api/attendances/`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      return {
        data: response.data.results,
        count: response.data.count,
        page,
        pageSize,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch attendances.");
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
      const response = await axios.post(`${BASE_URL}attendance/api/attendances/add/`, newAttendance, {
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
      const response = await axios.delete(`${BASE_URL}attendance/api/attendances/${id}/`, {
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

// Thunk: Staff Check-In
export const checkInStaff = createAsyncThunk(
  'attendance/checkIn',
  async (rfid_code, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}staff/api/check-in/`, { rfid_code }, {
        headers: {
          Authorization: getToken()
        }
      });
      console.log('✅ Check-in success:', response.data); // Log success
      return response.data;
    } catch (error) {
      console.error('❌ Check-in error:', error.response?.data || 'Check-in failed'); // Log error
      return rejectWithValue(error.response?.data || { error: 'Check-in failed' });
    }
  }
);


// Thunk: Staff Check-Out
export const checkOutStaff = createAsyncThunk('attendance/checkOut', async (rfid_code, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${BASE_URL}staff/api/check-out/`, { rfid_code }, {
      headers: {
        Authorization: getToken()
      }
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { error: 'Check-out failed' });
  }
});

// Thunk: Analyze Attendance
// Thunk: Analyze Attendance by Staff ID
export const analyzeAttendance = createAsyncThunk(
  'attendance/analyze',
  async (staffId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}staff/api/attendance/${staffId}/analysis/`, {
        headers: {
           Authorization: getToken(),  // Added Bearer prefix
          'Content-Type': 'application/json',
        },
        validateStatus: (status) => status < 500  // Consider 4xx statuses as not errors
      });

      // Handle non-2xx status codes that passed validateStatus
      if (response.status >= 400) {
        return rejectWithValue(response.data || { 
          error: response.status === 404 
            ? 'Attendance record not found' 
            : 'Request failed'
        });
      }

      return response.data;
    } catch (error) {
      // Handle network errors or other exceptions
      const errorPayload = {
        status: error.response?.status,
        data: error.response?.data || { error: 'Network error' },
        originalError: error.message
      };
      
      console.error('Analysis error:', errorPayload);
      return rejectWithValue(errorPayload.data);
    }
  }
);

// Thunk: Get Staff Attendance Report
export const getStaffAttendanceReport = createAsyncThunk('attendance/report', async (staffId, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${BASE_URL}staff/api/staff/${staffId}/attendance/report/`, {
      headers: {
        Authorization: getToken()
      }
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { error: 'Report fetch failed' });
  }
});

// Async thunk to fetch shift attendances
export const fetchShiftAttendances = createAsyncThunk(
  'shiftAttendance/fetchShiftAttendances',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}staff/api/attendance/`, {
        headers: {
          Authorization: getToken(),
          'Content-Type': 'application/json',
        },
      });

      // Sort by check_in (newest first)
      const sortedData = [...response.data].sort((a, b) => 
        new Date(b.check_in) - new Date(a.check_in)
      );

      return sortedData;
    } catch (error) {
      console.error('Fetch shift attendances error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch shift attendances.');
    }
  }
);

// Slice definition
const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    attendances: [],
    shiftAttendances: [],
    checkInData: null,
    checkOutData: null,
    analysisData: null,
    reportData: null,
    loading: false,
    error: null,
    pagination: {
      count: 0,
      next: null,
      previous: null,
      page: 1,
      perPage: 20,
    },
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
        state.data = action.payload.data; // Add data structure
        state.count = action.payload.count;
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
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
        state.attendances = state.attendances.filter(
          (attendance) => attendance.id !== deletedId
        );
      })
      .addCase(deleteAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(checkInStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkInStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.checkInData = action.payload;
      })
      .addCase(checkInStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(checkOutStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkOutStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.checkOutData = action.payload;
      })
      .addCase(checkOutStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

        .addCase(analyzeAttendance.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(analyzeAttendance.fulfilled, (state, action) => {
      state.loading = false;
      state.analysisData = action.payload;
    })
    .addCase(analyzeAttendance.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.error || 
                  action.error?.message || 
                  'Failed to analyze attendance';
      // Optional: Store full error details for debugging
      state.errorDetails = action.payload;
    })

      .addCase(getStaffAttendanceReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStaffAttendanceReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reportData = action.payload;
      })
      .addCase(getStaffAttendanceReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchShiftAttendances.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchShiftAttendances.fulfilled, (state, action) => {
        state.isLoading = false;
        state.shiftAttendances = action.payload;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchShiftAttendances.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default attendanceSlice;