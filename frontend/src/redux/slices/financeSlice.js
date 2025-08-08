import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import BASE_URL from '../../config/api';

export const fetchExpenseSummary = createAsyncThunk(
  'finance/fetchExpenseSummary',
  async (params, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const urlParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          urlParams.append(key, value);
        }
      });
      const response = await fetch(
        `${BASE_URL}finance/api/expense-summary/?${urlParams.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to fetch expense summary.');
      }
      return await response.json();
    } catch (error) {
      toast.error(error.message);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchExpenseCategories = createAsyncThunk(
  'finance/fetchExpenseCategories',
  async ({ page } = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      const response = await fetch(`${BASE_URL}finance/api/expense-categories/?${params.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to fetch expense categories.');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addExpenseCategory = createAsyncThunk(
  'finance/addExpenseCategory',
  async (newCategory, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}finance/api/expense-categories/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCategory),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to add expense category.');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchExpenses = createAsyncThunk(
  'finance/fetchExpenses',
  async ({ page = 1, filters = {} }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page,
        category: filters.category || '',
        stock_item: filters.stock_item || '',
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
      });
      const response = await fetch(`${BASE_URL}finance/api/expenses/?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to fetch expenses.');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addExpense = createAsyncThunk(
  'finance/addExpense',
  async (newExpense, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}finance/api/expenses/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExpense),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to add expense.');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateExpense = createAsyncThunk(
  'finance/updateExpense',
  async ({ id, updatedData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}finance/api/expenses/${id}/`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to update expense.');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteExpense = createAsyncThunk(
  'finance/deleteExpense',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}finance/api/expenses/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to delete expense.');
      }
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAllExpenses = createAsyncThunk(
  'finance/fetchAllExpenses',
  async ({ startDate, endDate, categoryId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('start', startDate);
      if (endDate) params.append('end', endDate);
      if (categoryId) params.append('category', categoryId);
      const response = await fetch(
        `${BASE_URL}finance/api/expense/all/?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch all expenses');
      }
      return await response.json();
    } catch (error) {
      toast.error(error.message);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAllIncomes = createAsyncThunk(
  'finance/fetchAllIncomes',
  async ({ startDate, endDate, sourceId, stock_item }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('start', startDate);
      if (endDate) params.append('end', endDate);
      if (sourceId) params.append('source', sourceId);
      if (stock_item) params.append('stock_item', stock_item);
      const response = await fetch(
        `${BASE_URL}finance/api/income/all/?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch all incomes');
      }
      return await response.json();
    } catch (error) {
      toast.error(error.message);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchIncomeSummary = createAsyncThunk(
  'finance/fetchIncomeSummary',
  async (params, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const urlParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          urlParams.append(key, value);
        }
      });
      const response = await fetch(
        `${BASE_URL}finance/api/income-summary/?${urlParams.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to fetch income summary.');
      }
      const data = await response.json();
      console.log('fetchIncomeSummary payload:', data); // تصحيح
      return data;
    } catch (error) {
      toast.error(error.message);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchIncomeSources = createAsyncThunk(
  'finance/fetchIncomeSources',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}finance/api/income-sources/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to fetch income sources.');
      }
      const data = await response.json();
      console.log('fetchIncomeSources payload:', data); // تصحيح
      return data;
    } catch (error) {
      toast.error(error.message);
      return rejectWithValue(error.message);
    }
  }
);

export const addIncomeSource = createAsyncThunk(
  'finance/addIncomeSource',
  async (newSource, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}finance/api/income-sources/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSource),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to add income source.');
      }
      return await response.json();
    } catch (error) {
      toast.error(error.message);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchIncomes = createAsyncThunk(
  'finance/fetchIncomes',
  async ({ page = 1, filters = {} }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const params = new URLSearchParams({
        page,
        source: filters.source || '',
        stock_item: filters.stock_item || '',
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
      });
      const response = await fetch(`${BASE_URL}finance/api/incomes/?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('fetchIncomes payload:', data); // تصحيح
      return data;
    } catch (error) {
      toast.error(error.message);
      return rejectWithValue(error.message);
    }
  }
);

export const addIncome = createAsyncThunk(
  'finance/addIncome',
  async (newIncome, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}finance/api/incomes/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newIncome),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to add income.');
      }
      return await response.json();
    } catch (error) {
      toast.error(error.message);
      return rejectWithValue(error.message);
    }
  }
);

