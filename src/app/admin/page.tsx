"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Package, ShoppingBag, Tag, Globe, ShoppingCart, TrendingUp } from "lucide-react";
import { supabase } from "../../lib/supabase/client";

type DashboardCounts = {
  orders: number;
  products: number;
  vouchers: number;
  customers: number;
  pending: number;
  processing: number;
  cancelled: number;
  returned: number;
  sales: number;
};

export default function AdminPage() {
  const [counts, setCounts] = useState<DashboardCounts>({
    orders: 0, products: 0, vouchers: 0, customers: 0,
    pending: 0, processing: 0, cancelled: 0, returned: 0, sales: 0,
  });

  useEffect(() => {
    Promise.all([
      supabase.from("orders").select("total,status"),
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("vouchers").select("*", { count: "exact", head: true }).eq("active", true),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]).then(([ordersResult, productsResult, vouchersResult, customersResult]) => {
      const orders = ordersResult.data || [];
      setCounts({
        orders: orders.length,
        products: productsResult.count || 0,
        vouchers: vouchersResult.count || 0,
        customers: customersResult.count || 0,
        pending: orders.filter((item) => item.status === "Menunggu Pembayaran").length,
        processing: orders.filter((item) => ["Diproses", "Dikirim"].includes(item.status)).length,
        cancelled: orders.filter((item) => item.status === "Dibatalkan").length,
        returned: orders.filter((item) => item.status === "Retur").length,
        sales: orders.reduce((sum, item) => sum + Number(item.total || 0), 0),
      });
    });
  }, []);

  return (
    <main className="p-5 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs text-slate-400">Adicetak Admin</p><h1 className="mt-1 text-2xl font-black">Dashboard</h1></div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-lg border bg-white px-4 py-2"><p className="text-[11px] text-slate-400">Date range</p><b className="text-xs">Bulan ini</b></div>
          <div className="rounded-lg border bg-white px-4 py-2"><p className="text-[11px] text-slate-400">Status data</p><b className="text-xs text-emerald-600">Terhubung Supabase</b></div>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Perlu Diproses", counts.pending, "text-blue-700", "bg-blue-50"],
          ["Sudah Diproses", counts.processing, "text-emerald-700", "bg-emerald-50"],
          ["Dibatalkan", counts.cancelled, "text-red-700", "bg-red-50"],
          ["Retur", counts.returned, "text-amber-700", "bg-amber-50"],
        ].map(([label, value, color, bg]) => <div key={String(label)} className={`${bg} rounded-xl border border-white p-5 text-center`}><b className={`block text-3xl ${color}`}>{value as number}</b><span className="mt-2 block text-xs text-slate-600">{label as string}</span></div>)}
      </section>

      <section className="mt-5">
        <h2 className="mb-3 font-black">Performa Toko</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Penjualan", `Rp ${counts.sales.toLocaleString("id-ID")}`, <TrendingUp size={19}/>],
            ["Pengunjung Web", "0", <Globe size={19}/>],
            ["Jumlah Produk Aktif", counts.products, <Package size={19}/>],
            ["Pesanan", counts.orders, <ShoppingCart size={19}/>],
          ].map(([label, value, icon]) => <div key={String(label)} className="rounded-xl border bg-white p-5"><div className="mb-3 text-blue-600">{icon}</div><span className="text-xs text-slate-500">{label as string}</span><b className="mt-1 block text-xl">{value as string | number}</b></div>)}
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-black">Grafik Penjualan</h2><span className="text-xs text-slate-400">30 hari terakhir</span></div><div className="grid h-44 place-items-center rounded-lg border border-dashed text-xs text-slate-400">Belum ada data grafik</div></div>
        <div className="rounded-xl border bg-white p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-black">Pesanan Terbaru</h2><Link href="/admin/orders" className="text-xs font-bold text-blue-600">Lihat semua</Link></div><p className="grid h-44 place-items-center rounded-lg border border-dashed text-xs text-slate-400">Belum ada pesanan</p></div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Link href="/admin/products" className="rounded-xl border bg-white p-4"><Package className="text-blue-600" size={20}/><b className="mt-3 block text-sm">Kelola Produk</b></Link>
        <Link href="/admin/categories" className="rounded-xl border bg-white p-4"><Tag className="text-blue-600" size={20}/><b className="mt-3 block text-sm">Kategori</b></Link>
        <Link href="/admin/customers" className="rounded-xl border bg-white p-4"><ShoppingBag className="text-blue-600" size={20}/><b className="mt-3 block text-sm">Pelanggan ({counts.customers})</b></Link>
        <Link href="/admin/discounts" className="rounded-xl border bg-white p-4"><Tag className="text-blue-600" size={20}/><b className="mt-3 block text-sm">Diskon & Voucher</b></Link>
      </section>
    </main>
  );
}
