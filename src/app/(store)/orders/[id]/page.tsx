"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatRupiah } from "@/app/components";

type OrderDetail = {
  id:string; status:string; courier:string|null; payment:string|null; subtotal:number; shipping:number; discount:number; total:number; payment_proof_url:string|null;
  shipping_address: {name?:string;phone?:string;province?:string;city?:string;district?:string;address?:string;postcode?:string;lat?:number;lng?:number;google_maps_url?:string};
  order_items:{id:string;name:string;quantity:number;unit_price:number;variants:string}[];
};

function statusLabel(status: string) {
  if (status === "pending") return "Belum Dibayar";
  if (status === "waiting_verification") return "Menunggu Konfirmasi";
  if (status === "paid" || status === "Diproses") return "Diproses";
  return status;
}

function OrderDetailContent() {
  const params = useParams();
  const [order, setOrder] = useState<OrderDetail|null>(null);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    supabase.from("orders").select("id,status,courier,payment,subtotal,shipping,discount,total,payment_proof_url,shipping_address,order_items(id,name,quantity,unit_price,variants)").eq("id", id).maybeSingle().then(({data}) => {
      setOrder(data as OrderDetail|null);
      setLoading(false);
    });
  }, [params.id]);

  if (loading) return <main className="grid min-h-[50vh] place-items-center text-sm text-slate-500">Memuat detail pesanan...</main>;
  if (!order) return <main className="grid min-h-[50vh] place-items-center px-4 text-center text-sm text-slate-500">Pesanan tidak ditemukan.</main>;

  const address = order.shipping_address || {};
  return <main className="mx-auto max-w-[1180px] px-4 py-6 md:px-5"><Link href="/orders" className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-500"><ArrowLeft size={15}/> Pesanan Saya</Link><div className="rounded-xl border bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4"><div><p className="text-xs text-slate-400">Nomor Pesanan</p><b>{order.id}</b></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">{statusLabel(order.status)}</span></div><div className="mt-5 space-y-3">{order.order_items.map((item)=><div key={item.id} className="flex justify-between gap-3 border-b pb-3 text-sm"><div><b>{item.name}</b><p className="mt-1 text-xs text-slate-400">{item.quantity} × {formatRupiah(item.unit_price)} · {item.variants}</p></div><b>{formatRupiah(item.quantity*item.unit_price)}</b></div>)}</div><div className="mt-5 grid gap-4 md:grid-cols-2"><section className="rounded-lg bg-slate-50 p-4"><h2 className="mb-3 flex items-center gap-2 font-black"><MapPin size={17}/> Lokasi Pengiriman</h2><p className="text-sm"><b>{address.name}</b> · {address.phone}</p><p className="mt-2 text-sm text-slate-600">{address.address}, {address.district}, {address.city}, {address.province} {address.postcode}</p>{address.google_maps_url&&<a href={address.google_maps_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-bold text-blue-600">Buka di Google Maps</a>}</section><section className="rounded-lg bg-slate-50 p-4"><h2 className="mb-3 font-black">Ringkasan</h2><div className="space-y-2 text-sm"><p className="flex justify-between"><span>Subtotal</span><b>{formatRupiah(order.subtotal)}</b></p><p className="flex justify-between"><span>Ongkir</span><b>{formatRupiah(order.shipping)}</b></p><p className="flex justify-between"><span>Diskon</span><b>{formatRupiah(order.discount)}</b></p><p className="flex justify-between border-t pt-2"><b>Total</b><b className="text-red-500">{formatRupiah(order.total)}</b></p></div></section></div>{order.payment_proof_url&&<section className="mt-5"><h2 className="mb-3 font-black">Bukti Pembayaran</h2><button onClick={()=>setPreview(true)} className="overflow-hidden rounded-lg border"><img src={order.payment_proof_url} alt="Bukti pembayaran" className="h-40 w-56 object-cover"/></button></section>}</div>{preview&&<div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-5" onClick={()=>setPreview(false)}><div className="relative" onClick={(event)=>event.stopPropagation()}><button onClick={()=>setPreview(false)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white font-bold">×</button><img src={order.payment_proof_url||""} alt="Bukti pembayaran" className="max-h-[90vh] max-w-full rounded-xl"/></div></div>}</main>;
}

export default function OrderDetailPage() {
  return <Suspense fallback={<div className="p-10 text-center">Memuat detail pesanan...</div>}><OrderDetailContent /></Suspense>;
}
