import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import BASE_URL from '../../config/api';
import toast from 'react-hot-toast';

export const fetchExpenseSummary = createAsyncThunk(
  "finance/fetchExpenseSummary",
  async (params, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      
      const urlParams = new URLSearchParams();
      // Add only defined parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          urlParams.append(key, value);
        }
      });

      const response = await fetch(
        `${BASE_URL}/finance/api/expense-summary/?${urlParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(
          errorData.message || "Failed to fetch expense summary."
        );
      }
      const data = await response.json();
      return data;
    } catch (error) {
      toast.error(error.message);
      return rejectWithValue(error.message);
    }
  }
);

// Async Thunks for Expense Categories
export const fetchExpenseCategories = createAsyncThunk(
  'finance/fetchExpenseCategories',
  async ({page} = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const url = `${BASE_URL}/finance/api/expense-categories/`;
      const params = new URLSearchParams();
      if (page) {
        params.append('page', page);
      }
      const response = await fetch(`${url}?${params.toString()}`, {
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
      const token = localStorage.getItem('token');
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
  "finance/fetchExpenses",
  async ({ page = 1, startDate, endDate }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: page,
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
      });

      const response = await fetch(
        `${BASE_URL}/finance/api/expenses/?${params}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(
          errorData.message || "Failed to fetch expenses."
        );
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
      const response = await fetch(`${BASE_URL}/finance/api/expenses/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: newExpense,
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/finance/api/expenses/${id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: updatedData,
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
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchIncomeSummary = createAsyncThunk(
  "finance/fetchIncomeSummary",
  async (params, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const urlParams = new URLSearchParams();

      // Add only defined parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          urlParams.append(key, value);
        }
      });

      const response = await fetch(
        `${BASE_URL}/finance/api/income-summary/?${urlParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(
          errorData.message || "Failed to fetch income summary."
        );
      }
      const data = await response.json();
      return data;
    } catch (error) {
      toast.error(error.message);
      return rejectWithValue(error.message);
    }
  }
);

// Async Thunks for Income Sources
export const fetchIncomeSources = createAsyncThunk(
  'finance/fetchIncomeSources',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
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
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addIncomeSource = createAsyncThunk(
  'finance/addIncomeSource',
  async (newSource, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/finance/api/income-sources/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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
      return rejectWithValue(error.message);
    }
  }
);

// Async Thunks for Incomes
export const fetchIncomes = createAsyncThunk(
  "finance/fetchIncomes",
  async ({ page = 1, filters = {} } = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      // Construct query parameters matching the API expectations
      const params = new URLSearchParams({
        page: page,
        source: filters.source || "",
        amount: filters.amount || "",
        description: filters.description || "",
      });

      const url = `${BASE_URL}/finance/api/incomes/?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch incomes");
    }
  }
);



export const addIncome = createAsyncThunk(
  'finance/addIncome',
  async (newIncome, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/finance/api/incomes/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: newIncome.source,
          description: newIncome.description || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to add income.');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


export const updateIncome = createAsyncThunk(
  'finance/updateIncome',
  async ({ id, updatedData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/finance/api/incomes/${id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: updatedData.source,
          description: updatedData.description || "",
        }),
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
      const token = localStorage.getItem('token');
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
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Finance Slice Definition
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
    totalCount: 0,
    totalExpenses: 0,
    totalExpensesCount: 0,
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
      state.incomeSources = action.payload.results || action.payload;
      state.incomeSourcesPagination = { }
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
    });
    builder.addCase(fetchIncomes.fulfilled, (state, action) => {
      state.loading = false;
      state.incomes = action.payload.results || action.payload;
      state.incomesPagination = {
        count: action.payload.count || 0,
        next: action.payload.next || null,
        previous: action.payload.previous || null,
      };
    });
    builder.addCase(fetchIncomes.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'An unknown error occurred';
    });

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

    // Total Income
    builder.addCase(fetchIncomeSummary.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchIncomeSummary.fulfilled, (state, action) => {
      state.loading = false;
      state.totalIncome = action.payload.total_income;
      state.totalCount = action.payload.details.length;
    });
    builder.addCase(fetchIncomeSummary.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Total Expenses
    builder.addCase(fetchExpenseSummary.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchExpenseSummary.fulfilled, (state, action) => {
      state.loading = false;
      state.totalExpenses = action.payload.total_expense;
      state.totalExpensesCount = action.payload.details.length;
    });
    builder.addCase(fetchExpenseSummary.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export default financeSlice;