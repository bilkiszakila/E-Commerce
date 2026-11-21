"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, MapPin, Navigation, QrCode, ShieldCheck, Tag } from "lucide-react";
import { useStore } from "@/app/store";
import { formatRupiah } from "@/app/components";
import { findVoucher, findMemberCode } from "@/services/productService";
import { getStoreSettings, ShippingOption, BankOption } from "@/services/settingsService";
import { supabase } from "@/lib/supabase/client";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useStore();
  const [courier, setCourier] = useState("JNE Reg");
  const [payment, setPayment] = useState<"qris"|"bank">("qris");
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; type: "fixed"|"percent"; value: number } | null>(null);
  const [promoMessage, setPromoMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", province: "DKI Jakarta", city: "Jakarta Selatan", district: "", address: "", postcode: "" });
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([
    { name: "JNE Reg", description: "Estimasi 2–3 hari", price: 17000 },
    { name: "J&T Express", description: "Estimasi 1–2 hari", price: 19000 },
    { name: "Ambil Sendiri", description: "Semarang Store", price: 0 },
  ]);
  const [bankOptions, setBankOptions] = useState<BankOption[]>([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [coordinates, setCoordinates] = useState<{lat:number;lng:number}|null>(null);
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login?next=/checkout");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,name,phone,address")
        .eq("id", data.session.user.id)
        .maybeSingle();
      if (profile) {
        const address = (profile.address as Record<string,string>) || {};
        setForm((old) => ({
          ...old,
          name: profile.full_name || profile.name || old.name,
          phone: profile.phone || old.phone,
          province: address.province || old.province,
          city: address.city || old.city,
          district: address.district || old.district,
          postcode: address.postcode || old.postcode,
          address: address.address || old.address,
        }));
      }
    });
    getStoreSettings().then((settings) => {
      if (settings?.shippingOptions.length) setShippingOptions(settings.shippingOptions);
      if (settings?.bankOptions.length) {
        setBankOptions(settings.bankOptions);
        setSelectedBank(settings.bankOptions[0].bank_name);
      }
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

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert("Browser tidak mendukung lokasi.");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setCoordinates({ lat, lng });
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=id`);
        if (!response.ok) throw new Error("Reverse geocoding gagal.");
        const data = await response.json();
        const address = data.address || {};
        setForm((old) => ({
          ...old,
          province: address.state || address.region || old.province,
          city: address.city || address.county || address.municipality || address.town || old.city,
          district: address.subdistrict || address.village || address.suburb || address.municipality || old.district,
          postcode: String(address.postcode || old.postcode).replace(/\D/g, "").slice(0, 5),
          address: [address.road, address.house_number, address.neighbourhood, address.suburb].filter(Boolean).join(", ") || old.address,
        }));
      } catch (error) {
        console.error(error);
        alert("Lokasi ditemukan, tetapi alamat belum dapat diisi otomatis.");
      } finally {
        setLocationLoading(false);
      }
    }, (error) => {
      setLocationLoading(false);
      alert(error.code === 1 ? "Izin lokasi ditolak. Aktifkan izin lokasi di browser." : "Lokasi saat ini tidak dapat ditemukan.");
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
  }

  async function applyPromo() {
    const code = voucherCode.trim().toUpperCase();
    if (!code) { setPromoMessage("Masukkan voucher atau kode member."); return; }
    const voucher = await findVoucher(code);
    if (!voucher) {
      const member = await findMemberCode(code);
      if (!member || member.discountPercent <= 0) {
        setAppliedVoucher(null);
        setPromoMessage("Kode voucher/member tidak ditemukan atau tidak aktif.");
        return;
      }
      setAppliedVoucher({ code: member.code, type: "percent", value: member.discountPercent });
      setPromoMessage(`Kode member ${member.code} berhasil diterapkan.`);
      return;
    }
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
    const errors: Record<string, string> = {};
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (form.name.trim().length < 3) errors.name = "Nama penerima minimal 3 karakter.";
    if (!(form.phone.startsWith("08") || form.phone.startsWith("+62")) || phoneDigits.length < 10 || phoneDigits.length > 14) {
      errors.phone = "Nomor WhatsApp harus diawali 08 atau +62 dan berisi 10–14 digit.";
    }
    if (!form.province) errors.province = "Provinsi wajib dipilih.";
    if (!form.city) errors.city = "Kota/Kabupaten wajib dipilih.";
    if (!form.district) errors.district = "Kecamatan wajib dipilih.";
    if (!/^\d{5}$/.test(form.postcode)) errors.postcode = "Kode Pos harus 5 digit angka.";
    if (form.address.trim().length < 15) errors.address = "Alamat lengkap minimal 15 karakter.";
    if (payment === "bank" && !selectedBank) errors.payment = "Pilih bank tujuan transfer.";
    setAddressErrors(errors);
    if (Object.keys(errors).length) {
      const firstError = Object.values(errors)[0];
      alert(firstError);
      return;
    }
    setLoading(true);
    const orderId = `AC-${Date.now().toString().slice(-8)}`;
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id || null;

    const { error: orderError } = await supabase.from("orders").insert({
      id: orderId,
      user_id: userId,
      status: "pending",
      courier,
      payment: payment === "bank" ? `Transfer Bank - ${selectedBank}` : "QRIS",
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
        lat: coordinates?.lat || null,
        lng: coordinates?.lng || null,
        google_maps_url: coordinates ? `https://maps.google.com/?q=${coordinates.lat},${coordinates.lng}` : null,
        selected_bank: payment === "bank"
          ? bankOptions.find((bank) => bank.bank_name === selectedBank) || null
          : null,
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
              <Field label="Nama Penerima" value={form.name} onChange={(v) => setForm({...form,name:v})} error={addressErrors.name}/>
              <Field label="Nomor WhatsApp" value={form.phone} onChange={(v) => setForm({...form,phone:v})} error={addressErrors.phone}/>
              <label className="text-xs font-bold text-slate-600">Provinsi
                <input value={form.province} onChange={(e)=>setForm({...form,province:e.target.value})} placeholder="Masukkan provinsi" className="mt-2 h-11 w-full rounded-lg border px-3 font-normal"/>
                {addressErrors.province && <span className="mt-1 block text-[11px] text-red-500">{addressErrors.province}</span>}
              </label>
              <label className="text-xs font-bold text-slate-600">Kota / Kabupaten
                <input value={form.city} onChange={(e)=>setForm({...form,city:e.target.value})} placeholder="Masukkan kota atau kabupaten" className="mt-2 h-11 w-full rounded-lg border px-3 font-normal"/>
                {addressErrors.city && <span className="mt-1 block text-[11px] text-red-500">{addressErrors.city}</span>}
              </label>
              <label className="text-xs font-bold text-slate-600">Kecamatan
                <input value={form.district} onChange={(e)=>setForm({...form,district:e.target.value})} placeholder="Masukkan kecamatan" className="mt-2 h-11 w-full rounded-lg border px-3 font-normal"/>
                {addressErrors.district && <span className="mt-1 block text-[11px] text-red-500">{addressErrors.district}</span>}
              </label>
              <Field label="Kode Pos" value={form.postcode} onChange={(v) => setForm({...form,postcode:v.replace(/\D/g,"").slice(0,5)})} error={addressErrors.postcode}/>
              <label className="sm:col-span-2 text-xs font-bold text-slate-600">Alamat Lengkap
                <textarea value={form.address} onChange={(e) => setForm({...form,address:e.target.value})} className="mt-2 h-20 w-full resize-none rounded-lg border px-3 py-3 font-normal outline-none focus:border-red-400" placeholder="Nama jalan, RT/RW, nomor rumah, gedung, patokan..."/>
                {addressErrors.address && <span className="mt-1 block text-[11px] text-red-500">{addressErrors.address}</span>}
              </label>
              <button type="button" onClick={useCurrentLocation} disabled={locationLoading} className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 text-xs font-bold sm:col-span-2 disabled:opacity-60"><Navigation size={16}/> {locationLoading ? "Mencari lokasi..." : "Gunakan Lokasi Saat Ini"}</button>
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
              <input value={voucherCode} onChange={(e)=>setVoucherCode(e.target.value.toUpperCase())} placeholder="Kode voucher atau member" className="h-11 rounded-lg border px-3 text-sm uppercase outline-none focus:border-red-400 sm:col-span-2"/>
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
            {payment === "bank" && <div className="mt-3"><label className="text-xs font-bold text-slate-600">Pilih Bank Tujuan
              <select value={selectedBank} onChange={(e)=>setSelectedBank(e.target.value)} className="mt-2 h-11 w-full rounded-lg border px-3 text-sm font-normal">
                <option value="">Pilih Bank</option>
                {bankOptions.map((bank)=><option key={bank.bank_name} value={bank.bank_name}>{bank.bank_name} — {bank.account_number}</option>)}
              </select>
              {addressErrors.payment && <span className="mt-1 block text-[11px] text-red-500">{addressErrors.payment}</span>}
            </label></div>}
          </section>
        </div>
        <aside className="h-fit rounded-xl bg-white p-5">
          <h2 className="font-black">Ringkasan Pesanan</h2>
          <div className="mt-3 space-y-3">
            {cart.map((item) => <div key={item.key} className="flex gap-3"><img src={item.product.image} alt="" className="h-14 w-14 rounded object-cover"/><div className="min-w-0 flex-1"><p className="line-clamp-1 text-xs font-bold">{item.product.name}</p><p className="mt-1 text-[10px] text-slate-400">{item.quantity} × {formatRupiah(item.unitPrice)}{item.fixedExtra ? ` + ${formatRupiah(item.fixedExtra)}` : ""}</p></div></div>)}
          </div>
          <div className="mt-5 hidden border-t pt-4 md:block">
            <h3 className="text-sm font-black">Voucher atau Kode Member</h3>
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
              <input value={voucherCode} onChange={(e)=>setVoucherCode(e.target.value.toUpperCase())} placeholder="Kode voucher/member" className="h-10 min-w-0 rounded-lg border px-3 text-xs uppercase outline-none focus:border-red-400"/>
              <button onClick={applyPromo} className="h-10 rounded-lg bg-slate-950 px-3 text-xs font-bold text-white">Gunakan</button>
            </div>
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
            {payment === "bank" && <div className="mt-3"><select value={selectedBank} onChange={(e)=>setSelectedBank(e.target.value)} className="h-10 w-full rounded-lg border px-3 text-xs"><option value="">Pilih Bank</option>{bankOptions.map((bank)=><option key={bank.bank_name} value={bank.bank_name}>{bank.bank_name} — {bank.account_number}</option>)}</select>{addressErrors.payment && <p className="mt-1 text-[11px] text-red-500">{addressErrors.payment}</p>}
              {selectedBank && (() => { const bank = bankOptions.find((item) => item.bank_name === selectedBank); return bank ? <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs"><p>Atas Nama: <b>{bank.account_name}</b></p><p className="mt-1">No. Rekening: <b>{bank.account_number}</b></p></div> : null; })()}
            </div>}
          </div>
          <div className="mt-5 space-y-3 border-t pt-4 text-sm"><div className="flex justify-between"><span className="text-slate-500">Subtotal</span><b>{formatRupiah(cartTotal)}</b></div><div className="flex justify-between"><span className="text-slate-500">Ongkir</span><b>{formatRupiah(shipping)}</b></div>{discount > 0 && <div className="flex justify-between"><span className="text-slate-500">Diskon</span><b className="text-emerald-600">-{formatRupiah(discount)}</b></div>}<div className="flex justify-between border-t pt-3"><b>Total</b><b className="text-xl text-red-500">{formatRupiah(total)}</b></div></div>
          <button onClick={pay} disabled={loading} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-red-500 text-sm font-bold text-white disabled:opacity-60"><ShieldCheck size={18}/>{loading ? "Memproses..." : payment === "qris" ? "Bayar QRIS dengan Xendit" : "Lanjutkan Transfer Bank"}</button>
          <p className="mt-3 text-center text-[10px] text-slate-400">{payment === "qris" ? "Pembayaran aman melalui Xendit" : "Pembayaran diverifikasi manual oleh admin"}</p>
        </aside>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string)=>void; error?: string }) {
  return <label className="text-xs font-bold text-slate-600">{label}<input value={value} onChange={(e)=>onChange(e.target.value)} className={`mt-2 h-11 w-full rounded-lg border px-3 font-normal outline-none focus:border-red-400 ${error ? "border-red-500" : ""}`}/>{error && <span className="mt-1 block text-[11px] text-red-500">{error}</span>}</label>;
}
