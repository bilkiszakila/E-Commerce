"use client";

import { useState } from "react";
import Link from "next/link";
import { formatRupiah } from "../../components";

export default function OrdersPage() {
  const [order] = useState<{id:string,total:number,status:string,date:string,courier:string}|null>(() => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem("adicetak-last-order")||"null"); } catch { return null; }
  });
  return <main className="mx-auto max-w-[1180px] px-4 py-6 md:px-5"><h1 className="mb-5 text-xl font-black">Pesanan Saya</h1>{order?<Link href={`/payment/${order.id}`} className="block rounded-xl bg-white p-5"><div className="flex items-center justify-between border-b pb-3"><b className="text-sm">{order.id}</b><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">{order.status}</span></div><div className="mt-4 flex justify-between text-sm"><div><p className="text-slate-500">Pengiriman</p><b>{order.courier}</b></div><div className="text-right"><p className="text-slate-500">Total</p><b className="text-red-500">{formatRupiah(order.total)}</b></div></div></Link>:<div className="rounded-xl bg-white p-12 text-center"><p className="text-slate-500">Belum ada pesanan.</p></div>}</main>;
}
