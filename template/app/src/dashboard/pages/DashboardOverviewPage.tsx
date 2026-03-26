import React from "react";
import DashboardLayout from "../layout/DashboardLayout";
import {
  Users,
  Banknote,
  Clock,
  LayoutGrid,
  TrendingUp,
  ArrowUpRight,
  QrCode,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const stats = [
    { name: "Total Orders Today", value: "0", icon: LayoutGrid, trend: "0%" },
    { name: "Revenue Today", value: "Rs. 0", icon: Banknote, trend: "0%" },
    { name: "Pending Orders", value: "0", icon: Clock, trend: "0%" },
    { name: "Total Menu Items", value: "0", icon: Users, trend: "0%" },
  ];

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <stat.icon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
              </div>
              <div className="flex items-center text-sm font-medium text-green-600">
                <TrendingUp className="self-center flex-shrink-0 h-4 w-4 mr-1" />
                <span>{stat.trend}</span>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 truncate">{stat.name}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table Shell */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Recent Orders</h3>
            <button className="text-sm font-semibold text-yellow-600 hover:text-yellow-700 flex items-center">
              View all <ArrowUpRight className="ml-1 h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/50">
            <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <LayoutGrid className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-gray-900 font-bold mb-1">No orders yet</p>
            <p className="text-gray-500 text-sm text-center max-w-[250px]">
              When customers start ordering, they'll appear here.
            </p>
          </div>
        </div>

        {/* QR Code Widget Placeholder */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">QR Code</h3>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/50">
            <div className="h-40 w-40 bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center mb-6 text-gray-400 p-4">
              <QrCode className="h-12 w-12 mb-2 opacity-20" />
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-30 text-center">
                Scan for Menu
              </span>
            </div>
            <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded-lg shadow-sm transition-all flex items-center justify-center">
              <QrCode className="mr-2 h-5 w-5" />
              Generate QR Code
            </button>
            <p className="mt-4 text-xs text-gray-500 text-center">
              Generate a unique QR code for your customers to access the menu.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
