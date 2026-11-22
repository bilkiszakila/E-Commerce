"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, ChevronLeft, BadgePercent } from "lucide-react";
import type { Product } from "@/app/data";
import type { Category } from "@/lib/supabase/data";
import { ProductCard } from "@/app/components";
import { getProducts, getCategories, getActiveBanner } from "@/services/productService";

export default function Home() {
  const [promoBanner, setPromoBanner] = useState("");
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const [displayCategories, setDisplayCategories] = useState<Category[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("adicetak-promo-banner") || "null");
      if (saved?.dataUrl) setPromoBanner(saved.dataUrl);
    } catch {
      setPromoBanner("");
    }
    Promise.all([getProducts(), getCategories(), getActiveBanner()]).then(([items, categoryItems, banner]) => {
      setDisplayProducts(items);
      setDisplayCategories(categoryItems);
      if (banner) setPromoBanner(banner);
      setLoadingProducts(false);
    });
  }, []);

  return (
    <main>
      <section className="mx-auto max-w-[1180px] px-4 pt-4 md:px-5">
        <div className="relative">
          <Link href="/promo" className="block aspect-[1180/290] overflow-hidden rounded-xl bg-slate-950">
            <img
              src={promoBanner || "https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?auto=format&fit=crop&w=1180&h=290&q=90"}
              alt="Promo cetak"
              className="h-full w-full object-cover"
            />
          </Link>
          <button className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white shadow"><ChevronLeft size={18}/></button>
          <button className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white shadow"><ChevronRight size={18}/></button>
        </div>

      </section>

      <section className="mx-auto max-w-[1180px] px-4 pt-8 md:px-5">
        <div className="mb-4 flex items-end justify-between"><h2 className="text-lg font-black md:text-xl">Kategori Produk</h2><Link href="/category" className="text-base font-bold text-red-500">Lihat semua</Link></div>

        <div className="hide-scrollbar grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
          {displayCategories.map((category) => <Link href={`/category?name=${encodeURIComponent(category.name)}`} key={category.id} className="flex flex-col overflow-hidden rounded-lg p-2 border border-blue-100">
            {category.thumbnailUrl ? <img src={category.thumbnailUrl} alt={category.name} className="aspect-square rounded-[8px] w-full object-cover transition group-hover:scale-105"/> : <div className="aspect-square w-full rounded-[8px] bg-slate-100"/>}
            <b className="mt-2 text-center text-xs text-slate-950 md:text-sm">{category.name}</b>
          </Link>)}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 pt-8 md:px-5">
        <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-3"><h2 className="text-lg font-semibold md:text-xl">Flash Sale</h2><div className="hidden items-center gap-1 md:flex"><span className="countdown-digit">02</span><b>:</b><span className="countdown-digit">14</span><b>:</b><span className="countdown-digit">39</span></div></div><Link href="/promo" className="text-xs font-bold text-slate-500">Lihat semua</Link></div>
        <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-4 lg:grid-cols-6">
          {loadingProducts ? <p className="col-span-full py-6 text-xs text-slate-400">Memuat produk...</p> : displayProducts.length ? displayProducts.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} className="min-w-[158px] w-fit sm:min-w-0" />) : <p className="col-span-full py-6 text-xs text-slate-400">Belum ada produk.</p>}
        </div>
      </section>

      <section className="mx-auto max-w-295 px-4 pt-8 md:px-5">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold md:text-xl">Rekomendasi Untuk Anda</h2><Link href="/category" className="text-xs font-bold text-slate-500">Lihat semua</Link></div>
        <div className="grid grid-cols-2 gap-2 pb-2 md:grid md:grid-cols-4 lg:grid-cols-6">
          {loadingProducts ? <p className="col-span-full py-6 text-xs text-slate-400">Memuat rekomendasi...</p> : displayProducts.length ? displayProducts.slice(4).concat(displayProducts.slice(0, 4)).map((p) => <ProductCard key={p.id + "-rec"} product={p} className="min-w-[158px] w-fit sm:min-w-0" />) : <p className="col-span-full py-6 text-xs text-slate-400">Belum ada rekomendasi.</p>}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 pt-8 md:px-5">
        <h2 className="mb-4 text-lg font-black md:text-xl">Promo & Penawaran</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Flash Sale", "Diskon hingga 50%", "bg-red-500"],
            ["Gratis Ongkir", "Area Jabodetabek", "bg-slate-800"],
            ["Paket Hemat", "Buy 1 Get 1", "bg-blue-600"],
            ["Loyalty Member", "Poin tiap belanja", "bg-amber-500"],
          ].map(([title, sub, color]) => <Link href="/promo" key={title} className={`${color} relative min-h-[110px] overflow-hidden rounded-xl p-5 text-white`}><BadgePercent className="absolute right-3 top-3 opacity-30" size={44}/><b>{title}</b><p className="mt-2 text-xs text-white/80">{sub}</p></Link>)}
        </div>
      </section>
    </main>
  );
}
