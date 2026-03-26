import React from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { Settings } from "lucide-react";

export default function DashboardSettingsPage() {
  return (
    <DashboardLayout>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col items-center justify-center p-8 bg-gray-50/50">
        <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Settings className="h-10 w-10 text-gray-400" />
        </div>
        <p className="text-gray-900 font-bold mb-1">Settings</p>
        <p className="text-gray-500 text-sm text-center max-w-[250px]">
          Manage your restaurant details and preferences.
        </p>
      </div>
    </DashboardLayout>
  );
}
