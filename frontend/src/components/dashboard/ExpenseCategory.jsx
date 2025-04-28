import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchExpenseCategories,
  addExpenseCategory,
} from '../../redux/slices/financeSlice';

const ExpenseCategory = () => {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ club: "", name: "", description: "" });
  const [errors, setErrors] = useState({});

  // Fetch expense categories from the backend
  const { expenseCategories, loading, error } = useSelector((state) => state.finance);

  // Fetch data on component mount
  React.useEffect(() => {
    dispatch(fetchExpenseCategories());
  }, [dispatch]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error on typing
  };

  // Validate form data
  const validate = () => {
    const newErrors = {};
    if (!formData.club.trim()) newErrors.club = "Club is required.";
    if (!formData.name.trim()) newErrors.name = "Name is required.";
    if (!formData.description.trim()) newErrors.description = "Description is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  // Add new expense category via API
  const handleAdd = () => {
    if (validate()) {
      dispatch(addExpenseCategory(formData))
        .unwrap() // Unwrap the promise to handle success or failure
        .then(() => {
          setFormData({ club: "", name: "", description: "" }); // Reset form
          setShowModal(false); // Close modal
        })
        .catch((err) => {
          console.error("Failed to add expense category:", err);
        });
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Expense Categories</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + Add Expense Category
        </button>
      </div>

      {/* Loading State */}
      {loading && <p className="text-lg text-gray-600">Loading...</p>}

      {/* Error State */}
      {error && <p className="text-lg text-red-600">Error: {error}</p>}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full shadow-md rounded-lg overflow-hidden">
          <thead>
            <tr className="text-left text-sm uppercase text-gray-600 tracking-wider">
              <th className="px-6 py-3">Club</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Description</th>
            </tr>
          </thead>
          <tbody>
            {expenseCategories.map((category) => (
              <tr key={category.id} className="border-b border-gray-200">
                <td className="px-6 py-4">{category.club}</td>
                <td className="px-6 py-4">{category.name}</td>
                <td className="px-6 py-4">{category.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Adding a New Expense Category */}
      {showModal && (
        <div
          className="fixed inset-0 z-40 flex justify-center items-center  bg-opacity-50"
          onClick={() => setShowModal(false)} // Close modal when clicking outside
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
          >
            <h2 className="text-xl font-semibold mb-4">Add Expense Category</h2>

            {/* Club Field */}
            <div className="mb-3">
              <label className="block text-sm font-medium">Club</label>
              <input
                type="text"
                name="club"
                value={formData.club}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-green-200"
              />
              {errors.club && <p className="text-red-500 text-sm">{errors.club}</p>}
            </div>

            {/* Name Field */}
            <div className="mb-3">
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-green-200"
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            {/* Description Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-green-200"
              />
              {errors.description && (
                <p className="text-red-500 text-sm">{errors.description}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseCategory;