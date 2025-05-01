import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchReceipts, 
  deleteReceipt, 
  updateReceipt,
  fetchReceiptById,
  fetchReceiptByInvoice
} from '../../redux/slices/receiptsSlice';
import { CiTrash, CiEdit } from "react-icons/ci";
import { HiOutlineDocumentReport } from "react-icons/hi";
import AddReceiptForm from './AddReceiptForm';

function Receipts() {
  const dispatch = useDispatch();
  const { receipts, status, error, message, currentReceipt } = useSelector(state => state.receipts);       
  
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [inputError, setInputError] = useState('');
  // State for edit modal
  const [editData, setEditData] = useState({
    id: '',
    club: '',
    member: '',
    subscription: '',
    amount: '',
    payment_method: 'cash',
    note: '',
    invoice_number: ''
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState(null);

  const [filteredReceipts, setFilteredReceipts] = useState(receipts); // Store filtered receipts

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of receipts per page

  // Format and validate invoice number input
  const formatInvoiceNumber = (value) => {
    let cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (cleaned.startsWith('INV') && cleaned.length > 11 && !cleaned.includes('-')) {
      cleaned = `${cleaned.slice(0, 11)}-${cleaned.slice(11)}`;
    }
    return cleaned.slice(0, 16);
  };

  const validateInvoiceNumber = (value) => {
    const invoiceRegex = /^INV\d{8}-\d{4}$/;
    return invoiceRegex.test(value);
  };

  const handleSearchInputChange = (e) => {
    const value = formatInvoiceNumber(e.target.value);
    setSearchTerm(value);
    setSearchError('');
    if (value && !validateInvoiceNumber(value) && value.length >= 16) {
      setInputError('Invalid format. Expected: INVYYYYMMDD-NNNN (e.g., INV20250429-0003)');
    } else {
      setInputError('');
    }
  };


  
    const resetSearch = () => {
      setSearchTerm('');
      setSearchError('');
      setInputError('');
      setFilteredReceipts(receipts); // Reset to all receipts
      setCurrentPage(1);
    };


    const handleSearch = (e) => {
      e.preventDefault();
      setSearchError('');
      setInputError('');
      if (!searchTerm.trim()) {
        setFilteredReceipts(receipts); // Show all receipts
        setCurrentPage(1);
        return;
      }
      if (!validateInvoiceNumber(searchTerm.trim())) {
        setSearchError('Invalid invoice number format. Expected: INVYYYYMMDD-NNNN (e.g., INV20250429-0003)');
        return;
      }
      const filtered = receipts.filter(receipt => receipt.invoice_number.includes(searchTerm.trim().toUpperCase()));
      setFilteredReceipts(filtered);
      setCurrentPage(1);
    };

  // Handle edit input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditData({
      ...editData,
      [name]: value
    });
  };

  // Handle edit form submission
  const handleEditSubmit = (e) => {
    e.preventDefault();
    setIsUpdating(true);
    
    const { id, ...receiptData } = editData;
    
    dispatch(updateReceipt({ 
      receiptId: id, 
      receiptData 
    }))
    .then(() => {
      dispatch(fetchReceipts());
    })
    .catch(error => {
      console.error('Update error:', error);
    })
    .finally(() => {
      setIsUpdating(false);
      setShowEditModal(false);
    });
  };

  // Handle delete confirmation
  const handleDelete = (receiptId) => {
    setReceiptToDelete(receiptId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    dispatch(deleteReceipt(receiptToDelete))
      .then(() => {
        dispatch(fetchReceipts());
      });
    setShowDeleteConfirm(false);
    setReceiptToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setReceiptToDelete(null);
  };

  // Handle edit button click
  const handleEdit = (receiptId) => {
    dispatch(fetchReceiptById(receiptId));
    setShowEditModal(true);
  };

  // Update edit data when currentReceipt changes
  useEffect(() => {
    if (currentReceipt) {
      setEditData({
        id: currentReceipt.id,
        club: currentReceipt.club || '',
        member: currentReceipt.member || '',
        subscription: currentReceipt.subscription || '',
        amount: currentReceipt.amount || '',
        payment_method: currentReceipt.payment_method || 'cash',
        note: currentReceipt.note || '',
        invoice_number: currentReceipt.invoice_number || ''
      });
    }
  }, [currentReceipt]);

  // Fetch all receipts on initial load
  useEffect(() => {
    dispatch(fetchReceipts());
  }, [dispatch]);

  // Update filtered receipts when receipts change
  useEffect(() => {
    setFilteredReceipts(receipts);
    setCurrentPage(1); // Reset to first page when receipts change
  }, [receipts]);

  // Pagination logic
  const totalItems = filteredReceipts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReceipts = filteredReceipts.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (status === 'loading') return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Header and Add Receipt Button */}
      <div className="flex items-start justify-between">  
        <div className="flex items-start space-x-3">  
          <HiOutlineDocumentReport className="text-blue-600 w-9 h-9 text-2xl" />
          <h2 className="text-2xl font-bold mb-6">الإيصالات</h2>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="btn flex items-center"
        >
          إضافة إيصال
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6 w-full">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="أدخل رقم الفاتورة"
            value={searchTerm}
            onChange={handleSearchInputChange}
            className={`px-4 w-full py-2 border ${inputError ? 'border-red-500' : 'border-gray-300'} rounded-md`}
          />
          {inputError && (
            <p className="absolute text-red-500 text-xs mt-1">{inputError}</p>
          )}
        </div>
        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded" disabled={status === 'loading'}>
          {status === 'loading' ? 'جاري البحث...' : 'بحث'}
        </button>
        {searchTerm && (
          <button type="button" onClick={resetSearch} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
            إعادة تعيين
          </button>
        )}
      </form>

    

      {/* Receipts Table */}
      <div className="overflow-x-auto">
        {paginatedReceipts.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">طريقة الدفع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ملاحظة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الفاتورة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
             {paginatedReceipts.map(receipt => (
                <tr key={receipt.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex gap-2">
                    <button onClick={() => handleEdit(receipt.id)} className="text-indigo-600 hover:text-indigo-900">
                      <CiEdit />
                    </button>
                    <button onClick={() => handleDelete(receipt.id)} className="text-red-600 hover:text-red-900">
                      <CiTrash />
                    </button>
                  </td>
                  <td className="px-6 py-4">{receipt.amount}</td>
                  <td className="px-6 py-4 capitalize">{receipt.payment_method}</td>
                  <td className="px-6 py-4">{receipt.note}</td>
                  <td className="px-6 py-4">{receipt.invoice_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-4 text-gray-500">
            {searchTerm ? 'لم يتم العثور على إيصال بهذا الرقم' : 'لم يتم العثور على إيصالات'}
          </p>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-md ${currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          >
            السابق
          </button>

          {/* Page Numbers */}
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded-md ${currentPage === page ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-md ${currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          >
            التالي
          </button>
        </div>
      )}

     {/* Add Receipt Form Modal */}
{/* Add Receipt Form Modal */}
{showForm && (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-40">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
      <div className="p-6 relative">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">إضافة إيصال جديد</h3>
        
        {/* Close Button */}
        <button
          onClick={() => setShowForm(false)}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
        >
          &times;
        </button>

        {/* Form Component */}
        <AddReceiptForm onClose={() => setShowForm(false)} />
      </div>
    </div>
  </div>
)}



      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">هل أنت متأكد من رغبتك في حذف هذا الإيصال؟</h3>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  تأكيد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">تعديل الإيصال</h3>
              <form onSubmit={handleEditSubmit}>
                {/* Club Field */}
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">النادي</label>
                  <input
                    type="number"
                    name="club"
                    value={editData.club}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                {/* Member Field */}
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">العضو</label>
                  <input
                    type="number"
                    name="member"
                    value={editData.member}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                {/* Subscription Field */}
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">الإشتراك</label>
                  <input
                    type="text"
                    name="subscription"
                    value={editData.subscription}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                {/* Amount Field */}
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">المبلغ</label>
                  <input
                    type="text"
                    name="amount"
                    value={editData.amount}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                {/* Payment Method Field */}
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">طريقة الدفع</label>
                  <select
                    name="payment_method"
                    value={editData.payment_method}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                   <option value="cash">Cash</option>
  <option value="credit">Credit Card</option>
  <option value="debit">Debit Card</option>
  <option value="bank">Bank Transfer</option>
  <option value="visa">Visa</option>
                  </select>
                </div>

                {/* Invoice Number Field */}
                <p className="mt-1 text-sm text-gray-500">
    رقم الفاتورة يتم توليده تلقائياً ولا يمكن تعديله
  </p>

                {/* Note Field */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">ملاحظة</label>
                  <textarea
                    name="note"
                    value={editData.note}
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
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'جاري الحفظ...' : 'حفظ التغييرات'}
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