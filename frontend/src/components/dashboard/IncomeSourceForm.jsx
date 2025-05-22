import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addIncomeSource } from "../../redux/slices/financeSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const IncomeSourceForm = ({ onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    club: "",
  });
  const dispatch = useDispatch();

  const handleSubmit = (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("جارٍ الإرسال...");

    dispatch(addIncomeSource(formData))
      .unwrap()
      .then(() => {
        toast.success("تمت إضافة مصدر الدخل بنجاح!", { id: loadingToast });
        setOpen(false);
        setFormData({ name: "", description: "", club: "" });
        onSuccess?.();
      })
      .catch((error) => {
        toast.error("فشل في إرسال النموذج", { id: loadingToast });
        console.error("Error adding income source:", error);
      });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>إضافة مصدر دخل جديد</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">
              إضافة مصدر دخل جديد
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-right">
                الاسم
              </label>
              <input
                required
                name="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full p-2 border rounded text-right"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-right">
                الوصف
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
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
              <Button type="submit">حفظ</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default IncomeSourceForm;
