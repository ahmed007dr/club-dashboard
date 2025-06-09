import React from 'react';
import { FiPlus, FiUser, FiList, FiDollarSign, FiCalendar, FiFileText } from 'react-icons/fi';
import { Button } from '../ui/button';

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
}) => (
  showModal && (
    <div
      className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={() => setShowModal(false)}
    >
      <div
        className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md overflow-y-auto max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center gap-3 mb-4">
          <FiPlus className="text-teal-600 w-6 h-6" />
          <h3 className="text-xl font-semibold text-right">
            {currentExpense ? "تعديل المصروف" : "إضافة مصروف"}
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-right">النادي</label>
            <div className="relative">
              <FiUser className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                name="club"
                value={currentExpense ? currentExpense.club : newExpense.club}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all duration-200 text-right"
                disabled
              >
                {userClub ? (
                  <option value={userClub.id}>{userClub.name}</option>
                ) : (
                  <option value="">جاري التحميل...</option>
                )}
              </select>
              {errors.club && (
                <p className="text-red-500 text-xs text-right mt-1">{errors.club}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">الفئة</label>
            <div className="relative">
              <FiList className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                name="category"
                value={currentExpense ? currentExpense.category : newExpense.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all duration-200 text-right"
                disabled={currentExpense ? !canEditExpense : !canAddExpense}
              >
                <option value="">اختر الفئة</option>
                {expenseCategories?.map((category) => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-xs text-right mt-1">{errors.category}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">المبلغ</label>
            <div className="relative">
              <FiDollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                name="amount"
                value={currentExpense ? currentExpense.amount || "" : newExpense.amount || ""}
                onChange={handleChange}
                step="0.01"
                className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all duration-200 text-right"
                disabled={currentExpense ? !canEditExpense : !canAddExpense}
              />
              {errors.amount && (
                <p className="text-red-500 text-xs text-right mt-1">{errors.amount}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">الوصف</label>
            <textarea
              name="description"
              value={currentExpense ? currentExpense.description || "" : newExpense.description || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg py-2.5 px-4 bg-white text-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all duration-200 text-right"
              rows={3}
              disabled={currentExpense ? !canEditExpense : !canAddExpense}
            />
            {errors.description && (
              <p className="text-red-500 text-xs text-right mt-1">{errors.description}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">التاريخ</label>
            <div className="relative">
              <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                name="date"
                value={currentExpense ? currentExpense.date || "" : newExpense.date || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all duration-200 text-right"
                disabled={currentExpense ? !canEditExpense : !canAddExpense}
              />
              {errors.date && (
                <p className="text-red-500 text-xs text-right mt-1">{errors.date}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">رقم الفاتورة</label>
            <div className="relative">
              <FiFileText className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="invoice_number"
                value={currentExpense ? currentExpense.invoice_number || "" : newExpense.invoice_number || ""}
                onChange={handleChange}
                placeholder="أدخل رقم الفاتورة (اختياري)"
                className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all duration-200 text-right"
                disabled={currentExpense ? !canEditExpense : !canAddExpense}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">المرفق</label>
            <input
              type="file"
              name="attachment"
              onChange={(e) => {
                const file = e.target.files[0];
                if (currentExpense) {
                  setCurrentExpense((prev) => ({ ...prev, attachment: file }));
                } else {
                  setNewExpense((prev) => ({ ...prev, attachment: file }));
                }
              }}
              className="w-full border border-gray-300 rounded-lg py-2.5 px-4 bg-white text-gray-700 text-right text-sm"
              disabled={currentExpense ? !canEditExpense : !canAddExpense}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            onClick={() => setShowModal(false)}
            variant="outline"
            className="px-6 py-2 text-sm"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            className={`px-6 py-2 text-sm text-white ${
              currentExpense
                ? canEditExpense
                  ? "bg-teal-600 hover:bg-teal-700"
                  : "bg-gray-400 cursor-not-allowed"
                : canAddExpense
                ? "bg-teal-600 hover:bg-teal-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            disabled={currentExpense ? !canEditExpense : !canAddExpense}
          >
            {currentExpense ? "حفظ التعديلات" : "إضافة"}
          </Button>
        </div>
      </div>
    </div>
  )
);

export default AddEditExpenseModal;