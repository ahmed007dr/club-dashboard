import React, { useState, useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import AddSubscription from '../modals/AddSubscription';

const fakeSubscriptions = [
  {
    id: 1,
    member_name: "Ahmed ElSayed",
    club_name: "Fitness Club",
    subscription_type: "Basic Gym Membership",
    start_date: "2023-01-15",
    end_date: "2023-02-14",
    paid_amount: "30.00",
    remaining_amount: "0.00",
    attendance_days: 20,
  },
  {
    id: 2,
    member_name: "Mona Fawzy",
    club_name: "Elite Gym",
    subscription_type: "Premium Gym & Pool Membership",
    start_date: "2023-02-01",
    end_date: "2023-04-01",
    paid_amount: "70.00",
    remaining_amount: "30.00",
    attendance_days: 40,
  },
  {
    id: 3,
    member_name: "Omar Tamer",
    club_name: "Sport Club",
    subscription_type: "All-Inclusive Membership",
    start_date: "2023-03-01",
    end_date: "2023-06-01",
    paid_amount: "100.00",
    remaining_amount: "60.00",
    attendance_days: 50,
  },
  {
    id: 4,
    member_name: "Nadine Hassan",
    club_name: "Health Club",
    subscription_type: "Basic Gym Membership",
    start_date: "2023-04-10",
    end_date: "2023-05-10",
    paid_amount: "30.00",
    remaining_amount: "0.00",
    attendance_days: 15,
  },
  {
    id: 5,
    member_name: "Youssef Adel",
    club_name: "Wellness Club",
    subscription_type: "Premium Gym & Pool Membership",
    start_date: "2023-05-01",
    end_date: "2023-07-01",
    paid_amount: "70.00",
    remaining_amount: "10.00",
    attendance_days: 30,
  },
];

const columnHelper = createColumnHelper();

const Subscriptions = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    member: '',
    subscription_type: '',
    sport_type: '',
    start_date: '',
    end_date: '',
    attendance_days: '',
    subscription_value: '',
    amount_paid: '',
    amount_remaining: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedData = { ...formData, [name]: value };

    if (name === 'subscription_value' || name === 'amount_paid') {
      const subscriptionValue = parseFloat(name === 'subscription_value' ? value : formData.subscription_value);
      const amountPaid = parseFloat(name === 'amount_paid' ? value : formData.amount_paid);

      if (!isNaN(subscriptionValue) && !isNaN(amountPaid)) {
        updatedData.amount_remaining = (subscriptionValue - amountPaid).toFixed(2);
      }
    }

    setFormData(updatedData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted:', formData);
    setIsModalOpen(false); // Close modal
  };

  const closeModal = () => setIsModalOpen(false);

  // Define columns for the table
  const columns = useMemo(() => [
    columnHelper.accessor("id", {
      header: "#",
      cell: info => info.getValue(),
    }),
    columnHelper.accessor("member_name", {
      header: "Member Name",
      cell: info => info.getValue(),
    }),
    columnHelper.accessor("club_name", {
      header: "Club Name",
      cell: info => info.getValue(),
    }),
    columnHelper.accessor("subscription_type", {
      header: "Subscription Type",
      cell: info => info.getValue(),
    }),
    columnHelper.accessor("start_date", {
      header: "Start Date",
      cell: info => info.getValue(),
    }),
    columnHelper.accessor("end_date", {
      header: "End Date",
      cell: info => info.getValue(),
    }),
    columnHelper.accessor("paid_amount", {
      header: "Paid Amount",
      cell: info => `$${info.getValue()}`,
    }),
    columnHelper.accessor("remaining_amount", {
      header: "Remaining Amount",
      cell: info => `$${info.getValue()}`,
    }),
    columnHelper.accessor("attendance_days", {
      header: "Attendance Days",
      cell: info => info.getValue(),
    }),
  ], []);

  // Create the table
  const table = useReactTable({
    data: fakeSubscriptions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Subscriptions</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          Add Subscription
        </button>
      </div>

      <p>This is the Subscriptions section.</p>

      {/* Subscriptions Table */}
      <div className="overflow-x-auto mt-6">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-green-100 text-right">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="p-3 border-b border-gray-200 font-medium">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="text-right">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-3 border-b border-gray-100">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
            onClick={closeModal}
          ></div>

          {/* Modal */}
          <AddSubscription
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            closeModal={closeModal}
          />
        </>
      )}
    </div>
  );
};

export default Subscriptions;
