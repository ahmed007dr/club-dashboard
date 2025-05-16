import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import BASE_URL from '../../config/api';

// Async Thunks for Expense Categories
export const fetchExpenseCategories = createAsyncThunk(
  'finance/fetchExpenseCategories',
  async (page = 1, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/finance/api/expense-categories/?page=${page}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
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
      const token = localStorage.getItem('token'); // Retrieve token
      const response = await fetch(`${BASE_URL}/finance/api/expense-categories/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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

// Async Thunks for Expenses
export const fetchExpenses = createAsyncThunk(
  'finance/fetchExpenses',
  async (page = 1, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/finance/api/expenses/?page=${page}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to fetch expenses.');
      }
      return await response.json(); // Expect paginated response: { results, count, next, previous }
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
      const response = await fetch(`${BASE_URL}/finance/api/expenses/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Do not set Content-Type; browser sets multipart/form-data automatically
        },
        body: newExpense, // Send FormData directly
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData || 'Failed to add expense.');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message || 'Network error occurred.');
    }
  }
);

export const updateExpense = createAsyncThunk(
  'finance/updateExpense',
  async ({ id, updatedData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token'); // Retrieve token
      const response = await fetch(`${BASE_URL}/finance/api/expenses/${id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          
        },
        body:updatedData,
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
      const token = localStorage.getItem('token'); // Retrieve token
      const response = await fetch(`${BASE_URL}/finance/api/expenses/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to delete expense.');
      }
      return id; // Return the ID of the deleted expense
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async Thunks for Income Sources
export const fetchIncomeSources = createAsyncThunk(
  'finance/fetchIncomeSources',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token'); // Retrieve token
      const response = await fetch(`${BASE_URL}/finance/api/income-sources/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to fetch income sources.');
      }
      return await response.json().then((data) => (data.results));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addIncomeSource = createAsyncThunk(
  'finance/addIncomeSource',
  async (newSource, { rejectWithValue }) => {
    try {
      console.log('Attempting to add income source with data:', newSource);
      
      const token = localStorage.getItem('token');
      console.log('Retrieved token from localStorage:', token ? 'exists' : 'missing');
      
      const response = await fetch(`${BASE_URL}/finance/api/income-sources/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json', // Make sure to include this if sending JSON
        },
        body: JSON.stringify(newSource), // Make sure to stringify if sending JSON
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response from server:', errorData);
        return rejectWithValue(errorData.message || 'Failed to add income source.');
      }
      
      const responseData = await response.json();
      console.log('Successfully added income source:', responseData);
      return responseData;
      
    } catch (error) {
      console.error('Caught an error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async Thunks for Incomes
export const fetchIncomes = createAsyncThunk(
  'finance/fetchIncomes',
  async ({ page = 1 }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token'); // Retrieve token
      const response = await fetch(`${BASE_URL}/finance/api/incomes/?page=${page}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to fetch incomes.');
      }
      return await response.json().then((data) => (data.results));
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch incomes.');
    }
  }
);

export const addIncome = createAsyncThunk(
  'finance/addIncome',
  async (newIncome, { rejectWithValue }) => {
    try {
      console.log('Starting income submission with data:', newIncome);
      
      const token = localStorage.getItem('token');
      console.log('Retrieved auth token:', token ? 'exists' : 'missing');
      
      const response = await fetch(`${BASE_URL}/finance/api/incomes/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newIncome),
      });

      console.log('Received response with status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server responded with error:', {
          status: response.status,
          error: errorData
        });
        return rejectWithValue(errorData.message || 'Failed to add income.');
      }
      
      const responseData = await response.json();
      console.log('Income successfully recorded:', responseData);
      return responseData;
      
    } catch (error) {
      console.error('Error occurred during income submission:', {
        error: error.message,
        stack: error.stack
      });
      return rejectWithValue(error.message);
    }
  }
);

