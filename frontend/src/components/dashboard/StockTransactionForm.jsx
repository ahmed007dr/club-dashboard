import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
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
import axios from 'axios';
import BASE_URL from '../../config/api';

// Memoized Selectors
const selectFinanceState = (state) => state.finance || {};
const selectStockState = (state) => state.stock || {};
const selectAuthState = (state) => state.auth || {};

const selectFinance = createSelector(
  [selectFinanceState],
  (finance) => ({
    incomeSources: finance.incomeSources || [],
    expenseCategories: finance.expenseCategories || [],
    isLoading: finance.loading || false,
  })
);

const selectStockItems = createSelector(
  [selectStockState],
  (stock) => stock.stockItems || []
);

const selectUser = createSelector(
  [selectAuthState],
  (auth) => auth.user || {}
);

const StockTransactionForm = ({ type, currentItem, setShowModal }) => {
  const dispatch = useDispatch();
  const { incomeSources, expenseCategories, isLoading } = useSelector(selectFinance);
  const stockItems = useSelector(selectStockItems);
  const user = useSelector(selectUser);

  const [formData, setFormData] = useState({
    source: '',
    description: '',
    stock_item: '',
    quantity: '1',
    payment_method: '',
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchStockItems());
    axios
      .get(`${BASE_URL}subscriptions/api/payment-methods/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Cache-Control': 'no-cache',
        },
      })
      .then((response) => {
        setPaymentMethods(Array.isArray(response.data) ? response.data : []);
      })
      .catch((error) => {
        console.error('Error fetching payment methods:', error);
        toast.error('فشل في جلب طرق الدفع');
      });

    if (currentItem) {
      const sourceId = type === 'income' ? currentItem.source?.toString() : currentItem.category?.toString();
      const selectedSource = (type === 'income' ? incomeSources : expenseCategories).find(
        (item) => item.id === parseInt(sourceId)
      );
      setFormData({
        source: sourceId || '',
        description: currentItem.description || '',
        stock_item: currentItem.stock_transaction_details?.stock_item_details?.id?.toString() || currentItem.stock_item?.toString() || '',
        quantity: currentItem.quantity?.toString() || currentItem.stock_transaction_details?.quantity?.toString() || currentItem.stock_quantity?.toString() || '1',
        payment_method: currentItem.payment_method?.toString() || '',
      });
      setSelectedPrice(selectedSource?.price || null);
    }
  }, [dispatch, currentItem, incomeSources, expenseCategories, type]);

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
          newFormData.quantity = '1';
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
    if (type === 'income' && !formData.payment_method) newErrors.payment_method = 'طريقة الدفع مطلوبة';
    if (type === 'income') {
      if (!formData.quantity || parseInt(formData.quantity) <= 0) {
        newErrors.quantity = 'الكمية يجب أن تكون أكبر من صفر';
      } else if (formData.stock_item) {
        const stockItem = stockItems.find((item) => item.id === parseInt(formData.stock_item));
        if (stockItem && parseInt(formData.quantity) > stockItem.current_quantity) {
          newErrors.quantity = 'الكمية المطلوبة غير متوفرة في المخزون';
        }
      }
    } else if (formData.stock_item && (!formData.quantity || parseInt(formData.quantity) <= 0)) {
      newErrors.quantity = 'الكمية يجب أن تكون أكبر من صفر';
    }
    if (!selectedPrice && type === 'income') newErrors.source = 'لا يوجد سعر لمصدر المبيعات المحدد';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const quantity = parseInt(formData.quantity) || 1;
    const payload = {
      [type === 'income' ? 'source' : 'category']: parseInt(formData.source) || null,
      amount: selectedPrice ? parseFloat(selectedPrice * quantity).toFixed(2) : 0,
      description: formData.description || '',
      stock_item: parseInt(formData.stock_item) || null,
      quantity: type === 'income' ? quantity : formData.stock_item ? quantity : null,
      payment_method: type === 'income' ? parseInt(formData.payment_method) || null : null,
    };

    const action = type === 'income'
      ? currentItem
        ? updateIncome({ id: currentItem.id, updatedData: payload })
        : addIncome(payload)
      : currentItem
      ? updateExpense({ id: currentItem.id, updatedData: payload })
      : addExpense(payload);

    const loadingToast = toast.loading('جارٍ حفظ العملية...');
    try {
      await dispatch(action).unwrap();
      toast.success('تم حفظ العملية بنجاح', { id: loadingToast });
      setShowModal(false);
      setFormData({
        source: '',
        description: '',
        stock_item: '',
        quantity: '1',
        payment_method: '',
      });
      setSelectedPrice(null);
      setErrors({});
    } catch (err) {
      const errorMessage = err.message || err || 'فشل في حفظ العملية';
      toast.error(errorMessage, { id: loadingToast });
      setErrors({ general: errorMessage });
    }
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
            {type === 'income' ? 'اختر مصدر المبيعات، طريقة الدفع، وعنصر المخزون (إن وجد) لتسجيل المبيعات.' : 'اختر فئة المصروف وعنصر المخزون لتسجيل المصروف.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="bg-red-50 p-3 rounded-lg flex items-center gap-2 text-red-600">
              <FiAlertTriangle className="w-5 h-5" />
              <p>{errors.general}</p>
            </div>
          )}
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
                {Array.isArray(type === 'income' ? incomeSources : expenseCategories) &&
                (type === 'income' ? incomeSources : expenseCategories).length > 0 ? (
                  (type === 'income' ? incomeSources : expenseCategories).map((item) => (
                    <SelectItem key={`source-${item.id}`} value={item.id.toString()}>
                      {item.name} ({item.price} جنيه)
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem key="no-sources" value="no-sources" disabled>
                    لا توجد {type === 'income' ? 'مصادر' : 'فئات'} متاحة
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.source && <p className="text-red-600 text-sm mt-1">{errors.source}</p>}
          </div>
          {type === 'income' && (
            <div>
              <label className="block text-sm font-medium mb-1 text-right">طريقة الدفع</label>
              <Select
                onValueChange={(value) => handleSelectChange('payment_method', value)}
                value={formData.payment_method}
              >
                <SelectTrigger className={errors.payment_method ? 'border-red-500' : ''}>
                  <SelectValue placeholder="اختر طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(paymentMethods) && paymentMethods.length > 0 ? (
                    paymentMethods.map((method) => (
                      <SelectItem key={`payment-${method.id}`} value={method.id.toString()}>
                        {method.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem key="no-payment-methods" value="no-payment-methods" disabled>
                      لا توجد طرق دفع متاحة
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.payment_method && <p className="text-red-600 text-sm mt-1">{errors.payment_method}</p>}
            </div>
          )}
          {selectedPrice !== null && type === 'income' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-right">
              <p className="text-sm font-medium text-gray-700">
                السعر للوحدة: <span className="text-green-600 font-bold">{selectedPrice} جنيه</span>
                {formData.quantity && parseInt(formData.quantity) > 0 && (
                  <span> | الإجمالي: {parseFloat(selectedPrice * parseInt(formData.quantity)).toFixed(2)} جنيه</span>
                )}
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
            <label className="block text-sm font-medium mb-1 text-right">عنصر المخزون (اختياري)</label>
            <Select
              onValueChange={(value) => handleSelectChange('stock_item', value)}
              value={formData.stock_item}
            >
              <SelectTrigger className={errors.stock_item ? 'border-red-500' : ''}>
                <SelectValue placeholder="اختر عنصر المخزون" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="no-stock" value="no-stock">بدون عنصر مخزون</SelectItem>
                {Array.isArray(stockItems) && stockItems.length > 0 && (
                  stockItems.map((item) => (
                    <SelectItem key={`stock-${item.id}`} value={item.id.toString()}>
                      {item.name} (متوفر: {item.current_quantity})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.stock_item && <p className="text-red-600 text-sm mt-1">{errors.stock_item}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">الكمية</label>
            <Input
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              className={errors.quantity ? 'border-red-500 text-right' : 'text-right'}
              min="1"
              placeholder="أدخل الكمية"
              required={type === 'income'}
            />
            {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <Button onClick={() => setShowModal(false)} variant="outline">
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="animate-spin h-4 w-4" />}
              حفظ
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockTransactionForm;