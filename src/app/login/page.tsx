"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useStore } from "../store";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { setLoggedIn } = useStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !phone || !password) return;
    setLoggedIn(true);
    localStorage.setItem("adicetak-profile", JSON.stringify({ name, phone }));
    router.push(search.get("next") || "/account");
  }
  return <main className="mx-auto max-w-[1180px] px-4 py-10 md:px-5"><div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-sm">
    <h1 className="text-2xl font-black">Masuk ke Adi Cetak</h1><p className="mt-2 text-sm text-slate-500">Masuk untuk melanjutkan transaksi dengan aman.</p>
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-xs font-bold">Nama Lengkap<input value={name} onChange={(e)=>setName(e.target.value)} className="mt-2 h-12 w-full rounded-lg border px-3 font-normal outline-none focus:border-red-400"/></label>
      <label className="block text-xs font-bold">Nomor WhatsApp<input value={phone} onChange={(e)=>setPhone(e.target.value)} className="mt-2 h-12 w-full rounded-lg border px-3 font-normal outline-none focus:border-red-400"/></label>
      <label className="block text-xs font-bold">Password<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-2 h-12 w-full rounded-lg border px-3 font-normal outline-none focus:border-red-400"/></label>
      <button className="h-12 w-full rounded-lg bg-red-500 font-bold text-white">Masuk</button>
    </form>
  </div></main>;
}

export default function LoginPage() { return <Suspense><LoginForm /></Suspense>; }
