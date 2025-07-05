import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FiList, FiCalendar } from "react-icons/fi";

const ExpenseFilters = ({
  filters,
  expenseCategories,
  users,
  handleFilterChange,
  handleSelectChange,
  handleReset,
  handleCalculateTotal,
}) => {
  return (
    <div className="space-y-4 w-full">
      {/* السطر الأول: الفئة، المستخدم، المبلغ، الوصف */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-right">الفئة</label>
          <div className="relative">
            <FiList className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Select
              name="category"
              onValueChange={(value) => handleSelectChange("category", value)}
              value={filters.category}
            >
              <SelectTrigger className="w-full text-right">
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {expenseCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-right">المستخدم</label>
          <div className="relative">
            <FiList className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Select
              name="user"
              onValueChange={(value) => handleSelectChange("user", value)}
              value={filters.user}
            >
              <SelectTrigger className="w-full text-right">
                <SelectValue placeholder="المستخدم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المستخدمين</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-right">المبلغ</label>
          <Input
            name="amount"
            type="number"
            placeholder="المبلغ"
            value={filters.amount}
            onChange={handleFilterChange}
            className="w-full text-right"
          />
        </div>
        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-right">الوصف</label>
          <Input
            name="description"
            type="text"
            placeholder="الوصف"
            value={filters.description}
            onChange={handleFilterChange}
            className="w-full text-right"
          />
        </div>
      </div>

      {/* السطر الثاني: فلتر التاريخ من وإلى */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-right">من</label>
          <div className="relative">
            <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="w-full text-right"
            />
          </div>
        </div>
        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-right">إلى</label>
          <div className="relative">
            <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="w-full text-right"
            />
          </div>
        </div>
      </div>

      {/* السطر الثالث: الأزرار */}
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
        <div className="flex gap-2">
          <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto text-sm">
            إعادة تعيين
          </Button>
          <Button
            onClick={handleCalculateTotal}
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white text-sm"
          >
            حساب الإجمالي
          </Button>
        </div>
      </div>
    </div>
  );
};
export default ExpenseFilters;