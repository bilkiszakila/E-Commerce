"use client";

import { useEffect, useState } from "react";
import { FolderTree, Save, Trash2, Upload } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";

type CategoryRow = { id: string; name: string; slug: string; thumbnail_url: string; sort_order: number; active: boolean };
const emptyCategory = { id: "", name: "", slug: "", thumbnail_url: "", sort_order: 0, active: true };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [form, setForm] = useState<CategoryRow>(emptyCategory);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCategories(data || []);
  }
  useEffect(() => { load(); }, []);

  function toSlug(value: string) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function uploadThumbnail(file?: File) {
    if (!file) return;
    const path = `categories/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("products").upload(path, file, { upsert: true });
    if (error) { setMessage(error.message); return; }
    const { data } = supabase.storage.from("products").getPublicUrl(path);
    setForm((old) => ({ ...old, thumbnail_url: data.publicUrl }));
  }

  async function save() {
    if (!form.name) { setMessage("Nama kategori wajib diisi."); return; }
    const payload = { name: form.name, slug: form.slug || toSlug(form.name), thumbnail_url: form.thumbnail_url, sort_order: form.sort_order, active: form.active };
    const { error } = editing
      ? await supabase.from("categories").update(payload).eq("id", form.id)
      : await supabase.from("categories").insert(payload);
    if (error) setMessage(error.message);
    else { setMessage("Kategori berhasil disimpan."); reset(); load(); }
  }

  function reset() { setForm(emptyCategory); setEditing(false); }

  async function remove(id: string) {
    if (!confirm("Hapus kategori ini?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) setMessage(error.message); else load();
  }

  return (
    <main className="p-5 md:p-8">
      <h1 className="mb-5 text-2xl font-black">Kategori</h1>
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <section className="h-fit rounded-xl border bg-white p-5">
          <h2 className="font-black">{editing ? "Edit Kategori" : "Tambah Kategori"}</h2>
          <div className="mt-4 space-y-3">
            <label className="block text-xs font-bold">Nama<input value={form.name} onChange={(e) => setForm({...form, name: e.target.value, slug: editing ? form.slug : toSlug(e.target.value)})} className="mt-2 h-11 w-full rounded-lg border px-3 font-normal"/></label>
            <label className="block text-xs font-bold">Slug<input value={form.slug} onChange={(e) => setForm({...form, slug: toSlug(e.target.value)})} className="mt-2 h-11 w-full rounded-lg border px-3 font-normal"/></label>
            <label className="block text-xs font-bold">Urutan<input type="number" value={form.sort_order} onChange={(e) => setForm({...form, sort_order: Number(e.target.value)})} className="mt-2 h-11 w-full rounded-lg border px-3 font-normal"/></label>
            {form.thumbnail_url && <img src={form.thumbnail_url} alt="" className="h-32 w-full rounded-lg object-cover"/>}
            <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border text-xs font-bold"><Upload size={16}/> Upload Thumbnail<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => uploadThumbnail(e.target.files?.[0])} className="hidden"/></label>
            <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={form.active} onChange={(e) => setForm({...form, active: e.target.checked})}/> Aktif</label>
            {message && <p className="text-xs font-bold text-red-500">{message}</p>}
            <button onClick={save} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-primary)] text-sm font-bold text-white"><Save size={16}/> Simpan</button>
          </div>
        </section>
        <section className="overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-left text-sm"><thead className="border-b bg-slate-50 text-xs text-slate-500"><tr><th className="p-4">Kategori</th><th>Slug</th><th>Status</th><th className="p-4 text-right">Aksi</th></tr></thead>
          <tbody>{categories.map((category) => <tr key={category.id} className="border-b last:border-0"><td className="p-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 overflow-hidden rounded-lg bg-slate-100">{category.thumbnail_url ? <img src={category.thumbnail_url} alt="" className="h-full w-full object-cover"/> : <FolderTree className="m-auto" size={17}/>}</div><b>{category.name}</b></div></td><td className="text-xs text-slate-500">{category.slug || "-"}</td><td><span className={`rounded-full px-2 py-1 text-xs ${category.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100"}`}>{category.active ? "Aktif" : "Nonaktif"}</span></td><td className="p-4"><div className="flex justify-end gap-2"><button onClick={() => { setForm(category); setEditing(true); }} className="rounded-lg border px-3 py-2 text-xs font-bold">Edit</button><button onClick={() => remove(category.id)} className="grid h-8 w-8 place-items-center rounded-lg border text-red-500"><Trash2 size={15}/></button></div></td></tr>)}</tbody></table>
        </section>
      </div>
    </main>
  );
}
