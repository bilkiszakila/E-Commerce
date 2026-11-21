"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, MapPin, Navigation, QrCode, ShieldCheck, Tag } from "lucide-react";
import { useStore } from "../store";
import { formatRupiah } from "../components";
import { findVoucher, getStoreSettings, ShippingOption } from "../../lib/supabase/data";
import { supabase } from "../../lib/supabase/client";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useStore();
  const [courier, setCourier] = useState("JNE Reg");
  const [payment, setPayment] = useState<"qris"|"bank">("qris");
  const [voucherCode, setVoucherCode] = useState("");
  const [memberCode, setMemberCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; type: "fixed"|"percent"; value: number } | null>(null);
  const [promoMessage, setPromoMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", province: "DKI Jakarta", city: "Jakarta Selatan", district: "", address: "", postcode: "" });
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([
    { name: "JNE Reg", description: "Estimasi 2–3 hari", price: 17000 },
    { name: "J&T Express", description: "Estimasi 1–2 hari", price: 19000 },
    { name: "Ambil Sendiri", description: "Semarang Store", price: 0 },
  ]);
  useEffect(() => {
    getStoreSettings().then((settings) => {
      if (settings?.shippingOptions.length) setShippingOptions(settings.shippingOptions);
    });
  }, []);
  const selectedShipping = shippingOptions.find((option) => option.name === courier) || shippingOptions[0];
  const shipping = selectedShipping?.price || 0;
  const discount = appliedVoucher
    ? appliedVoucher.type === "percent"
      ? Math.round(cartTotal * appliedVoucher.value / 100)
      : Math.min(appliedVoucher.value, cartTotal)
    : 0;
  const total = Math.max(0, cartTotal + shipping - discount);

  async function applyPromo() {
    const code = (voucherCode || memberCode).trim().toUpperCase();
    if (!code) { setPromoMessage("Masukkan voucher atau kode member."); return; }
    const voucher = await findVoucher(code);
    if (!voucher) { setAppliedVoucher(null); setPromoMessage("Kode tidak ditemukan atau tidak aktif."); return; }
    if ((voucher.minimum_purchase || 0) > cartTotal) {
      setAppliedVoucher(null);
      setPromoMessage(`Minimal belanja ${formatRupiah(voucher.minimum_purchase)}.`);
      return;
    }
    if (voucher.usage_limit !== null && voucher.used_count >= voucher.usage_limit) {
      setAppliedVoucher(null);
      setPromoMessage("Batas penggunaan voucher sudah tercapai.");
      return;
    }
    setAppliedVoucher(voucher);
    setPromoMessage(`Kode ${voucher.code} berhasil diterapkan.`);
  }

  async function pay() {
    if (!form.name || !form.phone || !form.address || !form.district) { alert("Lengkapi nama, nomor telepon, kecamatan, dan alamat penerima."); return; }
    setLoading(true);
    const orderId = `AC-${Date.now().toString().slice(-8)}`;
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id || null;

    const { error: orderError } = await supabase.from("orders").insert({
      id: orderId,
      user_id: userId,
      status: "pending",
      courier,
      payment,
      subtotal: cartTotal,
      shipping,
      discount,
      total,
      voucher_code: appliedVoucher?.code || null,
      shipping_address: {
        name: form.name,
        phone: form.phone,
        province: form.province,
        city: form.city,
        district: form.district,
        address: form.address,
        postcode: form.postcode,
      },
    });
    if (orderError) {
      setLoading(false);
      alert(`Pesanan gagal dibuat: ${orderError.message}`);
      return;
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      cart.map((item) => ({
        order_id: orderId,
        product_id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        variants: item.variants,
      }))
    );
    if (itemsError) {
      await supabase.from("orders").delete().eq("id", orderId);
      setLoading(false);
      alert(`Item pesanan gagal disimpan: ${itemsError.message}`);
      return;
    }

    clearCart();
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
              {shippingOptions.map((option) => <label key={option.name} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${courier === option.name ? "border-red-500 bg-red-50" : "border-slate-200"}`}>
                <input type="radio" name="courier" checked={courier === option.name} onChange={() => setCourier(option.name)} className="accent-red-500"/>
                <div className="flex-1"><b className="block text-sm">{option.name}</b><span className="text-xs text-slate-500">{option.description}</span></div><b className="text-sm">{option.price === 0 ? "Gratis" : formatRupiah(option.price)}</b>
              </label>)}
            </div>
          </section>
          <section className="rounded-xl bg-white p-5 md:hidden">
            <h2 className="font-black">Voucher atau Kode Member</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input value={voucherCode} onChange={(e)=>setVoucherCode(e.target.value.toUpperCase())} placeholder="Kode voucher" className="h-11 rounded-lg border px-3 text-sm uppercase outline-none focus:border-red-400"/>
              <input value={memberCode} onChange={(e)=>setMemberCode(e.target.value.toUpperCase())} placeholder="Kode member" className="h-11 rounded-lg border px-3 text-sm uppercase outline-none focus:border-red-400"/>
              <button onClick={applyPromo} className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-bold text-white"><Tag className="mr-2 inline" size={15}/> Gunakan</button>
            </div>
            {promoMessage && <p className={`mt-2 text-xs ${appliedVoucher ? "text-emerald-600" : "text-red-500"}`}>{promoMessage}</p>}
          </section>
          <section className="rounded-xl bg-white p-5 md:hidden">
            <h2 className="font-black">Metode Pembayaran</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className={`cursor-pointer rounded-lg border p-4 ${payment === "qris" ? "border-red-500 bg-red-50" : "border-slate-200"}`}>
                <input type="radio" name="payment" checked={payment === "qris"} onChange={()=>setPayment("qris")} className="accent-red-500"/>
                <QrCode className="mt-3 text-slate-700" size={28}/>
                <b className="mt-2 block text-sm">QRIS</b>
                <span className="mt-1 block text-xs text-slate-500">Scan QR melalui aplikasi e-wallet atau mobile banking. Diproses Xendit.</span>
              </label>
              <label className={`cursor-pointer rounded-lg border p-4 ${payment === "bank" ? "border-red-500 bg-red-50" : "border-slate-200"}`}>
                <input type="radio" name="payment" checked={payment === "bank"} onChange={()=>setPayment("bank")} className="accent-red-500"/>
                <CreditCard className="mt-3 text-slate-700" size={28}/>
                <b className="mt-2 block text-sm">Transfer Bank</b>
                <span className="mt-1 block text-xs text-slate-500">Transfer manual dan unggah bukti pembayaran untuk dicek admin.</span>
              </label>
            </div>
          </section>
        </div>
        <aside className="h-fit rounded-xl bg-white p-5">
          <h2 className="font-black">Ringkasan Pesanan</h2>
          <div className="mt-3 space-y-3">
            {cart.map((item) => <div key={item.key} className="flex gap-3"><img src={item.product.image} alt="" className="h-14 w-14 rounded object-cover"/><div className="min-w-0 flex-1"><p className="line-clamp-1 text-xs font-bold">{item.product.name}</p><p className="mt-1 text-[10px] text-slate-400">{item.quantity} × {formatRupiah(item.unitPrice)}</p></div></div>)}
          </div>
          <div className="mt-5 hidden border-t pt-4 md:block">
            <h3 className="text-sm font-black">Voucher atau Kode Member</h3>
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
              <input value={voucherCode} onChange={(e)=>setVoucherCode(e.target.value.toUpperCase())} placeholder="Kode voucher/member" className="h-10 min-w-0 rounded-lg border px-3 text-xs uppercase outline-none focus:border-red-400"/>
              <button onClick={applyPromo} className="h-10 rounded-lg bg-slate-950 px-3 text-xs font-bold text-white">Gunakan</button>
            </div>
            {memberCode && <input value={memberCode} onChange={(e)=>setMemberCode(e.target.value.toUpperCase())} placeholder="Kode member alternatif" className="mt-2 h-10 w-full rounded-lg border px-3 text-xs uppercase outline-none focus:border-red-400"/>}
            {promoMessage && <p className={`mt-2 text-xs ${appliedVoucher ? "text-emerald-600" : "text-red-500"}`}>{promoMessage}</p>}
          </div>
          <div className="mt-5 hidden border-t pt-4 md:block">
            <h3 className="text-sm font-black">Metode Pembayaran</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className={`cursor-pointer rounded-lg border p-3 ${payment === "qris" ? "border-red-500 bg-red-50" : "border-slate-200"}`}>
                <input type="radio" name="payment-summary" checked={payment === "qris"} onChange={()=>setPayment("qris")} className="accent-red-500"/>
                <QrCode className="mt-2 text-slate-700" size={21}/>
                <b className="mt-1 block text-xs">QRIS</b>
              </label>
              <label className={`cursor-pointer rounded-lg border p-3 ${payment === "bank" ? "border-red-500 bg-red-50" : "border-slate-200"}`}>
                <input type="radio" name="payment-summary" checked={payment === "bank"} onChange={()=>setPayment("bank")} className="accent-red-500"/>
                <CreditCard className="mt-2 text-slate-700" size={21}/>
                <b className="mt-1 block text-xs">Transfer Bank</b>
              </label>
            </div>
          </div>
          <div className="mt-5 space-y-3 border-t pt-4 text-sm"><div className="flex justify-between"><span className="text-slate-500">Subtotal</span><b>{formatRupiah(cartTotal)}</b></div><div className="flex justify-between"><span className="text-slate-500">Ongkir</span><b>{formatRupiah(shipping)}</b></div>{discount > 0 && <div className="flex justify-between"><span className="text-slate-500">Diskon</span><b className="text-emerald-600">-{formatRupiah(discount)}</b></div>}<div className="flex justify-between border-t pt-3"><b>Total</b><b className="text-xl text-red-500">{formatRupiah(total)}</b></div></div>
          <button onClick={pay} disabled={loading} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-red-500 text-sm font-bold text-white disabled:opacity-60"><ShieldCheck size={18}/>{loading ? "Memproses..." : payment === "qris" ? "Bayar QRIS dengan Xendit" : "Lanjutkan Transfer Bank"}</button>
          <p className="mt-3 text-center text-[10px] text-slate-400">{payment === "qris" ? "Pembayaran aman melalui Xendit" : "Pembayaran diverifikasi manual oleh admin"}</p>
        </aside>
      </div>
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string)=>void }) {
  return <label className="text-xs font-bold text-slate-600">{label}<input value={value} onChange={(e)=>onChange(e.target.value)} className="mt-2 h-11 w-full rounded-lg border px-3 font-normal outline-none focus:border-red-400"/></label>;
}
