import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";
import ExpenseCategory from "./ExpenseCategory";
import Expense from "./Expense";
import IncomeSources from "./IncomeSources";

const Finance = () => {
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <h1 className="text-2xl font-bold tracking-tight">
        إدارة الشؤون المالية
      </h1>

      {/* Tabs */}
      <Tabs defaultValue="expenseCategories">
        <TabsList dir="rtl" className="grid w-full grid-cols-3">
          <TabsTrigger value="expenseCategories"> فئات المصروفات</TabsTrigger>
          <TabsTrigger value="expenses"> المصروفات</TabsTrigger>
          <TabsTrigger value="incomeSources"> الايرادات</TabsTrigger>
        </TabsList>

        {/* Expense Categories Tab */}
        <TabsContent value="expenseCategories" className="space-y-4">
          {/* Expense Category Component */}
          <ExpenseCategory />
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <Expense />
        </TabsContent>

        {/* Income Sources Tab */}
        <TabsContent value="incomeSources" className="space-y-4">
          <IncomeSources />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Finance;
