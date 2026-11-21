"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { products, categories } from "../data";
import { formatRupiah } from "../components";

function CategoryContent() {
  const search = useSearchParams();
  const selected = search.get("name") || "Semua Produk";
  const [sort, setSort] = useState("Terlaris");
  const list = selected === "Semua Produk" ? products : products.filter((p) => p.category === selected);
  const visible = list.length ? list : products;

  return (
    <main className="mx-auto max-w-[1180px] px-4 py-6 md:px-5">
      <div className="mb-5 flex items-center justify-between">
        <div><p className="text-xs text-slate-400">Beranda / Kategori</p><h1 className="mt-1 text-xl font-black">{selected}</h1></div>
        <button className="flex h-10 items-center gap-2 rounded-lg border bg-white px-3 text-xs font-bold md:hidden"><SlidersHorizontal size={15}/> Filter</button>
      </div>
      <div className="grid gap-5 md:grid-cols-[210px_1fr]">
        <aside className="hidden h-fit rounded-xl bg-white p-4 md:block">
          <b className="text-sm">Kategori</b>
          <div className="mt-3 space-y-1">
            {categories.map(([name]) => (
              <Link href={`/category?name=${encodeURIComponent(name)}`} key={name} className={`block rounded px-2 py-2 text-xs ${selected === name ? "bg-red-50 font-bold text-red-500" : "text-slate-600"}`}>{name}</Link>
            ))}
          </div>
        </aside>
        <div>
          <div className="mb-3 flex h-11 items-center justify-between rounded-lg bg-white px-3">
            <span className="text-xs text-slate-500">{visible.length} produk</span>
            <select value={sort} onChange={(e)=>setSort(e.target.value)} className="text-xs font-bold outline-none"><option>Terlaris</option><option>Termurah</option><option>Terbaru</option></select>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((p)=>(
              <Link href={`/product/${p.id}`} key={p.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <img src={p.image} alt={p.name} className="h-36 w-full object-cover md:h-44"/>
                <div className="p-3"><p className="line-clamp-2 min-h-10 text-xs font-bold">{p.name}</p><b className="mt-2 block text-sm text-red-500">{formatRupiah(p.price)}</b><p className="mt-1 text-[10px] text-slate-400">★ {p.rating} · {p.sold}+ terjual</p></div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CategoryPage(){ return <Suspense><CategoryContent/></Suspense>; }
