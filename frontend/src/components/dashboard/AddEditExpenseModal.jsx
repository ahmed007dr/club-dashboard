import React, { useState, useEffect } from 'react';
import { FiPlus, FiUser, FiList, FiDollarSign, FiCalendar, FiFileText, FiAlertTriangle } from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import BASE_URL from '../../config/api';

const AddEditExpenseModal = ({
  showModal,
  setShowModal,
  currentExpense,
  newExpense,
  userClub,
  expenseCategories,
  handleChange,
  handleSave,
  errors,
  canEditExpense,
  canAddExpense,
}) => {
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const response = await axios.get(`${BASE_URL}accounts/api/users/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        setEmployees(response.data.results.filter(user => user.role !== 'member')); // Exclude members
      } catch (err) {
        console.error('Failed to fetch employees:', err);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <FiPlus className="text-teal-600 w-6 h-6" />
            {currentExpense ? 'تعديل المصروف' : 'إضافة مصروف'}
          </DialogTitle>
          <DialogDescription className="text-right text-sm text-gray-600">
            أدخل تفاصيل المصروف لتسجيله.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {errors.general && (
            <div className="bg-red-50 p-3 rounded-lg flex items-center gap-2 text-red-600">
              <FiAlertTriangle className="w-5 h-5" />
              <p>{errors.general}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1 text-right">النادي</label>
            <Input
              value={userClub?.name || 'جاري التحميل...'}
              disabled
              className="text-right"
            />
            {errors.club && <p className="text-red-500 text-xs mt-1">{errors.club}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">فئة المصروف</label>
            <Select
              name="category"
              onValueChange={(value) => handleChange({ target: { name: 'category', value } })}
              value={currentExpense ? currentExpense.category : newExpense.category}
              disabled={currentExpense ? !canEditExpense : !canAddExpense}
            >
              <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                <SelectValue placeholder="اختر فئة المصروف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">اختر الفئة</SelectItem>
                {expenseCategories?.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">الموظف المرتبط (اختياري)</label>
            <Select
              name="related_employee"
              onValueChange={(value) => handleChange({ target: { name: 'related_employee', value } })}
              value={currentExpense ? currentExpense.related_employee : newExpense.related_employee}
              disabled={(!canEditExpense && currentExpense) || loadingEmployees}
            >
              <SelectTrigger className={errors.related_employee ? 'border-red-500' : ''}>
                <SelectValue placeholder="اختر الموظف المرتبط" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون موظف</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {employee.first_name && employee.last_name
                      ? `${employee.first_name} ${employee.last_name}`
                      : employee.username || 'غير متوفر'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.related_employee && <p className="text-red-500 text-xs mt-1">{errors.related_employee}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">المبلغ</label>
            <Input
              type="number"
              name="amount"
              value={currentExpense ? currentExpense.amount || '' : newExpense.amount || ''}
              onChange={handleChange}
              step="0.01"
              className={errors.amount ? 'border-red-500 text-right' : 'text-right'}
              disabled={currentExpense ? !canEditExpense : !canAddExpense}
              placeholder="أدخل المبلغ"
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">الوصف</label>
            <Textarea
              name="description"
              value={currentExpense ? currentExpense.description || '' : newExpense.description || ''}
              onChange={handleChange}
              rows={3}
              className="text-right"
              disabled={currentExpense ? !canEditExpense : !canAddExpense}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">التاريخ</label>
            <Input
              type="date"
              name="date"
              value={currentExpense ? currentExpense.date || '' : newExpense.date || ''}
              onChange={handleChange}
              className={errors.date ? 'border-red-500 text-right' : 'text-right'}
              disabled={currentExpense ? !canEditExpense : !canAddExpense}
            />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">رقم الفاتورة (اختياري)</label>
            <Input
              type="text"
              name="invoice_number"
              value={currentExpense ? currentExpense.invoice_number || '' : newExpense.invoice_number || ''}
              onChange={handleChange}
              placeholder="أدخل رقم الفاتورة"
              className="text-right"
              disabled={currentExpense ? !canEditExpense : !canAddExpense}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">المرفق</label>
            <Input
              type="file"
              name="attachment"
              onChange={(e) => {
                const file = e.target.files[0];
                if (currentExpense) {
                  setCurrentExpense((prev) => ({ ...prev, attachment: file }));
                } else {
                  setNewExpense((prev) => ({ ...prev, attachment: file }));
                }
              }}
              className="text-right"
              disabled={currentExpense ? !canEditExpense : !canAddExpense}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            onClick={() => setShowModal(false)}
            variant="outline"
            className="px-6 py-2 text-sm"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            className={`px-6 py-2 text-sm text-white ${
              currentExpense
                ? canEditExpense
                  ? 'bg-teal-600 hover:bg-teal-700'
                  : 'bg-gray-400 cursor-not-allowed'
                : canAddExpense
                ? 'bg-teal-600 hover:bg-teal-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            disabled={currentExpense ? !canEditExpense : !canAddExpense}
          >
            {currentExpense ? 'حفظ التعديلات' : 'إضافة'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditExpenseModal;