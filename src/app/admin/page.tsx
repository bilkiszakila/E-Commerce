"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2, Settings, ShoppingBag, Tag } from "lucide-react";

export default function AdminPage() {
  const [bank] = useState(() => {
    if (typeof window === "undefined") return { bank: "BCA", accountName: "PT Adi Cetak", accountNumber: "1234567890" };
    try { return JSON.parse(localStorage.getItem("adicetak-bank") || '{"bank":"BCA","accountName":"PT Adi Cetak","accountNumber":"1234567890"}'); } catch { return { bank: "BCA", accountName: "PT Adi Cetak", accountNumber: "1234567890" }; }
  });
  return (
    <main className="mx-auto max-w-295 px-4 py-8 md:px-5">
      <div className="mb-6 flex items-center justify-between">
        <div><p className="text-xs text-slate-400">Adicetak Admin</p><h1 className="mt-1 text-2xl font-black">Dashboard</h1></div>
        <Link href="/admin/settings" className="flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-bold text-white"><Settings size={15}/> Pengaturan</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5"><ShoppingBag className="text-red-500" size={24}/><p className="mt-4 text-xs text-slate-400">Pesanan</p><b className="text-2xl">-</b></div>
        <div className="rounded-xl bg-white p-5"><Tag className="text-red-500" size={24}/><p className="mt-4 text-xs text-slate-400">Voucher Aktif</p><b className="text-2xl">2</b></div>
        <div className="rounded-xl bg-white p-5"><Building2 className="text-red-500" size={24}/><p className="mt-4 text-xs text-slate-400">Rekening Transfer</p><b className="mt-1 block text-sm">{bank.bank} · {bank.accountNumber}</b></div>
      </div>
      <section className="mt-5 rounded-xl bg-white p-5">
        <h2 className="font-black">Menu Admin</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link href="/admin/settings" className="flex items-center gap-3 rounded-lg border p-4"><Building2 size={20} className="text-red-500"/><div><b className="block text-sm">Pembayaran & Rekening</b><span className="text-xs text-slate-400">Edit bank dan nomor rekening</span></div></Link>
          <Link href="/admin/settings#vouchers" className="flex items-center gap-3 rounded-lg border p-4"><Tag size={20} className="text-red-500"/><div><b className="block text-sm">Voucher & Kode Member</b><span className="text-xs text-slate-400">Kelola kode diskon</span></div></Link>
        </div>
      </section>
    </main>
  );
}
