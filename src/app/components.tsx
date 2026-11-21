"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Heart, MapPin, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "./store";
import { categories, products } from "./data";
import brandLogo from "./images/brand-logo.svg";

export function ProductCard({ product, className = "" }: { product: typeof products[number]; className?: string }) {
  const effectivePrice = product.discountActive
    ? Math.round(product.price * (1 - (product.discountPercent || 0) / 100))
    : product.price;
  return (
    <Link href={`/product/${product.id}`} className={`product-card relative overflow-hidden rounded-xl border border-slate-200 bg-white p-2 transition ${className}`}>
      {product.badge && <span className="absolute left-4 top-4 z-10 rounded bg-orange-500 px-2 py-1 text-[9px] font-bold text-white">{product.badge}</span>}
      <button className="absolute right-4 top-4 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-slate-500 shadow" aria-label="Favorit"><Heart size={14} /></button>
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-slate-100">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
      </div>
      <div>
        <p className="mt-1 line-clamp-2 min-h-10 text-xs font-semibold leading-5 text-slate-800">{product.name}</p>
        <p className="mt-2 text-base font-black text-red-500">{formatRupiah(effectivePrice)}</p>
        {(product.oldPrice || product.discountActive) && (
          <p className="text-[11px] text-slate-400">
            <span className="mr-1 line-through">{formatRupiah(product.oldPrice || product.price)}</span>
            <span className="text-orange-500">
              -{product.discountActive
                ? (product.discountPercent || 0)
                : Math.round((1 - product.price / (product.oldPrice || product.price)) * 100)}%
            </span>
          </p>
        )}
        <p className="mt-2 text-[10px] text-slate-500">★ {product.rating} · {product.sold}+ terjual</p>
      </div>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { cartCount, loggedIn, isAdmin } = useStore();
  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-50">
      <div className="hidden md:block border-b border-slate-200 bg-white text-xs">
        <div className="mx-auto flex h-9 max-w-295 items-center justify-between px-5 text-slate-500">
          <div className="flex items-center gap-5">
            <span>Pesan mudah, cetak rapi.</span>
            <span className="flex items-center gap-1"><MapPin size={13} /> Kirim ke Jakarta</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/promo">Promo</Link><Link href="/account/orders">Lacak Pesanan</Link>
            {isAdmin && <Link href="/admin" className="font-bold text-red-500">Admin</Link>}
            <button className="flex items-center gap-1">Bahasa Indonesia <ChevronDown size={12} /></button>
          </div>
        </div>
      </div>
      <div className="bg-white text-slate-950">
        <div className="mx-auto flex h-17 max-w-295 items-center gap-4 px-4">
          <button onClick={() => setOpen(true)} className="md:hidden" aria-label="Buka menu"><Menu /></button>
          <Link href="/" className="shrink-0" aria-label="ADI CETAK - Beranda">
            <Image
              src={brandLogo}
              alt="ADI CETAK"
              width={146}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <div className="hidden h-11 flex-1 items-center rounded-lg border border-slate-200 bg-white md:flex">
            <Search className="ml-4 text-slate-400" size={18} />
            <input className="h-full min-w-0 flex-1 px-3 text-sm text-slate-800 outline-none" placeholder="Cari banner, stiker, brosur, kaos..." />
            <button className="mr-1 h-9 rounded-md bg-red-500 px-5 text-sm font-bold text-white">Cari</button>
          </div>
          <button onClick={() => setSearchOpen(true)} className="ml-auto md:hidden" aria-label="Cari"><Search /></button>
          <Link href="/wishlist" className="hidden text-slate-300 md:block" aria-label="Favorit"><Heart size={22} /></Link>
          <Link href="/account" className="hidden items-center gap-2 md:flex">
            <UserRound size={22} />
            <span className="text-xs leading-tight">{loggedIn ? "Halo, Anda" : "Masuk / Daftar"}<br /><b>Akun Saya</b></span>
          </Link>
          <Link href="/cart" className="relative ml-1 p-2 rounded-full bg-red-500 text-white" aria-label="Keranjang">
            <ShoppingBag size={25} />
            {cartCount > 0 && <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-bold">{cartCount}</span>}
          </Link>
        </div>
      </div>
      {open && <div className="fixed inset-0 z-70 bg-black/40" onClick={() => setOpen(false)}>
        <aside className="h-full w-[82%] max-w-sm bg-white p-5 text-slate-900" onClick={(e) => e.stopPropagation()}>
          <div className="mb-6 flex items-center justify-between"><b className="text-lg">Semua Kategori</b><button onClick={() => setOpen(false)}><X /></button></div>
          {categories.map(([name]) => <Link onClick={() => setOpen(false)} href={`/category?name=${encodeURIComponent(name)}`} key={name} className="block border-b py-3 text-sm">{name}</Link>)}
          <Link onClick={() => setOpen(false)} href="/account" className="mt-5 flex items-center gap-2 rounded-lg bg-slate-100 p-3"><UserRound size={18}/> Akun Saya</Link>
        </aside>
      </div>}
      {searchOpen && <div className="absolute inset-x-0 top-17 bg-white p-3 md:hidden">
        <div className="flex rounded-lg border"><input autoFocus className="h-11 flex-1 px-3 outline-none" placeholder="Cari produk..." /><button className="px-4"><Search /></button></div>
      </div>}
    </header>
  );
}

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <footer className="mt-12 border-t bg-slate-950 py-10 text-slate-300">
    <div className="mx-auto grid max-w-295 gap-8 px-5 text-sm md:grid-cols-4">
      <div><Link href="/" className="mb-3 block" aria-label="ADI CETAK - Beranda"><Image src={brandLogo} alt="ADI CETAK" width={146} height={32} className="h-8 w-auto" /></Link><p className="text-slate-400">Harga Bersahabat, Kualitas Mantap.</p></div>
      <div><b className="mb-3 block text-white">Belanja</b><p>Semua Produk</p><p>Promo</p><p>Produk Baru</p></div>
      <div><b className="mb-3 block text-white">Bantuan</b><p>Cara Pemesanan</p><p>Pembayaran</p><p>Lacak Pesanan</p></div>
      <div><b className="mb-3 block text-white">Hubungi Kami</b><p>WhatsApp: 0812-8888-9999</p><p>Senin–Sabtu, 08.00–17.00</p></div>
    </div>
  </footer>;
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}
