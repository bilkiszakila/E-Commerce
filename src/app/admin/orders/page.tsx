"use client";

import { useEffect, useState } from "react";
import { Filter, Search, ShoppingBag } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";

type OrderRow = { id: string; status: string; courier: string|null; payment: string|null; total: number; created_at: string };
const statuses = ["Semua", "Menunggu Pembayaran", "Diproses", "Dikirim", "Selesai", "Dibatalkan", "Retur"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [status, setStatus] = useState("Semua");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("Diproses");
  const [message, setMessage] = useState("");

  async function load() {
    const { data, error } = await supabase.from("orders").select("id,status,courier,payment,total,created_at").order("created_at", { ascending: false });
    if (error) setMessage(error.message); else setOrders(data || []);
  }
  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, nextStatus: string) {
    const { error } = await supabase.from("orders").update({ status: nextStatus }).eq("id", id);
    if (error) setMessage(error.message); else load();
  }

  async function applyBulkStatus() {
    if (!selected.length) return;
    const { error } = await supabase.from("orders").update({ status: bulkStatus }).in("id", selected);
    if (error) setMessage(error.message);
    else { setSelected([]); load(); }
  }

  const visible = orders.filter((order) => (status === "Semua" || order.status === status) && order.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="p-5 md:p-8">
      <div className="mb-5 flex items-center justify-between"><h1 className="text-2xl font-black">Pesanan</h1><span className="rounded-lg border bg-white px-3 py-2 text-xs font-bold">{visible.length} pesanan</span></div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {statuses.map((item) => <button key={item} onClick={() => setStatus(item)} className={`h-9 rounded-lg px-3 text-xs ${status === item ? "bg-blue-50 font-bold text-[var(--brand-primary)]" : "border bg-white"}`}>{item === "Semua" ? `Semua (${orders.length})` : item}</button>)}
      </div>
      <div className="mb-4 flex flex-wrap gap-2 rounded-xl border bg-white p-3">
        <Filter size={16} className="mt-2 text-slate-400"/>
        <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="h-10 rounded-lg border px-3 text-xs"><option>Diproses</option><option>Dikirim</option><option>Selesai</option><option>Dibatalkan</option><option>Retur</option></select>
        <button onClick={applyBulkStatus} disabled={!selected.length} className="h-10 rounded-lg bg-[var(--brand-primary)] px-4 text-xs font-bold text-white disabled:opacity-40">Terapkan</button>
        <div className="ml-auto flex h-10 w-full items-center rounded-lg border px-3 sm:w-64"><Search size={15} className="text-slate-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari pesanan" className="h-full flex-1 px-2 text-xs outline-none"/></div>
      </div>
      {message && <p className="mb-3 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600">{message}</p>}
      <section className="overflow-hidden rounded-xl border bg-white">
        {visible.length === 0 ? <div className="py-14 text-center"><ShoppingBag className="mx-auto text-slate-300" size={36}/><p className="mt-3 text-sm text-slate-500">Belum ada pesanan.</p></div> :
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-slate-50 text-xs text-slate-500"><tr><th className="p-4"><input type="checkbox" checked={selected.length === visible.length} onChange={(e) => setSelected(e.target.checked ? visible.map((item) => item.id) : [])}/></th><th>Pesanan</th><th>Tanggal</th><th>Status</th><th>Total</th><th className="p-4">Origin</th></tr></thead><tbody>{visible.map((order) => <tr key={order.id} className="border-b last:border-0"><td className="p-4"><input type="checkbox" checked={selected.includes(order.id)} onChange={(e) => setSelected((old) => e.target.checked ? [...old, order.id] : old.filter((id) => id !== order.id))}/></td><td className="py-4 font-bold">{order.id}</td><td>{new Date(order.created_at).toLocaleDateString("id-ID")}</td><td><select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} className="h-9 rounded-full border px-3 text-xs font-bold">{statuses.filter((item) => item !== "Semua").map((item) => <option key={item}>{item}</option>)}</select></td><td className="font-bold">Rp {order.total.toLocaleString("id-ID")}</td><td className="p-4">{order.payment || "Direct"}</td></tr>)}</tbody></table></div>}
      </section>
    </main>
  );
}
