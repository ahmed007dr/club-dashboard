// src/components/dashboard/payroll/PayrollReportTable.jsx
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { FaEye, FaPlus } from 'react-icons/fa';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import Pagination from '../../common/Pagination';
import usePermission from '../../../hooks/usePermission';
import { fetchPayrollReportAsync, clearError } from '../../../redux/slices/payrollSlice';
import { toast } from 'react-hot-toast';
import DeductionModal from './DeductionModal';

const columnHelper = createColumnHelper();

const columns = [
  columnHelper.accessor('id', {
    header: '#',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('employee_name', {
    header: 'الموظف',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('total_salary', {
    header: 'إجمالي الراتب',
    cell: (info) => info.getValue() || 0,
  }),
  columnHelper.accessor('deductions', {
    header: 'عدد الخصومات',
    cell: (info) => info.getValue()?.length || 0,
  }),
  columnHelper.accessor('final_salary', {
    header: 'الراتب النهائي',
    cell: (info) => info.getValue() || 0,
  }),
  columnHelper.accessor('is_finalized', {
    header: 'تم الإنهاء',
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
            onClick={() => navigate(`/payroll-details/${row.original.id}`)}
          >
            <FaEye size={20} />
          </button>
          {!row.original.is_finalized && (
            <button
              className="btn-green"
              onClick={() => setIsModalOpen(true)}
            >
              <FaPlus size={20} />
            </button>
          )}
          <DeductionModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            payrollId={row.original.id}
          />
        </div>
      );
    },
  }),
];

const PayrollReportTable = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const canViewAllClubs = usePermission('view_all_clubs');
  const { payrolls, totalPayrolls, loading, error } = useSelector((state) => state.payroll);
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: '',
    is_employee: '',
    period_id: searchParams.get('period_id') || '',
    club_id: '',
  });
  const [pagination, setPagination] = useState({ page: 1 });

  useEffect(() => {
    dispatch(clearError());
    dispatch(fetchPayrollReportAsync({
      page: pagination.page,
      search: filters.search,
      is_employee: filters.is_employee,
      period_id: filters.period_id,
      ...(canViewAllClubs && filters.club_id && { club_id: filters.club_id }),
    }));
  }, [dispatch, pagination.page, filters, canViewAllClubs]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      if (error.includes('No active payroll period found')) {
        toast.error('يرجى إنشاء فترة رواتب نشطة أولًا');
        navigate('/create-payroll-period');
      }
    }
  }, [error, navigate]);

  const table = useReactTable({
    data: payrolls,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="p-6 mt-6">
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="ابحث بالاسم"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="border rounded p-2"
        />
        <select
          value={filters.is_employee}
          onChange={(e) => setFilters({ ...filters, is_employee: e.target.value })}
          className="border rounded p-2"
        >
          <option value="">الكل</option>
          <option value="true">موظفون</option>
          <option value="false">غير موظفين</option>
        </select>
        <input
          type="text"
          placeholder="معرف الفترة"
          value={filters.period_id}
          onChange={(e) => setFilters({ ...filters, period_id: e.target.value })}
          className="border rounded p-2"
        />
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
      ) : payrolls.length === 0 ? (
        <p className="text-center">لا توجد رواتب متاحة. يرجى إنشاء فترة رواتب نشطة.</p>
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
          totalItems={totalPayrolls}
          itemsPerPage={20}
          onPageChange={(page) => setPagination({ ...pagination, page })}
        />
      </div>
    </Card>
  );
};

export default PayrollReportTable;