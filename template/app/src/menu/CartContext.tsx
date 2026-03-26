import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CartItem {
  id: string; // unique entry id (itemId + addons + instructions)
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  selectedAddOns: { id: string; name: string; price: number }[];
  instructions?: string;
  image?: string;
}

interface CartState {
  items: CartItem[];
  savedAt: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: any, quantity: number, selectedAddOns: any[], instructions: string) => void;
  updateCartQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export const CartProvider: React.FC<{ children: React.ReactNode; restaurantSlug: string }> = ({
  children,
  restaurantSlug,
}) => {
  const storageKey = `cart_${restaurantSlug}`;

  // Initial state from localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const { items, savedAt }: CartState = JSON.parse(saved);
        if (Date.now() - savedAt < CART_EXPIRY_MS) {
          return items;
        }
        localStorage.removeItem(storageKey);
      }
    } catch (e) {
      console.error("Failed to restore cart", e);
    }
    return [];
  });

  // Save to localStorage on every change
  useEffect(() => {
    const state: CartState = {
      items: cart,
      savedAt: Date.now(),
    };
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [cart, storageKey]);

  const addToCart = useCallback((item: any, quantity: number, selectedAddOns: any[], instructions: string) => {
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
  }, []);

  const updateCartQuantity = useCallback((id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  const total = cart.reduce((acc, item) => {
    const addOnsTotal = item.selectedAddOns.reduce((sum, ao) => sum + ao.price, 0);
    return acc + (item.price + addOnsTotal) * item.quantity;
  }, 0);

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateCartQuantity, clearCart, setItems: setCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
