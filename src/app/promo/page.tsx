"use client";

import { useEffect, useState } from "react";
import { products } from "../data";
import { ProductCard } from "../components";
import { getProducts, getActiveBanner } from "../../lib/supabase/data";
import type { Product } from "../data";

export default function PromoPage() {
  const [promoBanner, setPromoBanner] = useState("");
  const [displayProducts, setDisplayProducts] = useState<Product[]>(products);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("adicetak-promo-banner") || "null");
      if (saved?.dataUrl) setPromoBanner(saved.dataUrl);
    } catch {
      setPromoBanner("");
    }
    Promise.all([getProducts(), getActiveBanner()]).then(([items, banner]) => {
      setDisplayProducts(items);
      if (banner) setPromoBanner(banner);
    });
  }, []);

  const formatRupiah = (value: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
  return <main className="mx-auto max-w-295 px-4 py-6 md:px-5">
    <img
      src={promoBanner || "https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?auto=format&fit=crop&w=1180&h=290&q=90"}
      alt="Banner promo"
      className="aspect-1180/290 w-full rounded-xl object-cover"
    />
    <h2 className="mb-4 mt-8 text-xl font-black">Promo Pilihan</h2>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{displayProducts.map((p)=><ProductCard key={p.id} product={p} className="w-full" />)}</div>
  </main>;
}
