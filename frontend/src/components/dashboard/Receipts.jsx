import React, { useState, useEffect } from "react";
import { CiTrash, CiEdit } from "react-icons/ci";
import { FaEye } from "react-icons/fa";
import { HiOutlineDocumentReport } from "react-icons/hi";
import axios from "axios";
import { toast } from "react-hot-toast";

const Receipts = () => {
  const [receipts, setReceipts] = useState([]); // Ensure initial state is an array
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReceipts();
  }, []); // No dependencies, runs once on mount

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(
        `http://127.0.0.1:8000/receipts/api/receipts/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Log the full response for debugging
      console.log("Fetch Receipts Response:", response.data);

      // Handle different response structures
      let results = [];
      if (Array.isArray(response.data)) {
        results = response.data; // Direct array of receipts
      } else if (Array.isArray(response.data.results)) {
        results = response.data.results; // Handle paginated response
      } else {
        console.warn("Unexpected response structure:", response.data);
        results = [];
      }

      setReceipts(results);

      if (results.length === 0) {
        toast.error("No receipts found");
      }
    } catch (error) {
      console.error("Error fetching receipts:", error);
      toast.error(error.message || "Failed to fetch receipts");
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(
        `http://127.0.0.1:8000/receipts/api/receipts/invoice/${invoiceNumber}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Search Receipt Response:", response.data);

      const result = response.data ? [response.data] : [];
      setReceipts(result);

      if (result.length === 0) {
        toast.error("No receipt found for this invoice number");
      }
    } catch (error) {
      console.error("Error fetching receipt by invoice:", error);
      toast.error(error.message || "Receipt not found");
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditReceipt = async (e) => {
    e.preventDefault();
    setLoading(true);
    const updatedReceipt = {
      ...selectedReceipt,
      amount: e.target.amount.value,
      member: e.target.member.value,
      club: e.target.club.value,
      note: e.target.note.value,
      payment_method: e.target.payment_method.value,
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      await axios.put(
        `http://127.0.0.1:8000/receipts/api/receipts/${selectedReceipt.id}/edit/`,
        updatedReceipt,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setReceipts((prev) =>
        prev.map((r) => (r.id === selectedReceipt.id ? updatedReceipt : r))
      );
      toast.success("Receipt updated successfully");
      closeModal();
    } catch (error) {
      console.error("Error updating receipt:", error);
      toast.error(error.message || "Failed to update receipt");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReceipt = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      await axios.delete(
        `http://127.0.0.1:8000/receipts/api/receipts/${selectedReceipt.id}/delete/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setReceipts(receipts.filter((r) => r.id !== selectedReceipt.id));
      toast.success("Receipt deleted successfully");
      closeModal();
      // Refresh receipts after deletion
      fetchReceipts();
    } catch (error) {
      console.error("Error deleting receipt:", error);
      toast.error(error.message || "Failed to delete receipt");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReceipt = async (e) => {
    e.preventDefault();
    setLoading(true);
    const newReceipt = {
      amount: e.target.amount.value,
      member: e.target.member.value,
      club: e.target.club.value,
      note: e.target.note.value,
      payment_method: e.target.payment_method.value,
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post(
        "http://127.0.0.1:8000/receipts/api/receipts/add/",
        newReceipt,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setReceipts([...receipts, response.data]);
      toast.success("Receipt created successfully");
      closeModal();
      // Refresh receipts after creation
      fetchReceipts();
    } catch (error) {
      console.error("Error creating new receipt:", error);
      toast.error(error.message || "Failed to create receipt");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, receipt = null) => {
    setSelectedReceipt(receipt);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedReceipt(null);
    setModalType(null);
  };

  return (
    <div className="relative">
      <div className="flex items-start space-x-3">
        <HiOutlineDocumentReport className="text-blue-600 w-9 h-9 text-2xl" />
        <h1 className="text-2xl font-bold mb-4">Receipts</h1>
      </div>
      <div className="flex justify-between mb-4">
        <div>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="border px-4 py-2 rounded"
            placeholder="Enter Invoice Number"
          />
          <button onClick={handleSearch} className="ml-2 btn" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
        <button className="btn" onClick={() => openModal("create")} disabled={loading}>
          Add Receipt
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded-lg shadow">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Invoice Number</th>
                <th className="px-4 py-2 text-left">Member</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Club</th>
                <th className="px-4 py-2 text-left">Payment Method</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(!receipts || receipts.length === 0) ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No receipts found
                  </td>
                </tr>
              ) : (
                receipts.map((receipt) => (
                  <tr key={receipt.id} className="border-b">
                    <td className="px-4 py-2">{receipt.invoice_number}</td>
                    <td className="px-4 py-2 capitalize">{receipt.member}</td>
                    <td className="px-4 py-2">EGP {receipt.amount}</td>
                    <td className="px-4 py-2">{receipt.club}</td>
                    <td>{receipt.payment_method}</td>
                    <td className="px-4 py-2 space-x-2">
                      <button
                        onClick={() => openModal("view", receipt)}
                        className="btn-blue"
                        disabled={loading}
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => openModal("edit", receipt)}
                        className="btn-green"
                        disabled={loading}
                      >
                        <CiEdit />
                      </button>
                      <button
                        onClick={() => openModal("delete", receipt)}
                        className="btn-red"
                        disabled={loading}
                      >
                        <CiTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalType && (
        <div className="fixed inset-0 z-40 flex justify-center items-center bg-black/50 bg-opacity-50">
          <div className="modal bg-white p-6 rounded shadow-md w-full max-w-md">
            {/* View Mode */}
            {modalType === "view" && selectedReceipt && (
              <>
                <h3 className="text-xl font-semibold mb-4">Receipt Info</h3>
                <ul className="space-y-2">
                  <li><strong>Invoice Number:</strong> {selectedReceipt.invoice_number}</li>
                  <li><strong>Date:</strong> {selectedReceipt.date || "N/A"}</li>
                  <li><strong>Club Name:</strong> {selectedReceipt.club_details?.name || "N/A"}</li>
                  <li><strong>Issued By:</strong> {(selectedReceipt.issued_by_details?.first_name && selectedReceipt.issued_by_details?.last_name) ? `${selectedReceipt.issued_by_details.first_name} ${selectedReceipt.issued_by_details.last_name}` : "N/A"}</li>
                  <li><strong>Price:</strong> EGP {selectedReceipt.amount}</li>
                  <li><strong>Member:</strong> {selectedReceipt.member_details?.name || "N/A"}</li>
                  <li><strong>Phone:</strong> {selectedReceipt.member_details?.phone || "N/A"}</li>
                  <li><strong>Note:</strong> {selectedReceipt.note || "N/A"}</li>
                  <li><strong>Payment Method:</strong> {selectedReceipt.payment_method || "N/A"}</li>
                </ul>
                <button type="button" className="btn-red mt-4" onClick={closeModal} disabled={loading}>
                  Close
                </button>
              </>
            )}

            {/* Edit Mode */}
            {modalType === "edit" && selectedReceipt && (
              <form onSubmit={handleEditReceipt} className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Edit Receipt</h3>
                <input
                  name="amount"
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  defaultValue={selectedReceipt.amount}
                  placeholder="Amount"
                  required
                />
                <input
                  name="member"
                  className="w-full border rounded px-3 py-2"
                  defaultValue={selectedReceipt.member_details?.id || ""}
                  placeholder="Member ID"
                  required
                />
                <input
                  name="club"
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  defaultValue={selectedReceipt.club_details?.id || ""}
                  placeholder="Club ID"
                  required
                />
                <select
                  name="payment_method"
                  className="w-full border rounded px-3 py-2"
                  defaultValue={selectedReceipt.payment_method || ""}
                  required
                >
                  <option value="">Select Payment Method</option>
                  <option value="bank">Bank</option>
                  <option value="cash">Cash</option>
                  <option value="visa">Visa</option>
                </select>
                <textarea
                  name="note"
                  className="w-full border rounded px-3 py-2"
                  defaultValue={selectedReceipt.note || ""}
                  placeholder="Note"
                />
                <div className="flex justify-end space-x-4">
                  <button type="submit" className="btn-green" disabled={loading}>
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button type="button" className="btn-red" onClick={closeModal} disabled={loading}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Add Mode */}
            {modalType === "create" && (
              <form onSubmit={handleCreateReceipt} className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">New Receipt</h3>
                <input
                  name="amount"
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  placeholder="Amount"
                  required
                />
                <input
                  name="member"
                  className="w-full border rounded px-3 py-2"
                  placeholder="Member ID"
                  required
                />
                <input
                  name="club"
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  placeholder="Club ID"
                  required
                />
                <select name="payment_method" className="w-full border rounded px-3 py-2" required>
                  <option value="">Select Payment Method</option>
                  <option value="bank">Bank</option>
                  <option value="cash">Cash</option>
                  <option value="visa">Visa</option>
                </select>
                <textarea
                  name="note"
                  className="w-full border rounded px-3 py-2"
                  placeholder="Note"
                />
                <div className="flex justify-end space-x-4">
                  <button type="submit" className="btn-green" disabled={loading}>
                    {loading ? "Creating..." : "Create"}
                  </button>
                  <button type="button" className="btn-red" onClick={closeModal} disabled={loading}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Delete Confirmation */}
            {modalType === "delete" && selectedReceipt && (
              <>
                <h3 className="text-xl font-semibold mb-4">
                  Are you sure you want to delete this receipt?
                </h3>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={handleDeleteReceipt}
                    className="btn-red"
                    disabled={loading}
                  >
                    {loading ? "Deleting..." : "Yes, Delete"}
                  </button>
                  <button
                    onClick={closeModal}
                    className="btn-green"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Receipts;