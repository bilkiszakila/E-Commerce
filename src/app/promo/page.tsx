import { products } from "../data";
import { ProductCard } from "../components";

export default function PromoPage() {
  return <main className="mx-auto max-w-[1180px] px-4 py-6 md:px-5">
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-600 to-red-400 p-7 text-white md:h-44 md:p-10"><b className="text-xs">FLASH SALE HARI INI</b><h1 className="mt-2 text-3xl font-black md:text-4xl">Diskon Cetak hingga 50%</h1><p className="mt-2 text-sm text-red-100">Berakhir dalam 02:14:39</p></div>
    <h2 className="mb-4 mt-8 text-xl font-black">Promo Pilihan</h2>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{products.map((p)=><ProductCard key={p.id} product={p}/>)}</div>
  </main>;
}
