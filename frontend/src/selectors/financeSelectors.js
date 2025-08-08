import { createSelector } from 'reselect';

const selectFinanceState = (state) => state.finance || {};
const selectStockState = (state) => state.stock || {};
const selectAuthState = (state) => state.auth || {};

export const selectFinance = createSelector(
  [selectFinanceState],
  (finance) => ({
    incomes: finance.incomes || [],
    incomeSources: finance.incomeSources || [],
    loading: finance.loading || false,
    error: finance.error || null,
    incomesPagination: finance.incomesPagination || { count: 0, next: null, previous: null },
    totalIncome: finance.totalIncome || 0,
    totalIncomeCount: finance.totalIncomeCount || 0,
    totalQuantity: finance.totalQuantity || 0,
    allIncomes: finance.allIncomes || [],
  })
);

export const selectStockItems = createSelector(
  [selectStockState],
  (stock) => stock.stockItems || []
);

export const selectUser = createSelector(
  [selectAuthState],
  (auth) => auth.user || null
);