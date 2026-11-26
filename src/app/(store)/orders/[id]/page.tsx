"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  MapPin,
  MessageSquareText,
  Package,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatRupiah } from "@/app/components";
import { getStoreSettings } from "@/services/settingsService";

type ShippingAddress = {
  name?: string;
  phone?: string;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  postcode?: string;
  lat?: number;
  lng?: number;
  google_maps_url?: string;
};

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  variants: string;
  image_url?: string | null;
  design_file_url?: string | null;
  products?: { thumbnail_url?: string | null } | null;
};

type OrderDetail = {
  id: string;
  status: string;
  courier: string | null;
  payment: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  payment_proof_url: string | null;
  design_file_url?: string | null;
  shipping_address: ShippingAddress | null;
  order_items: OrderItem[];
};

function cleanVariants(variants?: string | null) {
  if (!variants) return "";
  return variants.replace(/\s*\(File:[^)]*\)/gi, "").trim();
}

function getStatusBanner(status: string) {
  const s = status.toLowerCase();
  if (s === "pending" || s.includes("belum")) {
    return {
      label: "Pesanan Menunggu Pembayaran",
      wrapper: "bg-[#FFEDD5] text-[#EA580C]",
      icon: Clock3,
    };
  }
  if (s === "waiting_verification" || s.includes("konfirmasi")) {
    return {
      label: "Menunggu Konfirmasi Admin",
      wrapper: "bg-[#FEF3C7] text-[#B45309]",
      icon: Clock3,
    };
  }
  if (s === "paid" || s === "diproses" || s.includes("proses")) {
    return {
      label: "Pesanan Sedang Diproses",
      wrapper: "bg-[#DBEAFE] text-[#1842D2]",
      icon: Package,
    };
  }
  if (s === "dikirim" || s.includes("kirim")) {
    return {
      label: "Pesanan Dalam Pengiriman",
      wrapper: "bg-[#E0E7FF] text-[#3730A3]",
      icon: Truck,
    };
  }
  if (s === "selesai" || s.includes("complete")) {
    return {
      label: "Pesanan Selesai",
      wrapper: "bg-[#DCFCE7] text-[#16A34A]",
      icon: CheckCircle2,
    };
  }
  return {
    label: status || "Detail Pesanan",
    wrapper: "bg-slate-100 text-slate-700",
    icon: XCircle,
  };
}

