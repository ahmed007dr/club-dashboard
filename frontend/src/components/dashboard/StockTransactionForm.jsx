import React, { useState, useEffect } from "react";
import { FiPlus, FiX, FiAlertTriangle, FiList, FiDollarSign } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDispatch, useSelector } from "react-redux";
import { addIncome } from "../../redux/slices/financeSlice";
import BASE_URL from "@/config/api";
import toast from 'react-hot-toast';

const StockTransactionForm = ({ type, setShowModal, onSuccess }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { incomeSources } = useSelector((state) => state.finance);
  const [newItem, setNewItem] = useState({
    source: "",
    amount: "",
    description: "",
    quantity: "1",
    payment_method: "",
    received_by: "",
  });
  const [errors, setErrors] = useState({});
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const paymentMethodsResponse = await fetch(`${BASE_URL}subscriptions/api/payment-methods/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        if (!paymentMethodsResponse.ok) throw new Error("فشل في جلب طرق الدفع");
        const paymentMethodsData = await paymentMethodsResponse.json();
        setPaymentMethods(paymentMethodsData || []);
        console.log("Payment methods response for club", user.club.id, ":", paymentMethodsData);

        if (incomeSources.length === 0) {
          setErrors({ general: "لا توجد مصادر إيرادات متاحة" });
        }
      } catch (err) {
        console.error("فشل في تحميل البيانات:", err);
        setErrors({ general: err.message || "فشل في تحميل طرق الدفع" });
      }
    };
    fetchData();
  }, [incomeSources, user.club.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "source") {
      const selectedSource = incomeSources.find((source) => source.id.toString() === value);
      if (selectedSource && selectedSource.price) {
        setNewItem((prev) => ({
          ...prev,
          amount: (parseFloat(selectedSource.price) * (parseInt(prev.quantity) || 1)).toString(),
        }));
      } else {
        setNewItem((prev) => ({ ...prev, amount: "" }));
        setErrors((prev) => ({ ...prev, source: "سعر مصدر الإيراد غير متوفر" }));
      }
    }
  };

  const handleSave = async () => {
    const validationErrors = {
      source: !newItem.source ? "مصدر الإيراد مطلوب." : "",
      amount: !newItem.amount || parseFloat(newItem.amount) <= 0 ? "المبلغ مطلوب ويجب أن يكون أكبر من صفر." : "",
      quantity: !newItem.quantity || parseInt(newItem.quantity) <= 0 ? "الكمية يجب أن تكون أكبر من صفر." : "",
      payment_method: !newItem.payment_method ? "طريقة الدفع مطلوبة." : "",
    };
    if (Object.values(validationErrors).some((err) => err)) {
      setErrors(validationErrors);
      return;
    }

    const selectedSource = incomeSources.find((source) => source.id.toString() === newItem.source);
    if (!selectedSource || !selectedSource.price) {
      setErrors({ general: "سعر مصدر الإيراد غير متوفر" });
      return;
    }

    const selectedPaymentMethod = paymentMethods.find((method) => method.id.toString() === newItem.payment_method);
    if (!selectedPaymentMethod) {
      setErrors({ payment_method: "طريقة الدفع غير صالحة" });
      return;
    }

    const incomeData = {
      source: parseInt(newItem.source),
      amount: parseFloat(newItem.amount),
      description: newItem.description || "",
      quantity: parseInt(newItem.quantity),
      payment_method: parseInt(newItem.payment_method),
      club: user.club.id,
      received_by: user.id,
    };

    console.log("Sending income data:", incomeData);

    try {
      const response = await dispatch(addIncome(incomeData)).unwrap();
      console.log("Income creation response:", response);
      toast.success("تم إضافة الإيراد بنجاح");
      setShowModal(false);
      setNewItem({
        source: "",
        amount: "",
        description: "",
        quantity: "1",
        payment_method: "",
        received_by: "",
      });
      setErrors({});
      onSuccess();
    } catch (err) {
      console.error("فشل في حفظ الإيراد:", err);
      setErrors({ general: err.message || "فشل في حفظ الإيراد" });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center items-center bg-gray-100"
      onClick={() => setShowModal(false)}
      dir="rtl"
    >
      <div
        className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md overflow-y-auto max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <FiPlus className="text-green-600 w-6 h-6" />
          <h3 className="text-xl font-semibold text-right">
            إضافة إيراد
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label className="block text-sm font-medium mb-1 text-right">مصدر الإيراد</Label>
            <div className="relative">
              <FiList className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Select
                name="source"
                value={newItem.source}
                onValueChange={(value) => handleChange({ target: { name: "source", value } })}
              >
                <SelectTrigger className="w-full text-right">
                  <SelectValue placeholder="اختر مصدر الإيراد" />
                </SelectTrigger>
                <SelectContent>
                  {incomeSources.length > 0 ? (
                    incomeSources.map((source) => (
                      <SelectItem key={source.id} value={source.id.toString()}>
                        {`${source.name} (${source.price} جنيه)`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>لا توجد مصادر متاحة</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.source && (
                <p className="text-red-600 text-sm text-right">{errors.source}</p>
              )}
            </div>
          </div>
          <div>
            <Label className="block text-sm font-medium mb-1 text-right">المبلغ</Label>
            <div className="relative">
              <FiDollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="number"
                name="amount"
                value={newItem.amount}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 text-right"
                min="0"
                step="0.01"
                disabled
              />
              {errors.amount && (
                <p className="text-red-600 text-sm text-right">{errors.amount}</p>
              )}
            </div>
          </div>
          <div>
            <Label className="block text-sm font-medium mb-1 text-right">الكمية</Label>
            <div className="relative">
              <Input
                type="number"
                name="quantity"
                value={newItem.quantity}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 text-right"
                min="1"
                step="1"
              />
              {errors.quantity && (
                <p className="text-red-600 text-sm text-right">{errors.quantity}</p>
              )}
            </div>
          </div>
          <div>
            <Label className="block text-sm font-medium mb-1 text-right">طريقة الدفع</Label>
            <div className="relative">
              <FiList className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Select
                name="payment_method"
                value={newItem.payment_method}
                onValueChange={(value) => handleChange({ target: { name: "payment_method", value } })}
              >
                <SelectTrigger className="w-full text-right">
                  <SelectValue placeholder="اختر طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.length > 0 ? (
                    paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id.toString()}>
                        {method.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>لا توجد طرق دفع متاحة</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.payment_method && (
                <p className="text-red-600 text-sm text-right">{errors.payment_method}</p>
              )}
            </div>
          </div>
          <div>
            <Label className="block text-sm font-medium mb-1 text-right">الوصف</Label>
            <textarea
              name="description"
              value={newItem.description || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg py-2.5 px-4 bg-white text-gray-700 text-right"
              rows={3}
            />
          </div>
          <div>
            <Label className="block text-sm font-medium mb-1 text-right">المستلم</Label>
            <div className="relative">
              <Input
                type="text"
                name="received_by"
                value={user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 text-right"
                disabled
              />
            </div>
          </div>
        </div>
        {errors.general && (
          <div className="flex items-center gap-2 text-red-600 text-sm mt-4">
            <FiAlertTriangle className="w-5 h-5" />
            <p>{errors.general}</p>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            onClick={() => setShowModal(false)}
            variant="outline"
            className="px-6 py-2"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white"
          >
            حفظ
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StockTransactionForm;