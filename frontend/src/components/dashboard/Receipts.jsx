import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchReceipts, 
  addReceipt, 
  deleteReceipt, 
  updateReceipt,
  fetchReceiptById,
  fetchReceiptByInvoice,
  clearCurrentReceipt
} from '../../redux/slices/receiptsSlice';
import { CiTrash, CiEdit } from "react-icons/ci";
import { FaEye } from "react-icons/fa";
import { HiOutlineDocumentReport } from "react-icons/hi";
import AddReceiptForm from './AddReceiptForm'

function Receipts() {
  const dispatch = useDispatch();
  const { receipts, status, error, currentReceipt } = useSelector(state => state.receipts);
  console.log(receipts);
  // Form state for adding new receipt
  const [formData, setFormData] = useState({
    club: '',
    member: '',
    subscription: '',
    amount: '',
    payment_method: 'cash',
    note: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // Show form to add receipt
  const handleAddReceiptClick = () => {
    setShowForm(true); // Show the add receipt form modal
  };

  // Close the form modal
  const handleCloseForm = () => {
    setShowForm(false); // Close the add receipt form modal
  };
  
  // State for edit modal
  const [editData, setEditData] = useState({
    id: '',
    amount: '',
    invoice_number: '',
    message: ''
  });
  
  const [showEditModal, setShowEditModal] = useState(false);
    // State for delete confirmation modal
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [receiptToDelete, setReceiptToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    useEffect(() => {
      if (searchTerm) {
        dispatch(fetchReceiptByInvoice(searchTerm));
      } else {
        dispatch(fetchReceipts());
      }
    }, [dispatch, searchTerm]);

      // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      dispatch(fetchReceiptByInvoice(searchTerm));
    } else {
      dispatch(fetchReceipts());
    }
  };

    // Reset search and show all receipts
    const resetSearch = () => {
      setSearchTerm('');
      dispatch(fetchReceipts());
    };
  

  useEffect(() => {
    if (currentReceipt) {
      setEditData({
        id: currentReceipt.id,
        amount: currentReceipt.amount,
        invoice_number: currentReceipt.invoice_number,
        message: 'Receipt updated successfully'
      });
    }
  }, [currentReceipt]);

 

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditData({
      ...editData,
      [name]: value
    });
  };

  const [formErrors, setFormErrors] = useState({});
 
 

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const { id, amount, invoice_number, message } = editData;
    
    const receiptData = {
      amount,
      invoice_number,
      message
    };
  
    dispatch(updateReceipt({ receiptId: id, receiptData }));
    setShowEditModal(false);
  };
  


  const handleDelete = (receiptId) => {
    setReceiptToDelete(receiptId); // Store the receipt ID to delete
    setShowDeleteConfirm(true); // Show the confirmation modal
  };

  const confirmDelete = () => {
    dispatch(deleteReceipt(receiptToDelete));
    setShowDeleteConfirm(false); // Close the confirmation modal after deleting
    setReceiptToDelete(null); // Reset the receipt ID
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false); // Close the confirmation modal without deleting
    setReceiptToDelete(null); // Reset the receipt ID
  };

  const handleEdit = (receiptId) => {
    dispatch(fetchReceiptById(receiptId));
    setShowEditModal(true);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    dispatch(fetchReceipts());
  };

  if (status === 'loading') return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Receipts Management</h2>
      
    
      {/* Receipts List Table */}
      <div className=" rounded-lg shadow-md overflow-hidden">
      <div className="flex items-start space-x-3">
        <HiOutlineDocumentReport className="text-blue-600 w-9 h-9 text-2xl" />
        <h1 className="text-2xl font-bold mb-4">Receipts</h1>
      </div>
      <button 
        onClick={handleAddReceiptClick}
        className="btn"
      >
        Add Receipt
      </button>
      <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          />
          <button 
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={resetSearch}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
            >
              Reset
            </button>
          )}
        </form>
        <h3 className="text-xl font-semibold p-4 bg-gray-100">
          {searchTerm ? `Search Results for Invoice #${searchTerm}` : 'All Receipts'}
        </h3>
        {receipts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className=" divide-y divide-gray-200">
                {receipts.map(receipt => (
                  <tr key={receipt.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{receipt.invoice_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{receipt.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{receipt.payment_method}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{receipt.note}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(receipt.id)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <CiEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(receipt.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <CiTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-4 text-gray-500">
          {searchTerm ? 'No receipt found with this invoice number' : 'No receipts found'}
        </p>
        )}
      </div>
       {/* Add Receipt Form Modal */}
       {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="modal">
            <div className="p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Add New Receipt</h3>
              <AddReceiptForm/>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
               
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className=" modal">
            <div className="p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Are you sure you want to delete this receipt?</h3>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className=" modal">
            <div className="p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Edit Receipt</h3>
              <form onSubmit={handleEditSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Invoice Number</label>
                  <input
                    type="text"
                    name="invoice_number"
                    value={editData.invoice_number}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Amount</label>
                  <input
                    type="text"
                    name="amount"
                    value={editData.amount}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">Message</label>
                  <textarea
                    name="message"
                    value={editData.message}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Receipts;