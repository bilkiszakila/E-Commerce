"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Product } from "./data";
import { supabase } from "../lib/supabase/client";
import { getIsAdmin } from "../lib/supabase/auth";
import Link from "next/link";

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
  isAdmin: boolean;
  setLoggedIn: (value: boolean) => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [toastProduct, setToastProduct] = useState("");

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
    async function syncAuthSession(session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) {
      setLoggedIn(Boolean(session));
      setIsAdmin(false);
      if (!session) return;

      setIsAdmin(await getIsAdmin(session.user.id));
    }

    supabase.auth.getSession().then(({ data }) => syncAuthSession(data.session));

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      syncAuthSession(session);
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
      setToastProduct(item.product.name);
      window.setTimeout(() => setToastProduct(""), 3000);
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
    isAdmin,
    setLoggedIn,
  }), [cart, loggedIn, isAdmin]);

  return (
    <StoreContext.Provider value={value}>
      {children}
      {toastProduct && (
        <div className="fixed bottom-5 left-1/2 z-[100] flex w-[calc(100%-32px)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="min-w-0"><p className="text-sm font-black">Ditambahkan ke keranjang</p><p className="mt-1 truncate text-xs text-slate-500">{toastProduct}</p></div>
          <Link href="/cart" onClick={() => setToastProduct("")} className="shrink-0 rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white">Lihat Keranjang</Link>
        </div>
      )}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
