import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/receipts/api';

// Helper function to get headers with token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'accept': 'application/json',
    'Content-Type': 'application/json'
  };
};

// Async Thunks for each API endpoint
export const fetchReceipts = createAsyncThunk(
  'receipts/fetchAll',
  async () => {
    const response = await axios.get(`${API_BASE_URL}/receipts/`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
);


export const addReceipt = createAsyncThunk(
    'receipts/addReceipt',
    async (receiptData, { rejectWithValue }) => {
      const token = localStorage.getItem('token');
      
      try {
        const response = await axios.post(
          'http://127.0.0.1:8000/receipts/api/receipts/add/',
          {
            club: receiptData.club,
            member: receiptData.member,
            subscription: receiptData.subscription,
            amount: receiptData.amount,
            payment_method: receiptData.payment_method,
            note: receiptData.note || '',
            issued_by: receiptData.issued_by
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept-Language': 'ar' // For Arabic error messages
            }
          }
        );
        return response.data;
      } catch (error) {
        // Handle Django validation errors
        if (error.response && error.response.data) {
          // Convert Django error object to more readable format
          const errors = {};
          Object.entries(error.response.data).forEach(([key, value]) => {
            errors[key] = Array.isArray(value) ? value.join(' ') : value;
          });
          return rejectWithValue(errors);
        }
        return rejectWithValue({ message: 'حدث خطأ غير متوقع' });
      }
    }
  );


export const fetchReceiptByInvoice = createAsyncThunk(
  'receipts/fetchByInvoice',
  async (invoiceNumber) => {
    const response = await axios.get(`${API_BASE_URL}/receipts/invoice/${invoiceNumber}/`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
);

export const fetchReceiptById = createAsyncThunk(
  'receipts/fetchById',
  async (receiptId) => {
    const response = await axios.get(`${API_BASE_URL}/receipts/${receiptId}/`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
);

export const deleteReceipt = createAsyncThunk(
  'receipts/delete',
  async (receiptId) => {
    await axios.delete(`${API_BASE_URL}/receipts/${receiptId}/delete/`, {
      headers: getAuthHeaders()
    });
    return receiptId;
  }
);

export const updateReceipt = createAsyncThunk(
  'receipts/update',
  async ({ receiptId, receiptData }) => {
    const response = await axios.put(`${API_BASE_URL}/receipts/${receiptId}/edit/`, receiptData, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
);

// Receipts Slice
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
      // Fetch all receipts
      .addCase(fetchReceipts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReceipts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.receipts = action.payload;
      })
      .addCase(fetchReceipts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      
      // Add receipt
      .addCase(addReceipt.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addReceipt.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.receipts.push(action.payload);
      })
      .addCase(addReceipt.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      
      // Fetch by invoice
      .addCase(fetchReceiptByInvoice.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReceiptByInvoice.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentReceipt = action.payload;
      })
      .addCase(fetchReceiptByInvoice.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      
      // Fetch by ID
      .addCase(fetchReceiptById.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReceiptById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentReceipt = action.payload;
      })
      .addCase(fetchReceiptById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      
      // Delete receipt
      .addCase(deleteReceipt.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteReceipt.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.receipts = state.receipts.filter(receipt => receipt.id !== action.payload);
      })
      .addCase(deleteReceipt.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      
      // Update receipt
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
        state.error = action.error.message;
      });
  }
});

export const { clearCurrentReceipt } = receiptsSlice.actions;

export default receiptsSlice.reducer;