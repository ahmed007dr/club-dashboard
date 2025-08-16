// ✅ SubscriptionCards.jsx (مصحح بالكامل مع كافة الميزات)

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

import {
  FaEdit,
  FaTrash,
  FaEye,
  FaRedo,
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import {
  fetchSubscriptionById,
  makePayment,
  renewSubscription,
  fetchPaymentMethods,
} from '@/redux/slices/subscriptionsSlice';
import usePermission from '@/hooks/usePermission';

const SubscriptionCards = ({
  subscriptions,
  isLoading,
  paymentAmounts,
  setPaymentAmounts,
  setSelectedSubscription,
  setIsUpdateModalOpen,
  setIsDeleteModalOpen,
  setIsDetailModalOpen,
  setDetailSubscription,
}) => {
  const dispatch = useDispatch();
  const { paymentMethods, paymentMethodsLoading, paymentMethodsError } = useSelector((state) => state.subscriptions);
  const [paymentMethodIds, setPaymentMethodIds] = useState({});
  const canUpdateSubscription = usePermission('change_subscription');
  const canDeleteSubscription = usePermission('delete_subscription');

  useEffect(() => {
    dispatch(fetchPaymentMethods());
  }, [dispatch]);

  const normalizeStatus = useCallback((status) => {
    const statusMap = {
      Active: 'نشط',
      Expired: 'منتهي',
      Upcoming: 'قادمة',
      Frozen: 'مجمد',
    };
    return statusMap[status] || 'غير معروف';
  }, []);

  const handleInputChange = useCallback((e, id) => {
    const val = e.target.value;
    if (/^\d*\.?\d*$/.test(val)) {
      setPaymentAmounts((prev) => ({ ...prev, [id]: val }));
    }
  }, [setPaymentAmounts]);

  const handlePaymentMethodChange = useCallback((val, id) => {
    setPaymentMethodIds((prev) => ({ ...prev, [id]: val }));
  }, []);

  const handlePayment = useCallback((subscription) => {
    const amount = parseFloat(paymentAmounts[subscription.id]);
    const method = paymentMethodIds[subscription.id];

    if (!amount || amount <= 0) return toast.error('الرجاء إدخال مبلغ صالح');
    if (!method) return toast.error('اختر طريقة الدفع');
    if (amount > parseFloat(subscription.remaining_amount)) return toast.error('المبلغ أكبر من المتبقي');

    dispatch(makePayment({
      subscriptionId: subscription.id,
      amount: amount.toFixed(2),
      paymentMethodId: parseInt(method),
    }))
      .unwrap()
      .then(() => {
        toast.success('تم الدفع');
        setPaymentAmounts((prev) => ({ ...prev, [subscription.id]: '' }));
        setPaymentMethodIds((prev) => ({ ...prev, [subscription.id]: '' }));
      })
      .catch((err) => {
        toast.error(err?.payment_method_id?.[0] || err?.message || 'خطأ غير متوقع');
      });
  }, [dispatch, paymentAmounts, paymentMethodIds]);

  const openDetailModal = useCallback((id) => {
    dispatch(fetchSubscriptionById(id))
      .unwrap()
      .then((data) => {
        setDetailSubscription(data);
        setIsDetailModalOpen(true);
      })
      .catch(() => toast.error('فشل تحميل التفاصيل'));
  }, [dispatch, setDetailSubscription, setIsDetailModalOpen]);

  const handleRenew = useCallback((id) => {
    dispatch(renewSubscription({ subscriptionId: id }))
      .unwrap()
      .then(() => toast.success('تم التجديد'))
      .catch((err) => toast.error(err?.message || 'فشل التجديد'));
  }, [dispatch]);

  if (isLoading || paymentMethodsLoading) {
    return <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!subscriptions.length) {
    return <p className="text-center py-6 text-gray-500">لا توجد اشتراكات</p>;
  }

  if (paymentMethodsError) {
    return <p className="text-center text-red-500 py-6">خطأ في جلب طرق الدفع: {paymentMethodsError}</p>;
  }

  return (
    <div className="space-y-4">
      {subscriptions.map((sub) => {
        const status = normalizeStatus(sub.status);
        return (
          <motion.div
            key={sub.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 border rounded bg-white shadow-sm hover:shadow-md"
          >
            <div className="flex justify-between mb-2">
              <Link to={`/member-subscriptions/${sub.member_details.id}`} className="text-blue-600 hover:underline">
                {sub.member_details.name}
              </Link>
              <DropdownMenu dir="rtl">
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost"><FaEye /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openDetailModal(sub.id)}><FaEye className="mr-2" />عرض</DropdownMenuItem>
                  {canUpdateSubscription && (
                    <DropdownMenuItem onClick={() => { setSelectedSubscription(sub); setIsUpdateModalOpen(true); }}>
                      <FaEdit className="mr-2" />تعديل
                    </DropdownMenuItem>
                  )}
                  {sub.status === 'Expired' && (
                    <DropdownMenuItem onClick={() => handleRenew(sub.id)}>
                      <FaRedo className="mr-2" />تجديد
                    </DropdownMenuItem>
                  )}
                  {canDeleteSubscription && (
                    <DropdownMenuItem onClick={() => { setSelectedSubscription(sub); setIsDeleteModalOpen(true); }}>
                      <FaTrash className="mr-2" />حذف
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="text-sm space-y-1">
              <p><strong>تاريخ البدء:</strong> {sub.start_date}</p>
              <p><strong>تاريخ الانتهاء:</strong> {sub.end_date}</p>
              <p><strong>عدد الإدخالات:</strong> {sub.entry_count}</p>
              <p><strong>الإدخالات المتبقية:</strong> {sub.type_details.max_entries - sub.entry_count}</p>
              <p><strong>مدفوع:</strong> {sub.paid_amount}</p>
              <p><strong>متبقي:</strong> {sub.remaining_amount}</p>
              <p><strong>الحالة:</strong> <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">{status}</span></p>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\\.?[0-9]*"
                placeholder="0.00"
                value={paymentAmounts[sub.id] || ''}
                onChange={(e) => handleInputChange(e, sub.id)}
                className="w-20"
              />
              <Select
                value={paymentMethodIds[sub.id] || ''}
                onValueChange={(val) => handlePaymentMethodChange(val, sub.id)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id.toString()}>{method.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => handlePayment(sub)} className="bg-blue-600 hover:bg-blue-700">
                دفع
              </Button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SubscriptionCards;
