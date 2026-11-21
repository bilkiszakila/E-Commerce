"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Product } from "./data";
import { supabase } from "../lib/supabase/client";

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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem("adicetak-cart") || "[]");
      if (Array.isArray(savedCart)) setCart(savedCart);
    } catch {
      setCart([]);
    }
    setLoggedIn(localStorage.getItem("adicetak-login") === "true");
    setHydrated(true);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(Boolean(data.session));
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session));
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("adicetak-cart", JSON.stringify(cart));
  }, [cart, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("adicetak-login", String(loggedIn));
  }, [loggedIn, hydrated]);

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
