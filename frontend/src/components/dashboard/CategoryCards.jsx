import React from 'react';

const CategoryCards = ({ categories }) => (
  <div className="lg:hidden space-y-3">
    {categories.length > 0 ? (
      categories.map((category, index) => (
        <div
          key={index}
          className="border border-gray-200 rounded-lg p-4 shadow-sm hover:bg-gray-50 transition-all duration-200"
        >
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">النادي:</span>
              <span>{category.club_details?.name || "غير متاح"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">الاسم:</span>
              <span className="font-medium">{category.name || "غير متاح"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">الوصف:</span>
              <span className="text-right flex-1">{category.description || "غير متاح"}</span>
            </div>
          </div>
        </div>
      ))
    ) : (
      <div className="border rounded-lg p-4 text-center text-sm text-gray-500 bg-white">
        لا توجد فئات مصروفات متاحة
      </div>
    )}
  </div>
);

export default CategoryCards;