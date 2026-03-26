import React, { useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { useQuery, useAction } from "wasp/client/operations";
import {
  getRestaurantOrders,
  updateOrderStatus,
  updateOrderPaymentStatus,
} from "wasp/client/operations";
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Utensils,
  ShoppingBag,
  Check,
  X,
  Phone,
  DollarSign,
  Loader2,
} from "lucide-react";

const STATUS_CONFIG: any = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800", next: "ACCEPTED", icon: Clock },
  ACCEPTED: { label: "Accepted", color: "bg-blue-100 text-blue-800", next: "PREPARING", icon: CheckCircle2 },
  PREPARING: { label: "Preparing", color: "bg-orange-100 text-orange-800", next: "READY", icon: Utensils },
  READY: { label: "Ready", color: "bg-purple-100 text-purple-800", next: "DELIVERED", icon: ShoppingBag },
  DELIVERED: { label: "Delivered", color: "bg-green-100 text-green-800", next: null, icon: Check },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800", next: null, icon: X },
};

export default function DashboardOrdersPage() {
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const { data: orders, isLoading, error } = useQuery(getRestaurantOrders, { status: filter }, { refetchInterval: 5000 });

  const updateStatusAction = useAction(updateOrderStatus);
  const updatePaymentAction = useAction(updateOrderPaymentStatus);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await updateStatusAction({ orderId, status });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMarkPaid = async (orderId: string) => {
    try {
      await updatePaymentAction({ orderId, paymentStatus: "PAID" });
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading) return (
    <DashboardLayout>
      <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-yellow-600" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-6">Live Orders</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter(undefined)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!filter ? "bg-yellow-600 text-white shadow-lg shadow-yellow-100" : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"}`}
          >
            All Orders
          </button>
          {Object.keys(STATUS_CONFIG).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === s ? "bg-yellow-600 text-white shadow-lg shadow-yellow-100" : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"}`}
            >
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <tr>
                <th className="px-6 py-4 text-left">Order Info</th>
                <th className="px-6 py-4 text-left">Customer</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Total</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-400 italic">No orders found.</td>
                </tr>
              ) : (
                orders?.map((order: any) => (
                  <React.Fragment key={order.id}>
                    <tr className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${expandedId === order.id ? "bg-yellow-50/30" : ""}`} onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">#{order.id.slice(-6).toUpperCase()}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">{new Date(order.createdAt).toLocaleTimeString()} • {order.orderType}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">{order.customerName}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" /> {order.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_CONFIG[order.status].color}`}>
                          {order.status}
                        </span>
                        <div className="mt-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${order.paymentStatus === "PAID" ? "text-green-600" : "text-yellow-600"}`}>
                            {order.paymentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-gray-900">Rs. {order.total}</td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                           {STATUS_CONFIG[order.status].next && (
                             <button
                              onClick={() => handleUpdateStatus(order.id, STATUS_CONFIG[order.status].next)}
                              className="p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all shadow-sm"
                              title={`Move to ${STATUS_CONFIG[order.status].next}`}
                             >
                               <CheckCircle2 className="h-4 w-4" />
                             </button>
                           )}
                           {order.paymentStatus === "UNPAID" && (
                             <button
                              onClick={() => handleMarkPaid(order.id)}
                              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm"
                              title="Mark as Paid"
                             >
                               <DollarSign className="h-4 w-4" />
                             </button>
                           )}
                           <button
                            onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                            className="p-2 bg-white text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-all"
                            title="Cancel Order"
                           >
                             <X className="h-4 w-4" />
                           </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === order.id && (
                      <tr className="bg-white">
                        <td colSpan={5} className="px-6 py-4 border-t border-yellow-100 shadow-inner">
                           <div className="space-y-4">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Items</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {order.orderItems.map((item: any) => (
                                   <div key={item.id} className="flex gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                      <div className="flex-1">
                                         <p className="font-bold text-sm text-gray-900">{item.quantity}x {item.menuItem.name}</p>
                                         <p className="text-[10px] text-gray-500 font-medium">Rs. {item.price} each</p>
                                         {item.instructions && <p className="text-[10px] text-yellow-700 mt-1 italic font-medium bg-yellow-100/50 p-1.5 rounded-lg border border-yellow-100">Note: {item.instructions}</p>}
                                      </div>
                                      {item.addOns.length > 0 && (
                                        <div className="text-right">
                                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Add-ons</p>
                                           {item.addOns.map((ao: any) => (
                                             <p key={ao.id} className="text-[10px] font-bold text-gray-600">{ao.addOn.name} (+{ao.addOn.price})</p>
                                           ))}
                                        </div>
                                      )}
                                   </div>
                                 ))}
                              </div>
                              {order.address && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-2xl">
                                   <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Delivery Address</p>
                                   <p className="text-sm font-bold text-blue-900">{order.address}</p>
                                </div>
                              )}
                              {order.tableNumber && (
                                <div className="mt-4 p-3 bg-purple-50 border border-purple-100 rounded-2xl inline-block">
                                   <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-1">Table Number</p>
                                   <p className="text-sm font-bold text-purple-900">{order.tableNumber}</p>
                                </div>
                              )}
                           </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
