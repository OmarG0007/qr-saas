import React, { useState, useEffect } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { useQuery, useAction } from "wasp/client/operations";
import { getMyRestaurant, updateRestaurantSettings } from "wasp/client/operations";
import {
  Save,
  Loader2,
  Building2,
  CreditCard,
  Image as ImageIcon,
  Smartphone,
  Globe,
} from "lucide-react";

const PAYMENT_METHODS = [
  "CASH_ON_COUNTER",
  "PAY_AT_RESTAURANT",
  "CASH_ON_DELIVERY",
  "BANK_TRANSFER",
  "JAZZCASH",
  "EASYPAISA",
];

export default function DashboardSettingsPage() {
  const { data: restaurant, isLoading } = useQuery(getMyRestaurant);
  const updateSettingsAction = useAction(updateRestaurantSettings);

  const [formData, setFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || "",
        slug: restaurant.slug || "",
        phone: restaurant.phone || "",
        address: restaurant.address || "",
        description: restaurant.description || "",
        enabledPaymentMethods: restaurant.enabledPaymentMethods || [],
        bankAccountDetails: restaurant.bankAccountDetails || "",
        jazzCashNumber: restaurant.jazzCashNumber || "",
        easypaisaNumber: restaurant.easypaisaNumber || "",
      });
    }
  }, [restaurant]);

  const togglePaymentMethod = (method: string) => {
    setFormData((prev: any) => {
      const current = prev.enabledPaymentMethods;
      const next = current.includes(method)
        ? current.filter((m: string) => m !== method)
        : [...current, method];
      return { ...prev, enabledPaymentMethods: next };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateSettingsAction(formData);
      alert("Settings updated successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !formData) return (
    <DashboardLayout>
      <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-yellow-600" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Restaurant Settings</h1>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center px-6 py-2.5 bg-yellow-600 text-white font-bold rounded-xl shadow-lg shadow-yellow-100 hover:bg-yellow-700 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </button>
        </div>

        <div className="space-y-8 pb-12">
          {/* General Info */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="h-5 w-5 text-yellow-600" />
              <h2 className="text-lg font-bold">General Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Restaurant Name</label>
                <input
                  className="w-full border-gray-200 rounded-xl px-4 py-3 focus:ring-yellow-500"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">URL Slug</label>
                <div className="flex items-center">
                  <span className="bg-gray-100 border border-r-0 border-gray-200 px-3 py-3 rounded-l-xl text-sm text-gray-400">/m/</span>
                  <input
                    disabled
                    className="flex-1 border-gray-200 rounded-r-xl px-4 py-3 bg-gray-50 text-gray-400 cursor-not-allowed"
                    value={formData.slug}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                <input
                  className="w-full border-gray-200 rounded-xl px-4 py-3 focus:ring-yellow-500"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Address</label>
                <textarea
                  className="w-full border-gray-200 rounded-xl px-4 py-3 focus:ring-yellow-500"
                  rows={2}
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                <textarea
                  className="w-full border-gray-200 rounded-xl px-4 py-3 focus:ring-yellow-500"
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Payment Methods */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="h-5 w-5 text-yellow-600" />
              <h2 className="text-lg font-bold">Payment Methods</h2>
            </div>
            <p className="text-xs text-gray-500 mb-6 font-medium">Select which payment methods customers can use at checkout.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {PAYMENT_METHODS.map(method => (
                 <button
                   key={method}
                   onClick={() => togglePaymentMethod(method)}
                   className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                     formData.enabledPaymentMethods.includes(method)
                       ? "border-yellow-600 bg-yellow-50"
                       : "border-gray-100 bg-white"
                   }`}
                 >
                   <span className="font-bold text-sm">{method.replace(/_/g, " ")}</span>
                   <div className={`h-6 w-11 rounded-full relative transition-colors ${formData.enabledPaymentMethods.includes(method) ? "bg-yellow-600" : "bg-gray-200"}`}>
                      <div className={`absolute top-1 left-1 bg-white h-4 w-4 rounded-full transition-transform ${formData.enabledPaymentMethods.includes(method) ? "translate-x-5" : ""}`} />
                   </div>
                 </button>
               ))}
            </div>

            {/* Manual Payment Details */}
            <div className="mt-8 space-y-6 pt-6 border-t border-gray-100">
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Bank Account Details</label>
                  <textarea
                    placeholder="Bank Name, Account Title, Account Number/IBAN"
                    className="w-full border-gray-200 rounded-xl px-4 py-3 focus:ring-yellow-500 text-sm"
                    rows={2}
                    value={formData.bankAccountDetails}
                    onChange={e => setFormData({ ...formData, bankAccountDetails: e.target.value })}
                  />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">JazzCash Wallet Number</label>
                    <input
                      className="w-full border-gray-200 rounded-xl px-4 py-3 focus:ring-yellow-500"
                      value={formData.jazzCashNumber}
                      onChange={e => setFormData({ ...formData, jazzCashNumber: e.target.value })}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Easypaisa Wallet Number</label>
                    <input
                      className="w-full border-gray-200 rounded-xl px-4 py-3 focus:ring-yellow-500"
                      value={formData.easypaisaNumber}
                      onChange={e => setFormData({ ...formData, easypaisaNumber: e.target.value })}
                    />
                 </div>
               </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
