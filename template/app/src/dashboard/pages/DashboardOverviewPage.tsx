import React from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { useQuery } from "wasp/client/operations";
import { getDashboardStats, getRestaurantOrders, getMyRestaurant } from "wasp/client/operations";
import {
  Users,
  Banknote,
  Clock,
  LayoutGrid,
  ArrowUpRight,
  QrCode,
  Loader2,
  Copy,
  Download,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const { data: stats, isLoading: isStatsLoading } = useQuery(getDashboardStats);
  const { data: orders, isLoading: isOrdersLoading } = useQuery(getRestaurantOrders, { status: undefined });
  const { data: restaurant } = useQuery(getMyRestaurant);

  const menuUrl = restaurant ? `${window.location.origin}/m/${restaurant.slug}` : "";
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}`;

  const statsConfig = [
    { name: "Total Orders Today", value: stats?.ordersToday || 0, icon: LayoutGrid, color: "text-blue-600", bg: "bg-blue-50" },
    { name: "Revenue Today", value: `Rs. ${stats?.revenueToday || 0}`, icon: Banknote, color: "text-green-600", bg: "bg-green-50" },
    { name: "Pending Orders", value: stats?.pendingCount || 0, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
    { name: "Total Menu Items", value: stats?.menuItemsCount || 0, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  if (isStatsLoading || isOrdersLoading) return (
    <DashboardLayout>
      <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-yellow-600" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statsConfig.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden rounded-3xl border border-gray-100 shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${stat.bg} rounded-2xl`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} aria-hidden="true" />
              </div>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.name}</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-gray-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Recent Orders</h3>
            <a href="/dashboard/orders" className="text-xs font-black uppercase tracking-widest text-yellow-600 hover:text-yellow-700 flex items-center">
              View all <ArrowUpRight className="ml-1 h-3 w-3" />
            </a>
          </div>
          <div className="flex-1 overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                   <tr>
                      <th className="px-6 py-3 text-left">Order</th>
                      <th className="px-6 py-3 text-left">Customer</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-right">Total</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {orders?.slice(0, 10).map((order: any) => (
                     <tr key={order.id} className="text-sm">
                        <td className="px-6 py-4 font-bold text-gray-900">#{order.id.slice(-6).toUpperCase()}</td>
                        <td className="px-6 py-4 text-gray-600 font-medium">{order.customerName}</td>
                        <td className="px-6 py-4">
                           <span className="text-[10px] font-black uppercase tracking-widest text-yellow-600">{order.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">Rs. {order.total}</td>
                     </tr>
                   ))}
                   {orders?.length === 0 && (
                     <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">No orders yet.</td></tr>
                   )}
                </tbody>
             </table>
          </div>
        </div>

        {/* QR Code Widget */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Your QR Code</h3>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-dashed border-gray-100 mb-6 group transition-all hover:border-yellow-200">
              <img src={qrApiUrl} className="h-48 w-48 rounded-2xl shadow-xl" alt="Menu QR Code" />
            </div>

            <div className="space-y-3 w-full">
              <button
                onClick={() => window.open(qrApiUrl, '_blank')}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-yellow-100 transition-all active:scale-95 flex items-center justify-center"
              >
                <Download className="mr-2 h-5 w-5" />
                Download PNG
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(menuUrl); alert("Menu link copied!"); }}
                className="w-full bg-white border border-gray-200 text-gray-600 font-bold py-3.5 rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Menu Link
              </button>
            </div>
            <p className="mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-relaxed">
              Place this QR on your tables for customers to scan and order.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
