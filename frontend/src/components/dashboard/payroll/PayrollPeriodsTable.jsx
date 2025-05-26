// src/components/dashboard/payroll/PayrollPeriodsTable.jsx
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { FaEye, FaCheckCircle } from 'react-icons/fa';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import Pagination from '../../common/Pagination';
import usePermission from '../../../hooks/usePermission';
import { fetchPayrollPeriodsAsync, clearError } from '../../../redux/slices/payrollSlice';
import { toast } from 'react-hot-toast';
import FinalizePayrollModal from './FinalizePayrollModal';

const columnHelper = createColumnHelper();

const columns = [
  columnHelper.accessor('id', {
    header: '#',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('club', {
    header: 'النادي',
    cell: (info) => {
      const club = info.getValue();
      return typeof club === 'object' && club?.name ? club.name : club || 'غير متوفر';
    },
  }),
  columnHelper.accessor('start_date', {
    header: 'تاريخ البداية',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('end_date', {
    header: 'تاريخ النهاية',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('is_active', {
    header: 'نشط',
    cell: (info) => (info.getValue() ? '✅' : '❌'),
  }),
  columnHelper.display({
    id: 'actions',
    header: 'الإجراءات',
    cell: ({ row }) => {
      const navigate = useNavigate();
      const [isModalOpen, setIsModalOpen] = useState(false);
      return (
        <div className="flex justify-end gap-3">
          <button
            className="btn-blue"
            onClick={() => navigate(`/payroll-report?period_id=${row.original.id}`)}
          >
            <FaEye size={20} />
          </button>
          {!row.original.is_active && (
            <button
              className="btn-green"
              onClick={() => setIsModalOpen(true)}
            >
              <FaCheckCircle size={20} />
            </button>
          )}
          <FinalizePayrollModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            periodId={row.original.id}
          />
        </div>
      );
    },
  }),
];

const PayrollPeriodsTable = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const canViewAllClubs = usePermission('view_all_clubs');
  const { periods, total, loading, error } = useSelector((state) => state.payroll);
  const [filters, setFilters] = useState({
    search: '',
    is_active: '',
    club_id: '',
  });
  const [pagination, setPagination] = useState({ page: 1 });

  useEffect(() => {
    dispatch(clearError());
    dispatch(fetchPayrollPeriodsAsync({
      page: pagination.page,
      search: filters.search,
      is_active: filters.is_active,
      ...(canViewAllClubs && filters.club_id && { club_id: filters.club_id }),
    }));
  }, [dispatch, pagination.page, filters, canViewAllClubs]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const table = useReactTable({
    data: periods,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="p-6 mt-6">
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="ابحث بالنادي، تاريخ البداية، أو تاريخ النهاية"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="border rounded p-2"
        />
        <select
          value={filters.is_active}
          onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
          className="border rounded p-2"
        >
          <option value="">الكل</option>
          <option value="true">نشط</option>
          <option value="false">غير نشط</option>
        </select>
        {canViewAllClubs && (
          <input
            type="text"
            placeholder="معرف النادي"
            value={filters.club_id}
            onChange={(e) => setFilters({ ...filters, club_id: e.target.value })}
            className="border rounded p-2"
          />
        )}
      </div>
      {loading ? (
        <p className="text-center">جاري التحميل...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="p-3 border-b border-gray-200 font-medium">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="text-right">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-3 border-b border-gray-100">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4">
        <Pagination
          currentPage={pagination.page}
          totalItems={total}
          itemsPerPage={20}
          onPageChange={(page) => setPagination({ ...pagination, page })}
        />
      </div>
    </Card>
  );
};

export default PayrollPeriodsTable;