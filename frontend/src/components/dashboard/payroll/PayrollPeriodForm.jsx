// src/components/dashboard/payroll/PayrollPeriodForm.jsx
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import usePermission from '../../../hooks/usePermission';
import { createPayrollPeriodAsync, clearError } from '../../../redux/slices/payrollSlice';
import { fetchClubList } from '../../../redux/slices/clubSlice'; // Changed to fetchClubList
import { toast } from 'react-hot-toast';

const PayrollPeriodForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const canViewAllClubs = usePermission('view_all_clubs');
  const { user } = useSelector((state) => state.auth);
  const { clubList, loading: clubsLoading } = useSelector((state) => state.club); // Changed to clubList
  const { loading: payrollLoading, error } = useSelector((state) => state.payroll);
  const [formData, setFormData] = useState({
    club: user?.club || '',
    start_date: '',
    end_date: '',
    is_active: false,
  });

  useEffect(() => {
    if (canViewAllClubs) {
      dispatch(fetchClubList()); // Changed to fetchClubList
    }
  }, [dispatch, canViewAllClubs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());

    try {
      await dispatch(createPayrollPeriodAsync(formData)).unwrap();
      toast.success('تم إنشاء فترة الرواتب بنجاح');
      navigate('/payroll-periods');
    } catch (err) {
      toast.error(err || 'خطأ في إنشاء فترة الرواتب');
    }
  };

  return (
    <Card className="p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold mb-4">إنشاء فترة رواتب</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {canViewAllClubs ? (
          <div>
            <label className="block mb-1 font-medium">النادي</label>
            <select
              name="club"
              value={formData.club}
              onChange={(e) => setFormData({ ...formData, club: e.target.value })}
              className="w-full border px-3 py-2 rounded-md"
              required
              disabled={payrollLoading || clubsLoading}
            >
              <option value="">-- اختر النادي --</option>
              {clubList.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
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
          <label className="block text-sm font-medium">تاريخ البداية</label>
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full border rounded p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">تاريخ النهاية</label>
          <input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            className="w-full border rounded p-2"
            required
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="mr-2"
          />
          <label className="text-sm font-medium">نشط</label>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={payrollLoading || clubsLoading}>
            {payrollLoading ? 'جاري الإنشاء...' : 'إنشاء الفترة'}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/payroll-periods')}
            disabled={payrollLoading || clubsLoading}
          >
            إلغاء
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default PayrollPeriodForm;