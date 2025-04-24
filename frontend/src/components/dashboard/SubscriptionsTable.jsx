import React, { useMemo } from 'react';
import { CiTrash } from 'react-icons/ci';
import { CiEdit } from 'react-icons/ci';
import { FaEye } from 'react-icons/fa';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';

const columnHelper = createColumnHelper();

const SubscriptionsTable = ({ subscriptions, openEditModal, openDeleteModal, openInfoModal }) => {
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
            className="btn-green"
            onClick={() => openEditModal(row.original)}
          >
            <CiEdit size={20} />
          </button>
          <button
            className="btn-red"
            onClick={() => openDeleteModal(row.original)}
          >
            <CiTrash size={20} />
          </button>
          <button
            className="btn-blue"
            onClick={() => openInfoModal(row.original)}
          >
            <FaEye size={20} />
          </button>
        </div>
      ),
    }),
  ], []);

  const table = useReactTable({
    data: subscriptions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full border border-gray-200">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} className="p-3 border-b border-gray-200 font-medium">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="text-right">
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="">
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
  );
};

export default SubscriptionsTable;
