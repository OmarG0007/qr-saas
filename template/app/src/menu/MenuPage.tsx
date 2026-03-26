import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "wasp/client/operations";
import { getRestaurantBySlug } from "wasp/client/operations";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  X,
  ChevronRight,
  Info,
  Loader2,
} from "lucide-react";

// Types for our in-memory cart
interface CartItem {
  id: string; // Unique ID for the cart entry (item + selected add-ons)
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  selectedAddOns: { id: string; name: string; price: number }[];
  instructions?: string;
  image?: string;
}

function ItemDetailContent({ item, onAdd }: { item: any, onAdd: any }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<any[]>([]);
  const [instructions, setInstructions] = useState("");

  const toggleAddOn = (addOn: any) => {
    setSelectedAddOns(prev =>
      prev.find(a => a.id === addOn.id)
        ? prev.filter(a => a.id !== addOn.id)
        : [...prev, addOn]
    );
  };

  const itemTotal = (item.price + selectedAddOns.reduce((sum, a) => sum + a.price, 0)) * quantity;

  return (
    <>
      {/* Add-ons List */}
      {item.addOns?.length > 0 && (
        <div className="space-y-4 mb-8">
           <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Customise your order</h3>
           <div className="space-y-3">
              {item.addOns.map((itemAddOn: any) => (
                <div
                  key={itemAddOn.addOn.id}
                  onClick={() => toggleAddOn(itemAddOn.addOn)}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedAddOns.find(a => a.id === itemAddOn.addOn.id)
                    ? "bg-yellow-50 border-yellow-500"
                    : "bg-gray-50 border-transparent"
                  }`}
                >
                   <span className="font-bold text-sm">{itemAddOn.addOn.name}</span>
                   <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-yellow-600">+Rs. {itemAddOn.addOn.price}</span>
                      <div className={`h-5 w-5 rounded border flex items-center justify-center ${
                        selectedAddOns.find(a => a.id === itemAddOn.addOn.id)
                        ? "bg-yellow-600 border-yellow-600 text-white"
                        : "bg-white border-gray-300"
                      }`}>
                        {selectedAddOns.find(a => a.id === itemAddOn.addOn.id) && <Plus className="h-3 w-3" />}
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="mb-8">
         <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs mb-3">Special Instructions</h3>
         <textarea
          placeholder="e.g. No onions, extra spicy..."
          className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-yellow-500"
          rows={2}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
         />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
         <div className="flex items-center bg-gray-100 rounded-xl p-1">
           <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="h-10 w-10 flex items-center justify-center"
           >
             <Minus className="h-5 w-5" />
           </button>
           <span className="w-10 text-center font-black">{quantity}</span>
           <button
            onClick={() => setQuantity(q => q + 1)}
            className="h-10 w-10 flex items-center justify-center"
           >
             <Plus className="h-5 w-5" />
           </button>
         </div>
         <button
          onClick={() => onAdd(item, quantity, selectedAddOns, instructions)}
          className="bg-yellow-600 text-white rounded-xl py-3 px-8 font-black shadow-lg shadow-yellow-100 flex-1 ml-4"
         >
           Add to Order • Rs. {itemTotal}
         </button>
      </div>
    </>
  );
}

export default function MenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: restaurant, isLoading, error } = useQuery(getRestaurantBySlug, { slug: slug || "" });

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null); // For detail modal

  // --- Cart Logic ---
  const addToCart = (item: any, quantity: number, selectedAddOns: any[], instructions: string) => {
    const addOnIds = selectedAddOns.map(a => a.id).sort().join(",");
    const cartId = `${item.id}-${addOnIds}-${instructions}`;

    setCart(prev => {
      const existing = prev.find(i => i.id === cartId);
      if (existing) {
        return prev.map(i => i.id === cartId ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, {
        id: cartId,
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity,
        selectedAddOns,
        instructions
      }];
    });
    setSelectedItem(null);
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const addOnsTotal = item.selectedAddOns.reduce((sum, ao) => sum + ao.price, 0);
      return total + (item.price + addOnsTotal) * item.quantity;
    }, 0);
  }, [cart]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // --- UI Helpers ---
  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-yellow-600" /></div>;
  if (error || !restaurant) return <div className="p-8 text-center"><h1 className="text-xl font-bold">Restaurant not found</h1><p className="text-gray-500">The menu you are looking for is unavailable.</p></div>;

  const categories = restaurant.categories || [];
  const filteredItems = categories.flatMap(c => c.menuItems).filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">{restaurant.name}</h1>
            <p className="text-xs text-gray-500 font-medium">PKR {restaurant.address}</p>
          </div>
          <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700">
             <Info className="h-5 w-5" />
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for dishes..."
              className="w-full bg-gray-100 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-yellow-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category Tabs */}
        {!searchQuery && (
          <div className="flex overflow-x-auto px-4 pb-2 scrollbar-hide space-x-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!activeCategory ? "bg-yellow-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              All
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeCategory === cat.id ? "bg-yellow-600 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Menu Content */}
      <div className="px-4 pt-6 space-y-8">
        {categories.filter(c => !activeCategory || c.id === activeCategory).map((cat: any) => {
          const items = cat.menuItems.filter((i: any) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
          if (items.length === 0) return null;
          return (
            <div key={cat.id} className="space-y-4">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest">{cat.name}</h2>
              <div className="grid grid-cols-1 gap-4">
                {items.map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-4 cursor-pointer active:scale-[0.98] transition-all"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{item.description}</p>
                      <div className="flex items-center justify-between">
                         <span className="font-black text-yellow-600">Rs. {item.price}</span>
                         <div className="h-8 w-8 bg-yellow-50 rounded-lg flex items-center justify-center text-yellow-600">
                           <Plus className="h-5 w-5" />
                         </div>
                      </div>
                    </div>
                    {item.image && (
                      <div className="h-24 w-24 rounded-xl overflow-hidden shrink-0 border border-gray-50">
                        <img src={item.image} className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 left-4 right-4 bg-yellow-600 text-white rounded-2xl py-4 px-6 flex items-center justify-between shadow-2xl shadow-yellow-900/20 z-40 active:scale-95 transition-all"
        >
          <div className="flex items-center gap-3">
             <div className="bg-white/20 px-2 py-0.5 rounded text-xs font-black">{cartCount}</div>
             <span className="font-bold">View Cart</span>
          </div>
          <span className="font-black">Rs. {cartTotal}</span>
        </button>
      )}

      {/* Item Detail Modal/Drawer */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedItem(null)}></div>
          <div className="relative bg-white rounded-t-[32px] max-h-[90%] overflow-y-auto p-6 animate-in slide-in-from-bottom duration-300">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute right-6 top-6 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center"
            >
              <X className="h-6 w-6" />
            </button>

            {selectedItem.image && (
               <div className="h-64 -mx-6 -mt-6 mb-6">
                 <img src={selectedItem.image} className="w-full h-full object-cover" />
               </div>
            )}

            <div className={selectedItem.image ? "" : "pt-8"}>
              <h2 className="text-2xl font-black text-gray-900 mb-2">{selectedItem.name}</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">{selectedItem.description}</p>

              <ItemDetailContent item={selectedItem} onAdd={addToCart} />
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative bg-white rounded-t-[32px] h-[85%] flex flex-col p-6 animate-in slide-in-from-bottom duration-300">
             <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-black text-gray-900">Your Order</h2>
               <button onClick={() => setIsCartOpen(false)} className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                 <X className="h-6 w-6" />
               </button>
             </div>

             <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex-1">
                       <h4 className="font-bold text-gray-900">{item.name}</h4>
                       <p className="text-xs text-gray-500">Rs. {item.price}</p>
                       {item.selectedAddOns.length > 0 && (
                         <div className="flex flex-wrap gap-1 mt-1">
                           {item.selectedAddOns.map(ao => (
                             <span key={ao.id} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-md font-medium text-gray-600">{ao.name}</span>
                           ))}
                         </div>
                       )}
                    </div>
                    <div className="flex items-center bg-gray-100 rounded-lg h-9 px-1">
                       <button onClick={() => updateCartQuantity(item.id, -1)} className="w-7 flex items-center justify-center"><Minus className="h-4 w-4" /></button>
                       <span className="w-7 text-center text-sm font-black">{item.quantity}</span>
                       <button onClick={() => updateCartQuantity(item.id, 1)} className="w-7 flex items-center justify-center"><Plus className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
             </div>

             <div className="pt-6 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-bold">Total</span>
                  <span className="text-xl font-black text-gray-900">Rs. {cartTotal}</span>
                </div>
                <button className="w-full bg-yellow-600 text-white rounded-2xl py-4 font-black shadow-xl shadow-yellow-100 text-lg active:scale-95 transition-all">
                  Proceed to Checkout
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
