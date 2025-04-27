import React, { useState } from 'react';
import ExpenseCategory from './ExpenseCategory';
import Expense from './Expense';
import IncomeSources from './IncomeSources';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { GiMoneyStack, GiReceiveMoney, GiPayMoney, GiWallet } from 'react-icons/gi';

const Finance = () => {
  const [openSection, setOpenSection] = useState(null);

  // Toggle accordion sections
  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8">
        <GiMoneyStack className="text-4xl text-green-600" />
        <h1 className="text-3xl font-bold text-gray-800">Finance Management</h1>
      </div>

      {/* Expense Category Accordion */}
      <div className="border border-gray-200 rounded-lg shadow-sm mb-6 overflow-hidden transition-all duration-300">
        <button
          onClick={() => toggleSection('expenseCategory')}
          className="w-full flex items-center justify-between px-6 py-4 text-left text-lg font-medium bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <GiPayMoney className="text-xl text-red-500" />
            <span>Expense Categories</span>
          </div>
          {openSection === 'expenseCategory' ? (
            <IoIosArrowUp className="text-xl text-gray-600" />
          ) : (
            <IoIosArrowDown className="text-xl text-gray-600" />
          )}
        </button>
        <div
          className={`${
            openSection === 'expenseCategory' ? 'block' : 'hidden'
          } bg-gray-50 p-6`}
        >
          <p className="text-sm text-gray-600 mb-4">
            Manage categories for tracking expenses.
          </p>
          <ExpenseCategory />
        </div>
      </div>

      {/* Expense Accordion */}
      <div className="border border-gray-200 rounded-lg shadow-sm mb-6 overflow-hidden transition-all duration-300">
        <button
          onClick={() => toggleSection('expense')}
          className="w-full flex items-center justify-between px-6 py-4 text-left text-lg font-medium bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <GiWallet className="text-xl text-blue-500" />
            <span>Expenses</span>
          </div>
          {openSection === 'expense' ? (
            <IoIosArrowUp className="text-xl text-gray-600" />
          ) : (
            <IoIosArrowDown className="text-xl text-gray-600" />
          )}
        </button>
        <div
          className={`${
            openSection === 'expense' ? 'block' : 'hidden'
          } bg-gray-50 p-6`}
        >
          <p className="text-sm text-gray-600 mb-4">
            Track and manage all your expenses here.
          </p>
          <Expense />
        </div>
      </div>

      {/* Income Sources Accordion */}
      <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all duration-300">
        <button
          onClick={() => toggleSection('incomeSources')}
          className="w-full flex items-center justify-between px-6 py-4 text-left text-lg font-medium bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <GiReceiveMoney className="text-xl text-green-500" />
            <span>Income Sources</span>
          </div>
          {openSection === 'incomeSources' ? (
            <IoIosArrowUp className="text-xl text-gray-600" />
          ) : (
            <IoIosArrowDown className="text-xl text-gray-600" />
          )}
        </button>
        <div
          className={`${
            openSection === 'incomeSources' ? 'block' : 'hidden'
          } bg-gray-50 p-6`}
        >
          <p className="text-sm text-gray-600 mb-4">
            Add and manage sources of income for better financial tracking.
          </p>
          <IncomeSources />
        </div>
      </div>
    </div>
  );
};

export default Finance;