import React, { useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { useQuery } from "wasp/client/operations";
import { getReportData } from "wasp/client/operations";
import {
  BarChart3,
  Calendar,
  Download,
  Loader2,
  TrendingUp,
  ShoppingBag,
  PieChart,
} from "lucide-react";

export default function DashboardReportsPage() {
  const [dateRange, setDateRange] = useState("today");

  const getDates = () => {
    const end = new Date();
    const start = new Date();
    if (dateRange === "today") start.setHours(0, 0, 0, 0);
    else if (dateRange === "7d") start.setDate(start.getDate() - 7);
    else if (dateRange === "30d") start.setDate(start.getDate() - 30);
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const { data: report, isLoading } = useQuery(getReportData, {
    startDate: getDates().start,
    endDate: getDates().end,
  });

  const stats = [
    { name: "Total Revenue", value: `Rs. ${report?.orders.reduce((acc: number, o: any) => acc + (o.status !== "CANCELLED" ? o.total : 0), 0) || 0}`, icon: TrendingUp },
    { name: "Total Orders", value: report?.orders.length || 0, icon: ShoppingBag },
    { name: "Average Order", value: `Rs. ${report?.orders.length ? Math.round(report.orders.reduce((acc: number, o: any) => acc + o.total, 0) / report.orders.length) : 0}`, icon: BarChart3 },
  ];

  const exportToCSV = () => {
    if (!report?.orders.length) return;
    const headers = ["Order ID", "Date", "Customer", "Type", "Status", "Payment", "Total"];
    const rows = report.orders.map((o: any) => [
      o.id,
      new Date(o.createdAt).toLocaleDateString(),
      o.customerName,
      o.orderType,
      o.status,
      o.paymentStatus,
      o.total,
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `report_${dateRange}_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) return (
    <DashboardLayout>
      <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-yellow-600" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black text-gray-900 tracking-tight">Analytics & Reports</h1>
           <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">Performance overview</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-white border border-gray-100 rounded-xl p-1 flex gap-1 shadow-sm">
              {[
                { id: "today", label: "Today" },
                { id: "7d", label: "Last 7 Days" },
                { id: "30d", label: "Last 30 Days" }
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setDateRange(r.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${dateRange === r.id ? "bg-yellow-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"}`}
                >
                  {r.label}
                </button>
              ))}
           </div>
           <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all shadow-sm"
           >
              <Download className="h-4 w-4" /> Export CSV
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         {stats.map(s => (
           <div key={s.name} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                 <div className="p-3 bg-yellow-50 rounded-2xl">
                    <s.icon className="h-6 w-6 text-yellow-600" />
                 </div>
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.name}</p>
              <p className="mt-1 text-2xl font-black text-gray-900">{s.value}</p>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Top Selling Items */}
         <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
               <TrendingUp className="h-5 w-5 text-yellow-600" /> Top Selling Items
            </h3>
            <div className="space-y-4">
               {report?.topItems.map((item: any, idx: number) => (
                 <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-4">
                       <span className="h-8 w-8 rounded-full bg-white flex items-center justify-center font-black text-xs text-yellow-600 border border-yellow-100">{idx + 1}</span>
                       <span className="font-bold text-gray-900">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-gray-400">{item.quantity} sold</span>
                 </div>
               ))}
               {report?.topItems.length === 0 && <p className="text-center py-8 text-gray-400 italic">No sales data yet.</p>}
            </div>
         </div>

         {/* Status Breakdown */}
         <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
               <PieChart className="h-5 w-5 text-yellow-600" /> Order Breakdown
            </h3>
            <div className="space-y-3">
               {["PENDING", "ACCEPTED", "PREPARING", "READY", "DELIVERED", "CANCELLED"].map(status => {
                 const count = report?.orders.filter((o: any) => o.status === status).length || 0;
                 const percentage = report?.orders.length ? (count / report.orders.length) * 100 : 0;
                 return (
                    <div key={status} className="space-y-1.5">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-gray-500">{status}</span>
                          <span className="text-gray-900">{count} orders</span>
                       </div>
                       <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-600 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
                       </div>
                    </div>
                 );
               })}
            </div>
         </div>
      </div>
    </DashboardLayout>
  );
}
