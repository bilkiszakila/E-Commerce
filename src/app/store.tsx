"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Product } from "./data";

export type CartItem = { key: string; product: Product; quantity: number; variants: string; unitPrice: number };
type Store = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  loggedIn: boolean;
  setLoggedIn: (value: boolean) => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("adicetak-cart") || "[]"); } catch { return []; }
  });
  const [loggedIn, setLoggedIn] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("adicetak-login") === "true"
  );

  useEffect(() => {
    localStorage.setItem("adicetak-cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    localStorage.setItem("adicetak-login", String(loggedIn));
  }, [loggedIn]);

  const value = useMemo<Store>(() => ({
    cart,
    addToCart(item) {
      setCart((old) => {
        const found = old.find((i) => i.key === item.key);
        return found ? old.map((i) => i.key === item.key ? { ...i, quantity: i.quantity + item.quantity } : i) : [...old, item];
      });
    },
    updateQuantity(key, quantity) {
      setCart((old) => old.map((i) => i.key === key ? { ...i, quantity: Math.max(1, quantity) } : i));
    },
    removeItem(key) { setCart((old) => old.filter((i) => i.key !== key)); },
    clearCart() { setCart([]); },
    cartCount: cart.reduce((n, i) => n + i.quantity, 0),
    cartTotal: cart.reduce((n, i) => n + i.unitPrice * i.quantity, 0),
    loggedIn,
    setLoggedIn,
  }), [cart, loggedIn]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