export const updateIncome = createAsyncThunk(
  'finance/updateIncome',
  async ({ id, updatedData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token'); // Retrieve token
      const response = await fetch(`${BASE_URL}/finance/api/incomes/${id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
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
      return rejectWithValue(error.message);
    }
  }
);

export const deleteIncome = createAsyncThunk(
  'finance/deleteIncome',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token'); // Retrieve token
      const response = await fetch(`${BASE_URL}/finance/api/incomes/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to delete income.');
      }
      return id; // Return the ID of the deleted income
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Finance Slice Definition
const financeSlice = createSlice({
  name: 'finance',
  initialState: {
    expenseCategories: [], // Just store the current page's categories
    expenseCategoriesPagination: { // Store pagination info from API
      count: 0,
      next: null,
      previous: null,
    },
    expenses: [],
    expensesPagination: { count: 0, next: null, previous: null },
    incomeSources: [],
    incomes: [],
    incomesPagination: { 
      count: 0,
      next: null,
      previous: null,
    },
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
 
    // Fetch Expense Categories
    builder.addCase(fetchExpenseCategories.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
  builder.addCase(fetchExpenseCategories.fulfilled, (state, action) => {
      state.loading = false;
      state.expenseCategories = action.payload.results;
      state.expenseCategoriesPagination = {
        count: action.payload.count,
        next: action.payload.next,
        previous: action.payload.previous,
      };
    });

    builder.addCase(fetchExpenseCategories.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Add Expense Category
    builder.addCase(addExpenseCategory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addExpenseCategory.fulfilled, (state, action) => {
      state.loading = false;
      state.expenseCategories.push(action.payload);
    });
    builder.addCase(addExpenseCategory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Fetch Expenses
    builder.addCase(fetchExpenses.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
   builder.addCase(fetchExpenses.fulfilled, (state, action) => {
      state.loading = false;
      state.expenses = action.payload.results;
      state.expensesPagination = {
        count: action.payload.count,
        next: action.payload.next,
        previous: action.payload.previous,
      };
    });
    builder.addCase(fetchExpenses.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Add Expense
    builder.addCase(addExpense.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addExpense.fulfilled, (state, action) => {
      state.loading = false;
      state.expenses.push(action.payload);
    });
    builder.addCase(addExpense.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Update Expense
    builder.addCase(updateExpense.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateExpense.fulfilled, (state, action) => {
      state.loading = false;
      const updatedExpense = action.payload;
      state.expenses = state.expenses.map((expense) =>
        expense.id === updatedExpense.id ? updatedExpense : expense
      );
    });
    builder.addCase(updateExpense.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Delete Expense
    builder.addCase(deleteExpense.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteExpense.fulfilled, (state, action) => {
      state.loading = false;
      const deletedId = action.payload;
      state.expenses = state.expenses.filter((expense) => expense.id !== deletedId);
    });
    builder.addCase(deleteExpense.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Fetch Income Sources
    builder.addCase(fetchIncomeSources.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchIncomeSources.fulfilled, (state, action) => {
      state.loading = false;
      state.incomeSources = action.payload;
    });
    builder.addCase(fetchIncomeSources.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Add Income Source
    builder.addCase(addIncomeSource.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addIncomeSource.fulfilled, (state, action) => {
      state.loading = false;
      state.incomeSources.push(action.payload);
    });
    builder.addCase(addIncomeSource.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Fetch Incomes
     builder.addCase(fetchIncomes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
       builder.addCase(fetchIncomes.fulfilled, (state, action) => {
        state.loading = false;
        state.incomes = {
          count: action.payload.count || 0,
          results: action.payload.results || [],
          next: action.payload.next || null,
          previous: action.payload.previous || null,
        };
      })
       builder.addCase(fetchIncomes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "An unknown error occurred";
      })

    // Add Income
    builder.addCase(addIncome.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addIncome.fulfilled, (state, action) => {
      state.loading = false;
      state.incomes.push(action.payload);
    });
    builder.addCase(addIncome.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Update Income
    builder.addCase(updateIncome.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateIncome.fulfilled, (state, action) => {
      state.loading = false;
      const updatedIncome = action.payload;
      state.incomes = state.incomes.map((income) =>
        income.id === updatedIncome.id ? updatedIncome : income
      );
    });
    builder.addCase(updateIncome.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Delete Income
    builder.addCase(deleteIncome.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteIncome.fulfilled, (state, action) => {
      state.loading = false;
      const deletedId = action.payload;
      state.incomes = state.incomes.filter((income) => income.id !== deletedId);
    });
    builder.addCase(deleteIncome.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export default financeSlice;