// src/redux/slices/payrollSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchPayrollPeriods, createPayrollPeriod, fetchPayrollReport, createDeduction, finalizePayroll, createPayroll, fetchPayrollDetails } from '../../api/payroll';

// Async thunk for fetching payroll periods
export const fetchPayrollPeriodsAsync = createAsyncThunk(
  'payroll/fetchPayrollPeriods',
  async (params, { rejectWithValue }) => {
    try {
      const response = await fetchPayrollPeriods(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطأ في جلب فترات الرواتب');
    }
  }
);

// Async thunk for creating payroll period
export const createPayrollPeriodAsync = createAsyncThunk(
  'payroll/createPayrollPeriod',
  async (data, { rejectWithValue }) => {
    try {
      const response = await createPayrollPeriod(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطأ في إنشاء فترة الرواتب');
    }
  }
);

// Async thunk for fetching payroll report
export const fetchPayrollReportAsync = createAsyncThunk(
  'payroll/fetchPayrollReport',
  async (params, { rejectWithValue }) => {
    try {
      const response = await fetchPayrollReport(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطأ في جلب تقرير الرواتب');
    }
  }
);

// Async thunk for creating deduction
export const createDeductionAsync = createAsyncThunk(
  'payroll/createDeduction',
  async (data, { rejectWithValue }) => {
    try {
      const response = await createDeduction(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطأ في إضافة الخصم');
    }
  }
);

// Async thunk for finalizing payroll
export const finalizePayrollAsync = createAsyncThunk(
  'payroll/finalizePayroll',
  async (periodId, { rejectWithValue }) => {
    try {
      const response = await finalizePayroll(periodId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'خطأ في إنهاء الرواتب');
    }
  }
);

// Async thunk for creating payroll
export const createPayrollAsync = createAsyncThunk(
  'payroll/createPayroll',
  async (data, { rejectWithValue }) => {
    try {
      const response = await createPayroll(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطأ في إنشاء الراتب');
    }
  }
);

// Async thunk for fetching payroll details
export const fetchPayrollDetailsAsync = createAsyncThunk(
  'payroll/fetchPayrollDetails',
  async (payrollId, { rejectWithValue }) => {
    try {
      const response = await fetchPayrollDetails(payrollId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطأ في جلب تفاصيل الراتب');
    }
  }
);

const payrollSlice = createSlice({
  name: 'payroll',
  initialState: {
    periods: [],
    payrolls: [],
    payrollDetails: null, // Add payrollDetails to state
    total: 0,
    totalPayrolls: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayrollPeriodsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayrollPeriodsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.periods = action.payload.results || [];
        state.total = action.payload.count || 0;
      })
      .addCase(fetchPayrollPeriodsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPayrollPeriodAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPayrollPeriodAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.periods.push(action.payload);
      })
      .addCase(createPayrollPeriodAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPayrollReportAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayrollReportAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.payrolls = action.payload.results || [];
        state.totalPayrolls = action.payload.count || 0;
      })
      .addCase(fetchPayrollReportAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createDeductionAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDeductionAsync.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally update payrolls if needed
      })
      .addCase(createDeductionAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(finalizePayrollAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(finalizePayrollAsync.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally update periods if needed
      })
      .addCase(finalizePayrollAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPayrollAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPayrollAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.payrolls.push(action.payload);
      })
      .addCase(createPayrollAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPayrollDetailsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayrollDetailsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.payrollDetails = action.payload;
      })
      .addCase(fetchPayrollDetailsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = payrollSlice.actions;
export default payrollSlice.reducer;