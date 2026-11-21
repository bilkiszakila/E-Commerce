"use client";

import Link from "next/link";
import { House, Grid3X3, Heart, ShoppingBag, UserRound } from "lucide-react";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 border-t bg-white px-2 py-2 md:hidden">
      <Link href="/" className="grid place-items-center gap-1 text-[10px]"><House size={19}/>Beranda</Link>
      <Link href="/category" className="grid place-items-center gap-1 text-[10px]"><Grid3X3 size={19}/>Kategori</Link>
      <Link href="/wishlist" className="grid place-items-center gap-1 text-[10px]"><Heart size={19}/>Favorit</Link>
      <Link href="/cart" className="grid place-items-center gap-1 text-[10px]"><ShoppingBag size={19}/>Keranjang</Link>
      <Link href="/account" className="grid place-items-center gap-1 text-[10px]"><UserRound size={19}/>Akun</Link>
    </nav>
  );
}
