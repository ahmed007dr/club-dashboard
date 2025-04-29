import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { postSubscription } from '../../redux/slices/subscriptionsSlice';



const CreateSubscription = () => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    club: "",
    member: "",
    type: "",
    start_date: "",
    end_date: "",
    paid_amount: "",
  });

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate the form data
    if (
      !formData.club ||
      !formData.member ||
      !formData.type ||
      !formData.paid_amount ||
      !formData.start_date ||
      !formData.end_date
    ) {
      alert("Please fill in all fields.");
      return;
    }

    const clubId = parseInt(formData.club, 10);
    const memberId = parseInt(formData.member, 10);
    const typeId = parseInt(formData.type, 10);
    const paidAmount = parseFloat(formData.paid_amount);

    // Check if IDs and amount are valid numbers
    if (isNaN(clubId) || isNaN(memberId) || isNaN(typeId) || isNaN(paidAmount)) {
      alert("Invalid data entered. Please check the fields.");
      return;
    }

    const payload = {
      club: clubId,
      member: memberId,
      type: typeId,
      start_date: formData.start_date,
      end_date: formData.end_date,
      paid_amount: paidAmount,
    };

    console.log("Payload before dispatch:", payload); // Log to check the payload

    // Dispatch the action to create a subscription
    dispatch(postSubscription(payload));
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-bold">Create Subscription</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Club ID</label>
          <input
            type="number"
            name="club"
            value={formData.club}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="Enter Club ID"
            required
          />
        </div>
        
        <div>
          <label className="block font-medium">Member ID</label>
          <input
            type="number"
            name="member"
            value={formData.member}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="Enter Member ID"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Subscription Type ID</label>
          <input
            type="number"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="Enter Subscription Type ID"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Start Date</label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium">End Date</label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Paid Amount</label>
          <input
            type="number"
            name="paid_amount"
            value={formData.paid_amount}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="Enter Paid Amount"
            required
            step="0.01"
          />
        </div>

        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded">
          Create Subscription
        </button>
      </form>
    </div>
  );
};

export default CreateSubscription;

