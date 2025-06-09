import React from 'react';
import { FiPlus, FiUser, FiList, FiDollarSign, FiCalendar } from 'react-icons/fi';
import { Button } from '../ui/button';

const AddEditIncomeModal = ({
  showModal,
  setShowModal,
  currentItem,
  newItem,
  userClub,
  incomeSources,
  handleChange,
  handleSave,
}) => (
  showModal && (
    <div
      className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={() => setShowModal(false)}
    >
      <div
        className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md overflow-y-auto max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <FiPlus className="text-green-600 w-6 h-6" />
          <h3 className="text-xl font-semibold text-right">
            {currentItem ? "تعديل إيراد" : "إضافة إيراد"}
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-right">النادي</label>
            <div className="relative">
              <FiUser className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                name="club"
                value={currentItem ? currentItem.club : newItem.club}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
                disabled
              >
                {userClub ? (
                  <option value={userClub.id}>{userClub.name}</option>
                ) : (
                  <option value="">جاري التحميل...</option>
                )}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">مصدر الدخل</label>
            <div className="relative">
              <FiList className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                name="source"
                value={currentItem ? currentItem.source : newItem.source}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
                required
              >
                <option value="">اختر مصدر الدخل</option>
                {incomeSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">المبلغ</label>
            <div className="relative">
              <FiDollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                name="amount"
                value={currentItem ? currentItem.amount || "" : newItem.amount || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">الوصف</label>
            <textarea
              name="description"
              value={currentItem ? currentItem.description || "" : newItem.description || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg py-2.5 px-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">التاريخ</label>
            <div className="relative">
              <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                name="date"
                value={
                  currentItem
                    ? currentItem.date
                      ? new Date(currentItem.date).toISOString().split("T")[0]
                      : ""
                    : newItem.date || ""
                }
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">المستلم</label>
            <div className="relative">
              <FiUser className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="received_by"
                value={currentItem ? currentItem.received_by || "" : newItem.received_by || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
                placeholder="اسم المستلم"
              />
            </div>
          </div>
        </div>
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
  )
);

export default AddEditIncomeModal;