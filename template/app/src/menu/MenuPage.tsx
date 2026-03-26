import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "wasp/client/operations";
import { getRestaurantBySlug, findOrderByPhone, getOrderDetails } from "wasp/client/operations";
import { CartProvider, useCart } from "./CartContext";
import { useToast } from "../client/components/ui/toast-hooks";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  X,
  ChevronRight,
  Info,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

function ItemDetailContent({ item, onAdd }: { item: any; onAdd: any }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<any[]>([]);
  const [instructions, setInstructions] = useState("");

  const toggleAddOn = (addOn: any) => {
    setSelectedAddOns((prev) =>
      prev.find((a) => a.id === addOn.id)
        ? prev.filter((a) => a.id !== addOn.id)
        : [...prev, addOn],
    );
  };

  const itemTotal =
    (item.price + selectedAddOns.reduce((sum, a) => sum + a.price, 0)) * quantity;

  return (
    <>
      {/* Add-ons List */}
      {item.addOns?.length > 0 && (
        <div className="mb-8 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">
            Customise your order
          </h3>
          <div className="space-y-3">
            {item.addOns.map((itemAddOn: any) => (
              <div
                key={itemAddOn.addOn.id}
                onClick={() => toggleAddOn(itemAddOn.addOn)}
                className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-3 transition-all ${
                  selectedAddOns.find((a) => a.id === itemAddOn.addOn.id)
                    ? "border-yellow-500 bg-yellow-50"
                    : "border-transparent bg-gray-50"
                }`}
              >
                <span className="text-sm font-bold">{itemAddOn.addOn.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-yellow-600">
                    +Rs. {itemAddOn.addOn.price}
                  </span>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border ${
                      selectedAddOns.find((a) => a.id === itemAddOn.addOn.id)
                        ? "border-yellow-600 bg-yellow-600 text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {selectedAddOns.find((a) => a.id === itemAddOn.addOn.id) && (
                      <Plus className="h-3 w-3" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-900">
          Special Instructions
        </h3>
        <textarea
          placeholder="e.g. No onions, extra spicy..."
          className="w-full rounded-xl border-none bg-gray-50 p-4 text-sm focus:ring-2 focus:ring-yellow-500"
          rows={2}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex items-center rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 items-center justify-center"
          >
            <Minus className="h-5 w-5" />
          </button>
          <span className="w-10 text-center font-black">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="flex h-10 w-10 items-center justify-center"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <button
          onClick={() => onAdd(item, quantity, selectedAddOns, instructions)}
          className="ml-4 flex-1 rounded-xl bg-yellow-600 py-3 px-8 font-black text-white shadow-lg shadow-yellow-100"
        >
          Add to Order • Rs. {itemTotal}
        </button>
      </div>
    </>
  );
}

function MenuContent({ slug }: { slug: string }) {
  const { data: restaurant, isLoading, error } = useQuery(getRestaurantBySlug, {
    slug,
  });
  const { cart, addToCart, updateCartQuantity, setItems, total, count, clearCart } =
    useCart();
  const { toast } = useToast();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [lookupPhone, setLookupPhone] = useState("");

  // --- Active Order Logic ---
  useEffect(() => {
    const saved = localStorage.getItem(`order_${slug}`);
    if (saved) {
      try {
        const { orderId } = JSON.parse(saved);
        setActiveOrderId(orderId);
      } catch (e) {}
    }
  }, [slug]);

  const { data: activeOrder } = useQuery(getOrderDetails,
    { orderId: activeOrderId || "", slug },
    { enabled: !!activeOrderId }
  );

  useEffect(() => {
    if (activeOrder && (activeOrder.status === "DELIVERED" || activeOrder.status === "CANCELLED")) {
      localStorage.removeItem(`order_${slug}`);
      setActiveOrderId(null);
    }
  }, [activeOrder, slug]);

  // --- Cart Validation Logic ---
  useEffect(() => {
    if (!restaurant || cart.length === 0) return;

    let itemsRemoved = false;
    let pricesUpdated = false;

    const allMenuItems = restaurant.categories.flatMap((c: any) => c.menuItems);

    const validatedCart = cart
      .map((cartItem) => {
        const menuItem = allMenuItems.find((mi: any) => mi.id === cartItem.menuItemId);

        if (!menuItem || !menuItem.isAvailable) {
          itemsRemoved = true;
          return null;
        }

        if (menuItem.price !== cartItem.price) {
          pricesUpdated = true;
          return { ...cartItem, price: menuItem.price };
        }

        return cartItem;
      })
      .filter(Boolean) as any[];

    if (itemsRemoved) {
      toast({
        variant: "destructive",
        title: "Menu Update",
        description:
          "Some items were removed because they are no longer available.",
      });
    }

    if (itemsRemoved || pricesUpdated) {
      setItems(validatedCart);
    }
  }, [restaurant, toast]); // Avoid cyclic updates by not including cart/setItems

  useEffect(() => {
    if (error || (restaurant === null && !isLoading)) {
      clearCart();
    }
  }, [error, restaurant, isLoading, clearCart]);

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-600" />
      </div>
    );
  if (error || !restaurant)
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold">Restaurant not found</h1>
        <p className="text-gray-500">The menu you are looking for is unavailable.</p>
      </div>
    );

  const categories = restaurant.categories || [];

  const handleLookup = async () => {
    if (!lookupPhone) return;
    try {
      const res = await findOrderByPhone({ phone: lookupPhone, slug });
      if (res) {
        navigate(`/m/${slug}/order/${res.id}`);
      } else {
        alert("No recent orders found for this phone number.");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAddToCart = (
    item: any,
    quantity: number,
    selectedAddOns: any[],
    instructions: string,
  ) => {
    addToCart(item, quantity, selectedAddOns, instructions);
    setSelectedItem(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Active Order Banner */}
      {activeOrder && activeOrder.status !== "DELIVERED" && activeOrder.status !== "CANCELLED" && (
        <div
          onClick={() => navigate(`/m/${slug}/order/${activeOrder.id}`)}
          className="bg-yellow-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between cursor-pointer sticky top-0 z-40"
        >
          <div className="flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>You have an active order: {activeOrder.status}</span>
          </div>
          <ExternalLink className="h-3 w-3" />
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900">
              {restaurant.name}
            </h1>
            <p className="text-xs font-medium text-gray-500">PKR {restaurant.address}</p>
          </div>
          <button
            onClick={() => setIsLookupOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-700"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for dishes..."
              className="w-full rounded-xl border-none bg-gray-100 py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-yellow-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category Tabs */}
        {!searchQuery && (
          <div className="scrollbar-hide flex space-x-2 overflow-x-auto px-4 pb-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                !activeCategory ? "bg-yellow-600 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              All
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  activeCategory === cat.id
                    ? "bg-yellow-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Menu Content */}
      <div className="space-y-8 px-4 pt-6">
        {categories
          .filter((c: any) => !activeCategory || c.id === activeCategory)
          .map((cat: any) => {
            const items = cat.menuItems.filter((i: any) =>
              i.name.toLowerCase().includes(searchQuery.toLowerCase()),
            );
            if (items.length === 0) return null;
            return (
              <div key={cat.id} className="space-y-4">
                <h2 className="text-lg font-black uppercase tracking-widest text-gray-900">
                  {cat.name}
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {items.map((item: any) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="flex cursor-pointer gap-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-all active:scale-[0.98]"
                    >
                      <div className="flex-1">
                        <h3 className="mb-1 font-bold text-gray-900">{item.name}</h3>
                        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-500">
                          {item.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-black text-yellow-600">
                            Rs. {item.price}
                          </span>
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
                            <Plus className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                      {item.image && (
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-gray-50">
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
      {count > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 left-4 right-4 z-40 flex items-center justify-between rounded-2xl bg-yellow-600 py-4 px-6 text-white shadow-2xl shadow-yellow-900/20 transition-all active:scale-95"
        >
          <div className="flex items-center gap-3">
            <div className="rounded bg-white/20 px-2 py-0.5 text-xs font-black">
              {count}
            </div>
            <span className="font-bold">View Cart</span>
          </div>
          <span className="font-black">Rs. {total}</span>
        </button>
      )}

      {/* Find Order Modal */}
      {isLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsLookupOpen(false)}></div>
          <div className="relative bg-white rounded-3xl w-full max-w-sm p-6 animate-in zoom-in duration-200">
            <h3 className="text-xl font-black mb-2">Find My Order</h3>
            <p className="text-sm text-gray-500 mb-6">Enter your phone number to find your most recent order.</p>
            <input
              type="tel"
              placeholder="e.g. 03001234567"
              className="w-full border-gray-200 rounded-xl px-4 py-3 mb-4 focus:ring-yellow-500 focus:border-yellow-500"
              value={lookupPhone}
              onChange={e => setLookupPhone(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setIsLookupOpen(false)} className="flex-1 px-4 py-3 font-bold text-gray-500">Cancel</button>
              <button onClick={handleLookup} className="flex-1 bg-yellow-600 text-white rounded-xl py-3 font-bold shadow-lg shadow-yellow-100">Find</button>
            </div>
          </div>
        </div>
      )}

      {/* Item Detail Modal/Drawer */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSelectedItem(null)}
          ></div>
          <div className="relative max-h-[90%] animate-in slide-in-from-bottom overflow-y-auto rounded-t-[32px] bg-white p-6 duration-300">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>

            {selectedItem.image && (
              <div className="mb-6 -mx-6 -mt-6 h-64">
                <img src={selectedItem.image} className="h-full w-full object-cover" />
              </div>
            )}

            <div className={selectedItem.image ? "" : "pt-8"}>
              <h2 className="mb-2 text-2xl font-black text-gray-900">
                {selectedItem.name}
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-gray-500">
                {selectedItem.description}
              </p>

              <ItemDetailContent item={selectedItem} onAdd={handleAddToCart} />
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsCartOpen(false)}
          ></div>
          <div className="relative flex h-[85%] animate-in slide-in-from-bottom flex-col rounded-t-[32px] bg-white p-6 duration-300">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-900">Your Order</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="-mx-2 flex-1 space-y-6 overflow-y-auto px-2">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{item.name}</h4>
                    <p className="text-xs text-gray-500">Rs. {item.price}</p>
                    {item.selectedAddOns.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.selectedAddOns.map((ao) => (
                          <span
                            key={ao.id}
                            className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
                          >
                            {ao.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex h-9 items-center rounded-lg bg-gray-100 px-1">
                    <button
                      onClick={() => updateCartQuantity(item.id, -1)}
                      className="flex w-7 items-center justify-center"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-7 text-center text-sm font-black">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.id, 1)}
                      className="flex w-7 items-center justify-center"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 border-t border-gray-100 pt-6">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-500">Total</span>
                <span className="text-xl font-black text-gray-900">Rs. {total}</span>
              </div>
                <button
                  onClick={() => navigate(`/m/${slug}/checkout`)}
                  className="w-full rounded-2xl bg-yellow-600 py-4 text-lg font-black text-white shadow-xl shadow-yellow-100 transition-all active:scale-95"
                >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) return <div>Invalid Restaurant</div>;

  return (
    <CartProvider restaurantSlug={slug}>
      <MenuContent slug={slug} />
    </CartProvider>
  );
}