export const updateIncome = createAsyncThunk(
  'finance/updateIncome',
  async ({ id, updatedData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}finance/api/incomes/${id}/`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to update income.');
      }
      return await response.json();
    } catch (error) {
      toast.error(error.message);
      return rejectWithValue(error.message);
    }
  }
);

export const deleteIncome = createAsyncThunk(
  'finance/deleteIncome',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}finance/api/incomes/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to delete income.');
      }
      return id;
    } catch (error) {
      toast.error(error.message);
      return rejectWithValue(error.message);
    }
  }
);

const financeSlice = createSlice({
  name: 'finance',
  initialState: {
    expenseCategories: [],
    expenseCategoriesPagination: { count: 0, next: null, previous: null },
    expenses: [],
    expensesPagination: { count: 0, next: null, previous: null },
    incomeSources: [],
    incomeSourcesPagination: { count: 0, next: null, previous: null },
    incomes: [],
    incomesPagination: { count: 0, next: null, previous: null },
    totalIncome: 0,
    totalIncomeCount: 0,
    totalQuantity: 0,
    totalExpenses: 0,
    totalExpensesCount: 0,
    allExpenses: [],
    allIncomes: [],
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
      // Expense Categories
      .addCase(fetchExpenseCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenseCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.expenseCategories = Array.isArray(action.payload.results) ? action.payload.results : action.payload || [];
        state.expenseCategoriesPagination = {
          count: action.payload.count || 0,
          next: action.payload.next || null,
          previous: action.payload.previous || null,
        };
      })
      .addCase(fetchExpenseCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addExpenseCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addExpenseCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.expenseCategories.push(action.payload);
      })
      .addCase(addExpenseCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Expenses
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = Array.isArray(action.payload.results) ? action.payload.results : action.payload || [];
        state.expensesPagination = {
          count: action.payload.count || 0,
          next: action.payload.next || null,
          previous: action.payload.previous || null,
        };
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses.push(action.payload);
      })
      .addCase(addExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = state.expenses.map((expense) =>
          expense.id === action.payload.id ? action.payload : expense
        );
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = state.expenses.filter((expense) => expense.id !== action.payload);
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // All Expenses
      .addCase(fetchAllExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.allExpenses = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAllExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // All Incomes
      .addCase(fetchAllIncomes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllIncomes.fulfilled, (state, action) => {
        state.loading = false;
        state.allIncomes = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAllIncomes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Income Sources
      .addCase(fetchIncomeSources.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIncomeSources.fulfilled, (state, action) => {
        state.loading = false;
        state.incomeSources = Array.isArray(action.payload.results) ? action.payload.results : action.payload || [];
        state.incomeSourcesPagination = {
          count: action.payload.count || 0,
          next: action.payload.next || null,
          previous: action.payload.previous || null,
        };
      })
      .addCase(fetchIncomeSources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addIncomeSource.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addIncomeSource.fulfilled, (state, action) => {
        state.loading = false;
        state.incomeSources.push(action.payload);
      })
      .addCase(addIncomeSource.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Incomes
      .addCase(fetchIncomes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIncomes.fulfilled, (state, action) => {
        state.loading = false;
        state.incomes = Array.isArray(action.payload?.results) ? action.payload.results : [];
        state.incomesPagination = {
          count: action.payload?.count || 0,
          next: action.payload?.next || null,
          previous: action.payload?.previous || null,
        };
      })
      .addCase(fetchIncomes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addIncome.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addIncome.fulfilled, (state, action) => {
        state.loading = false;
        state.incomes.push(action.payload);
      })
      .addCase(addIncome.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateIncome.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateIncome.fulfilled, (state, action) => {
        state.loading = false;
        state.incomes = state.incomes.map((income) =>
          income.id === action.payload.id ? action.payload : income
        );
      })
      .addCase(updateIncome.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteIncome.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteIncome.fulfilled, (state, action) => {
        state.loading = false;
        state.incomes = state.incomes.filter((income) => income.id !== action.payload);
      })
      .addCase(deleteIncome.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Income Summary
      .addCase(fetchIncomeSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIncomeSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.totalIncome = action.payload.total_income || 0;
        state.totalIncomeCount = action.payload.total_income_count || 0;
        state.totalQuantity = action.payload.total_quantity || 0;
      })
      .addCase(fetchIncomeSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = financeSlice.actions;
export default financeSlice.reducer;