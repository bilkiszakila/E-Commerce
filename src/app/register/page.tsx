"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { supabase } from "../../lib/supabase/client";

function RegisterContent() {
  const router = useRouter();
  const search = useSearchParams();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", address: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (form.fullName.trim().length < 3) { setError("Nama lengkap minimal 3 karakter."); return; }
    if (!(form.phone.startsWith("08") || form.phone.startsWith("+62")) || phoneDigits.length < 10 || phoneDigits.length > 14) { setError("Nomor WhatsApp harus diawali 08 atau +62."); return; }
    if (form.address.trim().length < 15) { setError("Alamat lengkap minimal 15 karakter."); return; }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName, phone: form.phone } },
    });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from("profiles").update({
        full_name: form.fullName,
        name: form.fullName,
        phone: form.phone,
        email: form.email,
        address: { address: form.address },
      }).eq("id", data.user.id);
    }
    router.replace(search.get("redirect") || "/account");
  }

  async function signUpWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${search.get("redirect") || "/account"}` },
    });
  }

  return <main className="mx-auto max-w-[1180px] px-4 py-10 md:px-5"><div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-sm">
    <h1 className="text-2xl font-black">Daftar Akun</h1>
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-xs font-bold">Nama Lengkap<input value={form.fullName} onChange={(e)=>setForm({...form,fullName:e.target.value})} className="mt-2 h-12 w-full rounded-lg border px-3 font-normal"/></label>
      <label className="block text-xs font-bold">Email<input type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} className="mt-2 h-12 w-full rounded-lg border px-3 font-normal"/></label>
      <label className="block text-xs font-bold">Nomor WhatsApp<input value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} className="mt-2 h-12 w-full rounded-lg border px-3 font-normal"/></label>
      <label className="block text-xs font-bold">Password<input type="password" minLength={6} value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} className="mt-2 h-12 w-full rounded-lg border px-3 font-normal"/></label>
      <label className="block text-xs font-bold">Alamat Lengkap<textarea value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})} className="mt-2 h-24 w-full rounded-lg border px-3 py-3 font-normal"/></label>
      {error && <p className="text-xs font-bold text-red-500">{error}</p>}
      <button disabled={loading} className="h-12 w-full rounded-lg bg-red-500 font-bold text-white disabled:opacity-60">{loading ? "Mendaftar..." : "Daftar"}</button>
    </form>
    <button type="button" onClick={signUpWithGoogle} className="mt-3 h-12 w-full rounded-lg border font-bold">Daftar dengan Google</button>
    <Link href="/login" className="mt-4 block text-center text-xs font-bold text-red-500">Sudah punya akun? Masuk</Link>
  </div></main>;
}

export default function RegisterPage() {
  return <Suspense fallback={<div className="p-10 text-center">Memuat...</div>}><RegisterContent /></Suspense>;
}
