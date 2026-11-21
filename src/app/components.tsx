"use client";

import Link from "next/link";
import { ChevronDown, Heart, MapPin, Menu, Search, ShoppingBag, Star, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useStore } from "./store";
import { categories } from "./data";

export function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { cartCount, loggedIn } = useStore();

  return (
    <header className="sticky top-0 z-50">
      <div className="hidden md:block border-b border-slate-200 bg-white text-xs">
        <div className="mx-auto flex h-9 max-w-[1180px] items-center justify-between px-5 text-slate-500">
          <div className="flex items-center gap-5">
            <span>Pesan mudah, cetak rapi.</span>
            <span className="flex items-center gap-1"><MapPin size={13} /> Kirim ke Jakarta</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/promo">Promo</Link><Link href="/account/orders">Lacak Pesanan</Link>
            <Link href="/admin">Admin</Link>
            <button className="flex items-center gap-1">Bahasa Indonesia <ChevronDown size={12} /></button>
          </div>
        </div>
      </div>
      <div className="bg-slate-950 text-white">
        <div className="mx-auto flex h-[68px] max-w-[1180px] items-center gap-4 px-4">
          <button onClick={() => setOpen(true)} className="md:hidden" aria-label="Buka menu"><Menu /></button>
          <Link href="/" className="shrink-0 text-xl font-black tracking-tight">
            <span className="text-red-500">ADI</span> CETAK
          </Link>
          <div className="hidden h-11 flex-1 items-center rounded-lg bg-white md:flex">
            <Search className="ml-4 text-slate-400" size={18} />
            <input className="h-full min-w-0 flex-1 px-3 text-sm text-slate-800 outline-none" placeholder="Cari banner, stiker, brosur, kaos..." />
            <button className="mr-1 h-9 rounded-md bg-red-500 px-5 text-sm font-bold">Cari</button>
          </div>
          <button onClick={() => setSearchOpen(true)} className="ml-auto md:hidden" aria-label="Cari"><Search /></button>
          <Link href="/wishlist" className="hidden text-slate-300 md:block" aria-label="Favorit"><Heart size={22} /></Link>
          <Link href="/account" className="hidden items-center gap-2 md:flex">
            <UserRound size={22} />
            <span className="text-xs leading-tight">{loggedIn ? "Halo, Anda" : "Masuk / Daftar"}<br /><b>Akun Saya</b></span>
          </Link>
          <Link href="/cart" className="relative ml-1" aria-label="Keranjang">
            <ShoppingBag size={25} />
            {cartCount > 0 && <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold">{cartCount}</span>}
          </Link>
        </div>
      </div>
      {open && <div className="fixed inset-0 z-[70] bg-black/40" onClick={() => setOpen(false)}>
        <aside className="h-full w-[82%] max-w-sm bg-white p-5 text-slate-900" onClick={(e) => e.stopPropagation()}>
          <div className="mb-6 flex items-center justify-between"><b className="text-lg">Semua Kategori</b><button onClick={() => setOpen(false)}><X /></button></div>
          {categories.map(([name]) => <Link onClick={() => setOpen(false)} href={`/category?name=${encodeURIComponent(name)}`} key={name} className="block border-b py-3 text-sm">{name}</Link>)}
          <Link onClick={() => setOpen(false)} href="/account" className="mt-5 flex items-center gap-2 rounded-lg bg-slate-100 p-3"><UserRound size={18}/> Akun Saya</Link>
        </aside>
      </div>}
      {searchOpen && <div className="absolute inset-x-0 top-[68px] bg-white p-3 md:hidden">
        <div className="flex rounded-lg border"><input autoFocus className="h-11 flex-1 px-3 outline-none" placeholder="Cari produk..." /><button className="px-4"><Search /></button></div>
      </div>}
    </header>
  );
}

export function Footer() {
  return <footer className="mt-12 border-t bg-slate-950 py-10 text-slate-300">
    <div className="mx-auto grid max-w-[1180px] gap-8 px-5 text-sm md:grid-cols-4">
      <div><div className="mb-3 text-xl font-black text-white"><span className="text-red-500">ADI</span> CETAK</div><p className="text-slate-400">Solusi cetak cepat untuk kebutuhan bisnis dan personal.</p></div>
      <div><b className="mb-3 block text-white">Belanja</b><p>Semua Produk</p><p>Promo</p><p>Produk Baru</p></div>
      <div><b className="mb-3 block text-white">Bantuan</b><p>Cara Pemesanan</p><p>Pembayaran</p><p>Lacak Pesanan</p></div>
      <div><b className="mb-3 block text-white">Hubungi Kami</b><p>WhatsApp: 0812-8888-9999</p><p>Senin–Sabtu, 08.00–17.00</p></div>
    </div>
  </footer>;
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export function ProductCard({ product }: { product: import("./data").Product }) {
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  return (
    <article className="product-card relative w-[148px] overflow-hidden rounded-[10px] border border-[var(--brand-border)] bg-white transition">
      <Link href={`/product/${product.id}`} className="block">
        <div className="mx-2 mt-2 relative aspect-square w-[132px] overflow-hidden rounded-[7px] bg-[var(--brand-surface)]">
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          {product.badge && (
            <span className="absolute left-2 top-2 rounded-[4px] bg-[var(--brand-accent)] px-2 py-1 text-[9px] font-bold leading-none text-white">
              {product.badge}
            </span>
          )}
        </div>
        <div className="px-2 pb-2 pt-2.5">
          <p className="line-clamp-2 min-h-8 text-[11px] font-semibold leading-4 text-[var(--brand-text)]">
            {product.name}
          </p>
          <p className="mt-1 text-[14px] font-black leading-5 text-[var(--brand-primary)]">
            {formatRupiah(product.price)}
          </p>
          {product.oldPrice && (
            <p className="mt-0.5 flex items-center gap-1 text-[9px] leading-3 text-slate-400">
              <span className="line-through">{formatRupiah(product.oldPrice)}</span>
              {discount > 0 && <span className="text-[var(--brand-danger)]">-{discount}%</span>}
            </p>
          )}
          <p className="mt-1.5 flex items-center gap-1 text-[9px] leading-3 text-slate-500">
            <Star size={9} fill="#FF7401" className="text-[var(--brand-accent)]" />
            {product.rating} · {product.sold}+ terjual
          </p>
        </div>
      </Link>
      <button
        type="button"
        className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full border border-[var(--brand-border)] bg-white/95 text-[var(--brand-text)] shadow-sm"
        aria-label={`Tambah ${product.name} ke favorit`}
      >
        <Heart size={14} />
      </button>
    </article>
  );
}
