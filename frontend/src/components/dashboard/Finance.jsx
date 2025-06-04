import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { Suspense, lazy } from "react";
import { motion } from "framer-motion"; // للأنيميشن
import { Tooltip } from "react-tooltip"; // لإضافة Tooltips
import { FaMoneyBillWave, FaCoins, FaChartLine } from "react-icons/fa"; // أيقونات
import { Loader2 } from "lucide-react"; // لمؤشر التحميل

// تحميل المكونات بشكل كسول (Lazy Loading)
const ExpenseCategory = lazy(() => import("./ExpenseCategory"));
const Expense = lazy(() => import("./Expense"));
const IncomeSources = lazy(() => import("./IncomeSources"));

const Finance = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-6 bg-gray-100 min-h-screen space-y-8"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaChartLine className="text-blue-600 w-8 h-8" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-800">
            إدارة الشؤون المالية
          </h1>
        </div>
        {/* زر إجراء عام (يمكن تخصيصه حسب التبويب) */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          data-tooltip-id="action-tooltip"
          data-tooltip-content="إضافة عنصر جديد"
        >
          إضافة جديد
        </motion.button>
        <Tooltip id="action-tooltip" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expenseCategories" className="bg-white rounded-lg shadow-sm">
        <TabsList className="flex flex-wrap justify-start gap-2 p-4 bg-gray-50 rounded-t-lg">
          <TabsTrigger
            value="expenseCategories"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:bg-gray-200"
            data-tooltip-id="expenseCategories-tooltip"
            data-tooltip-content="إدارة فئات المصروفات"
          >
            <FaMoneyBillWave className="w-4 h-4" />
            فئات المصروفات
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:bg-gray-200"
            data-tooltip-id="expenses-tooltip"
            data-tooltip-content="إدارة المصروفات"
          >
            <FaCoins className="w-4 h-4" />
            المصروفات
          </TabsTrigger>
          <TabsTrigger
            value="incomeSources"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:bg-gray-200"
            data-tooltip-id="incomeSources-tooltip"
            data-tooltip-content="إدارة مصادر الإيرادات"
          >
            <FaChartLine className="w-4 h-4" />
            الإيرادات
          </TabsTrigger>
          <Tooltip id="expenseCategories-tooltip" />
          <Tooltip id="expenses-tooltip" />
          <Tooltip id="incomeSources-tooltip" />
        </TabsList>

        {/* Tab Content with Lazy Loading and Animation */}
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="mr-2 text-gray-600">جاري التحميل...</span>
            </div>
          }
        >
          <TabsContent value="expenseCategories" className="p-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ExpenseCategory />
            </motion.div>
          </TabsContent>
          <TabsContent value="expenses" className="p-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Expense />
            </motion.div>
          </TabsContent>
          <TabsContent value="incomeSources" className="p-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <IncomeSources />
            </motion.div>
          </TabsContent>
        </Suspense>
      </Tabs>
    </motion.div>
  );
};

export default Finance;