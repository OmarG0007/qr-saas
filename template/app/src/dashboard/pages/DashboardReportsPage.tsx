import React from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { BarChart3 } from "lucide-react";

export default function DashboardReportsPage() {
  return (
    <DashboardLayout>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col items-center justify-center p-8 bg-gray-50/50">
        <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <BarChart3 className="h-10 w-10 text-gray-400" />
        </div>
        <p className="text-gray-900 font-bold mb-1">Reports are empty</p>
        <p className="text-gray-500 text-sm text-center max-w-[250px]">
          We'll start building your reports as soon as you get your first order.
        </p>
      </div>
    </DashboardLayout>
  );
}
