"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  Filter,
  MapPin,
  MessageCircle,
  Plus,
  Printer,
  Search,
  ShoppingBag,
  X,
  XCircle,
} from "lucide-react";
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

type OrderItemRow = {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  variants: string;
  note?: string | null;
  design_file_url?: string | null;
};

type OrderRow = {
  id: string;
  status: string;
  courier: string | null;
  payment: string | null;
  subtotal?: number;
  shipping?: number;
  discount?: number;
  total: number;
  created_at: string;
  shipping_address: ShippingAddress;
  tracking_number: string | null;
  payment_proof_url: string | null;
  payment_confirmed_at: string | null;
  order_items: OrderItemRow[];
};

const TABS = [
  { key: "Semua", label: "Semua" },
  { key: "waiting_verification", label: "Ditahan" },
  { key: "pending", label: "Belum Dibayar" },
  { key: "Diproses", label: "Diproses" },
  { key: "Dikirim", label: "Dikirim" },
  { key: "Selesai", label: "Selesai" },
  { key: "Dibatalkan", label: "Dibatalkan" },
];

const UPDATE_STATUSES = [
  "waiting_verification",
  "pending",
  "Diproses",
  "Dikirim",
  "Selesai",
  "Dibatalkan",
];

const MONTHS_ID = [
  "Jan",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function statusLabel(status: string) {
  if (status === "waiting_verification") return "Ditahan";
  if (status === "pending") return "Belum Dibayar";
  return status;
}

function statusBadgeStyle(status: string) {
  switch (status) {
    case "waiting_verification":
      return "bg-[#F59E0B] text-white";
    case "pending":
      return "bg-amber-100 text-amber-800";
    case "Diproses":
      return "bg-[#1D4ED8] text-white";
    case "Dikirim":
      return "bg-indigo-600 text-white";
    case "Selesai":
      return "bg-[#22C55E] text-white";
    case "Dibatalkan":
      return "bg-red-500 text-white";
    default:
      return "bg-slate-200 text-slate-700";
  }
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "Baru saja";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam yang lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} hari yang lalu`;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const idx = parseInt(month, 10) - 1;
  return `${MONTHS_ID[idx] || month} ${year}`;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Semua");
  const [monthFilter, setMonthFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  // Bulk status atas & bawah
  const [topBulkStatus, setTopBulkStatus] = useState("waiting_verification");
  const [bottomBulkStatus, setBottomBulkStatus] = useState(
    "waiting_verification",
  );

  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [detailOrder, setDetailOrder] = useState<OrderRow | null>(null);
  const [printOrder, setPrintOrder] = useState<OrderRow | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form Tambah Pesanan Manual (Offline / WA)
  const [manualForm, setManualForm] = useState({
    customerName: "",
    customerPhone: "",
    productName: "",
    variants: "",
    quantity: 1,
    total: 0,
    courier: "Ambil Sendiri",
    status: "Diproses",
    note: "",
  });
  const [savingManual, setSavingManual] = useState(false);

  async function load() {
    setLoading(true);
    // Coba select lengkap termasuk note & design_file_url
    let { data, error } = await supabase
      .from("orders")
      .select(
        "id,status,courier,payment,subtotal,shipping,discount,total,created_at,shipping_address,tracking_number,payment_proof_url,payment_confirmed_at,order_items(id,name,quantity,unit_price,variants,note,design_file_url)",
      )
      .order("created_at", { ascending: false });

    // Fallback aman jika kolom note / design_file_url belum ditambahkan ke schema
    if (error && /column/i.test(error.message)) {
      const retry = await supabase
        .from("orders")
        .select(
          "id,status,courier,payment,total,created_at,shipping_address,tracking_number,payment_proof_url,payment_confirmed_at,order_items(id,name,quantity,unit_price,variants)",
        )
        .order("created_at", { ascending: false });
      data = retry.data as typeof data;
      error = retry.error;
    }

    if (error) {
      setMessage(error.message);
    } else {
      const list = (data || []) as OrderRow[];
      setOrders(list);
      // Sinkronkan detailOrder jika sedang terbuka
      if (detailOrder) {
        const updated = list.find((o) => o.id === detailOrder.id);
        if (updated) setDetailOrder(updated);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateStatus(id: string, nextStatus: string) {
    const { error } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", id);
    if (error) setMessage(error.message);
    else load();
  }

  async function applyBulkStatus(targetStatus: string) {
    if (!selected.length) {
      setMessage("Pilih minimal 1 pesanan dengan mencentang kotak di kiri.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    const { error } = await supabase
      .from("orders")
      .update({ status: targetStatus })
      .in("id", selected);
    if (error) {
      setMessage(error.message);
    } else {
      setSelected([]);
      load();
    }
  }

  async function verifyPayment(orderId: string) {
    const { error } = await supabase
      .from("orders")
      .update({
        status: "Diproses",
        payment_confirmed_at: new Date().toISOString(),
      })
      .eq("id", orderId);
    if (error) setMessage(error.message);
    else load();
  }

  async function rejectPayment(orderId: string) {
    const { error } = await supabase
      .from("orders")
      .update({
        status: "pending",
        payment_proof_url: null,
        payment_confirmed_at: null,
      })
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
      setPrintOrder({
        ...printOrder,
        tracking_number: trackingNumber.trim(),
        status: "Dikirim",
      });
      load();
      window.setTimeout(() => window.print(), 100);
    }
  }

  async function handleCreateManualOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!manualForm.customerName.trim() || !manualForm.productName.trim()) {
      alert("Nama pemesan dan nama produk wajib diisi.");
      return;
    }
    setSavingManual(true);
    const orderId = `AC-${Date.now().toString().slice(-8)}`;
    const unitPrice =
      manualForm.quantity > 0
        ? Math.round(manualForm.total / manualForm.quantity)
        : manualForm.total;

    const { error: orderErr } = await supabase.from("orders").insert({
      id: orderId,
      status: manualForm.status,
      courier: manualForm.courier,
      payment: "Manual / Offline",
      subtotal: manualForm.total,
      shipping: 0,
      discount: 0,
      total: manualForm.total,
      shipping_address: {
        name: manualForm.customerName.trim(),
        phone: manualForm.customerPhone.trim(),
        address: "Pesanan Manual / Offline Store",
      },
    });

    if (orderErr) {
      setSavingManual(false);
      alert(`Gagal membuat pesanan: ${orderErr.message}`);
      return;
    }

    await supabase.from("order_items").insert({
      order_id: orderId,
      name: manualForm.productName.trim(),
      quantity: manualForm.quantity,
      unit_price: unitPrice,
      variants: manualForm.variants.trim() || "Standar",
      note: manualForm.note.trim() || null,
    });

    setSavingManual(false);
    setIsAddModalOpen(false);
    setManualForm({
      customerName: "",
      customerPhone: "",
      productName: "",
      variants: "",
      quantity: 1,
      total: 0,
      courier: "Ambil Sendiri",
      status: "Diproses",
      note: "",
    });
    load();
  }

  // Opsi bulan unik dari data pesanan
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => set.add(getMonthKey(o.created_at)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [orders]);

  // Hitung jumlah tiap tab status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: orders.length };
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  // Filter pesanan
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesTab = tab === "Semua" || order.status === tab;
      const matchesMonth =
        monthFilter === "all" || getMonthKey(order.created_at) === monthFilter;
      const customerName = (order.shipping_address?.name || "").toLowerCase();
      const itemNames = order.order_items
        .map((i) => i.name.toLowerCase())
        .join(" ");
      const matchesSearch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        customerName.includes(q) ||
        itemNames.includes(q);
      return matchesTab && matchesMonth && matchesSearch;
    });
  }, [orders, tab, monthFilter, search]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-5 md:p-8">
      {/* 1. HEADER ATAS: Judul + Tombol + Tambah Pesanan */}
      <div className="mb-5 flex flex-wrap items-center gap-3.5">
        <h1 className="text-xl font-black text-slate-900 md:text-2xl">
          Pesanan
        </h1>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-bold text-[#1D4ED8] transition hover:bg-blue-100"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Tambah Pesanan</span>
        </button>
      </div>

      {/* 2. BARIS FILTER TAB & SEARCH */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Tabs Status */}
        <div className="hide-scrollbar flex items-center gap-1.5 overflow-x-auto">
          {TABS.map((t) => {
            const count = statusCounts[t.key] || 0;
            // Sembunyikan tab dengan count 0 kecuali "Semua" dan "Ditahan" agar ringkas seperti Figma
            if (
              t.key !== "Semua" &&
              t.key !== "waiting_verification" &&
              count === 0
            ) {
              return null;
            }
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`shrink-0 rounded-xl px-3.5 py-2 text-xs transition ${
                  active
                    ? "bg-blue-50 font-bold text-[#1D4ED8]"
                    : "font-medium text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t.label} <span className="opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Filter Status Dropdown + Search Input + Tombol Search Biru */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={tab}
              onChange={(e) => setTab(e.target.value)}
              className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-9 text-xs font-medium text-slate-700 outline-none focus:border-[#1D4ED8]"
            >
              {TABS.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
            <Filter
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
          </div>

          <div className="flex flex-1 items-center gap-1.5 sm:flex-initial">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Pesanan"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#1D4ED8] sm:w-52"
            />
            <button
              type="button"
              onClick={() => {}}
              aria-label="Cari"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1D4ED8] text-white transition hover:bg-blue-800"
            >
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. BARIS BULK ACTION ATAS & FILTER TANGGAL (BULAN) */}
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-slate-400">
            Ubah Status Pesanan
          </label>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={topBulkStatus}
                onChange={(e) => setTopBulkStatus(e.target.value)}
                className="h-10 w-44 appearance-none rounded-xl border border-blue-200 bg-white pl-3.5 pr-9 text-xs font-semibold text-[#1D4ED8] outline-none focus:border-[#1D4ED8]"
              >
                {UPDATE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {statusLabel(st)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>
            <button
              type="button"
              onClick={() => applyBulkStatus(topBulkStatus)}
              className="h-10 rounded-xl bg-[#1D4ED8] px-4 text-xs font-bold text-white transition hover:bg-blue-800"
            >
              Terapkan
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-slate-400">
            Semua Tanggal
          </label>
          <div className="relative">
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="h-10 w-44 appearance-none rounded-xl border border-blue-200 bg-white pl-3.5 pr-9 text-xs font-semibold text-[#1D4ED8] outline-none focus:border-[#1D4ED8]"
            >
              <option value="all">Semua Tanggal</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
          <span>{message}</span>
          <button onClick={() => setMessage("")}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* 4. TABEL PESANAN MODERN */}
      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs font-medium text-slate-400">
            Memuat data pesanan...
          </div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag className="mx-auto text-slate-300" size={36} />
            <p className="mt-3 text-sm font-medium text-slate-500">
              Belum ada pesanan yang sesuai filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#EEF3FF] text-xs font-semibold text-slate-700">
                <tr>
                  <th className="w-12 py-3.5 pl-5 pr-2">
                    <input
                      type="checkbox"
                      checked={
                        visible.length > 0 && selected.length === visible.length
                      }
                      onChange={(e) =>
                        setSelected(
                          e.target.checked ? visible.map((item) => item.id) : [],
                        )
                      }
                      className="h-4 w-4 rounded border-blue-300 accent-[#1D4ED8]"
                    />
                  </th>
                  <th className="py-3.5 pr-4">Pesanan</th>
                  <th className="py-3.5 px-4 text-center">Tanggal</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Total</th>
                  <th className="py-3.5 pl-4 pr-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {visible.map((order) => {
                  const isChecked = selected.includes(order.id);
                  const customerName =
                    order.shipping_address?.name || "Pelanggan";
                  const hasDesignFile = order.order_items.some(
                    (i) => i.design_file_url,
                  );

                  return (
                    <tr
                      key={order.id}
                      className={`transition hover:bg-blue-50/30 ${
                        isChecked ? "bg-blue-50/40" : ""
                      }`}
                    >
                      <td className="py-4 pl-5 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setSelected((old) =>
                              e.target.checked
                                ? [...old, order.id]
                                : old.filter((id) => id !== order.id),
                            )
                          }
                          className="h-4 w-4 rounded border-blue-300 accent-[#1D4ED8]"
                        />
                      </td>

                      {/* Kolom Pesanan: #ID + Nama Pemesan + Indikator Bukti/File */}
                      <td className="py-4 pr-4">
                        <button
                          type="button"
                          onClick={() => setDetailOrder(order)}
                          className="text-left font-bold text-slate-900 hover:text-[#1D4ED8]"
                        >
                          #{order.id} {customerName}
                        </button>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          <span>
                            {order.order_items
                              .map((i) => `${i.quantity}× ${i.name}`)
                              .join(", ")}
                          </span>
                          {order.payment_proof_url && (
                            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                              • Ada Bukti Transfer
                            </span>
                          )}
                          {hasDesignFile && (
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#1D4ED8]">
                              • File Desain Siap
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Kolom Tanggal Relatif */}
                      <td
                        className="whitespace-nowrap px-4 py-4 text-center text-slate-600"
                        title={new Date(order.created_at).toLocaleString(
                          "id-ID",
                        )}
                      >
                        {formatRelativeTime(order.created_at)}
                      </td>

                      {/* Kolom Status Pill */}
                      <td className="whitespace-nowrap px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-3.5 py-1 text-[11px] font-bold ${statusBadgeStyle(
                            order.status,
                          )}`}
                        >
                          {statusLabel(order.status)}
                        </span>
                      </td>

                      {/* Kolom Total */}
                      <td className="whitespace-nowrap px-4 py-4 text-center font-bold text-slate-900">
                        Rp. {order.total.toLocaleString("id-ID")}
                      </td>

                      {/* Kolom Aksi: Tombol Biru "Detail Pesanan" */}
                      <td className="whitespace-nowrap py-4 pl-4 pr-6 text-center">
                        <button
                          type="button"
                          onClick={() => setDetailOrder(order)}
                          className="rounded-xl bg-[#1D4ED8] px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800"
                        >
                          Detail Pesanan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 5. BULK ACTION BAWAH (Ubah Status Pesanan Massal) */}
      <div className="mt-4">
        <label className="mb-1.5 block text-[11px] font-medium text-slate-400">
          Ubah Status Pesanan Massal
        </label>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={bottomBulkStatus}
              onChange={(e) => setBottomBulkStatus(e.target.value)}
              className="h-10 w-44 appearance-none rounded-xl border border-blue-200 bg-white pl-3.5 pr-9 text-xs font-semibold text-[#1D4ED8] outline-none focus:border-[#1D4ED8]"
            >
              {UPDATE_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {statusLabel(st)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
          </div>
          <button
            type="button"
            onClick={() => applyBulkStatus(bottomBulkStatus)}
            className="h-10 rounded-xl bg-[#1D4ED8] px-4 text-xs font-bold text-white transition hover:bg-blue-800"
          >
            Terapkan
          </button>
        </div>
      </div>

      {/* ================= MODAL DETAIL PESANAN LENGKAP ================= */}
      {detailOrder && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-[1px]"
          onClick={() => setDetailOrder(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-black text-slate-900">
                    Detail Pesanan #{detailOrder.id}
                  </h2>
                  <span
                    className={`rounded-full px-3 py-0.5 text-[11px] font-bold ${statusBadgeStyle(
                      detailOrder.status,
                    )}`}
                  >
                    {statusLabel(detailOrder.status)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Dibuat pada{" "}
                  {new Date(detailOrder.created_at).toLocaleString("id-ID")} •{" "}
                  {detailOrder.payment || "-"} ({detailOrder.courier || "-"})
                </p>
              </div>
              <button
                onClick={() => setDetailOrder(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Ubah Status Cepat di dalam Modal */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-blue-50/60 p-3.5">
              <span className="text-xs font-bold text-slate-700">
                Ubah Status Pesanan:
              </span>
              <select
                value={detailOrder.status}
                onChange={(e) => updateStatus(detailOrder.id, e.target.value)}
                className="h-9 rounded-xl border border-blue-200 bg-white px-3 text-xs font-bold text-[#1D4ED8] outline-none"
              >
                {UPDATE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {statusLabel(st)}
                  </option>
                ))}
              </select>
            </div>

            {/* Informasi Pemesan & Alamat Pengiriman */}
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-800">
                  <MapPin size={15} className="text-[#1D4ED8]" />
                  <span>Alamat Pengiriman</span>
                </p>
                {detailOrder.shipping_address?.phone && (
                  <a
                    href={`https://wa.me/${detailOrder.shipping_address.phone.replace(
                      /^0/,
                      "62",
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                  >
                    <MessageCircle size={13} />
                    <span>Chat WhatsApp</span>
                  </a>
                )}
              </div>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {detailOrder.shipping_address?.name || "-"} (
                {detailOrder.shipping_address?.phone || "-"})
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {[
                  detailOrder.shipping_address?.address,
                  detailOrder.shipping_address?.district,
                  detailOrder.shipping_address?.city,
                  detailOrder.shipping_address?.province,
                  detailOrder.shipping_address?.postcode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {detailOrder.shipping_address?.google_maps_url && (
                <a
                  href={detailOrder.shipping_address.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#1D4ED8] hover:underline"
                >
                  <ExternalLink size={12} />
                  <span>Buka Titik GPS di Google Maps</span>
                </a>
              )}
            </div>

            {/* Bukti Pembayaran (Jika Ada) */}
            {detailOrder.payment_proof_url && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewUrl(detailOrder.payment_proof_url || "")
                      }
                      className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                    >
                      <img
                        src={detailOrder.payment_proof_url}
                        alt="Bukti Transfer"
                        className="h-14 w-20 object-cover"
                      />
                    </button>
                    <div>
                      <p className="text-xs font-black text-slate-900">
                        Bukti Transfer Customer
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewUrl(detailOrder.payment_proof_url || "")
                        }
                        className="mt-0.5 text-[11px] font-semibold text-[#1D4ED8] hover:underline"
                      >
                        Klik gambar untuk memperbesar
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => verifyPayment(detailOrder.id)}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 size={14} />
                      <span>Verifikasi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectPayment(detailOrder.id)}
                      className="inline-flex items-center gap-1 rounded-xl bg-red-500 px-3 py-2 text-xs font-bold text-white hover:bg-red-600"
                    >
                      <XCircle size={14} />
                      <span>Tolak</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Daftar Item Produksi + Download File Desain + Catatan */}
            <div className="mt-4">
              <h3 className="text-xs font-black uppercase text-slate-700">
                Item Produksi ({detailOrder.order_items.length})
              </h3>
              <div className="mt-2.5 space-y-3">
                {detailOrder.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 p-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {item.quantity}× {item.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {item.variants}
                        </p>
                      </div>
                      <b className="text-sm font-black text-[#1D4ED8]">
                        Rp.{" "}
                        {(item.quantity * item.unit_price).toLocaleString(
                          "id-ID",
                        )}
                      </b>
                    </div>

                    {/* Catatan Produksi */}
                    {item.note && (
                      <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700">
                        <FileText
                          size={14}
                          className="mt-0.5 shrink-0 text-slate-400"
                        />
                        <div>
                          <span className="font-bold text-slate-900">
                            Catatan Produksi:{" "}
                          </span>
                          <span>{item.note}</span>
                        </div>
                      </div>
                    )}

                    {/* Tombol Download File Desain */}
                    {item.design_file_url && (
                      <div className="mt-2.5">
                        <a
                          href={item.design_file_url}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-bold text-[#1D4ED8] transition hover:bg-blue-100"
                        >
                          <Download size={14} />
                          <span>Download File Desain Customer</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Ringkasan Total & Tombol Cetak Resi */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <span className="text-xs text-slate-500">Total Tagihan</span>
                <p className="text-lg font-black text-[#1D4ED8]">
                  Rp. {detailOrder.total.toLocaleString("id-ID")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openPrint(detailOrder)}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1D4ED8] px-5 text-xs font-bold text-white transition hover:bg-blue-800"
              >
                <Printer size={15} />
                <span>Input Resi & Cetak Label</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL PREVIEW GAMBAR BUKTI ================= */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-120 grid place-items-center bg-black/75 p-5"
          onClick={() => setPreviewUrl("")}
        >
          <div
            className="relative max-h-[90vh] max-w-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => setPreviewUrl("")}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-bold shadow"
            >
              ×
            </button>
            <img
              src={previewUrl}
              alt="Preview bukti pembayaran"
              className="max-h-[90vh] max-w-full rounded-2xl object-contain"
            />
          </div>
        </div>
      )}

      {/* ================= MODAL CETAK RESI PENGIRIMAN ================= */}
      {printOrder && (
        <div
          className="fixed inset-0 z-110 grid place-items-center bg-black/50 p-4"
          onClick={() => setPrintOrder(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">
                Cetak Label Pengiriman
              </h2>
              <button onClick={() => setPrintOrder(null)}>
                <X size={18} />
              </button>
            </div>
            <label className="mt-4 block text-xs font-bold text-slate-700">
              Nomor Resi
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Masukkan nomor resi kurir..."
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-normal outline-none focus:border-[#1D4ED8]"
              />
            </label>
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4 text-sm">
              <b className="text-[#1D4ED8]">A DI CETAK AJA</b>
              <p className="mt-3 font-bold text-slate-900">
                {printOrder.shipping_address?.name || "-"}
              </p>
              <p className="text-xs text-slate-700">
                {printOrder.shipping_address?.phone || "-"}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {[
                  printOrder.shipping_address?.address,
                  printOrder.shipping_address?.district,
                  printOrder.shipping_address?.city,
                  printOrder.shipping_address?.province,
                  printOrder.shipping_address?.postcode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p className="mt-3 border-t border-slate-200 pt-3 text-xs">
                Pesanan: <b>#{printOrder.id}</b>
              </p>
              <p className="text-xs">
                Kurir: <b>{printOrder.courier || "-"}</b>
              </p>
              <p className="mt-2 font-black text-slate-900">
                Resi: {trackingNumber || "-"}
              </p>
            </div>
            <button
              onClick={saveTrackingAndShip}
              className="mt-4 h-11 w-full rounded-xl bg-[#1D4ED8] text-xs font-bold text-white transition hover:bg-blue-800"
            >
              Simpan, Tandai Dikirim & Cetak
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH PESANAN MANUAL ================= */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-110 grid place-items-center bg-black/50 p-4"
          onClick={() => setIsAddModalOpen(false)}
        >
          <form
            onSubmit={handleCreateManualOrder}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">
                Tambah Pesanan Manual
              </h2>
              <button type="button" onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Nama Pemesan</label>
                <input
                  required
                  value={manualForm.customerName}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      customerName: e.target.value,
                    })
                  }
                  placeholder="Contoh: Adi Kurniawan"
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">
                  No. WhatsApp Pemesan
                </label>
                <input
                  value={manualForm.customerPhone}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      customerPhone: e.target.value,
                    })
                  }
                  placeholder="08..."
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Nama Produk</label>
                <input
                  required
                  value={manualForm.productName}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      productName: e.target.value,
                    })
                  }
                  placeholder="Contoh: Banner Flexy 280gr"
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Jumlah</label>
                  <input
                    type="number"
                    min={1}
                    value={manualForm.quantity}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        quantity: Math.max(1, Number(e.target.value)),
                      })
                    }
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">
                    Total Harga (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={manualForm.total}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        total: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">
                  Variasi / Ukuran
                </label>
                <input
                  value={manualForm.variants}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, variants: e.target.value })
                  }
                  placeholder="Contoh: 2x1 meter, Mata Ayam"
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">
                  Catatan Produksi
                </label>
                <input
                  value={manualForm.note}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, note: e.target.value })
                  }
                  placeholder="Catatan tambahan..."
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#1D4ED8]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingManual}
              className="mt-5 h-11 w-full rounded-xl bg-[#1D4ED8] text-xs font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              {savingManual ? "Menyimpan..." : "Simpan Pesanan"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}