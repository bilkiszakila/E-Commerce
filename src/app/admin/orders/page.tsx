"use client";

import { useEffect, useState } from "react";
import { Filter, MapPin, Printer, Search, ShoppingBag, X } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";

type ShippingAddress = {
  name?: string;
  phone?: string;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  postcode?: string;
  google_maps_url?: string;
};
type OrderItemRow = { id: string; name: string; quantity: number; unit_price: number; variants: string };
type OrderRow = {
  id: string;
  status: string;
  courier: string | null;
  payment: string | null;
  total: number;
  created_at: string;
  shipping_address: ShippingAddress;
  tracking_number: string | null;
  payment_proof_url: string | null;
  payment_confirmed_at: string | null;
  order_items: OrderItemRow[];
};

const tabs = ["Semua", "Belum Dibayar", "Menunggu Verifikasi", "Diproses", "Dikirim", "Selesai", "Dibatalkan"];
const updateStatuses = ["pending", "waiting_verification", "Diproses", "Dikirim", "Selesai", "Dibatalkan"];

function statusLabel(status: string) {
  if (status === "pending") return "Belum Dibayar";
  if (status === "waiting_verification") return "Menunggu Verifikasi";
  return status;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tab, setTab] = useState("Semua");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("Diproses");
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [detailOrder, setDetailOrder] = useState<OrderRow | null>(null);
  const [printOrder, setPrintOrder] = useState<OrderRow | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");

  async function load() {
    const { data, error } = await supabase
      .from("orders")
      .select("id,status,courier,payment,total,created_at,shipping_address,tracking_number,payment_proof_url,payment_confirmed_at,order_items(id,name,quantity,unit_price,variants)")
      .order("created_at", { ascending: false });
    if (error) setMessage(error.message);
    else setOrders((data || []) as OrderRow[]);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, nextStatus: string) {
    const { error } = await supabase.from("orders").update({ status: nextStatus }).eq("id", id);
    if (error) setMessage(error.message);
    else load();
  }

  async function applyBulkStatus() {
    if (!selected.length) return;
    const { error } = await supabase.from("orders").update({ status: bulkStatus }).in("id", selected);
    if (error) setMessage(error.message);
    else { setSelected([]); load(); }
  }

  async function verifyPayment(orderId: string) {
    const { error } = await supabase
      .from("orders")
      .update({ status: "Diproses", payment_confirmed_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) setMessage(error.message);
    else load();
  }

  async function rejectPayment(orderId: string) {
    const { error } = await supabase
      .from("orders")
      .update({ status: "pending", payment_proof_url: null, payment_confirmed_at: null })
      .eq("id", orderId);
    if (error) setMessage(error.message);
    else load();
  }

  function openPrint(order: OrderRow) {
    setTrackingNumber(order.tracking_number || "");
    setPrintOrder(order);
  }

  async function saveTrackingAndShip() {
    if (!printOrder) return;
    if (!trackingNumber.trim()) {
      setMessage("Nomor resi wajib diisi sebelum pesanan dikirim.");
      return;
    }
    const { error } = await supabase
      .from("orders")
      .update({ tracking_number: trackingNumber.trim(), status: "Dikirim" })
      .eq("id", printOrder.id);
    if (error) setMessage(error.message);
    else {
      setPrintOrder({ ...printOrder, tracking_number: trackingNumber.trim(), status: "Dikirim" });
      load();
      window.setTimeout(() => window.print(), 100);
    }
  }

  const visible = orders.filter((order) => {
    const matchesTab =
      tab === "Semua" ||
      (tab === "Belum Dibayar" && order.status === "pending") ||
      (tab === "Menunggu Verifikasi" && order.status === "waiting_verification") ||
      order.status === tab;
    return matchesTab && order.id.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <main className="p-5 md:p-8">
      <div className="mb-5 flex items-center justify-between"><h1 className="text-2xl font-black">Pesanan</h1><span className="rounded-lg border bg-white px-3 py-2 text-xs font-bold">{visible.length} pesanan</span></div>
      <div className="hide-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`shrink-0 rounded-lg px-3 py-2 text-xs ${tab === item ? "bg-blue-50 font-bold text-[var(--brand-primary)]" : "border bg-white"}`}>{item === "Semua" ? `Semua (${orders.length})` : item}</button>)}
      </div>
      <div className="mb-4 flex flex-wrap gap-2 rounded-xl border bg-white p-3">
        <Filter size={16} className="mt-2 text-slate-400"/>
        <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="h-10 rounded-lg border px-3 text-xs">{updateStatuses.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}</select>
        <button onClick={applyBulkStatus} disabled={!selected.length} className="h-10 rounded-lg bg-[var(--brand-primary)] px-4 text-xs font-bold text-white disabled:opacity-40">Terapkan</button>
        <div className="ml-auto flex h-10 w-full items-center rounded-lg border px-3 sm:w-64"><Search size={15} className="text-slate-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari pesanan" className="h-full flex-1 px-2 text-xs outline-none"/></div>
      </div>
      {message && <p className="mb-3 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600">{message}</p>}
      <section className="overflow-hidden rounded-xl border bg-white">
        {visible.length === 0 ? <div className="py-14 text-center"><ShoppingBag className="mx-auto text-slate-300" size={36}/><p className="mt-3 text-sm text-slate-500">Belum ada pesanan.</p></div> :
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs text-slate-500"><tr><th className="p-4"><input type="checkbox" checked={visible.length > 0 && selected.length === visible.length} onChange={(e) => setSelected(e.target.checked ? visible.map((item) => item.id) : [])}/></th><th>Pesanan</th><th>Tanggal</th><th>Status</th><th>Bukti</th><th>Total</th><th className="p-4">Aksi</th></tr></thead>
            <tbody>{visible.map((order) => (
              <tr key={order.id} className="border-b last:border-0">
                <td className="p-4"><input type="checkbox" checked={selected.includes(order.id)} onChange={(e) => setSelected((old) => e.target.checked ? [...old, order.id] : old.filter((id) => id !== order.id))}/></td>
                <td className="py-4"><button onClick={() => setDetailOrder(order)} className="font-bold text-[var(--brand-primary)]">{order.id}</button>{order.order_items.map((item) => <span key={item.id} className="mt-1 block text-[11px] font-normal text-slate-500">{item.quantity}× {item.name}</span>)}</td>
                <td>{new Date(order.created_at).toLocaleDateString("id-ID")}</td>
                <td><select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} className="h-9 rounded-full border px-3 text-xs font-bold">{updateStatuses.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}</select></td>
                <td className="p-2">{order.payment_proof_url ? <button onClick={() => setPreviewUrl(order.payment_proof_url || "")} className="block overflow-hidden rounded-lg border"><img src={order.payment_proof_url} alt="Bukti pembayaran" className="h-12 w-16 object-cover"/></button> : <span className="text-[11px] text-slate-400">-</span>}
                  {order.payment_proof_url && <div className="mt-1 flex gap-1"><button onClick={() => verifyPayment(order.id)} className="rounded bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white">Verifikasi</button><button onClick={() => rejectPayment(order.id)} className="rounded bg-red-500 px-2 py-1 text-[10px] font-bold text-white">Tolak</button></div>}
                </td>
                <td className="font-bold">Rp {order.total.toLocaleString("id-ID")}</td>
                <td className="p-4"><button onClick={() => openPrint(order)} className="flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold"><Printer size={14}/> Resi</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>}
      </section>

      {previewUrl && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-5" onClick={() => setPreviewUrl("")}><div className="relative max-h-[90vh] max-w-3xl" onClick={(event) => event.stopPropagation()}><button onClick={() => setPreviewUrl("")} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-bold">×</button><img src={previewUrl} alt="Preview bukti pembayaran" className="max-h-[90vh] max-w-full rounded-xl object-contain"/></div></div>}

      {detailOrder && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4" onClick={() => setDetailOrder(null)}><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><h2 className="font-black">Detail Pesanan {detailOrder.id}</h2><button onClick={() => setDetailOrder(null)}><X size={18}/></button></div><div className="mt-4 rounded-lg bg-slate-50 p-4"><p className="mb-2 flex items-center gap-2 font-black"><MapPin size={16}/> Alamat Pengiriman</p><p className="text-sm"><b>{detailOrder.shipping_address?.name || "-"}</b></p><p className="text-sm">{detailOrder.shipping_address?.phone || "-"}</p><p className="mt-2 text-xs text-slate-600">{detailOrder.shipping_address?.address || ""}, {detailOrder.shipping_address?.district || ""}, {detailOrder.shipping_address?.city || ""}, {detailOrder.shipping_address?.province || ""} {detailOrder.shipping_address?.postcode || ""}</p>{detailOrder.shipping_address?.google_maps_url && <a href={detailOrder.shipping_address.google_maps_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-blue-600">Buka Titik GPS di Google Maps</a>}</div><div className="mt-4 space-y-2">{detailOrder.order_items.map((item) => <div key={item.id} className="flex justify-between border-b pb-2 text-sm"><span>{item.quantity}× {item.name}<small className="block text-slate-400">{item.variants}</small></span><b>Rp {(item.quantity * item.unit_price).toLocaleString("id-ID")}</b></div>)}</div><button onClick={() => openPrint(detailOrder)} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg border text-xs font-bold"><Printer size={14}/> Cetak Resi</button></div></div>}

      {printOrder && <div className="fixed inset-0 z-[110] grid place-items-center bg-black/50 p-4" onClick={() => setPrintOrder(null)}><div className="w-full max-w-md rounded-xl bg-white p-5" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><h2 className="font-black">Cetak Label Pengiriman</h2><button onClick={() => setPrintOrder(null)}><X size={18}/></button></div><label className="mt-4 block text-xs font-bold">Nomor Resi<input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="mt-2 h-11 w-full rounded-lg border px-3 font-normal"/></label><div className="mt-4 border border-dashed p-4 text-sm"><b>ADI CETAK</b><p className="mt-3"><b>{printOrder.shipping_address?.name || "-"}</b></p><p>{printOrder.shipping_address?.phone || "-"}</p><p className="mt-1 text-xs">{printOrder.shipping_address?.address || ""}, {printOrder.shipping_address?.district || ""}, {printOrder.shipping_address?.city || ""}, {printOrder.shipping_address?.province || ""} {printOrder.shipping_address?.postcode || ""}</p><p className="mt-3 border-t pt-3 text-xs">Pesanan: {printOrder.id}</p><p className="text-xs">Kurir: {printOrder.courier || "-"}</p><p className="mt-2 font-black">Resi: {trackingNumber || "-"}</p></div><button onClick={saveTrackingAndShip} className="mt-4 h-11 w-full rounded-lg bg-[var(--brand-primary)] text-sm font-bold text-white">Simpan, Tandai Dikirim & Cetak</button></div></div>}
    </main>
  );
}
