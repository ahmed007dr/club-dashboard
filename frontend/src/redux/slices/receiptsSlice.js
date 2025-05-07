import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import BASE_URL from '../../config/api';

const API_BASE_URL = `${BASE_URL}/receipts/api`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const fetchReceipts = createAsyncThunk(
  'receipts/fetchAll',
  async ({ clubId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/receipts/`, {
        headers: getAuthHeaders(),
        params: { club_id: clubId },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const addReceipt = createAsyncThunk(
  'receipts/addReceipt',
  async (receiptData, { rejectWithValue }) => {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Attempting to add receipt:', receiptData);
      }
      const response = await axios.post(
        `${API_BASE_URL}/receipts/add/`,
        receiptData,
        { headers: getAuthHeaders() }
      );
      if (process.env.NODE_ENV !== 'production') {
        console.log('Receipt added successfully:', response.data);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchReceiptByInvoice = createAsyncThunk(
  'receipts/fetchByInvoice',
  async (invoiceNumber, { rejectWithValue }) => {
    const normalizedInvoice = invoiceNumber.toUpperCase();
    const invoiceRegex = /^INV\d{8}-\d{4}$/;

    if (!normalizedInvoice || !invoiceRegex.test(normalizedInvoice)) {
      return rejectWithValue('Invalid invoice number format. Expected format: INVYYYYMMDD-NNNN (e.g., INV20250429-0003)');
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/receipts/invoice/${normalizedInvoice}/`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      if (status === 404) {
        return null;
      }
      return rejectWithValue('Something went wrong while fetching the receipt');
    }
  }
);

export const fetchReceiptById = createAsyncThunk(
  'receipts/fetchById',
  async (receiptId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/receipts/${receiptId}/`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteReceipt = createAsyncThunk(
  'receipts/delete',
  async (receiptId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE_URL}/receipts/${receiptId}/delete/`, {
        headers: getAuthHeaders()
      });
      return receiptId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateReceipt = createAsyncThunk(
  'receipts/update',
  async ({ receiptId, receiptData }, { rejectWithValue }) => {
    try {
      console.log(`Attempting to update receipt with ID: ${receiptId}`, receiptData);
      const response = await axios.put(`${API_BASE_URL}/receipts/${receiptId}/edit/`, receiptData, {
        headers: getAuthHeaders()
      });
      console.log('Receipt updated successfully:', response.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const receiptsSlice = createSlice({
  name: 'receipts',
  initialState: {
    receipts: [],
    currentReceipt: null,
    status: 'idle',
    error: null
  },
  reducers: {
    clearCurrentReceipt: (state) => {
      state.currentReceipt = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReceipts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReceipts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.receipts = action.payload;
      })
      .addCase(fetchReceipts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(addReceipt.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addReceipt.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.receipts.push(action.payload);
      })
      .addCase(addReceipt.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchReceiptByInvoice.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.message = null;
      })
      .addCase(fetchReceiptByInvoice.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload === null) {
          state.message = 'No receipt found for this invoice number.';
          state.currentReceipt = null;
        } else {
          state.currentReceipt = action.payload;
          state.message = null;
        }
      })
      .addCase(fetchReceiptByInvoice.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchReceiptById.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReceiptById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentReceipt = action.payload;
      })
      .addCase(fetchReceiptById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(deleteReceipt.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteReceipt.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.receipts = state.receipts.filter(receipt => receipt.id !== action.payload);
      })
      .addCase(deleteReceipt.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(updateReceipt.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateReceipt.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.receipts.findIndex(receipt => receipt.id === action.payload.id);
        if (index !== -1) {
          state.receipts[index] = action.payload;
        }
        state.currentReceipt = action.payload;
      })
      .addCase(updateReceipt.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { clearCurrentReceipt } = receiptsSlice.actions;

export default receiptsSlice.reducer;