import React, { useEffect, useState, useMemo } from "react";
import AddMember from "../modals/AddMember";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

// Column helper setup for TanStack Table
const columnHelper = createColumnHelper();

const Members = () => {
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  // Fake members data (no fetch, all belong to "club")
  const fakeMembers = [
    {
      id: 1,
      photo: "https://i.pravatar.cc/100?img=11",
      name: "Ahmed El-Zahrani",
      membership_number: "1001",
      national_id: "102030405060",
      phone: "0101234567",
      club_name: "Sports Club",
    },
    {
      id: 2,
      photo: "https://i.pravatar.cc/100?img=12",
      name: "Sara Al-Otaibi",
      membership_number: "1002",
      national_id: "112233445566",
      phone: "0109876543",
      club_name: "Sports Club",
    },
    {
      id: 3,
      photo: "https://i.pravatar.cc/100?img=13",
      name: "Mohamed Al-Qhatani",
      membership_number: "1003",
      national_id: "223344556677",
      phone: "0101239876",
      club_name: "Sports Club",
    },
    {
      id: 4,
      photo: "https://i.pravatar.cc/100?img=14",
      name: "Reem Al-Shahri",
      membership_number: "1004",
      national_id: "334455667788",
      phone: "01071123334",
      club_name: "Sports Club",
    },
    {
      id: 5,
      photo: "https://i.pravatar.cc/100?img=15",
      name: "Abdullah Al-Harbi",
      membership_number: "1005",
      national_id: "445566778899",
      phone: "0108998776",
      club_name: "Sports Club",
    },
  ];

  useEffect(() => {
    // Directly set the fake data
    setData(fakeMembers);
  }, []);

  const columns = useMemo(() => [
    columnHelper.accessor((row, index) => index + 1, {
      id: 'index',
      header: '#',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor("photo", {
      header: "Photo",
      cell: info => (
        <img
          src={info.getValue()}
          alt="photo"
          className="w-10 h-10 rounded-full object-cover"
        />
      ),
    }),
    columnHelper.accessor("name", {
      header: "Name",
      cell: info => info.getValue(),
    }),
    columnHelper.accessor("membership_number", {
      header: "Membership Number",
    }),
    columnHelper.accessor("national_id", {
      header: "National ID",
    }),
    columnHelper.accessor("phone", {
      header: "Phone",
    }),
    columnHelper.accessor("club_name", {
      header: "Club Name",
    }),
  ], []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-4 overflow-x-auto">
      <h2 className="text-2xl font-bold text-center mb-4">Members List</h2>
      <button
        onClick={openModal}
        className="bg-green-600 text-white py-2 px-4 rounded-md mb-4"
      >
        Add Member
      </button>
      <table className="min-w-full border border-gray-200">
        <thead className="bg-green-100 text-left">
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
        <tbody className="text-left">
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
      {/* Conditionally render the AddMember modal */}
      {isModalOpen && (
  <div
    className="fixed inset-0 flex justify-center items-center z-40"
    style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
  >
    <div className="bg-white p-6 rounded-lg shadow-lg w-1/3 relative">
      <button
        onClick={closeModal}
        className="absolute top-0 right-0 p-2 text-black text-xl"
        style={{ zIndex: 10 }}
      >
        &times;
      </button>
      <AddMember />
    </div>
  </div>
)}

    </div>
  );
};

export default Members;
