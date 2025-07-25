import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FiList, FiCalendar, FiSearch } from "react-icons/fi";

const IncomeFilters = ({
  filters,
  incomeSources,
  handleFilterChange,
  handleSelectChange,
  handleReset,
  handleCalculateTotal,
}) => {
  // قيمة افتراضية للتاريخ (اليوم الحالي)
  const defaultDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4 w-full">
      {/* السطر الأول: مصدر الدخل، المبلغ، الوصف */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-right">مصدر الدخل</label>
          <div className="relative">
            <FiList className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Select
              name="source"
              onValueChange={(value) => handleSelectChange("source", value)}
              value={filters.source || ""}
            >
              <SelectTrigger className="w-full text-right">
                <SelectValue placeholder="مصدر الدخل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المصادر</SelectItem>
                {incomeSources.map((source) => (
                  <SelectItem key={source.id} value={source.id.toString()}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-right">المبلغ</label>
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              name="amount"
              type="number"
              placeholder="المبلغ"
              value={filters.amount || ""}
              onChange={handleFilterChange}
              className="w-full text-right"
            />
          </div>
        </div>
        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-right">الوصف</label>
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              name="description"
              type="text"
              placeholder="الوصف"
              value={filters.description || ""}
              onChange={handleFilterChange}
              className="w-full text-right"
            />
          </div>
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
              value={filters.start_date || defaultDate}
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
              value={filters.end_date || defaultDate}
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
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white text-sm"
          >
            حساب الإجمالي
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IncomeFilters;