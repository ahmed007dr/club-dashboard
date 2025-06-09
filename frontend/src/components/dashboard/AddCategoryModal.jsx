import React from 'react';
import { FiPlus, FiUser, FiList, FiFileText } from 'react-icons/fi';
import { Button } from '../ui/button';

const AddCategoryModal = ({
  showModal,
  setShowModal,
  formData,
  userClub,
  handleChange,
  handleAdd,
  errors = {},
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
          <h3 className="text-xl font-semibold text-right">إضافة فئة مصروف</h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-right">النادي</label>
            <div className="relative">
              <FiUser className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                name="club"
                value={formData.club}
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
            <label className="block text-sm font-medium mb-1 text-right">الاسم</label>
            <div className="relative">
              <FiList className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg py-2.5 pr-10 pl-4 bg-white text-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all duration-200 text-right"
                placeholder="أدخل اسم الفئة"
              />
              {errors.name && (
                <p className="text-red-500 text-xs text-right mt-1">{errors.name}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">الوصف</label>
            <div className="relative">
              <FiFileText className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg py-2.5 px-4 bg-white text-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all duration-200 text-right"
                rows={3}
                placeholder="أدخل وصف الفئة (اختياري)"
              />
              {errors.description && (
                <p className="text-red-500 text-xs text-right mt-1">{errors.description}</p>
              )}
            </div>
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
            onClick={handleAdd}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm"
          >
            حفظ
          </Button>
        </div>
      </div>
    </div>
  )
);

export default AddCategoryModal;