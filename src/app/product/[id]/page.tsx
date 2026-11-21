"use client";

import { Suspense, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Heart, Minus, Plus, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { products } from "../../data";
import { formatRupiah } from "../../components";
import { useStore } from "../../store";

function ProductContent() {
  const params = useParams();
  const router = useRouter();
  const product = products.find((p) => p.id === params.id) || products[0];
  const [material, setMaterial] = useState("Standard");
  const [size, setSize] = useState("60 x 90 cm");
  const [customWidth, setCustomWidth] = useState("60");
  const [customHeight, setCustomHeight] = useState("90");
  const [finishing, setFinishing] = useState("Tanpa");
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useStore();

  const unitPrice = useMemo(() => {
    let price = product.price;
    if (material === "Premium") price *= 1.35;
    if (material === "Outdoor") price *= 1.6;
    if (size === "120 x 160 cm") price *= 2.2;
    if (size === "Custom") price *= (Number(customWidth) * Number(customHeight)) / 5400;
    if (finishing === "Jahit + Mata Itik") price += 18000;
    if (finishing === "Doble Sisi") price += 12000;
    if (finishing === "Laminasi") price += 25000;
    return Math.max(5000, Math.round(price));
  }, [product, material, size, customWidth, customHeight, finishing]);

  function add() {
    const key = `${product.id}-${material}-${size}-${customWidth}-${customHeight}-${finishing}`;
    addToCart({ key, product, quantity, variants: `${material} · ${size === "Custom" ? `${customWidth} x ${customHeight} cm` : size} · ${finishing}`, unitPrice });
  }

  return (
    <main className="mx-auto max-w-295 px-4 py-6 md:px-5">
      <div className="grid gap-6 rounded-xl bg-white p-4 md:grid-cols-[1fr_1fr] md:p-6">
        <div>
          <div className="aspect-square overflow-hidden rounded-lg bg-slate-100 md:h-130 md:aspect-auto">
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[product.image, product.image, product.image, product.image].map((img, i) => <button key={i} className={`h-20 overflow-hidden rounded border ${i === 0 ? "border-red-500" : "border-slate-200"}`}><img src={img} alt="" className="h-full w-full object-cover"/></button>)}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-red-500">{product.category}</p>
          <h1 className="mt-2 text-2xl font-black leading-tight md:text-3xl">{product.name}</h1>
          <p className="mt-2 text-sm text-slate-500">★ {product.rating} · Terjual {product.sold}+ · Garansi kualitas cetak</p>
          <div className="mt-5 border-y py-5">
            <p className="text-sm text-slate-500">Harga mulai</p>
            <p className="mt-1 text-3xl font-black text-red-500">{formatRupiah(unitPrice)} <span className="text-xs font-normal text-slate-400">/ item</span></p>
            {product.oldPrice && <p className="text-xs text-slate-400">Harga normal <span className="line-through">{formatRupiah(product.oldPrice)}</span></p>}
          </div>

          <div className="mt-5 space-y-5">
            <Option label="Jenis bahan" value={material} setValue={setMaterial} options={["Standard", "Premium", "Outdoor"]}/>
            <Option label="Ukuran" value={size} setValue={setSize} options={["60 x 90 cm", "120 x 160 cm", "Custom"]}/>
            {size === "Custom" && <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
              <label className="text-xs font-bold text-slate-600">Lebar (cm)<input type="number" min="10" value={customWidth} onChange={(e) => setCustomWidth(e.target.value)} className="mt-2 h-11 w-full rounded border bg-white px-3 outline-none"/></label>
              <label className="text-xs font-bold text-slate-600">Tinggi (cm)<input type="number" min="10" value={customHeight} onChange={(e) => setCustomHeight(e.target.value)} className="mt-2 h-11 w-full rounded border bg-white px-3 outline-none"/></label>
            </div>}
            <Option label="Finishing" value={finishing} setValue={setFinishing} options={["Tanpa", "Laminasi", "Jahit + Mata Itik", "Doble Sisi"]}/>
            <div>
              <p className="mb-2 text-sm font-bold">Jumlah</p>
              <div className="flex w-fit items-center overflow-hidden rounded-lg border">
                <button onClick={() => setQuantity(Math.max(1, quantity-1))} className="grid h-11 w-11 place-items-center"><Minus size={16}/></button>
                <input value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)||1))} className="h-11 w-14 border-x text-center outline-none" />
                <button onClick={() => setQuantity(quantity+1)} className="grid h-11 w-11 place-items-center"><Plus size={16}/></button>
              </div>
            </div>
            <label className="block text-sm font-bold">Catatan atau upload desain
              <textarea className="mt-2 h-20 w-full resize-none rounded-lg border p-3 font-normal outline-none focus:border-red-400" placeholder="Contoh: warna merah dominan, jangan potong logo..." />
              <input type="file" accept=".jpg,.jpeg,.png,.pdf,.cdr,.ai" className="mt-2 block text-xs font-normal text-slate-500" />
            </label>
          </div>

          <div className="mt-6 grid grid-cols-[52px_1fr] gap-3">
            <button className="grid h-12 place-items-center rounded-lg border text-slate-500"><Heart size={20}/></button>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={add} className="flex h-12 items-center justify-center gap-2 rounded-lg border border-red-500 font-bold text-red-500"><ShoppingCart size={18}/> Keranjang</button>
              <button onClick={() => { add(); router.push("/cart"); }} className="h-12 rounded-lg bg-red-500 font-bold text-white">Beli Sekarang</button>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-slate-500"><span className="flex items-center gap-2"><Truck size={16}/> Cek ongkir tersedia</span><span className="flex items-center gap-2"><ShieldCheck size={16}/> Kualitas terjamin</span></div>
        </div>
      </div>
    </main>
  );
}

function Option({ label, value, setValue, options }: { label: string; value: string; setValue: (v: string) => void; options: string[] }) {
  return <div><p className="mb-2 text-sm font-bold">{label}</p><div className="flex flex-wrap gap-2">{options.map((o) => <button key={o} onClick={() => setValue(o)} className={`rounded-lg border px-3 py-2 text-xs ${value === o ? "border-red-500 bg-red-50 font-bold text-red-500" : "border-slate-200 text-slate-600"}`}>{o}</button>)}</div></div>;
}

export default function ProductPage() {
  return <Suspense fallback={<div className="p-10 text-center">Memuat produk...</div>}><ProductContent /></Suspense>;
}
