"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { ProductCard } from "../components";
import { getProducts, getCategories } from "../../lib/supabase/data";
import type { Product } from "../data";

function CategoryContent() {
  const search = useSearchParams();
  const selected = search.get("name") || "Semua Produk";
  const [sort, setSort] = useState("Terlaris");
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const [displayCategories, setDisplayCategories] = useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  useEffect(() => {
    Promise.all([getProducts(), getCategories()]).then(([items, categoryItems]) => {
      setDisplayProducts(items);
      setDisplayCategories(categoryItems.map((category) => category.name));
      setLoadingProducts(false);
    });
  }, []);
  const list = selected === "Semua Produk" ? displayProducts : displayProducts.filter((p) => p.category === selected);
  const visible = list;

  return (
    <main className="mx-auto max-w-295 px-4 py-6 md:px-5">
      <div className="mb-5 flex items-center justify-between">
        <div><p className="text-xs text-slate-400">Beranda / Kategori</p><h1 className="mt-1 text-xl font-black">{selected}</h1></div>
        <button className="flex h-10 items-center gap-2 rounded-lg border bg-white px-3 text-xs font-bold md:hidden"><SlidersHorizontal size={15}/> Filter</button>
      </div>
      <div className="grid gap-5 md:grid-cols-[210px_1fr]">
        <aside className="hidden h-fit rounded-xl bg-white p-4 md:block">
          <b className="text-sm">Kategori</b>
          <div className="mt-3 space-y-1">
            {displayCategories.length ? displayCategories.map((name) => (
              <Link href={`/category?name=${encodeURIComponent(name)}`} key={name} className={`block rounded px-2 py-2 text-xs ${selected === name ? "bg-red-50 font-bold text-red-500" : "text-slate-600"}`}>{name}</Link>
            )) : <p className="text-xs text-slate-400">Belum ada kategori.</p>}
          </div>
        </aside>
        <div>
          <div className="mb-3 flex h-11 items-center justify-between rounded-lg bg-white px-3">
            <span className="text-xs text-slate-500">{visible.length} produk</span>
            <select value={sort} onChange={(e)=>setSort(e.target.value)} className="text-xs font-bold outline-none"><option>Terlaris</option><option>Termurah</option><option>Terbaru</option></select>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {loadingProducts ? <p className="col-span-full py-8 text-xs text-slate-400">Memuat produk...</p> : visible.length ? visible.map((p)=>(
              <ProductCard key={p.id} product={p} className="w-full" />
            )) : <p className="col-span-full py-8 text-xs text-slate-400">Belum ada produk pada kategori ini.</p>}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CategoryPage(){ return <Suspense><CategoryContent/></Suspense>; }
