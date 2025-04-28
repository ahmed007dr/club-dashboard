import React, { useState, useEffect } from 'react';
import { CiEdit, CiTrash } from 'react-icons/ci'; // Icons for Edit and Delete
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchExpenses,
  updateExpense,
  addExpense,
  deleteExpense,
} from '../../redux/slices/financeSlice';

const Expense = () => {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [newExpense, setNewExpense] = useState({
    club: "",
    category: "",
    amount: "",
    description: "",
    date: "",
    paid_by: "",
    invoice_number: "",
    attachment: null,
  });

  // Fetch expenses from the backend
  const { expenses, loading, error } = useSelector((state) => state.finance);

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchExpenses());
  }, [dispatch]);

  // Handle input changes in the modal (Edit or Add)
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (currentExpense) {
      setCurrentExpense((prev) => ({
        ...prev,
        [name]: name === "amount" ? parseFloat(value) || 0 : value,
      }));
    } else {
      setNewExpense((prev) => ({
        ...prev,
        [name]: name === "amount" ? parseFloat(value) || 0 : value,
      }));
    }
  };

  // Save the updated expense via API
  const handleSave = () => {
    if (currentExpense) {
      // Prepare the payload to match the backend schema
      const payload = {
        club: parseInt(currentExpense.club) || null,
        category: parseInt(currentExpense.category) || null,
        amount: currentExpense.amount || 0,
        description: currentExpense.description || "",
        date: currentExpense.date || "",
        paid_by: parseInt(currentExpense.paid_by) || null,
        invoice_number: currentExpense.invoice_number || "",
        attachment: currentExpense.attachment || null,
      };

      // Dispatch the update action
      dispatch(updateExpense({ id: currentExpense.id, updatedData: payload }))
        .unwrap()
        .then(() => {
          setShowModal(false); // Close modal after successful update
        })
        .catch((err) => {
          console.error("Failed to update expense:", err);
        });
    } else {
      // Dispatch the add action
      dispatch(addExpense(newExpense))
        .unwrap()
        .then(() => {
          setNewExpense({
            club: "",
            category: "",
            amount: "",
            description: "",
            date: "",
            paid_by: "",
            invoice_number: "",
            attachment: null,
          }); // Reset form
          setShowModal(false); // Close modal after successful addition
        })
        .catch((err) => {
          console.error("Failed to add expense:", err);
        });
    }
  };

  // Open the modal for editing an expense
  const handleEditClick = (expense) => {
    const sanitizedExpense = {
      ...expense,
      club: expense.club?.toString() || "",
      category: expense.category?.toString() || "",
      amount: expense.amount?.toString() || "0",
      description: expense.description || "",
      date: expense.date || "",
      paid_by: expense.paid_by?.toString() || "",
      invoice_number: expense.invoice_number || "",
      attachment: expense.attachment || null,
    };
    setCurrentExpense(sanitizedExpense);
    setShowModal(true);
  };

  // Open the modal for adding a new expense
  const handleAddClick = () => {
    setCurrentExpense(null); // Clear current expense for adding a new one
    setShowModal(true);
  };

  // Delete an expense
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      dispatch(deleteExpense(id))
        .unwrap()
        .then(() => {
          console.log("Expense deleted successfully");
        })
        .catch((err) => {
          console.error("Failed to delete expense:", err);
        });
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <h2 className="text-2xl font-bold mb-4">Expense List</h2>

      {/* Loading State */}
      {loading && <p className="text-lg text-gray-600">Loading...</p>}

      {/* Error State */}
      {error && <p className="text-lg text-red-600">Error: {error}</p>}

      {/* Add Button */}
      <button
        onClick={handleAddClick}
        className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        + Add Expense
      </button>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="text-gray-700 text-left text-sm">
            <tr>
              <th className="px-4 py-2">Club</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Paid By</th>
              <th className="px-4 py-2">Invoice #</th>
              <th className="px-4 py-2">Attachment</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {expenses.map((expense, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-2">{expense.club || "N/A"}</td>
                <td className="px-4 py-2">{expense.category || "N/A"}</td>
                <td className="px-4 py-2">{expense.amount ? `${expense.amount} EGP` : "N/A"}</td>
                <td className="px-4 py-2">{expense.description || "N/A"}</td>
                <td className="px-4 py-2">{expense.date || "N/A"}</td>
                <td className="px-4 py-2">{expense.paid_by || "N/A"}</td>
                <td className="px-4 py-2">{expense.invoice_number || "N/A"}</td>
                <td className="px-4 py-2 text-blue-500 underline cursor-pointer">
                  {expense.attachment || "No Attachment"}
                </td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    onClick={() => handleEditClick(expense)}
                    className="text-green-500 hover:text-green-700"
                  >
                    <CiEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <CiTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-40 flex justify-center items-center bg-black bg-opacity-50"
          onClick={() => setShowModal(false)} // Close modal when clicking outside
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md overflow-y-auto max-h-[80vh]"
            onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
          >
            <h3 className="text-xl font-semibold mb-4">
              {currentExpense ? "Edit Expense" : "Add Expense"}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {[
                "club",
                "category",
                "amount",
                "description",
                "date",
                "paid_by",
                "invoice_number",
                "attachment",
              ].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium capitalize mb-1">
                    {field.replace("_", " ")}
                  </label>
                  <input
                    type={
                      field === "amount"
                        ? "number"
                        : field === "date"
                        ? "date"
                        : "text"
                    }
                    name={field}
                    value={currentExpense ? currentExpense[field] || "" : newExpense[field] || ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200"
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expense;