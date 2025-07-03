import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import BASE_URL from '../../config/api';

const API_BASE_URL = `${BASE_URL}receipts/api`;

// Helper function to get auth headers
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

// Async Thunks
export const fetchReceipts = createAsyncThunk(
  'receipts/fetchAll',
  async (page = 1, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/receipts/`, {
        headers: getAuthHeaders(),
        params: {
          page: page
        }
      });
      return {
        data: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          currentPage: page
        }
      };
    } catch (error) {
      console.error('Error fetching receipts:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const addReceipt = createAsyncThunk(
  'receipts/addReceipt',
  async (receiptData, { rejectWithValue }) => {
    try {
      if (process.env.NODE_ENV !== 'production') {
//         console.log('Attempting to add receipt:', receiptData);
      }
      const response = await axios.post(
        `${API_BASE_URL}/receipts/add/`,
        receiptData,
        { headers: getAuthHeaders() }
      );
      if (process.env.NODE_ENV !== 'production') {
//         console.log('Receipt added successfully:', response.data);
      }
      return response.data;
    } catch (error) {
      console.error('Error adding receipt:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
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
        // Gracefully handle not found
        return null; // or return a specific object like { message: "Not found" }
      }

      console.error('Error fetching receipt by invoice:', error.response?.data || error.message);
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
      console.error('Error fetching receipt by ID:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
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
  async ({ receiptId, receiptData }, { rejectWithValue }) => {
    try {
      console.log(`Attempting to update receipt with ID: ${receiptId}`, receiptData); // Log the receipt data being sent

      const response = await axios.put(`${API_BASE_URL}/receipts/${receiptId}/edit/`, receiptData, {
        headers: getAuthHeaders()
      });

      console.log('Receipt updated successfully:', response.data); // Log the successful response
      return response.data;
    } catch (error) {
      console.error('Error updating receipt:', error.response?.data || error.message); // Log the error
      return rejectWithValue(
        error.response?.data || error.message
      );
    }
  }
);

// Receipts Slice
const receiptsSlice = createSlice({
  name: 'receipts',
  initialState: {
    receipts: [],
    currentReceipt: null,
    status: 'idle',
    error: null,
    pagination: {
      count: 0,
      next: null,
      previous: null,
      currentPage: 1
    }
  },
  reducers: {
    clearCurrentReceipt: (state) => {
      state.currentReceipt = null;
    },
    setCurrentPage: (state, action) => {
      state.pagination.currentPage = action.payload;
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
        state.receipts = action.payload.data;
        state.pagination = {
          ...state.pagination,
          count: action.payload.pagination.count,
          next: action.payload.pagination.next,
          previous: action.payload.pagination.previous,
          currentPage: action.payload.pagination.currentPage
        };
      })
      .addCase(fetchReceipts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      
      // Add receipt
      .addCase(addReceipt.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addReceipt.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Add new receipt to beginning of array (assuming newest first)
        state.receipts.unshift(action.payload);
        // Increment total count
        state.pagination.count += 1;
      })
      .addCase(addReceipt.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      
      // Fetch receipt by invoice
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
        state.error = action.payload || action.error.message;
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
        state.error = action.payload || action.error.message;
      })
      
      // Delete receipt
      .addCase(deleteReceipt.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteReceipt.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Remove from receipts array if it exists there
        state.receipts = state.receipts.filter(receipt => receipt.id !== action.payload);
        // Decrement total count
        state.pagination.count = Math.max(0, state.pagination.count - 1);
      })
      .addCase(deleteReceipt.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      
      // Update receipt
      .addCase(updateReceipt.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateReceipt.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Update in receipts array if it exists there
        const index = state.receipts.findIndex(receipt => receipt.id === action.payload.id);
        if (index !== -1) {
          state.receipts[index] = action.payload;
        }
        // Always update currentReceipt
        state.currentReceipt = action.payload;
      })
      .addCase(updateReceipt.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      });
  }
});

export const { clearCurrentReceipt, setCurrentPage } = receiptsSlice.actions;

export default receiptsSlice.reducer;