import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import BASE_URL from '../../config/api';
import toast from 'react-hot-toast';

export const fetchStockItems = createAsyncThunk(
  'stock/fetchStockItems',
  async ({ name = '' }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const params = new URLSearchParams({ name });
      const response = await fetch(`${BASE_URL}finance/api/stock-items/?${params}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to fetch stock items.');
      }
      const data = await response.json();
      return data.results || data;
    } catch (error) {
      toast.error(error.message || 'خطأ في تحميل عناصر المخزون');
      return rejectWithValue(error.message);
    }
  }
);

export const createStockItem = createAsyncThunk(
  'stock/createStockItem',
  async (newItem, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}finance/api/stock-items/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to create stock item.');
      }
      return await response.json();
    } catch (error) {
      toast.error(error.message || 'خطأ في إنشاء عنصر المخزون');
      return rejectWithValue(error.message);
    }
  }
);

export const updateStockItem = createAsyncThunk(
  'stock/updateStockItem',
  async ({ id, updatedData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}finance/api/stock-items/${id}/`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to update stock item.');
      }
      return await response.json();
    } catch (error) {
      toast.error(error.message || 'خطأ في تحديث عنصر المخزون');
      return rejectWithValue(error.message);
    }
  }
);

export const fetchStockInventory = createAsyncThunk(
  'stock/fetchStockInventory',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const response = await fetch(`${BASE_URL}finance/api/stock-inventory/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to fetch stock inventory.');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      toast.error(error.message || 'خطأ في تحميل تقرير الجرد');
      return rejectWithValue(error.message);
    }
  }
);

export const performStockInventory = createAsyncThunk(
  'stock/performStockInventory',
  async ({ inventory }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const response = await fetch(`${BASE_URL}finance/api/stock-inventory/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inventory }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to perform stock inventory.');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      toast.error(error.message || 'خطأ في تسجيل فحص الجرد');
      return rejectWithValue(error.message);
    }
  }
);

export const fetchStockProfit = createAsyncThunk(
  'stock/fetchStockProfit',
  async ({ stock_item_id, start_date, end_date }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const params = new URLSearchParams();
      if (stock_item_id) params.append('stock_item_id', stock_item_id);
      if (start_date) params.append('start_date', start_date);
      if (end_date) params.append('end_date', end_date);
      const response = await fetch(`${BASE_URL}finance/api/stock-profit/?${params}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to fetch stock profit.');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      toast.error(error.message || 'خطأ في تحميل أرباح المخزون');
      return rejectWithValue(error.message);
    }
  }
);

export const fetchStockSalesAnalysis = createAsyncThunk(
  'stock/fetchStockSalesAnalysis',
  async ({ stock_item_id, start_date, end_date, period_type = 'monthly' }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const params = new URLSearchParams({ period_type });
      if (stock_item_id) params.append('stock_item_id', stock_item_id);
      if (start_date) params.append('start_date', start_date);
      if (end_date) params.append('end_date', end_date);
      const response = await fetch(`${BASE_URL}finance/api/stock-sales-analysis/?${params}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to fetch stock sales analysis.');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      toast.error(error.message || 'خطأ في تحليل المبيعات');
      return rejectWithValue(error.message);
    }
  }
);

// New Action: Generate Inventory PDF
export const generateInventoryPDF = createAsyncThunk(
  'stock/generateInventoryPDF',
  async ({ stock_item_id, start_date, end_date }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const params = new URLSearchParams();
      if (stock_item_id) params.append('stock_item_id', stock_item_id);
      if (start_date) params.append('start_date', start_date);
      if (end_date) params.append('end_date', end_date);
      const response = await fetch(`${BASE_URL}finance/api/stock-inventory-pdf/?${params}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/pdf',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to generate inventory PDF.');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory_report_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      toast.error(error.message || 'خطأ في توليد تقرير PDF');
      return rejectWithValue(error.message);
    }
  }
);

// New Action: Fetch Schedules
export const fetchSchedules = createAsyncThunk(
  'stock/fetchSchedules',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const response = await fetch(`${BASE_URL}finance/api/schedule/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch schedules.');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      toast.error(error.message || 'خطأ في تحميل المواعيد');
      return rejectWithValue(error.message);
    }
  }
);

// New Action: Create Schedule
export const createSchedule = createAsyncThunk(
  'stock/createSchedule',
  async (scheduleData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const response = await fetch(`${BASE_URL}finance/api/schedule/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to create schedule.');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      toast.error(error.message || 'خطأ في إنشاء الموعد');
      return rejectWithValue(error.message);
    }
  }
);

const stockSlice = createSlice({
  name: 'stock',
  initialState: {
    stockItems: [],
    inventory: [],
    profit: [],
    salesAnalysis: [],
    schedules: [], // Added for schedules
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStockItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStockItems.fulfilled, (state, action) => {
        state.loading = false;
        state.stockItems = action.payload.results || action.payload;
      })
      .addCase(fetchStockItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createStockItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStockItem.fulfilled, (state, action) => {
        state.loading = false;
        state.stockItems.push(action.payload);
      })
      .addCase(createStockItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateStockItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStockItem.fulfilled, (state, action) => {
        state.loading = false;
        state.stockItems = state.stockItems.map((item) =>
          item.id === action.payload.id ? action.payload : item
        );
      })
      .addCase(updateStockItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchStockInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStockInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.inventory = action.payload;
      })
      .addCase(fetchStockInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(performStockInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(performStockInventory.fulfilled, (state, action) => {
        state.loading = false;
        // Update inventory with discrepancies if needed
        if (action.payload.discrepancies) {
          state.inventory = state.inventory.map(item => {
            const discrepancy = action.payload.discrepancies.find(d => d.stock_item === item.name);
            return discrepancy ? { ...item, current_quantity: discrepancy.actual_quantity } : item;
          });
        }
      })
      .addCase(performStockInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchStockProfit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStockProfit.fulfilled, (state, action) => {
        state.loading = false;
        state.profit = action.payload;
      })
      .addCase(fetchStockProfit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchStockSalesAnalysis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStockSalesAnalysis.fulfilled, (state, action) => {
        state.loading = false;
        state.salesAnalysis = action.payload;
      })
      .addCase(fetchStockSalesAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // New Reducers for PDF Generation
      .addCase(generateInventoryPDF.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateInventoryPDF.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(generateInventoryPDF.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // New Reducers for Schedules
      .addCase(fetchSchedules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchedules.fulfilled, (state, action) => {
        state.loading = false;
        state.schedules = action.payload;
      })
      .addCase(fetchSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.schedules.push(action.payload);
      })
      .addCase(createSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default stockSlice.reducer;