import React, { useState } from 'react';

const ExpenseCategory = () => {
  const [expenseCategories, setExpenseCategories] = useState([
    {
      club: "Cairo",
      name: "Office Supplies",
      description: "Buying pens, notebooks, and staplers for daily use."
    },
    {
      club: "Sohag",
      name: "Transport Costs",
      description: "Monthly transportation budget for staff."
    },
    {
      club: "Alexandria",
      name: "Utility Bills",
      description: "Electricity and water bills for the club branch."
    },
    {
      club: "Giza",
      name: "Event Catering",
      description: "Food and drink arrangements for meetings and events."
    },
    {
      club: "Mansoura",
      name: "Maintenance Services",
      description: "Regular check-ups and repairs in the facility."
    },
    {
      club: "Tanta",
      name: "Cleaning Materials",
      description: "Purchase of cleaning agents and tools."
    },
    {
      club: "Aswan",
      name: "Volunteer Travel",
      description: "Travel allowances for volunteers on field trips."
    },
    {
      club: "Luxor",
      name: "Marketing Campaign",
      description: "Flyers, posters, and social media ads."
    },
    {
      club: "Ismailia",
      name: "Workshop Tools",
      description: "Tools needed for community service workshops."
    },
    {
      club: "Zagazig",
      name: "Internet Services",
      description: "Monthly internet subscription for the club office."
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ club: "", name: "", description: "" });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAdd = () => {
    setExpenseCategories(prev => [...prev, formData]);
    setFormData({ club: "", name: "", description: "" });
    setShowModal(false);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Expense Categories</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          + Add Expense Category
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-100 text-left text-sm uppercase text-gray-600 tracking-wider">
              <th className="px-6 py-3">Club</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Description</th>
            </tr>
          </thead>
          <tbody>
            {expenseCategories.map((category, index) => (
              <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4">{category.club}</td>
                <td className="px-6 py-4">{category.name}</td>
                <td className="px-6 py-4">{category.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-40 flex justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add Expense Category</h2>

            <div className="mb-3">
              <label className="block text-sm font-medium">Club</label>
              <input
                type="text"
                name="club"
                value={formData.club}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-green-200"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-green-200"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-green-200"
              />
            </div>

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

