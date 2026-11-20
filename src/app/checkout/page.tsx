"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Navigation, ShieldCheck } from "lucide-react";
import { useStore } from "../store";
import { formatRupiah } from "../components";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, loggedIn, clearCart } = useStore();
  const [courier, setCourier] = useState("JNE Reg");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", province: "DKI Jakarta", city: "Jakarta Selatan", district: "", address: "", postcode: "" });
  const shipping = courier === "Ambil Sendiri" ? 0 : courier === "J&T Express" ? 19000 : 17000;
  const total = cartTotal + shipping;

  async function pay() {
    if (!loggedIn) { router.push("/login?next=/checkout"); return; }
    if (!form.name || !form.phone || !form.address || !form.district) { alert("Lengkapi nama, nomor telepon, kecamatan, dan alamat penerima."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    clearCart();
    const orderId = `AC-${Date.now().toString().slice(-8)}`;
    localStorage.setItem("adicetak-last-order", JSON.stringify({ id: orderId, total, status: "Menunggu Pembayaran", date: new Date().toISOString(), courier }));
    router.push(`/payment/${orderId}`);
  }

  if (cart.length === 0) return <main className="mx-auto max-w-[1180px] px-5 py-12 text-center"><h1 className="text-xl font-black">Keranjang kosong</h1><button onClick={() => router.push("/")} className="mt-5 rounded-lg bg-red-500 px-5 py-3 text-sm font-bold text-white">Belanja Sekarang</button></main>;

  return (
    <main className="mx-auto max-w-[1180px] px-4 py-6 md:px-5">
      <h1 className="mb-5 text-xl font-black md:text-2xl">Checkout</h1>
      <div className="grid gap-5 md:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <section className="rounded-xl bg-white p-5">
            <h2 className="flex items-center gap-2 font-black"><MapPin size={18} className="text-red-500"/> Alamat Pengiriman</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Nama Penerima" value={form.name} onChange={(v) => setForm({...form,name:v})}/>
              <Field label="Nomor WhatsApp" value={form.phone} onChange={(v) => setForm({...form,phone:v})}/>
              <Field label="Provinsi" value={form.province} onChange={(v) => setForm({...form,province:v})}/>
              <Field label="Kota / Kabupaten" value={form.city} onChange={(v) => setForm({...form,city:v})}/>
              <Field label="Kecamatan" value={form.district} onChange={(v) => setForm({...form,district:v})}/>
              <Field label="Kode Pos" value={form.postcode} onChange={(v) => setForm({...form,postcode:v})}/>
              <label className="sm:col-span-2 text-xs font-bold text-slate-600">Alamat Lengkap
                <textarea value={form.address} onChange={(e) => setForm({...form,address:e.target.value})} className="mt-2 h-20 w-full resize-none rounded-lg border px-3 py-3 font-normal outline-none focus:border-red-400" placeholder="Nama jalan, nomor rumah, gedung, patokan..."/>
              </label>
              <button className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 text-xs font-bold sm:col-span-2"><Navigation size={16}/> Gunakan Lokasi Saat Ini</button>
            </div>
          </section>
          <section className="rounded-xl bg-white p-5">
            <h2 className="font-black">Pilih Pengiriman</h2>
            <div className="mt-3 space-y-2">
              {[["JNE Reg","Estimasi 2–3 hari",17000],["J&T Express","Estimasi 1–2 hari",19000],["Ambil Sendiri","Semarang Store",0]].map(([name,desc,price]) => <label key={name as string} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${courier === name ? "border-red-500 bg-red-50" : "border-slate-200"}`}>
                <input type="radio" name="courier" checked={courier === name} onChange={() => setCourier(name as string)} className="accent-red-500"/>
                <div className="flex-1"><b className="block text-sm">{name}</b><span className="text-xs text-slate-500">{desc}</span></div><b className="text-sm">{price === 0 ? "Gratis" : formatRupiah(price as number)}</b>
              </label>)}
            </div>
          </section>
        </div>
        <aside className="h-fit rounded-xl bg-white p-5">
          <h2 className="font-black">Ringkasan Pesanan</h2>
          <div className="mt-3 space-y-3">
            {cart.map((item) => <div key={item.key} className="flex gap-3"><img src={item.product.image} alt="" className="h-14 w-14 rounded object-cover"/><div className="min-w-0 flex-1"><p className="line-clamp-1 text-xs font-bold">{item.product.name}</p><p className="mt-1 text-[10px] text-slate-400">{item.quantity} × {formatRupiah(item.unitPrice)}</p></div></div>)}
          </div>
          <div className="mt-5 space-y-3 border-t pt-4 text-sm"><div className="flex justify-between"><span className="text-slate-500">Subtotal</span><b>{formatRupiah(cartTotal)}</b></div><div className="flex justify-between"><span className="text-slate-500">Ongkir</span><b>{formatRupiah(shipping)}</b></div><div className="flex justify-between border-t pt-3"><b>Total</b><b className="text-xl text-red-500">{formatRupiah(total)}</b></div></div>
          <button onClick={pay} disabled={loading} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-red-500 text-sm font-bold text-white disabled:opacity-60"><ShieldCheck size={18}/>{loading ? "Memproses..." : "Bayar dengan Xendit"}</button>
          <p className="mt-3 text-center text-[10px] text-slate-400">Pembayaran aman melalui Xendit</p>
        </aside>
      </div>
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string)=>void }) {
  return <label className="text-xs font-bold text-slate-600">{label}<input value={value} onChange={(e)=>onChange(e.target.value)} className="mt-2 h-11 w-full rounded-lg border px-3 font-normal outline-none focus:border-red-400"/></label>;
}
