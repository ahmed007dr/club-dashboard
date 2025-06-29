
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
        const response = await axios.get(`${BASE_URL}/accounts/api/users/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        setEmployees(response.data.results.filter(user => user.role !== 'member'));
      } catch (err) {
        console.error('Failed to fetch employees:', err.response?.data || err.message);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent dir="rtl" className="max-w-3xl w-full p-4 bg-white rounded-lg shadow-sm font-noto-sans-arabic">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2 text-lg font-medium text-gray-800">
            <FiPlus className="text-teal-500 w-5 h-5 transition-transform transform hover:scale-110" />
            {currentExpense ? 'تعديل المصروف' : 'إضافة مصروف'}
          </DialogTitle>
          <DialogDescription className="text-right text-xs text-gray-500 mt-1">
            أدخل تفاصيل المصروف بسهولة وسرعة.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          {errors.general && (
            <div className="bg-red-50 p-2 rounded flex items-center gap-2 text-red-600 border border-red-100 mb-3">
              <FiAlertTriangle className="w-4 h-4" />
              <p className="text-xs">{errors.general}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">النادي</label>
              <Input
                value={userClub?.name || 'جاري التحميل...'}
                disabled
                className="w-full text-right bg-gray-50 border-gray-200 rounded focus:ring-teal-400 focus:border-teal-400"
              />
              {errors.club && <p className="text-red-500 text-xs mt-1">{errors.club}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">فئة المصروف</label>
              <Select
                name="category"
                onValueChange={(value) => handleChange({ target: { name: 'category', value } })}
                value={currentExpense?.category || newExpense?.category || 'none'}
                disabled={currentExpense ? !canEditExpense : !canAddExpense}
              >
                <SelectTrigger className={`w-full bg-gray-50 rounded border-gray-200 focus:ring-1 focus:ring-teal-400 ${errors.category ? 'border-red-300' : ''}`}>
                  <SelectValue placeholder="اختر فئة" />
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
              <label className="block text-xs font-medium mb-1 text-gray-700">الموظف المرتبط (اختياري)</label>
              <Select
                name="related_employee"
                onValueChange={(value) => handleChange({ target: { name: 'related_employee', value } })}
                value={currentExpense?.related_employee || newExpense?.related_employee || 'none'}
                disabled={(!canEditExpense && currentExpense) || loadingEmployees}
              >
                <SelectTrigger className={`w-full bg-gray-50 rounded border-gray-200 focus:ring-1 focus:ring-teal-400 ${errors.related_employee ? 'border-red-300' : ''}`}>
                  <SelectValue placeholder="اختر الموظف" />
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
              <label className="block text-xs font-medium mb-1 text-gray-700">المبلغ</label>
              <Input
                type="number"
                name="amount"
                value={currentExpense?.amount || newExpense?.amount || ''}
                onChange={handleChange}
                step="0.01"
                className={`w-full text-right bg-gray-50 rounded border-gray-200 focus:ring-1 focus:ring-teal-400 ${errors.amount ? 'border-red-300' : ''}`}
                disabled={currentExpense ? !canEditExpense : !canAddExpense}
                placeholder="أدخل المبلغ"
              />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">الوصف</label>
              <Textarea
                name="description"
                value={currentExpense?.description || newExpense?.description || ''}
                onChange={handleChange}
                rows={2}
                className="w-full text-right bg-gray-50 rounded border-gray-200 focus:ring-1 focus:ring-teal-400"
                disabled={currentExpense ? !canEditExpense : !canAddExpense}
                placeholder="وصف المصروف"
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">التاريخ</label>
              <Input
                type="date"
                name="date"
                value={currentExpense?.date || newExpense?.date || ''}
                onChange={handleChange}
                className={`w-full text-right bg-gray-50 rounded border-gray-200 focus:ring-1 focus:ring-teal-400 ${errors.date ? 'border-red-300' : ''}`}
                disabled={currentExpense ? !canEditExpense : !canAddExpense}
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">رقم الفاتورة (اختياري)</label>
              <Input
                type="text"
                name="invoice_number"
                value={currentExpense?.invoice_number || newExpense?.invoice_number || ''}
                onChange={handleChange}
                placeholder="رقم الفاتورة"
                className="w-full text-right bg-gray-50 rounded border-gray-200 focus:ring-1 focus:ring-teal-400"
                disabled={currentExpense ? !canEditExpense : !canAddExpense}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">المرفق (اختياري)</label>
              <Input
                type="file"
                name="attachment"
                onChange={(e) => handleChange({ target: { name: 'attachment', value: e.target.files[0] } })}
                className="w-full text-right bg-gray-50 rounded border-gray-200"
                disabled={currentExpense ? !canEditExpense : !canAddExpense}
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            onClick={() => setShowModal(false)}
            variant="outline"
            className="px-4 py-1 text-xs text-gray-600 border-gray-200 rounded hover:bg-gray-100"
          >
            إلغاء
          </Button>
          <Button
            onClick={() => {
              console.log('handleSave triggered', { canAddExpense, canEditExpense });
              handleSave();
            }}
            className={`px-4 py-1 text-xs text-white rounded ${
              currentExpense
                ? canEditExpense
                  ? 'bg-teal-500 hover:bg-teal-600'
                  : 'bg-gray-300 cursor-not-allowed'
                : canAddExpense
                ? 'bg-teal-500 hover:bg-teal-600'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
            disabled={currentExpense ? !canEditExpense : !canAddExpense}
          >
            {currentExpense ? 'حفظ' : 'إضافة'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditExpenseModal;
