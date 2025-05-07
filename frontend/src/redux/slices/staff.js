import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from 'axios';
import BASE_URL from '../../config/api';

export const fetchShifts = createAsyncThunk(
  'staff/fetchShifts',
  async ({ clubId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/attendance/shifts/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: { club_id: clubId },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch shifts.");
    }
  }
);

export const addShift = createAsyncThunk(
  'staff/addShift',
  async (newShift, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${BASE_URL}/api/attendance/shifts/add/`, newShift, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add shift');
    }
  }
);

export const editShift = createAsyncThunk(
  'staff/editShift',
  async ({ id, updatedShift }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${BASE_URL}/api/attendance/shifts/${id}/edit/`, updatedShift, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return { id, updatedShift: res.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to edit shift');
    }
  }
);

export const deleteShift = createAsyncThunk(
  'staff/deleteShift',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`${BASE_URL}/api/attendance/shifts/${id}/delete/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.status !== 204) {
        throw new Error("Failed to delete shift.");
      }
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete shift.");
    }
  }
);

export const getStaffShifts = createAsyncThunk(
  'staff/getStaffShifts',
  async (staffId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/attendance/staff/${staffId}/shifts/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return { staffId, shifts: res.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch staff shifts.");
    }
  }
);

export const checkInStaff = createAsyncThunk(
  'staff/checkInStaff',
  async (rfid_code, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/attendance/check-in/`, { rfid_code }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check-in');
    }
  }
);

export const checkOutStaff = createAsyncThunk(
  'staff/checkOutStaff',
  async (rfid_code, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/attendance/check-out/`, { rfid_code }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check-out');
    }
  }
);

export const getStaffReport = createAsyncThunk(
  'staff/getStaffReport',
  async (staffId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/attendance/staff/${staffId}/attendance/report/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch staff report.");
    }
  }
);

export const getAttendanceAnalysis = createAsyncThunk(
  'staff/getAttendanceAnalysis',
  async ({ clubId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/attendance/analysis/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: { club_id: clubId },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch attendance analysis.");
    }
  }
);

const staffSlice = createSlice({
  name: 'staff',
  initialState: {
    shifts: [],
    staffShifts: {},
    attendance: [],
    report: null,
    analysis: null,
    staffProfile: null,
    loading: {
      shifts: false,
      staffShifts: false,
      attendance: false,
      report: false,
      analysis: false,
    },
    error: {
      shifts: null,
      staffShifts: null,
      attendance: null,
      report: null,
      analysis: null,
    },
  },
  reducers: {
    clearError: (state, action) => {
      state.error[action.payload] = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShifts.pending, (state) => {
        state.loading.shifts = true;
        state.error.shifts = null;
      })
      .addCase(fetchShifts.fulfilled, (state, action) => {
        state.shifts = action.payload;
        state.loading.shifts = false;
      })
      .addCase(fetchShifts.rejected, (state, action) => {
        state.loading.shifts = false;
        state.error.shifts = action.payload;
      })
      .addCase(addShift.fulfilled, (state, action) => {
        state.shifts.push(action.payload);
      })
      .addCase(addShift.rejected, (state, action) => {
        state.error.shifts = action.payload;
      })
      .addCase(editShift.fulfilled, (state, action) => {
        const { id, updatedShift } = action.payload;
        const index = state.shifts.findIndex((shift) => shift.id === id);
        if (index !== -1) {
          state.shifts[index] = { ...state.shifts[index], ...updatedShift };
        }
      })
      .addCase(editShift.rejected, (state, action) => {
        state.error.shifts = action.payload;
      })
      .addCase(deleteShift.fulfilled, (state, action) => {
        state.shifts = state.shifts.filter((shift) => shift.id !== action.payload);
      })
      .addCase(deleteShift.rejected, (state, action) => {
        state.error.shifts = action.payload;
      })
      .addCase(getStaffShifts.pending, (state) => {
        state.loading.staffShifts = true;
        state.error.staffShifts = null;
      })
      .addCase(getStaffShifts.fulfilled, (state, action) => {
        const { staffId, shifts } = action.payload;
        state.staffShifts[staffId] = shifts;
        state.loading.staffShifts = false;
      })
      .addCase(getStaffShifts.rejected, (state, action) => {
        state.loading.staffShifts = false;
        state.error.staffShifts = action.payload;
      })
      .addCase(checkInStaff.pending, (state) => {
        state.loading.attendance = true;
        state.error.attendance = null;
      })
      .addCase(checkInStaff.fulfilled, (state, action) => {
        state.attendance.push(action.payload);
        state.loading.attendance = false;
      })
      .addCase(checkInStaff.rejected, (state, action) => {
        state.loading.attendance = false;
        state.error.attendance = action.payload;
      })
      .addCase(checkOutStaff.pending, (state) => {
        state.loading.attendance = true;
        state.error.attendance = null;
      })
      .addCase(checkOutStaff.fulfilled, (state, action) => {
        const updatedAttendance = action.payload;
        const index = state.attendance.findIndex((att) => att.id === updatedAttendance.id);
        if (index !== -1) {
          state.attendance[index] = updatedAttendance;
        } else {
          state.attendance.push(updatedAttendance);
        }
        state.loading.attendance = false;
      })
      .addCase(checkOutStaff.rejected, (state, action) => {
        state.loading.attendance = false;
        state.error.attendance = action.payload;
      })
      .addCase(getStaffReport.pending, (state) => {
        state.loading.report = true;
        state.error.report = null;
      })
      .addCase(getStaffReport.fulfilled, (state, action) => {
        state.report = action.payload;
        state.loading.report = false;
      })
      .addCase(getStaffReport.rejected, (state, action) => {
        state.loading.report = false;
        state.error.report = action.payload;
      })
      .addCase(getAttendanceAnalysis.pending, (state) => {
        state.loading.analysis = true;
        state.error.analysis = null;
      })
      .addCase(getAttendanceAnalysis.fulfilled, (state, action) => {
        state.analysis = action.payload;
        state.loading.analysis = false;
      })
      .addCase(getAttendanceAnalysis.rejected, (state, action) => {
        state.loading.analysis = false;
        state.error.analysis = action.payload;
      });
  },
});

export const { clearError } = staffSlice.actions;
export default staffSlice.reducer;