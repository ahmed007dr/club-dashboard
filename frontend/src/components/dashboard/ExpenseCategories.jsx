import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchExpenseCategories,
  addExpenseCategory 
} from '../../redux/slices/financeSlice';

const ExpenseCategories = () => {
  const dispatch = useDispatch();
  
  // Select data from Redux store
  const { expenseCategories, loading, error } = useSelector(
    (state) => state.finance
  );

  // Fetch expense categories on component mount
  useEffect(() => {
    dispatch(fetchExpenseCategories());
  }, [dispatch]);

  // Display loading state
  if (loading) return <div>Loading categories...</div>;

  // Display error state
  if (error) return <div>Error: {error}</div>;

  // Render categories
  return (
    <div>
      <h2>Expense Categories</h2>
      <ul>
        {expenseCategories?.map((category) => (
          <li key={category.id}>{category.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default ExpenseCategories;