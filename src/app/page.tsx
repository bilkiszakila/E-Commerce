"use client";

import Link from "next/link";
import { ShieldCheck, Truck, RotateCcw, Headphones, ChevronRight, ChevronLeft } from "lucide-react";
import { categories, products } from "./data";
import { ProductCard } from "./components";

export default function Home() {
  return (
    <main>
      <section className="mx-auto max-w-[1180px] px-4 pt-4 md:px-5">
        <div className="relative hidden md:block">
          <div className="flex h-[290px] overflow-hidden rounded-xl bg-slate-950">
            <div className="relative z-10 flex w-[58%] flex-col justify-center px-10 text-white">
              <span className="mb-3 w-fit rounded-full bg-red-500 px-3 py-1 text-xs font-bold">PROMO NOVEMBER</span>
              <h1 className="max-w-md text-4xl font-black leading-tight">Bikin Brand Lebih Dilihat</h1>
              <p className="mt-3 max-w-md text-sm text-blue-100">Cetak banner, stiker, dan kebutuhan advertising dengan kualitas warna tajam.</p>
              <Link href="/promo" className="mt-6 w-fit rounded-lg bg-white px-5 py-3 text-sm font-bold text-slate-900">Lihat Promo</Link>
            </div>
            <img src="https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?auto=format&fit=crop&w=1000&q=90" alt="Promo cetak" className="h-full w-[42%] object-cover opacity-90" />
          </div>
          <button className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white shadow"><ChevronLeft size={18}/></button>
          <button className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white shadow"><ChevronRight size={18}/></button>
        </div>
        <div className="relative h-[150px] overflow-hidden rounded-lg md:hidden">
          <img src="https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?auto=format&fit=crop&w=900&q=90" alt="Promo cetak" className="h-full w-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-r from-[#1842D2] to-[#1842D2]/70 p-5 text-white"><b className="text-[10px]">PROMO NOVEMBER</b><h1 className="mt-2 max-w-[220px] text-xl font-black leading-tight">Bikin Brand Lebih Dilihat</h1><Link href="/promo" className="mt-4 inline-block rounded-md bg-white px-3 py-2 text-[11px] font-bold text-[var(--brand-primary)]">Lihat Promo</Link></div>
        </div>

        <div className="mt-4 hidden grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-700 md:grid md:grid-cols-4">
          {[
            [Truck, "Gratis Ongkir*", "Minimal pembelian"],
            [ShieldCheck, "Pembayaran Aman", "Diproses Xendit"],
            [RotateCcw, "Garansi Cetak", "Hasil sesuai pesanan"],
            [Headphones, "Bantuan 24/7", "Admin siap membantu"],
          ].map(([Icon, title, sub], i) => {
            const IconComponent = Icon as typeof Truck;
            return <div key={i} className="flex items-center gap-3 border-b border-r px-4 py-4 md:border-b-0 md:last:border-r-0"><IconComponent className="shrink-0 text-red-500" size={24}/><div><b className="block text-xs md:text-sm">{title as string}</b><span className="text-[10px] text-slate-400 md:text-xs">{sub as string}</span></div></div>;
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-3 pt-5 md:px-5 md:pt-8">
        <div className="mb-3 flex items-center justify-between px-0"><h2 className="text-sm font-black md:text-xl">Kategori Produk</h2><Link href="/category" className="text-[10px] font-bold text-[var(--brand-primary)] md:text-xs md:text-slate-500">Lihat Semua</Link></div>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
          {categories.map(([name, image]) => <Link href={`/category?name=${encodeURIComponent(name)}`} key={name} className="group h-[108px] overflow-hidden rounded-[8px] border-[1.5px] border-[var(--brand-primary)] bg-white text-center md:h-[150px]">
            <div className="mx-auto mt-2 h-[62px] w-[62px] overflow-hidden md:mt-3 md:h-[92px] md:w-[92px]">
              <img src={image} alt={name} className="h-full w-full object-contain transition group-hover:scale-105"/>
            </div>
            <b className="mx-auto block h-8 max-w-[94px] px-1 pt-1 text-[11px] leading-[15px] text-[var(--brand-text)] md:max-w-none md:text-sm">{name}</b>
          </Link>)}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-3 pt-5 md:px-5 md:pt-8">
        <div className="mb-3 flex items-center justify-between px-1"><h2 className="text-sm font-black md:text-xl">Promo Akhir Tahun</h2><Link href="/promo" className="text-[10px] font-bold text-[var(--brand-primary)] md:text-xs">Lihat Semua</Link></div>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-3">
          {products.slice(0, 4).map((p) => <ProductCard key={p.id} product={p}/>)}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-3 pt-5 md:px-5 md:pt-8">
        <div className="mb-3 flex items-center justify-between px-1"><h2 className="text-sm font-black md:text-xl">Rekomendasi Untuk Anda</h2><Link href="/category" className="text-[10px] font-bold text-[var(--brand-primary)] md:text-xs md:text-slate-500">Lihat semua</Link></div>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-3">
          {products.slice(4).concat(products.slice(0, 4)).map((p) => <ProductCard key={p.id + "-rec"} product={p}/>)}
        </div>
      </section>

    </main>
  );
}
