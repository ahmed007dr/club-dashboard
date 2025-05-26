// src/components/dashboard/payroll/DeductionModal.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { createDeductionAsync, clearError } from '../../../redux/slices/payrollSlice';
import { toast } from 'react-hot-toast';

const DeductionModal = ({ open, onOpenChange }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { payrollId } = useParams(); // Assuming route is /add-deduction/:payrollId
  const { loading, error } = useSelector((state) => state.payroll);
  const [formData, setFormData] = useState({
    payroll: payrollId || '',
    reason: '',
    amount: '',
  });

  useEffect(() => {
    dispatch(clearError());
    if (payrollId) {
      setFormData((prev) => ({ ...prev, payroll: payrollId }));
    }
  }, [dispatch, payrollId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createDeductionAsync(formData)).unwrap();
      toast.success('Deduction added successfully');
      onOpenChange(false);
      navigate('/payroll-report'); // Adjust based on your flow
    } catch (err) {
      toast.error(err || 'Error adding deduction');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Deduction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Payroll ID</label>
            <input
              type="text"
              value={formData.payroll}
              disabled
              className="w-full border rounded p-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Reason</label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...prev, reason: e.target.value })}
              className="w-full border rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Amount</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...prev, amount: e.target.value })}
              className="w-full border rounded p-2"
              required
              min="0"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Deduction'}
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

export default DeductionModal;