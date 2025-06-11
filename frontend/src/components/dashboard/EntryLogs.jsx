
import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDispatch, useSelector } from "react-redux";
import { fetchEntryLogs } from "@/redux/slices/EntryLogsSlice";
import { FiUsers, FiPlus, FiCalendar, FiSearch, FiTag, FiHome } from "react-icons/fi";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import usePermission from "@/hooks/usePermission";
import EntryForm from "./EntryForm";

const FilterComponent = ({ filters, setFilters, onReset }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
    {[
      { label: "كود RFID", name: "rfid", type: "text", icon: FiTag },
      { label: "اسم النادي", name: "club", type: "text", icon: FiHome },
      { label: "اسم العضو", name: "member", type: "text", icon: FiSearch },
      { label: "الوقت والتاريخ", name: "timestamp", type: "date", icon: FiCalendar },
    ].map(({ label, name, type, icon: Icon }) => (
      <div key={name} className="relative">
        <label className="block text-sm font-medium mb-1 text-right">{label}</label>
        <div className="relative">
          <Icon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type={type}
            name={name}
            value={filters[name]}
            onChange={(e) => setFilters((prev) => ({ ...prev, [name]: name === "rfid" ? e.target.value.toUpperCase() : e.target.value }))}
            className="w-full py-2.5 pr-10 pl-4 text-right"
            placeholder={type === "text" ? `ابحث ب${label}` : undefined}
          />
        </div>
      </div>
    ))}
    <div className="flex items-end">
      <Button onClick={onReset} variant="outline" className="w-full">إعادة تعيين</Button>
    </div>
  </div>
);

const EntryLogs = ({ onClose }) => {
  const dispatch = useDispatch();
  const { data: entryLogs, count: entryLogCount, loading, error } = useSelector((state) => state.entryLogs);
  const canAddEntryLog = usePermission("change_subscriptiontype");

  const [filters, setFilters] = useState({ club: "", rfid: "", member: "", timestamp: "" });
  const [page, setPage] = useState(1);
  const [isEntryLogDialogOpen, setIsEntryLogDialogOpen] = useState(false);
  const itemsPerPage = 20;

  const fetchEntryLogsData = useCallback(() => {
    dispatch(fetchEntryLogs({ page, pageSize: itemsPerPage, ...filters }));
  }, [dispatch, page, filters]);

  useEffect(() => {
    fetchEntryLogsData();
  }, [fetchEntryLogsData]);

  const PaginationControls = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }

    const buttons = [];
    if (start > 1) {
      buttons.push(1);
      if (start > 2) buttons.push("...");
    }
    for (let page = start; page <= end; page++) {
      buttons.push(page);
    }
    if (end < totalPages) {
      if (end < totalPages - 1) buttons.push("...");
      buttons.push(totalPages);
    }

    return (
      <div className="flex justify-center items-center mt-6 gap-4" dir="rtl">
        {totalItems === 0 ? (
          <div className="text-sm text-gray-600">لا توجد سجلات دخول</div>
        ) : (
          <>
            <Button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="outline"
              className="px-3 py-1"
            >
              السابق
            </Button>
            <div className="flex gap-1">
              {buttons.map((page, index) => (
                <Button
                  key={index}
                  onClick={() => typeof page === "number" && onPageChange(page)}
                  variant={currentPage === page ? "default" : "outline"}
                  disabled={typeof page !== "number"}
                  className={`px-3 py-1 ${typeof page !== "number" ? "cursor-default" : ""}`}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="outline"
              className="px-3 py-1"
            >
              التالي
            </Button>
            <span className="text-sm text-gray-600">صفحة {currentPage} من {totalPages || 1}</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <FiUsers className="text-blue-600 w-6 h-6" />
        سجلات الدخول
      </h2>
      <Card className="shadow-md border-gray-200">
        <CardHeader>
          <CardTitle className="text-right text-lg">إدارة سجلات الدخول</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FilterComponent
            filters={filters}
            setFilters={setFilters}
            onReset={() => setFilters({ club: "", rfid: "", member: "", timestamp: "" })}
          />

          {canAddEntryLog && (
            <Button
              onClick={() => setIsEntryLogDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FiPlus className="mr-2" />
              إضافة سجل دخول
            </Button>
          )}

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-lg">خطأ: {error}</div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="px-4 py-3 text-right text-sm font-semibold">RFID</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">النادي</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">العضو</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">الوقت والتاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entryLogs?.map((log) => (
                      <tr key={log.id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-3">{log.rfid_code}</td>
                        <td className="px-4 py-3">{log.club_details?.name || "غير متاح"}</td>
                        <td className="px-4 py-3">{log.member_name || "غير متاح"}</td>
                        <td className="px-4 py-3">
                          {new Date(log.timestamp).toLocaleString("ar-EG", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                currentPage={page}
                totalItems={entryLogCount}
                itemsPerPage={itemsPerPage}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {isEntryLogDialogOpen && canAddEntryLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full" dir="rtl">
            <Button
              onClick={() => setIsEntryLogDialogOpen(false)}
              variant="ghost"
              className="absolute top-4 left-4"
            >
              ✕
            </Button>
            <h3 className="text-xl font-bold mb-6">إضافة سجل دخول</h3>
            <EntryForm
              onSuccess={() => {
                setIsEntryLogDialogOpen(false);
                fetchEntryLogsData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EntryLogs;
