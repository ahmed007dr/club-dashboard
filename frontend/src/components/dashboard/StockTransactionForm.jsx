
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiDollarSign, FiAlertTriangle } from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { addIncome, updateIncome, addExpense, updateExpense } from '../../redux/slices/financeSlice';
import { fetchStockItems } from '../../redux/slices/stockSlice';
import toast from 'react-hot-toast';

const StockTransactionForm = ({ type, currentItem, setShowModal }) => {
  const dispatch = useDispatch();
  const { stockItems } = useSelector((state) => state.stock || {});
  const { incomeSources, expenseCategories, isLoading } = useSelector((state) => state.finance || {});
  const { user } = useSelector((state) => state.auth || {});
  const today = new Date().toISOString().slice(0, 16); 
  const [formData, setFormData] = useState({
    club: user?.club?.id?.toString() || '',
    source: '',
    description: '',
    date: today,
    stock_item: '',
    quantity: '1',
  });
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchStockItems());
    if (currentItem) {
      const sourceId = type === 'income' ? currentItem.source?.toString() : currentItem.category?.toString();
      const selectedSource = (type === 'income' ? incomeSources : expenseCategories).find(
        (item) => item.id === parseInt(sourceId)
      );
      setFormData({
        club: currentItem.club?.toString() || user?.club?.id?.toString() || '',
        source: sourceId || '',
        description: currentItem.description || '',
        date: currentItem.date ? new Date(currentItem.date).toISOString().slice(0, 16) : today,
        stock_item: currentItem.stock_transaction_details?.stock_item_details?.id?.toString() || currentItem.stock_item?.toString() || '',
        quantity: currentItem.stock_transaction_details?.quantity?.toString() || currentItem.stock_quantity?.toString() || '1',
      });
      setSelectedPrice(selectedSource?.price || null);
    }
  }, [dispatch, currentItem, user, incomeSources, expenseCategories, type, today]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => {
      const newFormData = { ...prev, [name]: value === 'none' ? '' : value };
      if (name === 'source' && type === 'income') {
        const selectedSource = incomeSources.find((item) => item.id === parseInt(value));
        if (selectedSource?.stock_item) {
          newFormData.stock_item = selectedSource.stock_item.id.toString();
        } else {
          newFormData.stock_item = '';
        }
        setSelectedPrice(selectedSource?.price || null);
      }
      return newFormData;
    });
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.source) newErrors.source = type === 'income' ? 'مصدر المبيعات مطلوب' : 'فئة المصروف مطلوبة';
    if (!formData.date) newErrors.date = 'التاريخ والساعة مطلوبين';
    if (formData.stock_item) {
      if (!formData.quantity || parseInt(formData.quantity) <= 0) {
        newErrors.quantity = 'الكمية يجب أن تكون أكبر من صفر';
      } else {
        const stockItem = stockItems.find((item) => item.id === parseInt(formData.stock_item));
        if (stockItem && parseInt(formData.quantity) > stockItem.current_quantity) {
          newErrors.quantity = 'الكمية المطلوبة غير متوفرة في المخزون';
        }
      }
    }
    if (!selectedPrice && type === 'income') newErrors.amount = 'لا يوجد سعر لمصدر المبيعات المحدد';
    return newErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      club: parseInt(formData.club) || null,
      [type === 'income' ? 'source' : 'category']: parseInt(formData.source) || null,
      amount: selectedPrice || 0,
      description: formData.description || '',
      date: formData.date || today,
      stock_item: parseInt(formData.stock_item) || null,
      quantity: formData.stock_item ? parseInt(formData.quantity) : null,
    };

    const action = type === 'income'
      ? (currentItem ? updateIncome({ id: currentItem.id, updatedData: payload }) : addIncome(payload))
      : (currentItem ? updateExpense({ id: currentItem.id, updatedData: payload }) : addExpense(payload));

    const loadingToast = toast.loading('جارٍ حفظ العملية...');
    dispatch(action)
      .unwrap()
      .then(() => {
        toast.success('تم حفظ العملية بنجاح', { id: loadingToast });
        setShowModal(false);
        setFormData({
          club: user?.club?.id?.toString() || '',
          source: '',
          description: '',
          date: today,
          stock_item: '',
          quantity: '1',
        });
        setSelectedPrice(null);
        setErrors({});
      })
      .catch((err) => {
        toast.error(err.message || 'فشل في حفظ العملية', { id: loadingToast });
        setErrors({ general: err.message || 'فشل في حفظ العملية' });
      });
  };

  return (
    <Dialog open={true} onOpenChange={setShowModal}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <FiDollarSign className="text-green-600 w-6 h-6" />
            {type === 'income' ? (currentItem ? 'تعديل مبيعات' : 'إضافة مبيعات') : (currentItem ? 'تعديل مصروف' : 'إضافة مصروف')}
          </DialogTitle>
          <DialogDescription className="text-right text-sm text-gray-600">
            {type === 'income' ? 'اختر مصدر المبيعات وعنصر المخزون لتسجيل المبيعات.' : 'اختر فئة المصروف وعنصر المخزون لتسجيل المصروف.'}
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
              value={user?.club?.name || 'جاري التحميل...'}
              disabled
              className="text-right"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">
              {type === 'income' ? 'مصدر المبيعات' : 'فئة المصروف'}
            </label>
            <Select
              onValueChange={(value) => handleSelectChange('source', value)}
              value={formData.source}
            >
              <SelectTrigger className={errors.source ? 'border-red-500' : ''}>
                <SelectValue placeholder={type === 'income' ? 'اختر مصدر المبيعات' : 'اختر فئة المصروف'} />
              </SelectTrigger>
              <SelectContent>
                {(type === 'income' ? incomeSources : expenseCategories).map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.name} ({item.price} جنيه)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.source && <p className="text-red-600 text-sm mt-1">{errors.source}</p>}
          </div>
          {selectedPrice !== null && type === 'income' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-right">
              <p className="text-sm font-medium text-gray-700">
                السعر: <span className="text-green-600 font-bold">{selectedPrice} جنيه</span>
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1 text-right">الوصف (اختياري)</label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="text-right"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">التاريخ والساعة</label>
            <Input
              name="date"
              type="datetime-local"
              value={formData.date}
              onChange={handleChange}
              className={errors.date ? 'border-red-500 text-right' : 'text-right'}
              dir="rtl"
            />
            {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">عنصر المخزون</label>
            <Select
              onValueChange={(value) => handleSelectChange('stock_item', value)}
              value={formData.stock_item}
            >
              <SelectTrigger className={errors.stock_item ? 'border-red-500' : ''}>
                <SelectValue placeholder="اختر عنصر المخزون" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون عنصر مخزون</SelectItem>
                {stockItems.map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.name} (متوفر: {item.current_quantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.stock_item && <p className="text-red-600 text-sm mt-1">{errors.stock_item}</p>}
          </div>
          {formData.stock_item && (
            <div>
              <label className="block text-sm font-medium mb-1 text-right">الكمية</label>
              <Input
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                className={errors.quantity ? 'border-red-500 text-right' : 'text-right'}
                min="1"
                readOnly={type === 'income'}
                dir="rtl"
              />
              {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setShowModal(false)}
              variant="outline"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="animate-spin h-4 w-4" />}
              حفظ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockTransactionForm;
