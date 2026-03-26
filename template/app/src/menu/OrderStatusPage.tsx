import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "wasp/client/operations";
import { getOrderDetails } from "wasp/client/operations";
import {
  Loader2,
  ChevronLeft,
  Phone,
  CheckCircle2,
  Clock,
  Utensils,
  ShoppingBag,
  Check,
  X,
  AlertCircle,
} from "lucide-react";

const STATUS_STEPS = [
  { status: "PENDING", label: "Pending", icon: Clock },
  { status: "ACCEPTED", label: "Accepted", icon: CheckCircle2 },
  { status: "PREPARING", label: "Preparing", icon: Utensils },
  { status: "READY", label: "Ready", icon: ShoppingBag },
  { status: "DELIVERED", label: "Delivered", icon: Check },
];

export default function OrderStatusPage() {
  const { slug, orderId } = useParams<{ slug: string; orderId: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading, error } = useQuery(
    getOrderDetails,
    { orderId: orderId || "", slug: slug || "" },
    { enabled: !!orderId && !!slug, refetchInterval: 5000 } // Poll every 5s
  );

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-600" />
      </div>
    );

  if (error || !order)
    return (
      <div className="flex h-screen flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="mb-4 h-16 w-16 text-red-500" />
        <h1 className="text-xl font-bold">Order not found</h1>
        <p className="text-gray-500">We couldn't find the order you're looking for.</p>
        <button
          onClick={() => navigate(`/m/${slug}`)}
          className="mt-8 rounded-xl bg-yellow-600 px-8 py-3 font-bold text-white"
        >
          Back to Menu
        </button>
      </div>
    );

  const currentStatusIndex = STATUS_STEPS.findIndex((s) => s.status === order.status);
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-4 bg-white px-4 py-4 shadow-sm">
        <button
          onClick={() => navigate(`/m/${slug}`)}
          className="rounded-full bg-gray-100 p-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-black tracking-tight">{order.restaurant.name}</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Order #{order.id.slice(-6).toUpperCase()}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-6 p-4">
        {/* Status Timeline */}
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-black">Order Status</h2>
          {isCancelled ? (
            <div className="flex items-center gap-4 rounded-2xl bg-red-50 p-4 text-red-700">
              <X className="h-6 w-6" />
              <span className="font-bold">This order was cancelled.</span>
            </div>
          ) : (
            <div className="space-y-6">
              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStatusIndex;
                const isCurrent = idx === currentStatusIndex;
                return (
                  <div key={step.status} className="flex items-start gap-4">
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                          isCompleted || isCurrent
                            ? "border-yellow-600 bg-yellow-600 text-white"
                            : "border-gray-200 bg-white text-gray-300"
                        }`}
                      >
                        {isCompleted ? <Check className="h-5 w-5" /> : <step.icon className="h-4 w-4" />}
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div
                          className={`absolute top-8 h-6 w-0.5 ${
                            isCompleted ? "bg-yellow-600" : "bg-gray-100"
                          }`}
                        />
                      )}
                    </div>
                    <div className="pt-0.5">
                      <p
                        className={`text-sm font-bold ${
                          isCurrent ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-[10px] font-medium text-yellow-600 uppercase tracking-widest">
                          In progress
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Order Details */}
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Order Details
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                order.paymentStatus === "PAID"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {order.paymentStatus}
            </span>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Customer
                </p>
                <p className="text-sm font-bold">{order.customerName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Service
                </p>
                <p className="text-sm font-bold">{order.orderType.replace("_", " ")}</p>
              </div>
            </div>
            {order.tableNumber && (
               <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Table</p>
                <p className="text-sm font-bold">{order.tableNumber}</p>
              </div>
            )}
            {order.address && (
               <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Address</p>
                <p className="text-sm font-bold">{order.address}</p>
              </div>
            )}
          </div>
        </section>

        {/* Itemized List */}
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
            Items
          </h3>
          <div className="space-y-4">
            {order.orderItems.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div className="flex-1">
                  <p className="font-bold">
                    {item.quantity}x {item.menuItem.name}
                  </p>
                  {item.addOns.map((ao: any) => (
                    <p key={ao.id} className="text-[10px] text-gray-400">
                      + {ao.addOn.name}
                    </p>
                  ))}
                </div>
                <span className="font-bold text-gray-900">Rs. {item.price * item.quantity}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-xl font-black text-yellow-600">Rs. {order.total}</span>
            </div>
          </div>
        </section>

        {/* Help */}
        <a
          href={`tel:${order.restaurant.phone}`}
          className="flex items-center justify-center gap-2 rounded-2xl bg-white p-4 text-sm font-bold text-yellow-600 shadow-sm transition-all active:scale-95"
        >
          <Phone className="h-4 w-4" />
          Something wrong? Call Restaurant
        </a>
      </div>
    </div>
  );
}
