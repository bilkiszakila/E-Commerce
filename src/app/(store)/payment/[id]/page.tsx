"use client";

import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Clock3, Copy, Upload } from "lucide-react";
import { formatRupiah } from "@/app/components";
import { supabase } from "@/lib/supabase/client";
import { getStoreSettings, StoreSettings } from "@/services/settingsService";

function PaymentContent() {
  const params = useParams();
  const router = useRouter();
  type PaymentOrder = {id:string,total:number,courier:string,payment?:string,voucher_code?:string,status:string,payment_proof_url?:string};
  const [order, setOrder] = useState<PaymentOrder|null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [proof, setProof] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);

  useEffect(() => {
    const orderId = params.id as string;
    Promise.all([
      supabase.from("orders").select("id,total,courier,payment,voucher_code,status,payment_proof_url").eq("id", orderId).maybeSingle(),
      getStoreSettings(),
    ]).then(([orderResult, settings]) => {
      setOrder(orderResult.data ? {
        id: orderResult.data.id,
        total: orderResult.data.total,
        courier: orderResult.data.courier || "",
        payment: orderResult.data.payment || undefined,
        voucher_code: orderResult.data.voucher_code || undefined,
        status: orderResult.data.status,
        payment_proof_url: orderResult.data.payment_proof_url || undefined,
      } : null);
      setStoreSettings(settings);
      setLoadingOrder(false);
    });
  }, [params.id]);

  const transferBankName = order?.payment?.startsWith("Transfer Bank - ")
    ? order.payment.replace("Transfer Bank - ", "")
    : "";
  const transferBank = storeSettings?.bankOptions.find((bank) => bank.bank_name === transferBankName);

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

    const { data: publicUrl } = supabase.storage.from("payment-proofs").getPublicUrl(path);
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

    setOrder({ ...order, status: "waiting_verification", payment_proof_url: publicUrl.publicUrl });
    alert("Bukti pembayaran berhasil dikirim. Pesanan menunggu verifikasi admin.");
  }

  if (loadingOrder) return <main className="grid min-h-[50vh] place-items-center text-sm text-slate-500">Memuat pesanan...</main>;
  if (!order) return <main className="grid min-h-[50vh] place-items-center px-4 text-center text-sm text-slate-500">Pesanan tidak ditemukan.</main>;
  function copy() { navigator.clipboard?.writeText(params.id as string); }
  return <main className="mx-auto max-w-lg px-4 py-10 text-center"><div className="rounded-xl bg-white p-7 shadow-sm">
    <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-amber-600"><Clock3 size={28}/></div>
    <h1 className="mt-4 text-xl font-black">Pesanan Menunggu Pembayaran</h1>
    <p className="mt-2 text-sm text-slate-500">Xendit Invoice dibuat untuk pesanan <b>{params.id}</b>.</p>
    <div className="mt-5 rounded-lg bg-slate-50 p-4 text-left text-sm"><div className="flex justify-between"><span className="text-slate-500">No. Pesanan</span><button onClick={copy} className="flex items-center gap-1 font-bold">{params.id}<Copy size={13}/></button></div><div className="mt-3 flex justify-between"><span className="text-slate-500">Total Bayar</span><b className="text-red-500">{formatRupiah(order?.total || 0)}</b></div><div className="mt-3 flex justify-between"><span className="text-slate-500">Pengiriman</span><b>{order?.courier || "-"}</b></div>    {order.voucher_code && <div className="mt-3 flex justify-between"><span className="text-slate-500">Voucher</span><b>{order.voucher_code}</b></div>}</div>
    {order.status === "waiting_verification" || order.status === "menunggu_konfirmasi" ? (
      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-5">
        <b className="text-sm">Menunggu Verifikasi Admin</b>
        <p className="mt-2 text-xs text-slate-500">Bukti pembayaran sudah dikirim dan sedang diperiksa.</p>
        {order.payment_proof_url && <img src={order.payment_proof_url} alt="Bukti pembayaran" className="mt-4 max-h-72 w-full rounded-lg object-contain"/>}
      </div>
    ) : order.payment === "bank" || order.payment?.startsWith("Transfer Bank -") ? (
      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
        <b className="text-sm">Instruksi Transfer</b>
        <div className="mt-3 space-y-2 text-sm"><p>Bank: <b>{transferBank?.bank_name || storeSettings?.bankName || "-"}</b></p><p>Atas nama: <b>{transferBank?.account_name || storeSettings?.bankAccountName || "-"}</b></p><div className="flex items-center justify-between"><span>Nomor rekening:</span><b className="text-base">{transferBank?.account_number || storeSettings?.bankAccountNumber || "-"}</b></div></div>
        <label className="mt-4 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white text-xs font-bold"><Upload size={16}/> {proof ? "Bukti dipilih" : "Unggah Bukti Transfer"}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e)=>{const file=e.target.files?.[0]||null;setProofFile(file);setProof(file?.name||"");}}/></label>
        <button onClick={confirmPayment} disabled={submittingProof} className="mt-3 h-11 w-full rounded-lg bg-blue-600 text-sm font-bold text-white disabled:opacity-60">{submittingProof ? "Mengirim Bukti..." : "Konfirmasi Pembayaran"}</button>
      </div>
    ) : (
      <button onClick={() => alert("Di mode demo, status pembayaran akan diperbarui melalui webhook Xendit.")} className="mt-5 h-12 w-full rounded-lg bg-blue-600 font-bold text-white">Lanjutkan ke Xendit</button>
    )}
    <button onClick={() => router.push("/account/orders")} className="mt-3 text-sm font-bold text-slate-600">Lihat Pesanan</button>
  </div></main>;
}

export default function PaymentPage() {
  return <Suspense fallback={<div className="p-10 text-center">Memuat pembayaran...</div>}><PaymentContent /></Suspense>;
}
