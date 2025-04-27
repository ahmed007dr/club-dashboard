import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addTicket } from '../../redux/slices/ticketsSlice';

const AddTicket = () => {
  const dispatch = useDispatch();

  const [clubNumber, setClubNumber] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [ticketType, setTicketType] = useState('');
  const [price, setPrice] = useState('');
  const [used, setUsed] = useState(false);
  const [usedBy, setUsedBy] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!clubNumber || !buyerName || !ticketType || !price || (used && !usedBy)) {
      setError('All fields are required');
      return;
    }

    const ticketData = {
      club: clubNumber,
      buyer_name: buyerName,
      ticket_type: ticketType,
      price: parseFloat(price),
      used,
      used_by: used ? parseInt(usedBy) : null,
    };

    // Dispatch the action to add the ticket
    dispatch(addTicket(ticketData))
      .then(() => {
        setSuccessMessage('Ticket added successfully!');
        setError('');
        // Clear the form after success
        setClubNumber('');
        setBuyerName('');
        setTicketType('');
        setPrice('');
        setUsed(false);
        setUsedBy('');
      })
      .catch((error) => {
        setError(error.message || 'Failed to add ticket');
        setSuccessMessage('');
      });
  };

  return (
    <div className="max-w-xl mx-auto mt-8 p-6 bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-semibold mb-4">Add New Ticket</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {successMessage && <p className="text-green-500 mb-4">{successMessage}</p>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="club_number" className="block text-sm font-medium text-gray-700">
            Club Number
          </label>
          <input
            type="text"
            id="club_number"
            value={clubNumber}
            onChange={(e) => setClubNumber(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            placeholder="Enter club number"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="buyer_name" className="block text-sm font-medium text-gray-700">
            Buyer Name
          </label>
          <input
            type="text"
            id="buyer_name"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            placeholder="Enter buyer name"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="ticket_type" className="block text-sm font-medium text-gray-700">
            Ticket Type
          </label>
          <input
            type="text"
            id="ticket_type"
            value={ticketType}
            onChange={(e) => setTicketType(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            placeholder="Enter ticket type"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Price
          </label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            placeholder="Enter ticket price"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="used" className="block text-sm font-medium text-gray-700">
            Used
          </label>
          <input
            type="checkbox"
            id="used"
            checked={used}
            onChange={(e) => setUsed(e.target.checked)}
            className="mt-1"
          />
        </div>

        {used && (
          <div className="mb-4">
            <label htmlFor="used_by" className="block text-sm font-medium text-gray-700">
              Used By (Member ID)
            </label>
            <input
              type="number"
              id="used_by"
              value={usedBy}
              onChange={(e) => setUsedBy(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              placeholder="Enter member ID"
            />
          </div>
        )}

        <div className="mt-6">
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded-md">
            Add Ticket
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTicket;
