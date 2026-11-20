"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, MapPin } from "lucide-react";
import { useStore } from "../store";
import { formatRupiah } from "../components";

export default function CartPage() {
  const { cart, updateQuantity, removeItem, cartTotal } = useStore();
  return (
    <main className="mx-auto max-w-[1180px] px-4 py-6 md:px-5">
      <h1 className="mb-5 text-xl font-black md:text-2xl">Keranjang Belanja</h1>
      {cart.length === 0 ? <div className="rounded-xl bg-white p-12 text-center"><div className="text-5xl">🛒</div><h2 className="mt-4 font-bold">Keranjang masih kosong</h2><p className="mt-2 text-sm text-slate-500">Temukan produk cetak yang Anda butuhkan.</p><Link href="/" className="mt-5 inline-block rounded-lg bg-red-500 px-6 py-3 text-sm font-bold text-white">Mulai Belanja</Link></div> :
      <div className="grid gap-5 md:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {cart.map((item) => <div key={item.key} className="flex gap-3 rounded-xl bg-white p-3 md:p-4">
            <img src={item.product.image} alt={item.product.name} className="h-24 w-24 rounded-lg object-cover"/>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-bold">{item.product.name}</p>
              <p className="mt-1 text-xs text-slate-500">{item.variants}</p>
              <div className="mt-3 flex items-end justify-between">
                <div className="flex items-center rounded border"><button onClick={() => updateQuantity(item.key, item.quantity-1)} className="grid h-8 w-8 place-items-center"><Minus size={13}/></button><span className="w-8 text-center text-xs">{item.quantity}</span><button onClick={() => updateQuantity(item.key, item.quantity+1)} className="grid h-8 w-8 place-items-center"><Plus size={13}/></button></div>
                <b className="text-red-500">{formatRupiah(item.unitPrice*item.quantity)}</b>
              </div>
            </div>
            <button onClick={() => removeItem(item.key)} className="h-fit text-slate-400"><Trash2 size={17}/></button>
          </div>)}
        </div>
        <aside className="h-fit rounded-xl bg-white p-5">
          <h2 className="font-black">Ringkasan Belanja</h2>
          <div className="mt-4 space-y-3 border-b pb-4 text-sm"><div className="flex justify-between"><span className="text-slate-500">Subtotal</span><b>{formatRupiah(cartTotal)}</b></div><div className="flex justify-between"><span className="text-slate-500">Diskon</span><b className="text-red-500">Rp0</b></div></div>
          <div className="mt-4 flex justify-between"><b>Total</b><b className="text-xl text-red-500">{formatRupiah(cartTotal)}</b></div>
          <Link href="/checkout" className="mt-5 block rounded-lg bg-red-500 py-3 text-center text-sm font-bold text-white">Checkout</Link>
          <p className="mt-3 flex items-center justify-center gap-1 text-[11px] text-slate-400"><MapPin size={13}/> Ongkir dihitung saat checkout</p>
        </aside>
      </div>}
    </main>
  );
}
