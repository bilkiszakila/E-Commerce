"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  ChevronLeft,
  Clock3,
  Copy,
  FileText,
  Package,
  Upload,
} from "lucide-react";
import { formatRupiah } from "@/app/components";
import { supabase } from "@/lib/supabase/client";
import { getStoreSettings, StoreSettings } from "@/services/settingsService";

type PaymentOrder = {
  id: string;
  total: number;
  courier: string;
  payment?: string;
  voucher_code?: string;
  status: string;
  payment_proof_url?: string;
  design_url?: string;
  itemName: string;
  itemVariant: string;
  itemQty: number;
  itemImage: string;
};

function PaymentContent() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [proof, setProof] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [copiedKey, setCopiedKey] = useState<"" | "order" | "rekening">("");

  useEffect(() => {
    const orderId = params.id as string;
    Promise.all([
      supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId)
        .maybeSingle(),
      getStoreSettings(),
    ]).then(async ([orderResult, settings]) => {
      let row = orderResult.data as Record<string, unknown> | null;
      if (orderResult.error) {
        const fallback = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();
        row = fallback.data as Record<string, unknown> | null;
      }

      if (row) {
        const rawItems =
          (Array.isArray(row.order_items) && row.order_items.length > 0
            ? row.order_items
            : Array.isArray(row.items)
              ? row.items
              : []) as Record<string, unknown>[];
        const first = rawItems[0] || {};
        const prod = (first.products || first.product || {}) as Record<string, unknown>;
        const specs: string[] = [];
        if (first.variant) specs.push(String(first.variant));
        if (first.material) specs.push(String(first.material));
        if (first.size) specs.push(String(first.size));
        if (first.finishing) specs.push(String(first.finishing));

        setOrder({
          id: String(row.id || ""),
          total: Number(row.total || 0),
          courier: String(row.courier || "-"),
          payment: row.payment ? String(row.payment) : undefined,
          voucher_code: row.voucher_code ? String(row.voucher_code) : undefined,
          status: String(row.status || "pending"),
          payment_proof_url: row.payment_proof_url
            ? String(row.payment_proof_url)
            : undefined,
          design_url: String(
            row.design_url || row.file_url || first.design_url || first.file_url || ""
          ),
          itemName: String(
            first.product_name || first.name || prod.name || `Pesanan #${row.id}`
          ),
          itemVariant: specs.filter(Boolean).join(", "),
          itemQty: Number(first.qty || first.quantity || 1),
          itemImage: String(
            first.image_url ||
              first.image ||
              prod.image_url ||
              (Array.isArray(prod.images) ? prod.images[0] : "") ||
              ""
          ),
        });
      }
      setStoreSettings(settings);
      setLoadingOrder(false);
    });
  }, [params.id]);

  const transferBankName = order?.payment?.startsWith("Transfer Bank - ")
    ? order.payment.replace("Transfer Bank - ", "")
    : "";
  const transferBank = storeSettings?.bankOptions.find(
    (bank) => bank.bank_name === transferBankName
  );
  const bankName = transferBank?.bank_name || storeSettings?.bankName || "SeaBank";
  const accountName =
    transferBank?.account_name || storeSettings?.bankAccountName || "Adi Rizki Kurniawan";
  const accountNumber =
    transferBank?.account_number || storeSettings?.bankAccountNumber || "-";

  function copyText(text: string, key: "order" | "rekening") {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 1800);
  }

  async function confirmPayment() {
    if (!proofFile || !order) {
      alert("Silakan unggah foto bukti transfer terlebih dahulu.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(proofFile.type)) {
      alert("Bukti pembayaran harus berupa gambar JPG, PNG, atau WebP.");
      return;
    }
    if (proofFile.size > 5 * 1024 * 1024) {
      alert("Ukuran bukti pembayaran maksimal 5 MB.");
      return;
    }

    setSubmittingProof(true);
    const extension = proofFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${order.id}/${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(path, proofFile, { cacheControl: "3600", upsert: true });
    if (uploadError) {
      setSubmittingProof(false);
      alert(`Upload bukti gagal: ${uploadError.message}`);
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from("payment-proofs")
      .getPublicUrl(path);
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_proof_url: publicUrl.publicUrl,
        status: "waiting_verification",
        payment_confirmed_at: new Date().toISOString(),
      })
      .eq("id", order.id);
    setSubmittingProof(false);
    if (updateError) {
      alert(`Pesanan gagal diperbarui: ${updateError.message}`);
      return;
    }

    setOrder({
      ...order,
      status: "waiting_verification",
      payment_proof_url: publicUrl.publicUrl,
    });
    alert("Bukti pembayaran berhasil dikirim. Pesanan menunggu verifikasi admin.");
  }

  if (loadingOrder) {
    return (
      <main className="grid min-h-[70dvh] place-items-center text-xs text-slate-400">
        Memuat detail pesanan...
      </main>
    );
  }
  if (!order) {
    return (
      <main className="grid min-h-[70dvh] place-items-center px-4 text-center text-xs text-slate-500">
        Pesanan tidak ditemukan.
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[80dvh] max-w-xl px-4 py-5 pb-28 md:py-8 md:pb-14">
      <div className="mb-4 flex items-center gap-2.5">
        <Link
          href="/account/orders"
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
        <div className="flex items-center justify-between rounded-xl bg-[#FFEDD5] px-4 py-3 text-xs font-bold text-[#EA580C]">
          <span>
            {order.status === "waiting_verification"
              ? "Menunggu Konfirmasi Admin"
              : "Pesanan Menunggu Pembayaran"}
          </span>
          <Clock3 size={18} strokeWidth={2.2} />
        </div>

        <section className="rounded-2xl bg-white p-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#F1F4FD]">
              {order.itemImage ? (
                <img
                  src={order.itemImage}
                  alt={order.itemName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Package size={22} className="text-[#1842D2]/50" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-bold text-[#172338]">
                {order.itemName}
              </h2>
              {order.itemVariant && (
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {order.itemVariant}
                </p>
              )}
              <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                x{order.itemQty}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5 border-t border-[#C6CEDC]/50 pt-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">No. Pesanan</span>
              <button
                type="button"
                onClick={() => copyText(order.id, "order")}
                className="inline-flex items-center gap-1.5 font-extrabold text-[#172338]"
              >
                <span>{order.id}</span>
                <Copy size={13} className="text-slate-500" />
                {copiedKey === "order" && (
                  <span className="text-[10px] font-bold text-[#1842D2]">
                    Disalin
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Pesanan</span>
              <span className="font-extrabold text-[#1842D2]">
                {formatRupiah(order.total)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Pengiriman</span>
              <span className="font-bold text-[#172338]">{order.courier}</span>
            </div>

            {order.design_url && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400">File Desain</span>
                <a
                  href={order.design_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-[#1842D2] hover:underline"
                >
                  <FileText size={13} /> Lihat File
                </a>
              </div>
            )}
          </div>
        </section>

        {order.status === "waiting_verification" ||
        order.status === "menunggu_konfirmasi" ? (
          <section className="rounded-2xl bg-white p-5 text-center shadow-xs">
            <p className="text-sm font-extrabold text-[#172338]">
              Menunggu Verifikasi Admin
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Bukti pembayaran sudah dikirim dan sedang diperiksa oleh admin.
            </p>
            {order.payment_proof_url && (
              <img
                src={order.payment_proof_url}
                alt="Bukti pembayaran"
                className="mx-auto mt-4 max-h-64 w-full rounded-xl border border-[#C6CEDC]/60 object-contain"
              />
            )}
            <button
              type="button"
              onClick={() => router.push("/account/orders")}
              className="mt-5 w-full rounded-xl bg-[#1842D2] py-3 text-xs font-bold text-white"
            >
              Lihat Pesanan
            </button>
          </section>
        ) : order.payment === "bank" ||
          order.payment?.startsWith("Transfer Bank -") ? (
          <section className="rounded-2xl bg-white p-5 shadow-xs">
            <h2 className="text-sm font-extrabold text-[#172338]">
              Instruksi transfer
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Silahkan transfer dengan nominal yang tertera lalu screenshot bukti
              pembayaran.
            </p>

            <div className="mt-4 border-t border-[#C6CEDC]/50 pt-4 text-center">
              <p className="text-sm font-extrabold text-[#FF7401]">{bankName}</p>
              <p className="mt-2 text-[10px] font-medium text-slate-400">
                Atas Nama
              </p>
              <p className="text-xs font-bold text-[#172338]">{accountName}</p>

              <button
                type="button"
                onClick={() => copyText(accountNumber, "rekening")}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F1F4FD] py-3 text-sm font-extrabold text-[#1842D2] hover:bg-blue-100"
              >
                <span>{accountNumber}</span>
                <Copy size={14} />
                {copiedKey === "rekening" && (
                  <span className="text-[10px] font-bold">Disalin</span>
                )}
              </button>
            </div>

            <label className="mt-4 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#C6CEDC] bg-white px-4 text-xs font-semibold text-slate-500 hover:border-[#1842D2] hover:text-[#1842D2]">
              <Upload size={16} />
              <span className="truncate">
                {proof ? proof : "Upload Bukti Pembayaran"}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setProofFile(file);
                  setProof(file?.name || "");
                }}
              />
            </label>

            <button
              type="button"
              onClick={confirmPayment}
              disabled={submittingProof}
              className="mt-3 h-11 w-full rounded-xl bg-[#1842D2] text-xs font-bold text-white shadow-xs hover:bg-blue-800 disabled:opacity-60"
            >
              {submittingProof ? "Mengirim Bukti..." : "Konfirmasi"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/account/orders")}
              className="mt-3 w-full py-1.5 text-center text-xs font-bold text-[#1842D2] hover:underline"
            >
              Lihat Pesanan
            </button>
          </section>
        ) : (
          <section className="rounded-2xl bg-white p-5 text-center shadow-xs">
            <button
              type="button"
              onClick={() =>
                alert(
                  "Di mode demo, status pembayaran akan diperbarui melalui webhook Xendit."
                )
              }
              className="h-11 w-full rounded-xl bg-[#1842D2] text-xs font-bold text-white"
            >
              Lanjutkan ke Xendit
            </button>
            <button
              type="button"
              onClick={() => router.push("/account/orders")}
              className="mt-3 w-full py-1.5 text-center text-xs font-bold text-[#1842D2]"
            >
              Lihat Pesanan
            </button>
          </section>
        )}
      </div>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-xs text-slate-400">
          Memuat pembayaran...
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}