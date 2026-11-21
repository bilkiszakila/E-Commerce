"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  old_price: number | null;
  image: string | null;
  thumbnail_url: string | null;
  badge: string | null;
  discount_percent: number;
  discount_active: boolean;
  stock: number;
  rating: number;
  sold: number;
  active: boolean;
};

const emptyProduct: ProductRow = {
  id: "", name: "", slug: "", category: "", price: 0, old_price: null,
  image: "", thumbnail_url: "", badge: "", discount_percent: 0, discount_active: false, stock: 0, rating: 0, sold: 0, active: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [form, setForm] = useState<ProductRow>(emptyProduct);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const [{ data: productData }, { data: categoryData }] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("categories").select("name").order("sort_order"),
    ]);
    setProducts(productData || []);
    setCategories((categoryData || []).map((item) => item.name));
  }

  useEffect(() => { load(); }, []);

  function edit(product: ProductRow) {
    setForm(product);
    setEditing(true);
  }

  function reset() {
    setForm(emptyProduct);
    setEditing(false);
  }

  function toSlug(value: string) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function uploadThumbnail(file?: File) {
    if (!file) return;
    const path = `products/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("products").upload(path, file, { upsert: true });
    if (error) { setMessage(error.message); return; }
    const { data } = supabase.storage.from("products").getPublicUrl(path);
    setForm((old) => ({ ...old, thumbnail_url: data.publicUrl, image: data.publicUrl }));
  }

  async function save() {
    setMessage("");
    if (!form.id || !form.name || !form.category || form.price <= 0) {
      setMessage("ID, nama, kategori, dan harga wajib diisi.");
      return;
    }
    const payload = {
      id: form.id,
      name: form.name,
      slug: form.slug || toSlug(form.name),
      category: form.category,
      price: form.price,
      old_price: form.old_price || null,
      image: form.image || null,
      thumbnail_url: form.thumbnail_url || form.image || null,
      badge: form.badge || null,
      discount_percent: form.discount_percent,
      discount_active: form.discount_active,
      stock: form.stock,
      rating: form.rating,
      sold: form.sold,
      active: form.active,
    };
    const { error } = editing
      ? await supabase.from("products").update(payload).eq("id", form.id)
      : await supabase.from("products").insert(payload);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage(editing ? "Produk berhasil diperbarui." : "Produk berhasil ditambahkan.");
    reset();
    load();
  }

  async function remove(id: string) {
    if (!confirm("Hapus produk ini?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) setMessage(error.message);
    else load();
  }

  return (
    <main className="mx-auto max-w-[1180px] px-4 py-8 md:px-5">
      <div className="mb-5 flex items-center justify-between">
        <div><Link href="/admin" className="mb-2 flex items-center gap-1 text-xs font-bold text-slate-500"><ArrowLeft size={14}/> Dashboard</Link><h1 className="text-2xl font-black">Pengelolaan Produk</h1></div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <section className="h-fit rounded-xl bg-white p-5">
          <h2 className="flex items-center gap-2 font-black">{editing ? "Edit Produk" : <><Plus size={17}/> Tambah Produk</>}</h2>
          <div className="mt-4 space-y-3">
            <Field label="ID Produk" value={form.id} disabled={editing} onChange={(value) => setForm({...form, id: value})}/>
            <Field label="Nama Produk" value={form.name} onChange={(value) => setForm({...form, name: value, slug: editing ? form.slug : toSlug(value)})}/>
            <Field label="Slug" value={form.slug} onChange={(value) => setForm({...form, slug: toSlug(value)})}/>
            <label className="block text-xs font-bold text-slate-600">Kategori
              <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="mt-2 h-11 w-full rounded-lg border px-3 text-sm">
                <option value="">Pilih kategori</option>{categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Harga" type="number" value={String(form.price)} onChange={(value) => setForm({...form, price: Number(value)})}/>
              <Field label="Harga Lama" type="number" value={form.old_price ? String(form.old_price) : ""} onChange={(value) => setForm({...form, old_price: value ? Number(value) : null})}/>
            </div>
            <Field label="URL Gambar" value={form.image || ""} onChange={(value) => setForm({...form, image: value})}/>
            {form.thumbnail_url && <img src={form.thumbnail_url} alt="Thumbnail produk" className="h-32 w-full rounded-lg object-cover"/>}
            <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border text-xs font-bold">Upload Thumbnail<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => uploadThumbnail(e.target.files?.[0])} className="hidden"/></label>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Badge" value={form.badge || ""} onChange={(value) => setForm({...form, badge: value})}/>
              <Field label="Terjual" type="number" value={String(form.sold)} onChange={(value) => setForm({...form, sold: Number(value)})}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stok" type="number" value={String(form.stock)} onChange={(value) => setForm({...form, stock: Number(value)})}/>
              <Field label="Diskon %" type="number" value={String(form.discount_percent)} onChange={(value) => setForm({...form, discount_percent: Number(value)})}/>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={form.discount_active} onChange={(e) => setForm({...form, discount_active: e.target.checked})}/> Diskon aktif</label>
            <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={form.active} onChange={(e) => setForm({...form, active: e.target.checked})}/> Produk aktif</label>
            {message && <p className="text-xs font-bold text-red-500">{message}</p>}
            <div className="flex gap-2"><button onClick={save} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 text-sm font-bold text-white"><Save size={16}/> Simpan</button>{editing && <button onClick={reset} className="h-11 rounded-lg border px-4 text-sm font-bold">Batal</button>}</div>
          </div>
        </section>
        <section className="overflow-hidden rounded-xl bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs text-slate-500"><tr><th className="p-4">Produk</th><th>Harga</th><th>Status</th><th className="p-4 text-right">Aksi</th></tr></thead>
              <tbody>{products.map((product) => <tr key={product.id} className="border-b last:border-0"><td className="p-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100"><Package size={18}/></div><div><b className="block">{product.name}</b><span className="text-xs text-slate-400">{product.category}</span></div></div></td><td className="font-bold">Rp {product.price.toLocaleString("id-ID")}</td><td><span className={`rounded-full px-2 py-1 text-xs font-bold ${product.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{product.active ? "Aktif" : "Nonaktif"}</span></td><td className="p-4"><div className="flex justify-end gap-2"><button onClick={() => edit(product)} className="rounded-lg border px-3 py-2 text-xs font-bold">Edit</button><button onClick={() => remove(product.id)} aria-label={`Hapus ${product.name}`} className="grid h-8 w-8 place-items-center rounded-lg border text-red-500"><Trash2 size={15}/></button></div></td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, type = "text", disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; disabled?: boolean }) {
  return <label className="block text-xs font-bold text-slate-600">{label}<input disabled={disabled} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 h-11 w-full rounded-lg border px-3 text-sm font-normal disabled:bg-slate-100"/></label>;
}
