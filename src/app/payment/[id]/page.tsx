"use client";

import { useParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { Clock3, Copy } from "lucide-react";
import { formatRupiah } from "../../components";

function PaymentContent() {
  const params = useParams();
  const router = useRouter();
  const [order] = useState<{id:string,total:number,courier:string}|null>(() => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem("adicetak-last-order") || "null"); } catch { return null; }
  });
  function copy() { navigator.clipboard?.writeText(params.id as string); }
  return <main className="mx-auto max-w-lg px-4 py-10 text-center"><div className="rounded-xl bg-white p-7 shadow-sm">
    <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-amber-600"><Clock3 size={28}/></div>
    <h1 className="mt-4 text-xl font-black">Pesanan Menunggu Pembayaran</h1>
    <p className="mt-2 text-sm text-slate-500">Xendit Invoice dibuat untuk pesanan <b>{params.id}</b>.</p>
    <div className="mt-5 rounded-lg bg-slate-50 p-4 text-left text-sm"><div className="flex justify-between"><span className="text-slate-500">No. Pesanan</span><button onClick={copy} className="flex items-center gap-1 font-bold">{params.id}<Copy size={13}/></button></div><div className="mt-3 flex justify-between"><span className="text-slate-500">Total Bayar</span><b className="text-red-500">{formatRupiah(order?.total || 0)}</b></div><div className="mt-3 flex justify-between"><span className="text-slate-500">Pengiriman</span><b>{order?.courier || "-"}</b></div></div>
    <button onClick={() => alert("Di mode demo, status pembayaran akan diperbarui melalui webhook Xendit.")} className="mt-5 h-12 w-full rounded-lg bg-blue-600 font-bold text-white">Lanjutkan ke Xendit</button>
    <button onClick={() => router.push("/account/orders")} className="mt-3 text-sm font-bold text-slate-600">Lihat Pesanan</button>
  </div></main>;
}

export default function PaymentPage() {
  return <Suspense fallback={<div className="p-10 text-center">Memuat pembayaran...</div>}><PaymentContent /></Suspense>;
}
