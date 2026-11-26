"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Package } from "lucide-react";
import { formatRupiah } from "@/app/components";
import { supabase } from "@/lib/supabase/client";

type OrderItemPreview = {
  name: string;
  variant: string;
  qty: number;
  image: string;
  extraCount: number;
};

type OrderRow = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  courier: string | null;
  preview: OrderItemPreview;
};

const TABS = [
  { key: "Semua", label: "Semua" },
  { key: "unpaid", label: "Belum Bayar" },
  { key: "waiting", label: "Menunggu Konfirmasi" },
  { key: "processing", label: "Diproses" },
  { key: "shipped", label: "Dikirim" },
  { key: "completed", label: "Selesai" },
];

function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "pending" || s.includes("belum")) {
    return {
      label: "Menunggu Pembayaran",
      className: "bg-[#FEF3C7] text-[#B45309]",
    };
  }
  if (s === "waiting_verification" || s.includes("konfirmasi")) {
    return {
      label: "Menunggu Konfirmasi",
      className: "bg-[#FFEDD5] text-[#C2410C]",
    };
  }
  if (s === "diproses" || s === "paid" || s.includes("proses")) {
    return {
      label: "Diproses",
      className: "bg-[#DBEAFE] text-[#1842D2]",
    };
  }
  if (s === "dikirim" || s.includes("kirim")) {
    return {
      label: "Dikirim",
      className: "bg-[#E0E7FF] text-[#3730A3]",
    };
  }
  if (s === "selesai" || s.includes("complete")) {
    return {
      label: "Selesai",
      className: "bg-[#DCFCE7] text-[#16694D]",
    };
  }
  if (s === "dibatalkan" || s.includes("cancel")) {
    return {
      label: "Dibatalkan",
      className: "bg-[#FEE2E2] text-[#E81C17]",
    };
  }
  return {
    label: status,
    className: "bg-slate-100 text-slate-600",
  };
}

