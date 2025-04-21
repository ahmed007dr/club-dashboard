import React from 'react';
import ExpenseCategory from "./ExpenseCategory"
import Expense from "./Expense"
const Finance = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Finance</h1>
      <ExpenseCategory />
      <Expense />
    </div>
  );
};

export default Finance;
