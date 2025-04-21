import React, { useState } from 'react';
import { CiTrash, CiEdit } from 'react-icons/ci';
import { FaEye } from "react-icons/fa";

const fakeReceipts = [
  {
    id: 1,
    buyer_name: "Mike Johnson",
    ticket_type: "day_pass",
    price: "30.00",
    used: false,
    issue_date: "2025-04-10",
    used_by: null,
  },
  {
    id: 2,
    buyer_name: "Sarah Parker",
    ticket_type: "week_pass",
    price: "50.00",
    used: true,
    issue_date: "2025-04-08",
    used_by: "Sarah Parker",
  },
  {
    id: 3,
    buyer_name: "David Brown",
    ticket_type: "month_pass",
    price: "100.00",
    used: false,
    issue_date: "2025-04-01",
    used_by: null,
  },
];

const Receipts = () => {
  const [receipts, setReceipts] = useState(fakeReceipts);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [modalType, setModalType] = useState(null); // 'view' | 'edit' | 'delete'

  const openModal = (type, receipt) => {
    setSelectedReceipt(receipt);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedReceipt(null);
    setModalType(null);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Receipts</h2>
       <div className="mb-4">
        <input
          type="text"
         // value={invoiceNumber}
          //onChange={(e) => setInvoiceNumber(e.target.value)}
          className="border px-4 py-2 rounded"
          placeholder="أدخل رقم الفاتورة"
        />
        <button
         // onClick={handleSearch}
          className="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          بحث
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="px-4 py-2 text-left">Buyer</th>
              <th className="px-4 py-2 text-left">Ticket Type</th>
              <th className="px-4 py-2 text-left">Price</th>
              <th className="px-4 py-2 text-left">Used</th>
              <th className="px-4 py-2 text-left">Issue Date</th>
              <th className="px-4 py-2 text-left">Used By</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((receipt) => (
              <tr key={receipt.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{receipt.buyer_name}</td>
                <td className="px-4 py-2 capitalize">{receipt.ticket_type}</td>
                <td className="px-4 py-2">EGP {receipt.price}</td>
                <td className="px-4 py-2">{receipt.used ? "Yes" : "No"}</td>
                <td className="px-4 py-2">{receipt.issue_date}</td>
                <td className="px-4 py-2">{receipt.used_by || "N/A"}</td>
                <td className="px-4 py-2 space-x-2">
                  <button onClick={() => openModal('view', receipt)} className="text-blue-500 hover:text-blue-700">
                    <FaEye />
                  </button>
                  <button onClick={() => openModal('edit', receipt)} className="text-green-500 hover:text-green-700">
                    <CiEdit />
                  </button>
                  <button onClick={() => openModal('delete', receipt)} className="text-red-500 hover:text-red-700">
                    <CiTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modalType && selectedReceipt && (
        <div className="fixed inset-0 z-40 flex justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            {modalType === 'view' && (
              <>
                <h3 className="text-xl font-semibold mb-4">Receipt Info</h3>
                <ul className="space-y-2">
                  <li><strong>Buyer:</strong> {selectedReceipt.buyer_name}</li>
                  <li><strong>Ticket Type:</strong> {selectedReceipt.ticket_type}</li>
                  <li><strong>Price:</strong> EGP {selectedReceipt.price}</li>
                  <li><strong>Used:</strong> {selectedReceipt.used ? "Yes" : "No"}</li>
                  <li><strong>Issue Date:</strong> {selectedReceipt.issue_date}</li>
                  <li><strong>Used By:</strong> {selectedReceipt.used_by || "N/A"}</li>
                </ul>
              </>
            )}

{modalType === 'edit' && (
  <>
    <h3 className="text-xl font-semibold mb-4">Edit Receipt</h3>
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();

        const updatedReceipt = {
          ...selectedReceipt,
          buyer_name: e.target.buyer_name.value,
          ticket_type: e.target.ticket_type.value,
          price: e.target.price.value,
          issue_date: e.target.issue_date.value,
          used_by: e.target.used_by.value || null,
        };

        setReceipts((prevReceipts) =>
          prevReceipts.map((r) =>
            r.id === selectedReceipt.id ? updatedReceipt : r
          )
        );

        closeModal();
      }}
    >
      <input
        name="buyer_name"
        className="w-full border rounded px-3 py-2"
        defaultValue={selectedReceipt.buyer_name}
        placeholder="Buyer Name"
      />

      <select
        name="ticket_type"
        className="w-full border rounded px-3 py-2"
        defaultValue={selectedReceipt.ticket_type}
      >
        <option value="day_pass">Day Pass</option>
        <option value="week_pass">Week Pass</option>
        <option value="month_pass">Month Pass</option>
      </select>

      <input
        name="price"
        className="w-full border rounded px-3 py-2"
        type="number"
        step="0.01"
        defaultValue={selectedReceipt.price}
        placeholder="Price"
      />

      <input
        name="issue_date"
        className="w-full border rounded px-3 py-2"
        type="date"
        defaultValue={selectedReceipt.issue_date}
      />

      <input
        name="used_by"
        className="w-full border rounded px-3 py-2"
        placeholder="Used By"
        defaultValue={selectedReceipt.used_by || ""}
      />

      <div className="flex justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={closeModal}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Submit
        </button>
      </div>
    </form>
  </>
)}


            {modalType === 'delete' && (
              <>
                <h3 className="text-xl font-semibold mb-4 text-red-600">Delete Receipt</h3>
                <p>Are you sure you want to delete this receipt?</p>
              </>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              {modalType === 'delete' && (
                <button
                  onClick={() => {
                    setReceipts(receipts.filter(r => r.id !== selectedReceipt.id));
                    closeModal();
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Confirm Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receipts;
