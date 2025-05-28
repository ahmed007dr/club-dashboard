import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addIncomeSource } from "../../redux/slices/financeSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import BASE_URL from "@/config/api";

const IncomeSourceForm = ({ onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    club: "",
  });
  const [userClub, setUserClub] = useState(null);
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();

  // Fetch user profile to get club details
  useEffect(() => {
    fetch(`${BASE_URL}/accounts/api/profile/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setUserClub({
          id: data.club.id,
          name: data.club.name,
        });
        setFormData((prev) => ({ ...prev, club: data.club.id.toString() }));
      })
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
        setErrors((prev) => ({ ...prev, club: "فشل في تحميل بيانات النادي" }));
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = (data) => {
    const newErrors = {};
    if (!data.name) newErrors.name = "الاسم مطلوب.";
    if (!data.club || isNaN(parseInt(data.club)))
      newErrors.club = "النادي مطلوب.";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    console.log("Form Data being sent:", formData);

    const loadingToast = toast.loading("جارٍ الإرسال...");

    dispatch(addIncomeSource(formData))
      .unwrap()
      .then(() => {
        toast.success("تمت إضافة مصدر الدخل بنجاح!", { id: loadingToast });
        setOpen(false);
        setFormData({ name: "", description: "", club: userClub?.id?.toString() || "" });
        setErrors({});
        onSuccess?.();
      })
      .catch((error) => {
        console.error("Full error object:", error);
        let errorMessage = "فشل في إرسال النموذج";
        if (error.response?.data) {
          if (typeof error.response.data === "string") {
            errorMessage = error.response.data;
          } else if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          } else if (error.response.data.non_field_errors) {
            errorMessage = error.response.data.non_field_errors.join(", ");
          } else {
            const firstError = Object.values(error.response.data)[0];
            if (Array.isArray(firstError)) {
              errorMessage = firstError[0];
            }
          }
        }
        toast.error(errorMessage, { id: loadingToast });
      });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} aria-label="فتح نموذج إضافة مصدر دخل جديد">
        إضافة مصدر دخل جديد
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" aria-describedby="dialog-description">
          <DialogHeader>
            <DialogTitle className="text-right">
              إضافة مصدر دخل جديد
            </DialogTitle>
            <DialogDescription id="dialog-description" className="sr-only">
              نموذج لإضافة مصدر دخل جديد للنادي. يرجى ملء الحقول المطلوبة وحفظ البيانات.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name-input" className="block text-sm font-medium text-right">
                الاسم *
              </label>
              <input
                id="name-input"
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border rounded text-right"
                aria-describedby="name-help"
              />
              <span id="name-help" className="sr-only">
                ادخل اسم مصدر الدخل - هذا الحقل مطلوب
              </span>
              {errors.name && (
                <p className="text-red-500 text-xs text-right mt-1">
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="club-input" className="block text-sm font-medium text-right">
                النادي *
              </label>
              <select
                id="club-input"
                name="club"
                value={formData.club}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-green-200 text-right text-sm"
                disabled
                aria-describedby="club-help"
              >
                {userClub ? (
                  <option value={userClub.id}>{userClub.name}</option>
                ) : (
                  <option value="">جاري التحميل...</option>
                )}
              </select>
              <span id="club-help" className="sr-only">
                النادي المرتبط بمصدر الدخل - هذا الحقل معطل ويتم ملؤه تلقائيًا
              </span>
              {errors.club && (
                <p className="text-red-500 text-xs text-right mt-1">
                  {errors.club}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="description-input" className="block text-sm font-medium text-right">
                الوصف
              </label>
              <textarea
                id="description-input"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border rounded text-right"
                rows={3}
                aria-describedby="description-help"
              />
              <span id="description-help" className="sr-only">
                ادخل وصف تفصيلي لمصدر الدخل - هذا الحقل اختياري
              </span>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setErrors({});
                }}
                aria-label="إلغاء العملية وإغلاق النموذج"
              >
                إلغاء
              </Button>
              <Button type="submit" aria-label="حفظ مصدر الدخل الجديد">
                حفظ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default IncomeSourceForm;