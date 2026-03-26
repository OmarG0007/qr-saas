import React from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { ClipboardList } from "lucide-react";

export default function DashboardOrdersPage() {
  return (
    <DashboardLayout>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders</h1>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-yellow-600 text-white font-bold rounded-lg shadow-sm hover:bg-yellow-700 transition-colors">
            Manage Live Orders
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col items-center justify-center p-8 bg-gray-50/50">
        <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <ClipboardList className="h-10 w-10 text-gray-400" />
        </div>
        <p className="text-gray-900 font-bold mb-1">No orders yet</p>
        <p className="text-gray-500 text-sm text-center max-w-[250px]">
          Orders placed by your customers will show up here in real-time.
        </p>
      </div>
    </DashboardLayout>
  );
}
