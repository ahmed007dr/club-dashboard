import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchIncomeSources } from "../../redux/slices/financeSlice";
import IncomeSourceForm from "./IncomeSourceForm";
import usePermission from "@/hooks/usePermission";
import { Button } from "@/components/ui/button";

const IncomeSourcesList = () => {
  const dispatch = useDispatch();
  const { incomeSources, loading, error, expenseCategoriesPagination } =
    useSelector((state) => state.finance);

  const canViewIncomeSources = usePermission("view_incomesource");
  const canAddIncomeSources = usePermission("add_incomesource");

  useEffect(() => {
    dispatch(fetchIncomeSources());
  }, [dispatch]);

  if (!canViewIncomeSources) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 rounded-lg" dir="rtl">
        <p className="text-red-500">ليس لديك صلاحية عرض مصادر الدخل</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 rounded-lg" dir="rtl">
      {canAddIncomeSources && (
        <div className="flex justify-end mb-6">
          <IncomeSourceForm />
        </div>
      )}

      {loading && <p className="text-center">جاري التحميل...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {incomeSources.length === 0 ? (
        <p className="text-center text-gray-500">لا توجد مصادر دخل مسجلة.</p>
      ) : (
       <div>
  {/* Table view (lg screens and above) */}
  <div className="hidden lg:block overflow-x-auto">
    <table className="w-full table-auto border border-gray-300">
      <thead>
        <tr className="text-right bg-gray-100">
          <th className="px-4 py-2 border">ID</th>
          <th className="px-4 py-2 border">الاسم</th>
          <th className="px-4 py-2 border">الوصف</th>
          <th className="px-4 py-2 border">النادي</th>
        </tr>
      </thead>
      <tbody>
        {incomeSources.map((source) => (
          <tr key={source.id} className="text-right hover:bg-gray-50">
            <td className="px-4 py-2 border">{source.id}</td>
            <td className="px-4 py-2 border">{source.name}</td>
            <td className="px-4 py-2 border">
              {source.description || "لا يوجد وصف"}
            </td>
            <td className="px-4 py-2 border">
              {source.club_details?.name || "غير معروف"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Card view (md and sm screens) */}
  <div className="lg:hidden space-y-3">
    {incomeSources.map((source) => (
      <div key={source.id} className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-left text-gray-500">ID</div>
          <div className="text-right">{source.id}</div>

          <div className="text-left text-gray-500">الاسم</div>
          <div className="text-right font-medium">{source.name}</div>

          <div className="text-left text-gray-500">الوصف</div>
          <div className="text-right">{source.description || "لا يوجد وصف"}</div>

          <div className="text-left text-gray-500">النادي</div>
          <div className="text-right">{source.club_details?.name || "غير معروف"}</div>
        </div>
      </div>
    ))}
  </div>
</div>
      )}

      {expenseCategoriesPagination.count > 20 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from(
            { length: Math.ceil(expenseCategoriesPagination.count / 20) },
            (_, i) => (
              <Button
                key={i + 1}
                variant="outline"
                onClick={() => dispatch(fetchIncomeSources({ page: i + 1 }))}
              >
                {i + 1}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default IncomeSourcesList;