function extractPreview(row: Record<string, unknown>): OrderItemPreview {
  const rawItems =
    (Array.isArray(row.order_items) && row.order_items.length > 0
      ? row.order_items
      : Array.isArray(row.items)
        ? row.items
        : []) as Record<string, unknown>[];

  if (rawItems.length === 0) {
    return {
      name: `Pesanan #${String(row.id || "")}`,
      variant: String(row.courier || "Cetak Custom"),
      qty: 1,
      image: "",
      extraCount: 0,
    };
  }

  const first = rawItems[0];
  const productObj = (first.products || first.product || {}) as Record<string, unknown>;
  const name = String(
    first.product_name || first.name || productObj.name || "Produk Cetak"
  );

  const specParts: string[] = [];
  if (first.variants) specParts.push(String(first.variants));
  if (first.variant) specParts.push(String(first.variant));
  if (first.material) specParts.push(String(first.material));
  if (first.size) specParts.push(String(first.size));
  if (first.finishing) specParts.push(String(first.finishing));
  if (typeof first.specs === "object" && first.specs !== null) {
    Object.values(first.specs as Record<string, unknown>).forEach((v) => {
      if (v) specParts.push(String(v));
    });
  }

  const image = String(
    first.thumbnail_url ||
      first.image_url ||
      first.image ||
      productObj.thumbnail_url ||
      productObj.image_url ||
      (Array.isArray(productObj.images) ? productObj.images[0] : "") ||
      ""
  );

  return {
    name,
    variant: specParts.filter(Boolean).join(", "),
    qty: Number(first.qty || first.quantity || 1),
    image,
    extraCount: Math.max(0, rawItems.length - 1),
  };
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "Semua";
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tab, setTab] = useState(initialStatus);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const param = searchParams.get("status");
    if (param && TABS.some((t) => t.key === param)) {
      setTab(param);
    }
  }, [searchParams]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        setLoading(false);
        return;
      }
      const userId = data.session.user.id;

      let { data: rows, error } = await supabase
        .from("orders")
        .select("id,total,status,created_at,courier,order_items(*,products(thumbnail_url))")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        const fallback = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        rows = fallback.data;
      }

      const mapped: OrderRow[] = (rows || []).map((r: Record<string, unknown>) => ({
        id: String(r.id || ""),
        total: Number(r.total || 0),
        status: String(r.status || "pending"),
        created_at: String(r.created_at || ""),
        courier: r.courier ? String(r.courier) : null,
        preview: extractPreview(r),
      }));

      setOrders(mapped);
      setLoading(false);
    });
  }, []);

  const visible = orders.filter((order) => {
    const s = order.status.toLowerCase();
    if (tab === "Semua") return true;
    if (tab === "unpaid") return s === "pending";
    if (tab === "waiting") return s === "waiting_verification" || s === "menunggu_konfirmasi";
    if (tab === "processing") return s === "diproses" || s === "paid";
    if (tab === "shipped") return s === "dikirim";
    if (tab === "completed") return s === "selesai";
    return true;
  });

  return (
    <main className="mx-auto min-h-[80dvh] max-w-[1180px] px-4 py-5 pb-28 md:px-5 md:py-8 md:pb-14">
      <div className="mb-4 flex items-center gap-2.5">
        <Link
          href="/account"
          aria-label="Kembali ke Akun Saya"
          className="grid h-8 w-8 place-items-center rounded-lg text-[#172338] hover:bg-white"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-base font-extrabold text-[#172338] md:text-xl">
          Pesanan Saya
        </h1>
      </div>

      <div className="hide-scrollbar mb-5 flex items-center gap-5 overflow-x-auto border-b border-[#C6CEDC]/60 px-1">
        {TABS.map((item) => {
          const isActive = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`relative shrink-0 pb-2.5 text-xs transition ${
                isActive
                  ? "font-extrabold text-[#1842D2]"
                  : "font-semibold text-slate-400 hover:text-[#172338]"
              }`}
            >
              {item.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-[#1842D2]" />
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-12 text-center text-xs font-medium text-slate-400 shadow-xs">
          Memuat pesanan...
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center text-xs font-medium text-slate-500 shadow-xs">
          Belum ada pesanan pada tab ini.
        </div>
      ) : (
        <div className="grid gap-3.5 md:grid-cols-2">
          {visible.map((order) => {
            const badge = getStatusBadge(order.status);
            const href =
              order.status === "pending"
                ? `/payment/${order.id}`
                : `/orders/${order.id}`;

            return (
              <div
                key={order.id}
                className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-xs transition hover:shadow-sm"
              >
                <span
                  className={`absolute right-0 top-0 rounded-bl-xl px-3 py-1 text-[10px] font-bold ${badge.className}`}
                >
                  {badge.label}
                </span>

                <div className="mt-2 flex items-start gap-3.5">
                  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#F1F4FD]">
                    {order.preview.image ? (
                      <img
                        src={order.preview.image}
                        alt={order.preview.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package size={24} className="text-[#1842D2]/50" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pr-2">
                    <h2 className="truncate text-sm font-bold text-[#172338]">
                      {order.preview.name}
                    </h2>
                    {order.preview.variant && (
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                        {order.preview.variant}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-[11px] font-medium text-slate-400">
                      <span>x{order.preview.qty}</span>
                      {order.preview.extraCount > 0 && (
                        <span className="rounded bg-[#F1F4FD] px-1.5 py-0.5 text-[10px] font-bold text-[#1842D2]">
                          +{order.preview.extraCount} produk lainnya
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 flex items-center justify-between border-t border-[#C6CEDC]/50 pt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] font-medium text-slate-400">
                      Total Pesanan
                    </span>
                    <span className="text-sm font-extrabold text-[#1842D2]">
                      {formatRupiah(order.total)}
                    </span>
                  </div>

                  <Link
                    href={href}
                    className="rounded-lg bg-[#1842D2] px-5 py-1.5 text-xs font-bold text-white transition hover:bg-blue-800"
                  >
                    Detail
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-[80dvh] max-w-[1180px] px-4 py-8 text-center text-xs text-slate-400">
          Memuat pesanan...
        </main>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}