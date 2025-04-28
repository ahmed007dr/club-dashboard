import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchReceipts, 
  addReceipt, 
  deleteReceipt, 
  updateReceipt,
  fetchReceiptById,
  clearCurrentReceipt
} from '../../redux/slices/receiptsSlice';

function ReceiptsList() {
  const dispatch = useDispatch();
  const { receipts, status, error, currentReceipt } = useSelector(state => state.receipts);
  
  // Form state for adding new receipt
  const [formData, setFormData] = useState({
    club: '',
    member: '',
    subscription: '',
    amount: '',
    payment_method: 'cash',
    note: ''
  });
  
  // State for edit modal
  const [editData, setEditData] = useState({
    id: '',
    amount: '',
    invoice_number: '',
    message: ''
  });
  
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    dispatch(fetchReceipts());
  }, [dispatch]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditData({
      ...editData,
      [name]: value
    });
  };

  const [formErrors, setFormErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const receiptData = {
      ...formData,
      club: Number(formData.club),
      member: Number(formData.member),
      subscription: Number(formData.subscription),
      amount: Number(formData.amount),
    };
  
    dispatch(addReceipt(receiptData))
      .unwrap()
      .then(() => {
        setShowForm(false);
        setFormData({ ...initialFormState });
      })
      .catch((error) => {
        if (error) {
          setFormErrors(error); // Store Django validation errors
        }
      });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    dispatch(updateReceipt(editData));
    setShowEditModal(false);
  };

  const handleDelete = (receiptId) => {
    dispatch(deleteReceipt(receiptId));
  };

  const handleEdit = (receiptId) => {
    dispatch(fetchReceiptById(receiptId));
    setShowEditModal(true);
  };

  if (status === 'loading') return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Receipts Management</h2>
      
      <button 
        onClick={() => setShowForm(!showForm)}
        className="mb-6 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
      >
        {showForm ? 'Hide Form' : 'Add New Receipt'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Club ID</label>
              <input
                type="number"
                name="club"
                value={formData.club}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Member ID</label>
              <input
                type="number"
                name="member"
                value={formData.member}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Subscription ID</label>
              <input
                type="number"
                name="subscription"
                value={formData.subscription}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Amount</label>
              <input
                type="text"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="150.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Payment Method</label>
              <select
  name="payment_method"
  value={formData.payment_method}
  onChange={handleInputChange}
  required
>
  <option value="cash">Cash</option>
  <option value="credit_card">Credit Card</option>
  <option value="bank_transfer">Bank Transfer</option>
</select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Note</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleInputChange}
              placeholder="Monthly subscription payment"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>

          <button 
            type="submit" 
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Submit Receipt
          </button>
          {formErrors && Object.keys(formErrors).length > 0 && (
  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
    <h4 className="font-bold">Validation Errors:</h4>
    <ul className="list-disc pl-5">
      {Object.entries(formErrors).map(([field, errors]) => (
        <li key={field}>
          <strong>{field}:</strong> {Array.isArray(errors) ? errors.join(", ") : errors}
        </li>
      ))}
    </ul>
  </div>
)}
        </form>
      )}

      {/* Receipts List Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h3 className="text-xl font-semibold p-4 bg-gray-100">Receipts List</h3>
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
              <tbody className="bg-white divide-y divide-gray-200">
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
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(receipt.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-4 text-gray-500">No receipts found</p>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
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

export default ReceiptsList;