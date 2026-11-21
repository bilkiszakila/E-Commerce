"use client";

import { useState } from "react";
import { Save } from "lucide-react";

type BankSettings = { bank: string; accountName: string; accountNumber: string };
type VoucherSettings = { code: string; type: "fixed" | "percent"; value: number; label: string }[];

export default function AdminSettingsPage() {
  const [bank, setBank] = useState<BankSettings>(() => {
    if (typeof window === "undefined") return { bank: "BCA", accountName: "PT Adi Cetak", accountNumber: "1234567890" };
    try { return JSON.parse(localStorage.getItem("adicetak-bank") || "null") || { bank: "BCA", accountName: "PT Adi Cetak", accountNumber: "1234567890" }; } catch { return { bank: "BCA", accountName: "PT Adi Cetak", accountNumber: "1234567890" }; }
  });
  const [vouchers, setVouchers] = useState<VoucherSettings>(() => {
    if (typeof window === "undefined") return [{ code: "ADICETAK10", type: "percent", value: 10, label: "Diskon 10%" }];
    try { return JSON.parse(localStorage.getItem("adicetak-vouchers") || "null") || [{ code: "ADICETAK10", type: "percent", value: 10, label: "Diskon 10%" }]; } catch { return [{ code: "ADICETAK10", type: "percent", value: 10, label: "Diskon 10%" }]; }
  });
  const [saved, setSaved] = useState(false);

  function save() {
    localStorage.setItem("adicetak-bank", JSON.stringify(bank));
    localStorage.setItem("adicetak-vouchers", JSON.stringify(vouchers));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function updateVoucher(index: number, patch: Partial<VoucherSettings[number]>) {
    setVouchers((old) => old.map((item, i) => i === index ? { ...item, ...patch } : item));
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
        <section id="vouchers" className="rounded-xl bg-white p-5">
          <h2 className="font-black">Voucher & Kode Member</h2>
          <div className="mt-4 space-y-3">
            {vouchers.map((voucher, index) => (
              <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_110px_80px]">
                <input aria-label="Kode voucher" value={voucher.code} onChange={(e)=>updateVoucher(index,{code:e.target.value.toUpperCase()})} className="h-10 rounded border px-3 text-sm font-bold uppercase"/>
                <select aria-label="Jenis voucher" value={voucher.type} onChange={(e)=>updateVoucher(index,{type:e.target.value as "fixed"|"percent"})} className="h-10 rounded border px-2 text-xs"><option value="fixed">Nominal</option><option value="percent">Persen</option></select>
                <input aria-label="Nilai voucher" type="number" value={voucher.value} onChange={(e)=>updateVoucher(index,{value:Number(e.target.value)||0})} className="h-10 rounded border px-3 text-sm"/>
              </div>
            ))}
            <button onClick={()=>setVouchers((old)=>[...old,{code:"",type:"fixed",value:0,label:"Voucher baru"}])} className="h-10 w-full rounded-lg border border-dashed text-xs font-bold text-slate-500">+ Tambah Voucher</button>
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
