import React, { useState } from 'react';
import { CiEdit } from 'react-icons/ci';

const Expense = () => {
  const [expenses, setExpenses] = useState([
    {
      club: "Cairo",
      category: "Office Supplies",
      amount: 750,
      description: "Purchased notebooks, pens, and folders for the office.",
      date: "2024-05-12",
      paid_by: "John Doe",
      invoice_number: "INV-00123",
      attachment: "receipt_office_supplies.pdf"
    },
    {
      club: "Alexandria",
      category: "Transport Costs",
      amount: 1200,
      description: "Monthly transportation for volunteers.",
      date: "2024-05-08",
      paid_by: "Fatima Hassan",
      invoice_number: "INV-00124",
      attachment: "transport_invoice_may.pdf"
    },
    {
      club: "Sohag",
      category: "Utility Bills",
      amount: 980,
      description: "Electricity and water bill payment for April.",
      date: "2024-04-30",
      paid_by: "Ahmed Ali",
      invoice_number: "INV-00125",
      attachment: "utilities_april.pdf"
    },
    {
      club: "Giza",
      category: "Event Catering",
      amount: 2500,
      description: "Catering services for youth development event.",
      date: "2024-06-01",
      paid_by: "Mona Ibrahim",
      invoice_number: "INV-00126",
      attachment: "catering_receipt.pdf"
    },
    {
      club: "Luxor",
      category: "Maintenance Services",
      amount: 1650,
      description: "Air conditioner and plumbing maintenance.",
      date: "2024-06-10",
      paid_by: "Tariq Al-Masry",
      invoice_number: "INV-00127",
      attachment: "maintenance_report.pdf"
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [editIndex, setEditIndex] = useState(null);

  const handleEditClick = (index) => {
    setCurrentExpense(expenses[index]);
    setEditIndex(index);
    setShowModal(true);
  };

  const handleChange = (e) => {
    setCurrentExpense({ ...currentExpense, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    const updatedExpenses = [...expenses];
    updatedExpenses[editIndex] = currentExpense;
    setExpenses(updatedExpenses);
    setShowModal(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Expense List</h2>
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
        <table className="min-w-full  divide-y divide-gray-200">
          <thead className=" text-gray-700 text-left text-sm">
            <tr>
              <th className="px-4 py-2">Club</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Paid By</th>
              <th className="px-4 py-2">Invoice #</th>
              <th className="px-4 py-2">Attachment</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {expenses.map((expense, index) => (
              <tr key={index} className="">
                <td className="px-4 py-2">{expense.club}</td>
                <td className="px-4 py-2">{expense.category}</td>
                <td className="px-4 py-2">{expense.amount} EGP</td>
                <td className="px-4 py-2">{expense.description}</td>
                <td className="px-4 py-2">{expense.date}</td>
                <td className="px-4 py-2">{expense.paid_by}</td>
                <td className="px-4 py-2">{expense.invoice_number}</td>
                <td className="px-4 py-2 text-blue-500 underline cursor-pointer">{expense.attachment}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleEditClick(index)}
                    className="btn-green"
                  >
                    
                    <CiEdit />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showModal && currentExpense && (
        <div className="fixed inset-0 z-40 flex justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="modal">
            <h3 className="text-xl font-semibold mb-4">Edit Expense</h3>
            <div className="grid grid-cols-1 gap-4">
              {[
                "club",
                "category",
                "amount",
                "description",
                "date",
                "paid_by",
                "invoice_number",
                "attachment"
              ].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium capitalize mb-1">{field.replace('_', ' ')}</label>
                  <input
                    type={field === "amount" ? "number" : field === "date" ? "date" : "text"}
                    name={field}
                    value={currentExpense[field]}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded-md"
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
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
