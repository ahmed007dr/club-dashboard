// src/components/dashboard/payroll/FinalizePayrollModal.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { finalizePayrollAsync, clearError } from '../../../redux/slices/payrollSlice';
import { toast } from 'react-hot-toast';

const FinalizePayrollModal = ({ open, onOpenChange }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const periodId = searchParams.get('period_id');
  const { loading, error } = useSelector((state) => state.payroll);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirm) return;

    try {
      await dispatch(finalizePayrollAsync(periodId)).unwrap();
      toast.success('Payroll finalized successfully');
      onOpenChange(false);
      navigate('/payroll-periods');
    } catch (err) {
      toast.error(err || 'Error finalizing payroll');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Finalize Payroll Period</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm">
              Are you sure you want to finalize payroll period #{periodId}? This action cannot be undone.
            </p>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
              className="mr-2"
            />
            <label className="text-sm font-medium">I confirm finalizing this payroll period</label>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={loading || !confirm}>
              {loading ? 'Finalizing...' : 'Finalize'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FinalizePayrollModal;