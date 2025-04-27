import React, { useState, useEffect } from 'react';
import { CiEdit, CiTrash } from 'react-icons/ci'; // Icons for Edit and Delete
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchIncomeSources,
  addIncomeSource,
  fetchIncomes,
  addIncome,
  updateIncome,
  deleteIncome,
} from '../../redux/slices/financeSlice';

const Income = () => {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null); // For editing income
  const [newItem, setNewItem] = useState({
    club: "",
    source: "",
    amount: "",
    description: "",
    date: "",
    received_by: "",
  }); // For adding new income or income source
  const [activeTab, setActiveTab] = useState('incomeSources'); // Toggle between Income Sources and Incomes

  // Fetch data from Redux state
  const { incomeSources, incomes, loading, error } = useSelector((state) => state.finance);

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchIncomeSources());
    dispatch(fetchIncomes());
  }, [dispatch]);

  // Handle input changes in the modal (Edit or Add)
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (currentItem) {
      setCurrentItem((prev) => ({ ...prev, [name]: value }));
    } else {
      setNewItem((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Save the updated item via API
  const handleSave = () => {
    const isIncomeSource = activeTab === 'incomeSources';

    // Prepare the payload based on the active tab
    const payload = currentItem
      ? {
          id: currentItem.id,
          club: parseInt(currentItem.club),
          source: parseInt(currentItem.source),
          amount: parseFloat(currentItem.amount),
          description: currentItem.description || "",
          date: currentItem.date || "",
          received_by: parseInt(currentItem.received_by),
        }
      : {
          club: parseInt(newItem.club),
          source: parseInt(newItem.source),
          amount: parseFloat(newItem.amount),
          description: newItem.description || "",
          date: newItem.date || "",
          received_by: parseInt(newItem.received_by),
        };

    // Dispatch action based on the active tab and whether editing or adding
    const action = currentItem
      ? updateIncome({ id: currentItem.id, updatedData: payload }) // Editing an income
      : isIncomeSource
      ? addIncomeSource(newItem) // Adding a new income source
      : addIncome(payload); // Adding a new income

    dispatch(action)
      .unwrap()
      .then(() => {
        setCurrentItem(null); // Reset current item
        setNewItem({
          club: "",
          source: "",
          amount: "",
          description: "",
          date: "",
          received_by: "",
        }); // Reset new item form
        setShowModal(false); // Close modal after successful operation
      })
      .catch((err) => {
        console.error(`Failed to ${currentItem ? 'update' : 'add'} ${isIncomeSource ? 'income source' : 'income'}:`, err);
      });
  };

  // Open the modal for editing an income
  const handleEditClick = (item) => {
    if (activeTab === 'incomes') {
      setCurrentItem(item);
      setShowModal(true);
    }
  };

  // Open the modal for adding a new item
  const handleAddClick = () => {
    setCurrentItem(null); // Clear current item for adding a new one
    setShowModal(true);
  };

  // Delete an income
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this income?")) {
      dispatch(deleteIncome(id))
        .unwrap()
        .then(() => {
          console.log("Income deleted successfully");
        })
        .catch((err) => {
          console.error("Failed to delete income:", err);
        });
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Finance</h2>

      {/* Loading State */}
      {loading && <p className="text-lg text-gray-600">Loading...</p>}

      {/* Error State */}
      {error && <p className="text-lg text-red-600">Error: {error}</p>}

      {/* Tabs */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setActiveTab('incomeSources')}
          className={`px-4 py-2 rounded ${activeTab === 'incomeSources' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Income Sources
        </button>
        <button
          onClick={() => setActiveTab('incomes')}
          className={`px-4 py-2 rounded ${activeTab === 'incomes' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Incomes
        </button>
      </div>

      {/* Add Button */}
      <button
        onClick={handleAddClick}
        className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        + Add {activeTab === 'incomeSources' ? 'Income Source' : 'Income'}
      </button>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
        <table className="min-w-full table-auto divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                Club Name
              </th>
             
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                {activeTab === 'incomes' ? 'Income Source' : " Name"}
              </th>
              
              {activeTab === 'incomes' && (
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                Amount
              </th>
              )}
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                Description
              </th>
              {activeTab === 'incomes' && (
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                Date
              </th>
              )}
              {activeTab === 'incomes' && (
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                Received By
              </th>
              )}
              {activeTab === 'incomes' && (
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(activeTab === 'incomeSources' ? incomeSources : incomes).map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {activeTab === 'incomes' ? item.source_details?.name || "N/A" : item.club_details?.name || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {activeTab === 'incomes' ?item.source_details?.name || "N/A" : item.name || "N/A"}
                </td>
                {activeTab === 'incomes' && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.amount ? `${item.amount} EGP` : "N/A"}
                </td>
                )}
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.description || "No description"}
                </td>
                
                {activeTab === 'incomes' && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date || "N/A"}</td>
                )}
                {activeTab === 'incomes' && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.received_by_details?.username || "N/A"}
                </td>
                )}
                {activeTab === 'incomes' && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex gap-2">
                  {activeTab === 'incomes' && (
                    <>
                      <button
                        onClick={() => handleEditClick(item)}
                        className="text-green-500 hover:text-green-700"
                      >
                        <CiEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <CiTrash />
                      </button>
                    </>
                  )}
                </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-40 flex justify-center items-center  bg-opacity-50"
          onClick={() => setShowModal(false)} // Close modal when clicking outside
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md overflow-y-auto max-h-[80vh]"
            onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
          >
            <h3 className="text-xl font-semibold mb-4">
              {currentItem ? `Edit ${activeTab === 'incomeSources' ? 'Income Source' : 'Income'}` : `Add ${activeTab === 'incomeSources' ? 'Income Source' : 'Income'}`}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {[
                ...(activeTab === 'incomeSources'
                  ? ['name', 'description', 'club']
                  : ['club', 'source', 'amount', 'description', 'date', 'received_by']),
              ].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium capitalize mb-1">
                    {field.replace("_", " ")}
                  </label>
                  <input
                    type={
                      field === 'amount'
                        ? 'number'
                        : field === 'date'
                        ? 'date'
                        : 'text'
                    }
                    name={field}
                    value={
                      currentItem
                        ? currentItem[field] || ""
                        : newItem[field] || ""
                    }
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

export default Income;