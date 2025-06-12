import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { fetchSubscriptions } from "@/redux/slices/subscriptionsSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaCalendarAlt, FaRedo } from "react-icons/fa";
import { Loader2 } from "lucide-react";
const SubscriptionFilters = ({
  filters,
  setFilters,
  setCurrentPage,
  setError,
  isLoading,
  setIsLoading,
  itemsPerPage,
}) => {
  const dispatch = useDispatch();

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    console.log("Filter change:", name, value); // تسجيل التغيير
    setFilters((prev) => ({ ...prev, [name]: value }));
    setError(null);
  }, [setFilters, setError]);

  const handleSearch = useCallback(() => {
    setIsLoading(true);
    setCurrentPage(1);
    setError(null);
    
    const queryParams = new URLSearchParams();
    
    // إضافة جميع المعاملات غير الفارغة
    if (filters.memberName.trim()) queryParams.append('searchTerm', filters.memberName.trim());
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.entryCount) queryParams.append('entryCount', filters.entryCount);
    if (filters.status) queryParams.append('status', filters.status);
    
    queryParams.append('page', '1');
    queryParams.append('pageSize', itemsPerPage.toString());
    
    console.log('Final query params:', queryParams.toString()); // تأكد من ظهور المعاملات بشكل صحيح
    
    dispatch(fetchSubscriptions(Object.fromEntries(queryParams)))
      .unwrap()
      .catch((err) => {
        setError(`فشل في البحث: ${err.message || "حدث خطأ"}`);
      })
      .finally(() => setIsLoading(false));
  }, [dispatch, filters, itemsPerPage]);

  
  const resetFilters = useCallback(() => {
    setFilters({
      memberName: "",
      startDate: "",
      endDate: "",
      entryCount: "",
      status: "",
    });
    setCurrentPage(1);
    setError(null);
  }, [setFilters, setCurrentPage, setError]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">اسم العضو / RFID / رقم الهاتف</label>
          <div className="relative flex items-center gap-2">
            <Input
              type="text"
              name="memberName"
              value={filters.memberName}
              onChange={handleFilterChange}
              placeholder="ابحث باسم العضو، RFID، أو رقم الهاتف..."
              className="w-full text-right pr-10"
            />
            <svg
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "ابحث الآن"}
            </Button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ البدء</label>
          <div className="relative">
            <Input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full text-right"
            />
            <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الانتهاء</label>
          <div className="relative">
            <Input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full text-right"
            />
            <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">عدد الإدخالات</label>
          <Input
            type="number"
            name="entryCount"
            value={filters.entryCount}
            onChange={handleFilterChange}
            placeholder="تصفية حسب عدد الإدخالات"
            min="0"
            className="w-full text-right"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="w-full border border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg px-3 py-2.5 text-sm text-right"
          >
            <option value="">كل الحالات</option>
            <option value="Active">نشط</option>
            <option value="Expired">منتهي</option>
            <option value="Upcoming">قادمة</option>
            <option value="Frozen">مجمد</option>
          </select>
        </div>
        <div className="flex items-end gap-2 col-span-1 sm:col-span-2 lg:col-span-4">
          <Button
            onClick={resetFilters}
            className="bg-gray-300 text-gray-700 hover:bg-gray-400 flex items-center gap-2"
          >
            <FaRedo />
            إعادة تعيين
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionFilters;