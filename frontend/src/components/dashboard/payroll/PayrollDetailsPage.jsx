// src/components/dashboard/payroll/PayrollDetailsPage.jsx
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import DeductionModal from './DeductionModal';
import { fetchPayrollDetailsAsync, clearError } from '../../../redux/slices/payrollSlice';
import { toast } from 'react-hot-toast';

const columnHelper = createColumnHelper();

const deductionColumns = [
  columnHelper.accessor('id', {
    header: '#',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('reason', {
    header: 'السبب',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('amount', {
    header: 'المبلغ',
    cell: (info) => info.getValue(),
  }),
];

const PayrollDetailsPage = () => {
  const dispatch = useDispatch();
  const { payrollId } = useParams();
  const { payrollDetails, loading, error } = useSelector((state) => state.payroll);
  const [isDeductionModalOpen, setIsDeductionModalOpen] = useState(false);

  useEffect(() => {
    dispatch(clearError());
    dispatch(fetchPayrollDetailsAsync(payrollId));
  }, [dispatch, payrollId]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const table = useReactTable({
    data: payrollDetails?.deductions || [],
    columns: deductionColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return <p className="text-center">جاري التحميل...</p>;
  }

  if (!payrollDetails) {
    return <p className="text-center">لم يتم العثور على تفاصيل الراتب</p>;
  }

  return (
    <Card className="p-6 mt-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">تفاصيل الراتب #{payrollId}</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">اسم الموظف</label>
            <p className="border rounded p-2">{payrollDetails.employee_name || 'غير متوفر'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium">الفترة</label>
            <p className="border rounded p-2">
              {payrollDetails.period_start_date} - {payrollDetails.period_end_date || 'غير متوفر'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium">الراتب الأساسي</label>
            <p className="border rounded p-2">{payrollDetails.base_salary || 0}</p>
          </div>
          <div>
            <label className="block text-sm font-medium">المكافآت</label>
            <p className="border rounded p-2">{payrollDetails.bonuses || 0}</p>
          </div>
          <div>
            <label className="block text-sm font-medium">خصم الغياب</label>
            <p className="border rounded p-2">{payrollDetails.absence_deduction || 0}</p>
          </div>
          <div>
            <label className="block text-sm font-medium">إيرادات الجلسات الخاصة</label>
            <p className="border rounded p-2">{payrollDetails.private_earnings || 0}</p>
          </div>
          <div>
            <label className="block text-sm font-medium">إجمالي الراتب</label>
            <p className="border rounded p-2">{payrollDetails.total_salary || 0}</p>
          </div>
          <div>
            <label className="block text-sm font-medium">موظف</label>
            <p className="border rounded p-2">{payrollDetails.is_employee ? '✅ نعم' : '❌ لا'}</p>
          </div>
        </div>

        <h3 className="text-xl font-semibold mt-6 mb-2">الخصومات</h3>
        <Button
          className="mb-4"
          onClick={() => setIsDeductionModalOpen(true)}
        >
          إضافة خصم
        </Button>
        <DeductionModal
          open={isDeductionModalOpen}
          onOpenChange={setIsDeductionModalOpen}
          payrollId={payrollId}
        />
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
      </div>
    </Card>
  );
};

export default PayrollDetailsPage;