// src/components/dashboard/payroll/PayrollForm.jsx
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import usePermission from '../../../hooks/usePermission';
import { createPayrollAsync, clearError } from '../../../redux/slices/payrollSlice';
import { toast } from 'react-hot-toast';

const PayrollForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const canViewAllClubs = usePermission('view_all_clubs');
  const { user } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.payroll);
  const [formData, setFormData] = useState({
    club: user?.club || '',
    period: '',
    employee: '',
    base_salary: '',
    bonuses: '',
    deductions: '',
    note: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());

    try {
      const data = {
        club: formData.club,
        period: formData.period,
        employee: formData.employee,
        base_salary: parseFloat(formData.base_salary),
        bonuses: parseFloat(formData.bonuses) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        note: formData.note,
      };
      await dispatch(createPayrollAsync(data)).unwrap();
      toast.success('تم إنشاء الراتب بنجاح');
      navigate('/payroll-report');
    } catch (err) {
      toast.error(err || 'خطأ في إنشاء الراتب');
    }
  };

  return (
    <Card className="p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold mb-4">إنشاء راتب</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {canViewAllClubs ? (
          <div>
            <label className="block text-sm font-medium">النادي</label>
            <input
              type="text"
              value={formData.club}
              onChange={(e) => setFormData({ ...formData, club: e.target.value })}
              className="w-full border rounded p-2"
              placeholder="أدخل معرف النادي"
              required
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium">النادي</label>
            <input
              type="text"
              value={user?.club || 'ناديك'}
              disabled
              className="w-full border rounded p-2 bg-gray-100"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium">معرف الفترة</label>
          <input
            type="text"
            value={formData.period}
            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
            className="w-full border rounded p-2"
            placeholder="أدخل معرف الفترة"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">معرف الموظف</label>
          <input
            type="text"
            value={formData.employee}
            onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
            className="w-full border rounded p-2"
            placeholder="أدخل معرف الموظف"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">الراتب الأساسي</label>
          <input
            type="number"
            value={formData.base_salary}
            onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
            className="w-full border rounded p-2"
            placeholder="أدخل الراتب الأساسي"
            required
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">المكافآت (اختياري)</label>
          <input
            type="number"
            value={formData.bonuses}
            onChange={(e) => setFormData({ ...formData, bonuses: e.target.value })}
            className="w-full border rounded p-2"
            placeholder="أدخل المكافآت"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">الخصومات (اختياري)</label>
          <input
            type="number"
            value={formData.deductions}
            onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
            className="w-full border rounded p-2"
            placeholder="أدخل الخصومات"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">ملاحظات (اختياري)</label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="w-full border rounded p-2"
            placeholder="أدخل ملاحظات"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'جاري الإنشاء...' : 'إنشاء الراتب'}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/payroll-report')}
            disabled={loading}
          >
            إلغاء
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default PayrollForm;