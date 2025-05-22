import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addIncome, fetchIncomeSources } from "../../redux/slices/financeSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

const AddIncomeForm = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const { isLoading } = useSelector((state) => state.finance);
  const { incomeSources } = useSelector((state) => state.finance);
  const user = useSelector((state) => state.auth.user);

  const [formData, setFormData] = useState({
    source: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    dispatch(fetchIncomeSources());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("جارٍ الإرسال...");

    try {
      const incomeData = {
        ...formData,
        source: parseInt(formData.source),
        amount: parseFloat(formData.amount),
        club: user.club.id,
        received_by: user.id,
        date: new Date(formData.date).toISOString().split("T")[0],
      };

      await dispatch(addIncome(incomeData)).unwrap();

      toast.success("تم تسجيل الدخل بنجاح", { id: loadingToast });
      setOpen(false);
      setFormData({
        source: "",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("خطأ أثناء إضافة الدخل:", error);
      toast.error(error.message || "فشل في تسجيل الدخل", { id: loadingToast });
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="mb-4">
        <Plus className="ml-2 h-4 w-4" />
        إضافة دخل جديد
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">إضافة دخل جديد</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-right">
                المصدر
              </label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded text-right"
              >
                <option value="">اختر المصدر</option>
                {incomeSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-right">
                  المبلغ
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded text-right"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-right">
                  التاريخ
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-right">
                الوصف
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border rounded text-right"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddIncomeForm;