function OrderDetailContent() {
  const params = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [waNumber, setWaNumber] = useState("6285721314868");
  const [previewProof, setPreviewProof] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [showPriceDetail, setShowPriceDetail] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    Promise.all([
      supabase
        .from("orders")
        .select(
          "id,status,courier,payment,subtotal,shipping,discount,total,payment_proof_url,shipping_address,order_items(id,name,quantity,unit_price,variants,design_file_url,products(thumbnail_url))"
        )
        .eq("id", id)
        .maybeSingle(),
      getStoreSettings(),
    ]).then(([orderRes, settings]) => {
      setOrder((orderRes.data as OrderDetail | null) ?? null);

      const rawSettings = (settings ?? {}) as Record<string, unknown>;
      const phoneCandidate = String(
        rawSettings.whatsapp ||
          rawSettings.whatsappNumber ||
          rawSettings.adminWhatsapp ||
          rawSettings.phone ||
          ""
      ).replace(/\D/g, "");

      if (phoneCandidate) {
        setWaNumber(
          phoneCandidate.startsWith("0")
            ? `62${phoneCandidate.slice(1)}`
            : phoneCandidate
        );
      }
      setLoading(false);
    });
  }, [params.id]);

  function copyOrderId() {
    if (!order) return;
    navigator.clipboard?.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (loading) {
    return (
      <main className="mx-auto min-h-[80dvh] max-w-lg px-4 py-10 text-center text-xs text-slate-400">
        Memuat detail pesanan...
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto min-h-[80dvh] max-w-lg px-4 py-12 text-center">
        <p className="text-sm font-bold text-[#172338]">Pesanan tidak ditemukan.</p>
        <Link
          href="/orders"
          className="mt-4 inline-block rounded-xl bg-[#1842D2] px-5 py-2.5 text-xs font-bold text-white"
        >
          Kembali ke Pesanan Saya
        </Link>
      </main>
    );
  }

  const address = order.shipping_address || {};
  const formattedAddress = [
    address.address,
    address.district,
    address.city,
    address.province,
    address.postcode,
  ]
    .filter(Boolean)
    .join(", ");

  const banner = getStatusBanner(order.status);
  const BannerIcon = banner.icon;
  const waText = encodeURIComponent(
    `Halo Admin A DI Cetak Aja, saya butuh bantuan terkait pesanan ${order.id}.`
  );

  // Kumpulkan semua URL file desain dari tabel orders maupun order_items
  const designFiles = [
    ...(order.design_file_url
      ? [{ key: "order-design", label: "File Desain Pesanan", url: order.design_file_url }]
      : []),
    ...(order.order_items || [])
      .filter((item) => Boolean(item.design_file_url) && item.design_file_url !== order.design_file_url)
      .map((item) => ({
        key: item.id,
        label: item.name,
        url: item.design_file_url as string,
      })),
  ];

  return (
    <main className="mx-auto min-h-[80dvh] max-w-xl px-4 py-5 pb-28 md:py-8 md:pb-14">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2.5">
        <Link
          href="/orders"
          aria-label="Kembali ke Pesanan Saya"
          className="grid h-8 w-8 place-items-center rounded-lg text-[#172338] hover:bg-white"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-base font-extrabold text-[#172338] md:text-lg">
          Detail Pesanan
        </h1>
      </div>

      <div className="space-y-3.5">
        {/* Banner Status Pesanan */}
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs font-bold ${banner.wrapper}`}
        >
          <span>{banner.label}</span>
          <BannerIcon size={18} strokeWidth={2.2} />
        </div>

        {/* Kartu Alamat Pengiriman */}
        <section className="rounded-2xl bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold text-[#172338]">Alamat Pengiriman</p>
          <div className="mt-2.5 flex items-center gap-2 text-xs">
            <MapPin size={15} className="shrink-0 text-[#1842D2]" />
            <span className="font-extrabold uppercase text-[#172338]">
              {address.name || "Penerima"}
            </span>
            {address.phone && (
              <span className="text-[11px] text-slate-400">
                ({address.phone})
              </span>
            )}
          </div>

          <div className="mt-1.5 flex items-end justify-between gap-3">
            <p
              className={`text-xs leading-relaxed text-slate-500 ${
                showFullAddress ? "" : "line-clamp-1"
              }`}
            >
              {formattedAddress || "-"}
            </p>
            <button
              type="button"
              onClick={() => setShowFullAddress((prev) => !prev)}
              className="shrink-0 text-xs font-bold text-[#1842D2]"
            >
              {showFullAddress ? "Tutup" : "Lihat"}
            </button>
          </div>

          {showFullAddress && address.google_maps_url && (
            <a
              href={address.google_maps_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#1842D2] hover:underline"
            >
              Buka di Google Maps <ExternalLink size={12} />
            </a>
          )}
        </section>

        {/* Kartu Produk & Informasi Pesanan */}
        <section className="rounded-2xl bg-white p-4 shadow-xs">
          <div className="space-y-3">
            {(order.order_items || []).map((item) => {
              const thumb = item.products?.thumbnail_url || item.image_url;
              const cleanedSpec = cleanVariants(item.variants);
              return (
                <div key={item.id} className="flex items-start gap-3.5">
                  <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#F1F4FD]">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package size={22} className="text-[#1842D2]/50" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-bold text-[#172338]">
                      {item.name}
                    </h2>
                    {cleanedSpec && (
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {cleanedSpec}
                      </p>
                    )}
                    <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                      x{item.quantity}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 space-y-2.5 border-t border-[#C6CEDC]/50 pt-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">No. Pesanan</span>
              <button
                type="button"
                onClick={copyOrderId}
                className="inline-flex items-center gap-1.5 font-extrabold text-[#172338]"
              >
                <span>{order.id}</span>
                <Copy size={13} className="text-slate-500" />
                {copied && (
                  <span className="text-[10px] font-bold text-[#1842D2]">
                    Disalin
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowPriceDetail((prev) => !prev)}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-[#172338]"
              >
                <span>Total Pesanan</span>
                <ChevronDown
                  size={13}
                  className={`transition ${showPriceDetail ? "rotate-180" : ""}`}
                />
              </button>
              <span className="font-extrabold text-[#1842D2]">
                {formatRupiah(order.total)}
              </span>
            </div>

            {showPriceDetail && (
              <div className="space-y-1.5 rounded-xl bg-[#F5F5F7] p-3 text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#172338]">
                    {formatRupiah(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Ongkir</span>
                  <span className="font-semibold text-[#172338]">
                    {formatRupiah(order.shipping)}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-[#16694D]">
                    <span>Diskon</span>
                    <span className="font-bold">
                      -{formatRupiah(order.discount)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Pengiriman</span>
              <span className="font-bold text-[#172338]">
                {order.courier || "-"}
              </span>
            </div>
          </div>
        </section>

        {/* Kartu File Desain & Bukti Pembayaran (Jika Ada) */}
        {(designFiles.length > 0 || order.payment_proof_url) && (
          <section className="space-y-3 rounded-2xl bg-white p-4 shadow-xs">
            {designFiles.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-[#172338]">
                  File Desain Cetak
                </p>
                <div className="mt-2 space-y-2">
                  {designFiles.map((file) => (
                    <a
                      key={file.key}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-xl bg-[#F1F4FD] px-3.5 py-2.5 text-xs font-bold text-[#1842D2] hover:bg-blue-100"
                    >
                      <span className="inline-flex items-center gap-2 truncate">
                        <FileText size={15} className="shrink-0" />
                        <span className="truncate">{file.label}</span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-[11px]">
                        Lihat File <ExternalLink size={12} />
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {order.payment_proof_url && (
              <div
                className={
                  designFiles.length > 0
                    ? "border-t border-[#C6CEDC]/50 pt-3"
                    : ""
                }
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-[#172338]">
                    Bukti Pembayaran
                  </p>
                  <button
                    type="button"
                    onClick={() => setPreviewProof(true)}
                    className="text-[11px] font-bold text-[#1842D2] hover:underline"
                  >
                    Perbesar
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewProof(true)}
                  className="mt-2 block w-full overflow-hidden rounded-xl border border-[#C6CEDC]/60 bg-[#F5F5F7]"
                >
                  <img
                    src={order.payment_proof_url}
                    alt="Bukti Pembayaran"
                    className="max-h-44 w-full object-contain"
                  />
                </button>
              </div>
            )}
          </section>
        )}

        {/* Kartu Ada Kendala -> Hubungi Admin */}
        <section className="rounded-2xl bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold text-[#172338]">Ada kendala?</p>
          <a
            href={`https://wa.me/${waNumber}?text=${waText}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center gap-3 text-sm font-bold text-[#172338] hover:text-[#1842D2]"
          >
            <MessageSquareText size={20} strokeWidth={2} />
            <span>Hubungi Admin</span>
          </a>
        </section>
      </div>

      {/* Modal Lightbox Bukti Pembayaran */}
      {previewProof && order.payment_proof_url && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-5"
          onClick={() => setPreviewProof(false)}
        >
          <div
            className="relative max-w-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewProof(false)}
              aria-label="Tutup pratinjau"
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-[#172338] shadow-md"
            >
              <X size={18} />
            </button>
            <img
              src={order.payment_proof_url}
              alt="Bukti pembayaran"
              className="max-h-[85dvh] max-w-full rounded-2xl bg-white"
            />
          </div>
        </div>
      )}
    </main>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-[80dvh] max-w-lg px-4 py-10 text-center text-xs text-slate-400">
          Memuat detail pesanan...
        </main>
      }
    >
      <OrderDetailContent />
    </Suspense>
  );
}