"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Save } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";
import { getStoreSettings, ShippingOption } from "../../../lib/supabase/data";

type BankSettings = { bank: string; accountName: string; accountNumber: string };
type PromoBannerSettings = { dataUrl: string; name: string };
const PROMO_BANNER_SIZE = { width: 1180, height: 290 };

export default function AdminSettingsPage() {
  const [bank, setBank] = useState<BankSettings>({ bank: "BCA", accountName: "PT Adi Cetak", accountNumber: "1234567890" });
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([
    { name: "JNE Reg", description: "Estimasi 2–3 hari", price: 17000 },
    { name: "J&T Express", description: "Estimasi 1–2 hari", price: 19000 },
    { name: "Ambil Sendiri", description: "Semarang Store", price: 0 },
  ]);
  const [promoBanner, setPromoBanner] = useState<PromoBannerSettings>(() => {
    if (typeof window === "undefined") return { dataUrl: "", name: "" };
    try { return JSON.parse(localStorage.getItem("adicetak-promo-banner") || "null") || { dataUrl: "", name: "" }; } catch { return { dataUrl: "", name: "" }; }
  });
  const [bannerError, setBannerError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getStoreSettings().then((settings) => {
      if (!settings) return;
      setBank({ bank: settings.bankName, accountName: settings.bankAccountName, accountNumber: settings.bankAccountNumber });
      if (settings.shippingOptions.length) setShippingOptions(settings.shippingOptions);
    });
  }, []);

  async function save() {
    localStorage.setItem("adicetak-promo-banner", JSON.stringify(promoBanner));
    const { error } = await supabase.from("store_settings").upsert({
      id: 1,
      bank_name: bank.bank,
      bank_account_name: bank.accountName,
      bank_account_number: bank.accountNumber,
      shipping_options: shippingOptions,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (error) {
      alert(error.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function handleBannerUpload(file?: File) {
    setBannerError("");
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setBannerError("Format banner harus PNG atau JPEG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setBannerError("Ukuran file maksimal 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const image = new Image();
      image.onload = () => {
        if (image.width !== PROMO_BANNER_SIZE.width || image.height !== PROMO_BANNER_SIZE.height) {
          setBannerError(`Ukuran gambar harus tepat ${PROMO_BANNER_SIZE.width} × ${PROMO_BANNER_SIZE.height} px.`);
          return;
        }
        setPromoBanner({ dataUrl, name: file.name });
      };
      image.onerror = () => setBannerError("File gambar tidak dapat dibaca.");
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }


  return (
    <main className="mx-auto max-w-[1180px] px-4 py-8 md:px-5">
      <h1 className="mb-5 text-2xl font-black">Pengaturan Pembayaran</h1>
      <div className="grid gap-5 md:grid-cols-2">
        <section className="h-fit rounded-xl bg-white p-5">
          <h2 className="font-black">Rekening Transfer Manual</h2>
          <div className="mt-4 space-y-3">
            <Field label="Nama Bank" value={bank.bank} onChange={(bankName) => setBank({ ...bank, bank: bankName })}/>
            <Field label="Nama Pemilik Rekening" value={bank.accountName} onChange={(accountName) => setBank({ ...bank, accountName })}/>
            <Field label="Nomor Rekening" value={bank.accountNumber} onChange={(accountNumber) => setBank({ ...bank, accountNumber })}/>
          </div>
        </section>
        <section className="rounded-xl bg-white p-5">
          <h2 className="font-black">Opsi Ongkos Kirim</h2>
          <div className="mt-4 space-y-3">
            {shippingOptions.map((option, index) => (
              <div key={option.name} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_100px]">
                <input aria-label="Nama kurir" value={option.name} onChange={(e)=>setShippingOptions((old)=>old.map((item,i)=>i===index?{...item,name:e.target.value}:item))} className="h-10 rounded border px-3 text-sm"/>
                <input aria-label="Deskripsi ongkir" value={option.description} onChange={(e)=>setShippingOptions((old)=>old.map((item,i)=>i===index?{...item,description:e.target.value}:item))} className="h-10 rounded border px-3 text-sm"/>
                <input aria-label="Tarif ongkir" type="number" value={option.price} onChange={(e)=>setShippingOptions((old)=>old.map((item,i)=>i===index?{...item,price:Number(e.target.value)||0}:item))} className="h-10 rounded border px-3 text-sm"/>
              </div>
            ))}
            <button onClick={()=>setShippingOptions((old)=>[...old,{name:"Kurir Baru",description:"Estimasi pengiriman",price:0}])} className="h-10 w-full rounded-lg border border-dashed text-xs font-bold text-slate-500">+ Tambah Opsi Ongkir</button>
          </div>
        </section>
        <section className="rounded-xl bg-white p-5 md:col-span-2">
          <h2 className="font-black">Banner Promo Utama</h2>
          <p className="mt-1 text-xs text-slate-500">Ukuran tetap: 1180 × 290 px · Format PNG atau JPEG · Maksimal 2 MB</p>
          <div className="mt-4">
            {promoBanner.dataUrl ? (
              <img src={promoBanner.dataUrl} alt="Preview banner promo" className="w-full rounded-lg border object-cover" style={{ aspectRatio: "1180 / 290" }} />
            ) : (
              <div className="grid aspect-[1180/290] place-items-center rounded-lg border border-dashed bg-slate-50 text-slate-400">
                <div className="text-center"><ImagePlus className="mx-auto mb-2" size={28}/><span className="text-xs">Belum ada banner promo</span></div>
              </div>
            )}
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
              <ImagePlus size={17}/> {promoBanner.name ? "Ganti Banner" : "Upload Banner"}
              <input type="file" accept="image/png,image/jpeg" onChange={(event) => handleBannerUpload(event.target.files?.[0])} className="hidden"/>
            </label>
            {promoBanner.name && <span className="ml-3 text-xs text-slate-500">{promoBanner.name}</span>}
            {bannerError && <p className="mt-2 text-xs font-bold text-red-500">{bannerError}</p>}
          </div>
        </section>
      </div>
      <button onClick={save} className="mt-5 flex h-12 items-center justify-center gap-2 rounded-lg bg-red-500 px-6 text-sm font-bold text-white"><Save size={17}/>{saved ? "Tersimpan" : "Simpan Pengaturan"}</button>
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-xs font-bold text-slate-600">{label}<input value={value} onChange={(e)=>onChange(e.target.value)} className="mt-2 h-11 w-full rounded-lg border px-3 font-normal outline-none focus:border-red-400"/></label>;
}
