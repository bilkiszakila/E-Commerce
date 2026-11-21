"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";

type OrderRow = {
  id: string;
  status: string;
  courier: string | null;
  payment: string | null;
  total: number;
  created_at: string;
};

const statuses = ["Menunggu Pembayaran", "Diproses", "Dikirim", "Selesai", "Dibatalkan"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const { data, error } = await supabase.from("orders").select("id,status,courier,payment,total,created_at").order("created_at", { ascending: false });
    if (error) setMessage(error.message);
    else setOrders(data || []);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) setMessage(error.message);
    else load();
  }

  return (
    <main className="mx-auto max-w-[1180px] px-4 py-8 md:px-5">
      <div className="mb-5"><Link href="/admin" className="mb-2 flex items-center gap-1 text-xs font-bold text-slate-500"><ArrowLeft size={14}/> Dashboard</Link><h1 className="text-2xl font-black">Pengelolaan Pesanan</h1></div>
      {message && <p className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-500">{message}</p>}
      <section className="overflow-hidden rounded-xl bg-white">
        {orders.length === 0 ? (
          <div className="py-14 text-center"><ShoppingBag className="mx-auto text-slate-300" size={36}/><p className="mt-3 text-sm text-slate-500">Belum ada pesanan.</p></div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-slate-50 text-xs text-slate-500"><tr><th className="p-4">Pesanan</th><th>Tanggal</th><th>Pengiriman</th><th>Total</th><th className="p-4">Status</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-b last:border-0"><td className="p-4 font-bold">{order.id}<span className="block text-[11px] font-normal text-slate-400">{order.payment || "-"}</span></td><td>{new Date(order.created_at).toLocaleDateString("id-ID")}</td><td>{order.courier || "-"}</td><td className="font-bold text-red-500">Rp {order.total.toLocaleString("id-ID")}</td><td className="p-4"><select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} className="h-10 min-w-40 rounded-lg border px-3 text-xs font-bold">{statuses.map((status) => <option key={status}>{status}</option>)}</select></td></tr>)}</tbody></table></div>
        )}
      </section>
    </main>
  );
}
