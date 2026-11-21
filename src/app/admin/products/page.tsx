"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";
import type { ProductVariations, VariationOption } from "../../data";

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
  gallery: string[];
  variations: ProductVariations;
  rating: number;
  sold: number;
  active: boolean;
};

const emptyProduct: ProductRow = {
  id: "", name: "", slug: "", category: "", price: 0, old_price: null,
  image: "", thumbnail_url: "", badge: "", discount_percent: 0, discount_active: false, stock: 0,
  gallery: [], variations: { materials: [], sizes: [], finishings: [] }, rating: 0, sold: 0, active: true,
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
    setForm({
      ...product,
      gallery: Array.isArray(product.gallery) ? product.gallery : [],
      variations: {
        materials: product.variations?.materials || [],
        sizes: product.variations?.sizes || [],
        finishings: product.variations?.finishings || [],
      },
    });
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

  async function uploadGallery(files?: FileList | null) {
    if (!files?.length) return;
    setMessage("");
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setMessage("Galeri hanya menerima JPG, PNG, atau WebP.");
        continue;
      }
      const path = `gallery/${Date.now()}-${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage.from("products").upload(path, file, { upsert: false });
      if (error) {
        setMessage(error.message);
        continue;
      }
      uploaded.push(supabase.storage.from("products").getPublicUrl(path).data.publicUrl);
    }
    setForm((old) => ({ ...old, gallery: Array.from(new Set([...old.gallery, ...uploaded])) }));
  }

  async function removeGallery(url: string) {
    setForm((old) => ({ ...old, gallery: old.gallery.filter((item) => item !== url) }));
    const marker = "/storage/v1/object/public/products/";
    const index = url.indexOf(marker);
    if (index >= 0) {
      await supabase.storage.from("products").remove([decodeURIComponent(url.slice(index + marker.length))]);
    }
  }

  function updateVariation(category: keyof ProductVariations, index: number, patch: Partial<VariationOption>) {
    setForm((old) => ({
      ...old,
      variations: {
        ...old.variations,
        [category]: old.variations[category].map((item, i) => i === index ? { ...item, ...patch } : item),
      },
    }));
  }

  function addVariation(category: keyof ProductVariations) {
    setForm((old) => ({
      ...old,
      variations: {
        ...old.variations,
        [category]: [...old.variations[category], { name: "", extra_price: 0 }],
      },
    }));
  }

  function removeVariation(category: keyof ProductVariations, index: number) {
    setForm((old) => ({
      ...old,
      variations: {
        ...old.variations,
        [category]: old.variations[category].filter((_, i) => i !== index),
      },
    }));
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
      gallery: form.gallery,
      variations: form.variations,
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
            <div className="border-t pt-3">
              <p className="mb-2 text-xs font-bold text-slate-600">Galeri Produk</p>
              {form.gallery.length > 0 && <div className="grid grid-cols-3 gap-2">{form.gallery.map((url) => <div key={url} className="relative overflow-hidden rounded-lg border"><img src={url} alt="Foto galeri" className="h-20 w-full object-cover"/><button type="button" onClick={() => removeGallery(url)} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-bold text-red-500">×</button></div>)}</div>}
              <label className="mt-2 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed text-xs font-bold">Upload Foto Galeri<input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={(e) => uploadGallery(e.target.files)} className="hidden"/></label>
            </div>
            <VariationBuilder
              label="Bahan"
              items={form.variations.materials}
              onAdd={() => addVariation("materials")}
              onRemove={(index) => removeVariation("materials", index)}
              onChange={(index, patch) => updateVariation("materials", index, patch)}
            />
            <VariationBuilder
              label="Ukuran"
              items={form.variations.sizes}
              onAdd={() => addVariation("sizes")}
              onRemove={(index) => removeVariation("sizes", index)}
              onChange={(index, patch) => updateVariation("sizes", index, patch)}
            />
            <VariationBuilder
              label="Finishing"
              items={form.variations.finishings}
              onAdd={() => addVariation("finishings")}
              onRemove={(index) => removeVariation("finishings", index)}
              onChange={(index, patch) => updateVariation("finishings", index, patch)}
            />
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

function VariationBuilder({ label, items, onAdd, onRemove, onChange }: {
  label: string;
  items: VariationOption[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, patch: Partial<VariationOption>) => void;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between"><b className="text-xs">{label}</b><button type="button" onClick={onAdd} className="text-xs font-bold text-red-500">+ Tambah</button></div>
      {items.length === 0 ? <p className="text-[11px] text-slate-400">Tidak ada opsi {label.toLowerCase()}.</p> : <div className="space-y-2">{items.map((item, index) => (
        <div key={index} className="grid grid-cols-[1fr_100px_28px] gap-2">
          <input value={item.name} onChange={(e) => onChange(index, { name: e.target.value })} placeholder={`Nama ${label.toLowerCase()}`} className="h-9 rounded border px-2 text-xs"/>
          <input type="number" value={item.extra_price} onChange={(e) => onChange(index, { extra_price: Number(e.target.value) || 0 })} placeholder="Tambah Rp" className="h-9 rounded border px-2 text-xs"/>
          <button type="button" onClick={() => onRemove(index)} aria-label={`Hapus opsi ${label}`} className="grid h-9 place-items-center rounded border text-red-500"><Trash2 size={13}/></button>
        </div>
      ))}</div>}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; disabled?: boolean }) {
  return <label className="block text-xs font-bold text-slate-600">{label}<input disabled={disabled} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 h-11 w-full rounded-lg border px-3 text-sm font-normal disabled:bg-slate-100"/></label>;
}
