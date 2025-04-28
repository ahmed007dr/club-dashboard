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
    try {
      const token = localStorage.getItem('token'); // get token directly

      console.log('Attempting to add receipt:', receiptData); // Log the receipt data being sent

      const response = await axios.post(
        'http://127.0.0.1:8000/receipts/api/receipts/add/',
        receiptData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      console.log('Receipt added successfully:', response.data); // Log the successful response
      return response.data;
    } catch (error) {
      console.error('Error adding receipt:', error.response?.data || error.message); // Log the error
      return rejectWithValue(
        error.response?.data || error.message
      );
    }
  }
);


export const fetchReceiptByInvoice = createAsyncThunk(
  'receipts/fetchByInvoice',
  async (invoiceNumber) => {
    const response = await axios.get(`${API_BASE_URL}/receipts/invoice/${invoiceNumber}/`, {
      headers: getAuthHeaders()
    });
    console.log('Fetched receipt by invoice:', response.data); // Log the fetched receipt
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
      // In your receiptsSlice.js
.addCase(fetchReceiptByInvoice.fulfilled, (state, action) => {
  state.status = 'succeeded';
  // Convert single object to array if needed
  state.receipts = Array.isArray(action.payload) ? action.payload : [action.payload];
  state.error = null;
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