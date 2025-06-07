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
import { Label } from "@/components/ui/label"; // حاولي تثبتيه
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const AddIncomeForm = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const { isLoading, incomeSources } = useSelector((state) => state.finance);
  const user = useSelector((state) => state.auth.user);

  const [formData, setFormData] = useState({
    source: "",
    description: "",
  });
  const [selectedPrice, setSelectedPrice] = useState(null);

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

  const handleSourceChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      source: value,
    }));
    const selectedSource = incomeSources.find((source) => source.id === parseInt(value));
    setSelectedPrice(selectedSource ? selectedSource.price : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.source) {
      toast.error("يرجى اختيار مصدر الإيراد");
      return;
    }

    const loadingToast = toast.loading("جارٍ تسجيل الإيراد...");

    try {
      const incomeData = {
        source: parseInt(formData.source),
        description: formData.description || "",
      };

      await dispatch(addIncome(incomeData)).unwrap();

      toast.success("تم تسجيل الإيراد بنجاح", { id: loadingToast });
      setOpen(false);
      setFormData({
        source: "",
        description: "",
      });
      setSelectedPrice(null);
    } catch (error) {
      console.error("خطأ أثناء إضافة الإيراد:", error);
      toast.error(error.message || "فشل في تسجيل الإيراد", { id: loadingToast });
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="mb-4 bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        إضافة إيراد جديد
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-w-md bg-white rounded-lg shadow-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-right text-2xl font-bold text-gray-800">
              إضافة إيراد جديد
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="block text-sm font-medium text-right text-gray-700 mb-2">
                مصدر الإيراد
              </Label>
              <Select
                name="source"
                value={formData.source}
                onValueChange={handleSourceChange}
                required
              >
                <SelectTrigger className="w-full text-right border-gray-300 rounded-lg py-2.5 px-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500">
                  <SelectValue placeholder="اختر مصدر الإيراد" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {incomeSources.map((source) => (
                    <SelectItem key={source.id} value={source.id.toString()} className="text-right">
                      {source.name} ({source.price} جنيه)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPrice !== null && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-right">
                <p className="text-sm font-medium text-gray-700">
                  السعر: <span className="text-green-600 font-bold">{selectedPrice} جنيه</span>
                </p>
              </div>
            )}

            <div>
              <Label className="block text-sm font-medium text-right text-gray-700 mb-2">
                الوصف (اختياري)
              </Label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-lg py-2.5 px-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 text-right resize-none"
                rows={4}
                placeholder="أدخل وصفًا إن أردت"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="px-6 py-2 text-gray-700 border-gray-300 hover:bg-gray-100"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                {isLoading && <Loader2 className="animate-spin h-4 w-4" />}
                حفظ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddIncomeForm;