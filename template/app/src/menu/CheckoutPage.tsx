import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useAction } from "wasp/client/operations";
import { getRestaurantBySlug, createOrder } from "wasp/client/operations";
import { useCart, CartProvider } from "./CartContext";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  Copy,
  Loader2,
  ShoppingBag,
} from "lucide-react";

function CheckoutContent() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { cart, total, clearCart } = useCart();
  const { data: restaurant, isLoading } = useQuery(getRestaurantBySlug, { slug: slug || "" });
  const createOrderAction = useAction(createOrder);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    orderType: "DINE_IN" as const,
    tableNumber: "",
    address: "",
    paymentMethod: "" as any,
  });

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-yellow-600" /></div>;
  if (!restaurant || cart.length === 0) {
    return (
       <div className="flex flex-col h-screen items-center justify-center p-8 text-center">
         <ShoppingBag className="h-16 w-16 text-gray-200 mb-4" />
         <h1 className="text-xl font-bold mb-2">Checkout not available</h1>
         <p className="text-gray-500 mb-8">Your cart is empty or the restaurant is unavailable.</p>
         <button onClick={() => navigate(`/m/${slug}`)} className="bg-yellow-600 text-white px-8 py-3 rounded-xl font-bold">Back to Menu</button>
       </div>
    );
  }

  const enabledMethods = restaurant.enabledPaymentMethods || ["CASH_ON_COUNTER"];

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      const res = await createOrderAction({
        restaurantSlug: slug!,
        customerName: formData.customerName,
        phone: formData.phone,
        orderType: formData.orderType,
        tableNumber: formData.tableNumber,
        address: formData.address,
        paymentMethod: formData.paymentMethod,
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          selectedAddOnIds: item.selectedAddOns.map(ao => ao.id),
          instructions: item.instructions
        }))
      });

      // Save order ref to localStorage
      const orderRef = { orderId: res.id, phone: formData.phone, createdAt: Date.now() };
      localStorage.setItem(`order_${slug}`, JSON.stringify(orderRef));

      clearCart();
      // Redirect to order status (Task 9 will build this)
      navigate(`/m/${slug}/order/${res.id}`);
    } catch (err: any) {
      alert("Error creating order: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.customerName || !formData.phone) return alert("Name and phone are required");
      if (formData.orderType === "DINE_IN" && !formData.tableNumber) return alert("Table number is required");
      if (formData.orderType === "DELIVERY" && !formData.address) return alert("Address is required");
    }
    if (step === 2 && !formData.paymentMethod) return alert("Please select a payment method");
    setStep(s => s + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm flex items-center gap-4 sticky top-0 z-20">
        <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate(`/m/${slug}`)} className="p-2 bg-gray-100 rounded-full">
           <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-black tracking-tight">Checkout</h1>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6 mt-4">
        {/* Progress Bar */}
        <div className="flex items-center justify-between px-2 mb-8">
           {[1, 2, 3].map(i => (
             <div key={i} className="flex items-center flex-1 last:flex-none">
               <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= i ? "bg-yellow-600 text-white" : "bg-gray-200 text-gray-400"}`}>
                 {step > i ? <CheckCircle2 className="h-5 w-5" /> : i}
               </div>
               {i < 3 && <div className={`flex-1 h-1 mx-2 rounded ${step > i ? "bg-yellow-600" : "bg-gray-200"}`} />}
             </div>
           ))}
        </div>

        {/* Step 1: Order Details */}
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <section>
              <h2 className="text-xl font-black mb-4">How would you like your order?</h2>
              <div className="grid grid-cols-3 gap-3">
                {["DINE_IN", "TAKEAWAY", "DELIVERY"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, orderType: type as any })}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                      formData.orderType === type ? "border-yellow-600 bg-yellow-50 text-yellow-700" : "border-transparent bg-white text-gray-500 shadow-sm"
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">{type.replace("_", " ")}</span>
                  </button>
                ))}
              </div>
            </section>

            <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                  <input
                    className="w-full border-gray-200 rounded-xl px-4 py-3 focus:ring-yellow-500 focus:border-yellow-500"
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full border-gray-200 rounded-xl px-4 py-3 focus:ring-yellow-500 focus:border-yellow-500"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
               </div>
               {formData.orderType === "DINE_IN" && (
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Table Number</label>
                    <input
                      className="w-full border-gray-200 rounded-xl px-4 py-3 focus:ring-yellow-500 focus:border-yellow-500"
                      value={formData.tableNumber}
                      onChange={e => setFormData({ ...formData, tableNumber: e.target.value })}
                    />
                 </div>
               )}
               {formData.orderType === "DELIVERY" && (
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Delivery Address</label>
                    <textarea
                      className="w-full border-gray-200 rounded-xl px-4 py-3 focus:ring-yellow-500 focus:border-yellow-500"
                      rows={3}
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                 </div>
               )}
            </div>
            <button onClick={nextStep} className="w-full bg-yellow-600 text-white rounded-2xl py-4 font-black shadow-lg shadow-yellow-100 flex items-center justify-center">
               Next Step <ChevronRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        )}

        {/* Step 2: Payment Method */}
        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
             <h2 className="text-xl font-black mb-4">Choose Payment Method</h2>
             <div className="space-y-3">
                {enabledMethods.map((method: string) => (
                  <div key={method} className="space-y-3">
                    <button
                      onClick={() => setFormData({ ...formData, paymentMethod: method as any })}
                      className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                        formData.paymentMethod === method ? "border-yellow-600 bg-yellow-50" : "border-transparent bg-white shadow-sm"
                      }`}
                    >
                      <span className="font-bold text-gray-900">{method.replace(/_/g, " ")}</span>
                      <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === method ? "border-yellow-600 bg-yellow-600 text-white" : "border-gray-200"}`}>
                        {formData.paymentMethod === method && <div className="h-2 w-2 bg-white rounded-full" />}
                      </div>
                    </button>
                    {/* Manual Payment Details */}
                    {formData.paymentMethod === method && (
                       <div className="bg-yellow-100/50 p-4 rounded-2xl border border-yellow-200 text-sm space-y-3 animate-in fade-in slide-in-from-top-2">
                          {method === "BANK_TRANSFER" && (
                             <>
                               <p className="font-bold text-yellow-800">Transfer total amount to:</p>
                               <div className="bg-white p-3 rounded-lg border border-yellow-200 font-mono text-xs whitespace-pre-wrap">
                                 {restaurant.bankAccountDetails || "Bank details not provided."}
                               </div>
                             </>
                          )}
                          {(method === "JAZZCASH" || method === "EASYPAISA") && (
                             <>
                               <p className="font-bold text-yellow-800">Transfer to wallet number:</p>
                               <div className="bg-white p-3 rounded-lg border border-yellow-200 flex items-center justify-between">
                                  <span className="font-bold text-lg">{method === "JAZZCASH" ? restaurant.jazzCashNumber : restaurant.easypaisaNumber}</span>
                                  <button onClick={() => navigator.clipboard.writeText(method === "JAZZCASH" ? restaurant.jazzCashNumber! : restaurant.easypaisaNumber!)} className="p-2 bg-gray-100 rounded-md">
                                     <Copy className="h-4 w-4" />
                                  </button>
                               </div>
                               <p className="text-[10px] text-yellow-700 italic">Please keep the transaction ID ready after payment.</p>
                             </>
                          )}
                       </div>
                    )}
                  </div>
                ))}
             </div>
             <button onClick={nextStep} className="w-full bg-yellow-600 text-white rounded-2xl py-4 font-black shadow-lg shadow-yellow-100 flex items-center justify-center">
               Continue to Review <ChevronRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div>
                   <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Order Summary</h3>
                   <div className="space-y-3">
                      {cart.map(item => (
                        <div key={item.id} className="flex justify-between items-start text-sm">
                           <div className="flex-1">
                              <p className="font-bold">{item.quantity}x {item.name}</p>
                              {item.selectedAddOns.map(ao => <p key={ao.id} className="text-[10px] text-gray-500">+ {ao.name}</p>)}
                           </div>
                           <span className="font-bold">Rs. {item.price * item.quantity}</span>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                         <span className="font-bold text-gray-900">Total Amount</span>
                         <span className="text-xl font-black text-yellow-600">Rs. {total}</span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                   <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Service</h4>
                      <p className="text-sm font-bold">{formData.orderType.replace("_", " ")}</p>
                   </div>
                   <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment</h4>
                      <p className="text-sm font-bold">{formData.paymentMethod.replace(/_/g, " ")}</p>
                   </div>
                </div>
             </div>

             <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl py-4 font-black shadow-lg shadow-green-100 flex items-center justify-center transition-all disabled:opacity-50"
             >
               {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Confirm & Place Order"}
            </button>
            <p className="text-[10px] text-center text-gray-400 px-8 leading-relaxed uppercase font-bold tracking-widest">
              By confirming, you agree to our terms. For manual payments, your order will be processed once payment is verified by the restaurant.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return null;
  return (
    <CartProvider restaurantSlug={slug}>
      <CheckoutContent />
    </CartProvider>
  );
}
