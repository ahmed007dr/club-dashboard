import React, { useState, useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { CiTrash } from 'react-icons/ci';
import { CiEdit } from 'react-icons/ci';
import { FaEye } from "react-icons/fa";
import AddSubscription from '../modals/AddSubscription';
import SubscriptionsTypes from './Subscriptionstypes';

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
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

  const openEditModal = (subscription) => {
    setFormData({
      member: subscription.member_name,
      subscription_type: subscription.subscription_type,
      sport_type: '', // Update if you have this data
      start_date: subscription.start_date,
      end_date: subscription.end_date,
      attendance_days: subscription.attendance_days,
      subscription_value: subscription.paid_amount, // Assuming
      amount_paid: subscription.paid_amount,
      amount_remaining: subscription.remaining_amount,
    });
    setSelectedSubscription(subscription);
    setIsModalOpen(true);
  };

  const openDeleteModal = (subscription) => {
    setSelectedSubscription(subscription);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    console.log("Deleting:", selectedSubscription);
    setIsDeleteModalOpen(false); // Close the delete modal
  };

  const openInfoModal = (subscription) => {
    setSelectedSubscription(subscription);
    setIsInfoModalOpen(true);
  };

  const closeInfoModal = () => setIsInfoModalOpen(false);

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
   
    columnHelper.accessor("attendance_days", {
      header: "Attendance Days",
      cell: info => info.getValue(),
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-3">
          <button
            className="text-blue-600 hover:text-blue-800"
            onClick={() => openEditModal(row.original)}
          >
            <CiEdit size={20} />
          </button>
          <button
            className="text-red-600 hover:text-red-800"
            onClick={() => openDeleteModal(row.original)}
          >
            <CiTrash size={20} />
          </button>
          <button
            className="text-green-600 hover:text-green-800"
            onClick={() => openInfoModal(row.original)}
          >
            <FaEye size={20} />
          </button>
        </div>
      ),
    }),
  ], []);

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

      {/* Edit Modal */}
      {isModalOpen && (
        <>
          <div
            className="fixed inset-0 flex justify-center items-center z-40" style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
            onClick={closeModal}
          ></div>
          <AddSubscription
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            closeModal={closeModal}
          />
        </>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <>
          <div
            className="fixed inset-0 flex justify-center items-center z-40" style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
            onClick={() => setIsDeleteModalOpen(false)}
          ></div>
          <div className="fixed z-50 bg-white p-6 rounded-lg shadow-md top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Confirm Deletion</h2>
            <p className="mb-6">Are you sure you want to delete this subscription?</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}

      {/* Subscription Info Modal */}
      {isInfoModalOpen && (
        <div
          className="fixed inset-0 flex justify-center items-center z-40"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
          onClick={closeInfoModal}
        >
          <div className="fixed z-50 bg-white p-6 rounded-lg shadow-md top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md">
            <h2 className="text-xl font-semibold mb-4">Subscription Details</h2>
            <div>
              <p><strong>Member Name:</strong> {selectedSubscription.member_name}</p>
              <p><strong>Club Name:</strong> {selectedSubscription.club_name}</p>
              <p><strong>Subscription Type:</strong> {selectedSubscription.subscription_type}</p>
              <p><strong>Start Date:</strong> {selectedSubscription.start_date}</p>
              <p><strong>End Date:</strong> {selectedSubscription.end_date}</p>
              <p><strong>Paid Amount:</strong> ${selectedSubscription.paid_amount}</p>
              <p><strong>Remaining Amount:</strong> ${selectedSubscription.remaining_amount}</p>
              <p><strong>Attendance Days:</strong> {selectedSubscription.attendance_days}</p>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={closeInfoModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

     <SubscriptionsTypes/>
    </div>
  );
};

export default Subscriptions;
