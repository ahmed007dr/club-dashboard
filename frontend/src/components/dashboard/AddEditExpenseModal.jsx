import React from "react";
import { FiX, FiAlertTriangle } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSelector } from "react-redux";
import { ErrorBoundary } from "react-error-boundary";

const ErrorFallback = ({ error }) => (
  <div className="text-red-600 text-sm text-right">
    <p>خطأ في عرض القائمة: {error.message}</p>
  </div>
);

const AddEditExpenseModal = ({
  showModal,
  setShowModal,
  newExpense,
  userClub,
  expenseCategories,
  users,
  handleChange,
  handleSave,
  errors,
}) => {
  const { user } = useSelector((state) => state.auth);

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-[425px] font-sans" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة مصروف جديد</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paid_by" className="text-right col-span-1">تسجيل بواسطة</Label>
            <div className="col-span-3 text-right">
              {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
            </div>
          </div>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right col-span-1">الفئة</Label>
              <Select
                name="category"
                value={newExpense.category}
                onValueChange={(value) => handleChange({ target: { name: "category", value } })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories
                    .filter((category) => category.id)
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-red-600 text-sm col-span-4 text-right">{errors.category}</p>
              )}
            </div>
          </ErrorBoundary>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right col-span-1">المبلغ</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              value={newExpense.amount}
              onChange={handleChange}
              className="col-span-3"
            />
            {errors.amount && (
              <p className="text-red-600 text-sm col-span-4 text-right">{errors.amount}</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right col-span-1">الوصف</Label>
            <Input
              id="description"
              name="description"
              value={newExpense.description}
              onChange={handleChange}
              className="col-span-3"
            />
            {errors.description && (
              <p className="text-red-600 text-sm col-span-4 text-right">{errors.description}</p>
            )}
          </div>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="related_employee" className="text-right col-span-1">الموظف المرتبط</Label>
              <Select
                name="related_employee"
                value={newExpense.related_employee}
                onValueChange={(value) => handleChange({ target: { name: "related_employee", value } })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="اختر الموظف المرتبط (اختياري)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون موظف مرتبط</SelectItem>
                  {users
                    .filter((user) => user.id)
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.related_employee && (
                <p className="text-red-600 text-sm col-span-4 text-right">{errors.related_employee}</p>
              )}
            </div>
          </ErrorBoundary>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="attachment" className="text-right col-span-1">المرفق</Label>
            <Input
              id="attachment"
              name="attachment"
              type="file"
              onChange={(e) => handleChange({ target: { name: "attachment", value: e.target.files[0] } })}
              className="col-span-3"
            />
            {errors.attachment && (
              <p className="text-red-600 text-sm col-span-4 text-right">{errors.attachment}</p>
            )}
          </div>
        </div>
        {errors.general && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <FiAlertTriangle className="w-5 h-5" />
            <p>{errors.general}</p>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setShowModal(false)}
            className="text-gray-600"
          >
            إلغاء
          </Button>
          <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700 text-white">
            حفظ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditExpenseModal;