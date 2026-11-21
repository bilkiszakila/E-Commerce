"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AdminRevenuePage() {
  const [total, setTotal] = useState(0);
  useEffect(() => { supabase.from("orders").select("total,status").then(({ data }) => setTotal((data || []).filter((order) => order.status !== "Dibatalkan").reduce((sum, order) => sum + Number(order.total || 0), 0))); }, []);
  return <main className="p-5 md:p-8"><h1 className="text-2xl font-black">Penghasilan</h1><div className="mt-5 rounded-xl border bg-white p-6"><p className="text-xs text-slate-500">Total penghasilan aktif</p><b className="mt-2 block text-3xl text-[var(--brand-primary)]">Rp {total.toLocaleString("id-ID")}</b></div></main>;
}
