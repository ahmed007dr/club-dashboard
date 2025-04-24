import React, { useState } from 'react';
import ExpenseCategory from './ExpenseCategory';
import Expense from './Expense';
import IncomeSources from './IncomeSources';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import {  GiMoneyStack } from 'react-icons/gi';

const Finance = () => {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="p-6">
      <div className="flex items-start space-x-3">
  <GiMoneyStack className='btn-pinkish text-2xl' />
  <h1 className="text-2xl font-bold mb-4">Finance</h1>
</div>


      {/* Expense Category Accordion */}
      <div className="border-b border-gray-200 mb-4">
        <button
          onClick={() => toggleSection('expenseCategory')}
          className="w-full flex items-center justify-between text-left text-lg font-medium py-3 px-4  rounded-t"
        >
          <span>Expense Categories</span>
          {openSection === 'expenseCategory' ? (
            <IoIosArrowUp className="text-xl" />
          ) : (
            <IoIosArrowDown className="text-xl" />
          )}
        </button>
        {openSection === 'expenseCategory' && (
          <div className="  shadow rounded-b">
            <ExpenseCategory />
          </div>
        )}
      </div>

      {/* Expense Accordion */}
      <div className="border-b border-gray-200 mb-4">
        <button
          onClick={() => toggleSection('expense')}
          className="w-full flex items-center justify-between text-left text-lg font-medium py-3 px-4  rounded-t"
        >
          <span>Expenses</span>
          {openSection === 'expense' ? (
            <IoIosArrowUp className="text-xl" />
          ) : (
            <IoIosArrowDown className="text-xl" />
          )}
        </button>
        {openSection === 'expense' && (
          <div className="  shadow rounded-b">
            <Expense />
          </div>
        )}
      </div>

      {/* Income Sources Accordion */}
      <div className="border-b border-gray-200 mb-4">
        <button
          onClick={() => toggleSection('incomeSources')}
          className="w-full flex items-center justify-between text-left text-lg font-medium py-3 px-4  rounded-t"
        >
          <span>Income Sources</span>
          {openSection === 'incomeSources' ? (
            <IoIosArrowUp className="text-xl" />
          ) : (
            <IoIosArrowDown className="text-xl" />
          )}
        </button>
        {openSection === 'incomeSources' && (
          <div className="  shadow rounded-b">
            <IncomeSources />
          </div>
        )}
      </div>
    </div>
  );
};

export default Finance;


