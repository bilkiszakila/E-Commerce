"use client";

import { useEffect, useState } from "react";
import { Save, Trash2, TicketPercent } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";

type VoucherRow = { id: string; code: string; type: "fixed"|"percent"; value: number; label: string; minimum_purchase: number; usage_limit: number|null; active: boolean };
const emptyVoucher: VoucherRow = { id: "", code: "", type: "percent", value: 10, label: "", minimum_purchase: 0, usage_limit: null, active: true };

export default function AdminDiscountsPage() {
  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [form, setForm] = useState(emptyVoucher);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  async function load() { const { data } = await supabase.from("vouchers").select("*").order("created_at", { ascending: false }); setVouchers(data || []); }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.code) { setMessage("Kode voucher wajib diisi."); return; }
    const payload = { code: form.code.toUpperCase(), type: form.type, value: form.value, label: form.label || `Diskon ${form.value}${form.type === "percent" ? "%" : ""}`, minimum_purchase: form.minimum_purchase, usage_limit: form.usage_limit, active: form.active };
    const { error } = editing ? await supabase.from("vouchers").update(payload).eq("id", form.id) : await supabase.from("vouchers").insert(payload);
    if (error) setMessage(error.message);
    else { setMessage("Diskon berhasil disimpan."); setForm(emptyVoucher); setEditing(false); load(); }
  }

  async function remove(id: string) { if (!confirm("Hapus voucher ini?")) return; await supabase.from("vouchers").delete().eq("id", id); load(); }

  return (
    <main className="p-5 md:p-8">
      <h1 className="mb-5 text-2xl font-black">Diskon & Voucher</h1>
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <section className="h-fit rounded-xl border bg-white p-5">
          <h2 className="font-black">{editing ? "Edit Voucher" : "Tambah Voucher"}</h2>
          <div className="mt-4 space-y-3">
            <label className="block text-xs font-bold">Kode<input value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} className="mt-2 h-11 w-full rounded-lg border px-3 uppercase"/></label>
            <label className="block text-xs font-bold">Jenis<select value={form.type} onChange={(e) => setForm({...form, type: e.target.value as "fixed"|"percent"})} className="mt-2 h-11 w-full rounded-lg border px-3"><option value="percent">Persen</option><option value="fixed">Nominal</option></select></label>
            <label className="block text-xs font-bold">Nilai<input type="number" value={form.value} onChange={(e) => setForm({...form, value: Number(e.target.value)})} className="mt-2 h-11 w-full rounded-lg border px-3"/></label>
            <label className="block text-xs font-bold">Minimal Pembelian<input type="number" value={form.minimum_purchase} onChange={(e) => setForm({...form, minimum_purchase: Number(e.target.value)})} className="mt-2 h-11 w-full rounded-lg border px-3"/></label>
            <label className="block text-xs font-bold">Batas Pemakaian<input type="number" value={form.usage_limit || ""} onChange={(e) => setForm({...form, usage_limit: e.target.value ? Number(e.target.value) : null})} className="mt-2 h-11 w-full rounded-lg border px-3"/></label>
            <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={form.active} onChange={(e) => setForm({...form, active: e.target.checked})}/> Aktif</label>
            {message && <p className="text-xs font-bold text-red-500">{message}</p>}
            <button onClick={save} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-primary)] text-sm font-bold text-white"><Save size={16}/> Simpan</button>
          </div>
        </section>
        <section className="overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-left text-sm"><thead className="border-b bg-slate-50 text-xs text-slate-500"><tr><th className="p-4">Voucher</th><th>Jenis</th><th>Nilai</th><th>Status</th><th className="p-4 text-right">Aksi</th></tr></thead><tbody>{vouchers.map((voucher) => <tr key={voucher.id} className="border-b last:border-0"><td className="p-4"><div className="flex items-center gap-2"><TicketPercent size={17} className="text-blue-600"/><b>{voucher.code}</b></div></td><td>{voucher.type === "percent" ? "Persen" : "Nominal"}</td><td>{voucher.value}{voucher.type === "percent" ? "%" : ""}</td><td><span className={`rounded-full px-2 py-1 text-xs ${voucher.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100"}`}>{voucher.active ? "Aktif" : "Nonaktif"}</span></td><td className="p-4"><div className="flex justify-end gap-2"><button onClick={() => { setForm(voucher); setEditing(true); }} className="rounded-lg border px-3 py-2 text-xs font-bold">Edit</button><button onClick={() => remove(voucher.id)} className="grid h-8 w-8 place-items-center rounded-lg border text-red-500"><Trash2 size={15}/></button></div></td></tr>)}</tbody></table>
        </section>
      </div>
    </main>
  );
}
