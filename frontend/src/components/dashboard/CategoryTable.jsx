import React from 'react';

const CategoryTable = ({ categories }) => (
  <div className="hidden lg:block rounded-lg border border-gray-200 overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr className="bg-teal-50 text-gray-700">
          <th className="px-3 py-2 text-right text-sm font-semibold">النادي</th>
          <th className="px-3 py-2 text-right text-sm font-semibold">الاسم</th>
          <th className="px-3 py-2 text-right text-sm font-semibold">الوصف</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {categories.length > 0 ? (
          categories.map((category, index) => (
            <tr key={index} className="hover:bg-gray-50 transition-all duration-200">
              <td className="px-3 py-2 text-sm text-gray-800">
                {category.club_details?.name || "غير متاح"}
              </td>
              <td className="px-3 py-2 text-sm text-gray-800">
                {category.name || "غير متاح"}
              </td>
              <td className="px-3 py-2 text-sm text-gray-800">
                {category.description || "غير متاح"}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={3} className="px-3 py-3 text-center text-sm text-gray-500">
              لا توجد فئات مصروفات متاحة
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default CategoryTable;