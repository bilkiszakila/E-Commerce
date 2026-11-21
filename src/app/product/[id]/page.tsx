"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Heart, Minus, Plus, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { formatRupiah } from "../../components";
import { useStore } from "../../store";
import { getProductByIdOrSlug } from "../../../lib/supabase/data";
import { Product } from "../../data";

function ProductContent() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [material, setMaterial] = useState("");
  const [size, setSize] = useState("");
  const [finishing, setFinishing] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useStore();

  useEffect(() => {
    const value = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!value) return;
    getProductByIdOrSlug(value).then((item) => {
      if (item) {
        setProduct(item);
        setMaterial(item.variations?.materials[0]?.name || "");
        setSize(item.variations?.sizes[0]?.name || "");
        setFinishing(item.variations?.finishings[0]?.name || "");
        setSelectedImage(item.thumbnailUrl || item.image);
      }
      setLoadingProduct(false);
    });
  }, [params.id]);

  const variations = product?.variations || { materials: [], sizes: [], finishings: [] };

  const unitPrice = useMemo(() => {
    if (!product) return 0;
    const basePrice = product.discountActive
      ? Math.round(product.price * (1 - (product.discountPercent || 0) / 100))
      : product.price;
    let price = basePrice;
    price += variations.materials.find((item) => item.name === material)?.extra_price || 0;
    price += variations.sizes.find((item) => item.name === size)?.extra_price || 0;
    price += variations.finishings.find((item) => item.name === finishing)?.extra_price || 0;
    return Math.max(5000, Math.round(price));
  }, [product, material, size, finishing, variations]);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    const primary = product.thumbnailUrl || product.image;
    return Array.from(new Set([primary, ...(product.gallery || [])].filter(Boolean)));
  }, [product]);

  function add() {
    if (!product) return;
    const labels = [material, size, finishing].filter(Boolean);
    const key = `${product.id}-${labels.join("-")}`;
    addToCart({ key, product, quantity, variants: labels.join(" · ") || "Tanpa variasi", unitPrice });
  }

  if (loadingProduct) {
    return <main className="grid min-h-[50vh] place-items-center text-sm text-slate-500">Memuat produk...</main>;
  }
  if (!product) {
    return <main className="grid min-h-[50vh] place-items-center px-4 text-center text-sm text-slate-500">Produk tidak ditemukan atau sudah tidak aktif.</main>;
  }

  return (
    <main className="mx-auto max-w-295 px-4 py-6 md:px-5">
      <div className="grid gap-6 rounded-xl bg-white p-4 md:grid-cols-[1fr_1fr] md:p-6">
        <div>
          <div className="aspect-square overflow-hidden rounded-lg bg-slate-100 md:h-130 md:aspect-auto">
            <img src={selectedImage || product.image} alt={product.name} className="h-full w-full object-cover" />
          </div>
          {galleryImages.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {galleryImages.map((img) => (
                <button key={img} onClick={() => setSelectedImage(img)} className={`h-20 overflow-hidden rounded border ${selectedImage === img ? "border-red-500" : "border-slate-200"}`}>
                  <img src={img} alt="" className="h-full w-full object-cover"/>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-red-500">{product.category}</p>
          <h1 className="mt-2 text-2xl font-black leading-tight md:text-3xl">{product.name}</h1>
          <p className="mt-2 text-sm text-slate-500">★ {product.rating} · Terjual {product.sold}+ · Garansi kualitas cetak</p>
          <div className="mt-5 border-y py-5">
            <p className="text-sm text-slate-500">Harga mulai</p>
            <p className="mt-1 text-3xl font-black text-red-500">{formatRupiah(unitPrice)} <span className="text-xs font-normal text-slate-400">/ item</span></p>
            {(product.oldPrice || product.discountActive) && (
              <p className="text-xs text-slate-400">
                Harga normal <span className="line-through">{formatRupiah(product.oldPrice || product.price)}</span>
                {product.discountActive && <span className="ml-2 font-bold text-orange-500">-{product.discountPercent || 0}%</span>}
              </p>
            )}
          </div>

          <div className="mt-5 space-y-5">
            {variations.materials.length > 0 && (
              <VariationOption label="Jenis bahan" value={material} setValue={setMaterial} options={variations.materials}/>
            )}
            {variations.sizes.length > 0 && (
              <VariationOption label="Ukuran" value={size} setValue={setSize} options={variations.sizes}/>
            )}
            {variations.finishings.length > 0 && (
              <VariationOption label="Finishing" value={finishing} setValue={setFinishing} options={variations.finishings}/>
            )}
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

function VariationOption({ label, value, setValue, options }: { label: string; value: string; setValue: (v: string) => void; options: {name:string;extra_price:number}[] }) {
  return <div><p className="mb-2 text-sm font-bold">{label}</p><div className="flex flex-wrap gap-2">{options.map((option) => <button key={option.name} onClick={() => setValue(option.name)} className={`rounded-lg border px-3 py-2 text-xs ${value === option.name ? "border-red-500 bg-red-50 font-bold text-red-500" : "border-slate-200 text-slate-600"}`}><span>{option.name}</span>{option.extra_price !== 0 && <span className="ml-1 text-[10px] text-slate-400">{option.extra_price > 0 ? `+${formatRupiah(option.extra_price)}` : formatRupiah(option.extra_price)}</span>}</button>)}</div></div>;
}

export default function ProductPage() {
  return <Suspense fallback={<div className="p-10 text-center">Memuat produk...</div>}><ProductContent /></Suspense>;
}
