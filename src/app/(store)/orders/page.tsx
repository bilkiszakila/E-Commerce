"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatRupiah } from "@/app/components";
import { supabase } from "@/lib/supabase/client";

type OrderRow = { id:string; total:number; status:string; created_at:string; courier:string|null };

function statusLabel(status: string) {
  if (status === "pending") return "Belum Dibayar";
  if (status === "waiting_verification") return "Menunggu Konfirmasi";
  if (status === "Diproses" || status === "paid") return "Diproses";
  if (status === "Dikirim") return "Dikirim";
  if (status === "Selesai") return "Selesai";
  if (status === "Dibatalkan") return "Dibatalkan";
  return status;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tab, setTab] = useState("Semua");
  const [loading, setLoading] = useState(true);
  const tabs = ["Semua", "Belum Dibayar", "Diproses", "Dikirim", "Selesai", "Penilaian"];

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { setLoading(false); return; }
      const { data: rows } = await supabase
        .from("orders")
        .select("id,total,status,created_at,courier")
        .eq("user_id", data.session.user.id)
        .order("created_at", { ascending: false });
      setOrders(rows || []);
      setLoading(false);
    });
  }, []);

  const visible = orders.filter((order) => {
    if (tab === "Semua") return true;
    if (tab === "Belum Dibayar") return order.status === "pending";
    if (tab === "Diproses") return order.status === "Diproses" || order.status === "paid" || order.status === "waiting_verification";
    if (tab === "Dikirim") return order.status === "Dikirim";
    if (tab === "Selesai") return order.status === "Selesai";
    if (tab === "Penilaian") return order.status === "Selesai";
    return true;
  });

  return (
    <main className="mx-auto max-w-[1180px] px-4 py-6 md:px-5">
      <h1 className="mb-5 text-xl font-black">Pesanan Saya</h1>
      <div className="hide-scrollbar mb-4 flex gap-2 overflow-x-auto rounded-xl bg-white p-2">
        {tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`shrink-0 rounded-lg px-4 py-2 text-xs ${tab === item ? "bg-red-50 font-bold text-red-500" : "text-slate-500"}`}>{item}</button>)}
      </div>
      {loading ? (
        <div className="rounded-xl bg-white p-12 text-center text-sm text-slate-400">Memuat pesanan...</div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center text-sm text-slate-500">Belum ada pesanan pada tab ini.</div>
      ) : (
        <div className="space-y-3">
          {visible.map((order) => {
            const href = order.status === "pending" ? `/payment/${order.id}` : `/orders/${order.id}`;
            return (
              <Link key={order.id} href={href} className="block rounded-xl border bg-white p-5">
                <div className="flex items-center justify-between border-b pb-3">
                  <b className="text-sm">{order.id}</b>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">{statusLabel(order.status)}</span>
                </div>
                <div className="mt-4 flex justify-between text-sm">
                  <div><p className="text-slate-500">Pengiriman</p><b>{order.courier || "-"}</b></div>
                  <div className="text-right"><p className="text-slate-500">Total</p><b className="text-red-500">{formatRupiah(order.total)}</b></div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
