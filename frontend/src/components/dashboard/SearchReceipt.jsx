import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReceiptByInvoice } from '../../redux/slices/receiptsSlice';

const SearchReceipt = () => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const dispatch = useDispatch();
  
  const { receipt, loading, error } = useSelector((state) => state.receipts);


  const handleSubmit = (e) => {
    e.preventDefault();
    if (invoiceNumber) {
      dispatch(fetchReceiptByInvoice(invoiceNumber));  // Dispatch the thunk to fetch receipt
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Enter Invoice Number"
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          className="p-2 w-full border border-gray-300 rounded-md"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
          disabled={loading}  // Disable button while loading
        >
          {loading ? 'Loading...' : 'Search'}
        </button>
      </form>

      {/* Display search results or error */}
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {receipt && (
        <div className="mt-4 p-4 border border-gray-300 rounded-md">
          <h3 className="text-lg font-semibold">Receipt Details</h3>
          <p><strong>Club:</strong> {receipt.club}</p>
          <p><strong>Member:</strong> {receipt.member}</p>
          <p><strong>Subscription:</strong> {receipt.subscription}</p>
          <p><strong>Amount:</strong> {receipt.amount}</p>
          <p><strong>Payment Method:</strong> {receipt.payment_method}</p>
          <p><strong>Note:</strong> {receipt.note}</p>
        </div>
      )}
    </div>
  );
};

export default SearchReceipt;
