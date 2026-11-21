"use client";

import { useEffect, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";

type Customer = { id: string; name: string | null; email: string | null; phone: string | null; is_admin: boolean; updated_at: string };

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("profiles").select("id,name,email,phone,is_admin,updated_at").order("updated_at", { ascending: false }).then(({ data }) => setCustomers(data || []));
  }, []);

  const visible = customers.filter((customer) => `${customer.name || ""} ${customer.email || ""} ${customer.phone || ""}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="p-5 md:p-8">
      <div className="mb-5 flex items-center justify-between"><h1 className="text-2xl font-black">Pelanggan</h1><div className="flex h-10 w-full max-w-sm items-center rounded-lg border bg-white px-3"><Search size={16} className="text-slate-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari pelanggan" className="h-full flex-1 px-2 text-xs outline-none"/></div></div>
      <section className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-left text-sm"><thead className="border-b bg-slate-50 text-xs text-slate-500"><tr><th className="p-4">Pelanggan</th><th>Email</th><th>Telepon</th><th>Status</th></tr></thead><tbody>{visible.map((customer) => <tr key={customer.id} className="border-b last:border-0"><td className="p-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-700"><UserRound size={17}/></div><b>{customer.name || "Pengguna"}</b></div></td><td>{customer.email || "-"}</td><td>{customer.phone || "-"}</td><td><span className={`rounded-full px-2 py-1 text-xs font-bold ${customer.is_admin ? "bg-slate-950 text-white" : "bg-emerald-100 text-emerald-700"}`}>{customer.is_admin ? "Admin" : "Customer"}</span></td></tr>)}</tbody></table>
        {visible.length === 0 && <p className="py-12 text-center text-xs text-slate-400">Tidak ada pelanggan.</p>}
      </section>
    </main>
  );
}
