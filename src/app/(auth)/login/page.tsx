"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useStore } from "@/app/store";
import { supabase } from "@/lib/supabase/client";
import { getIsAdmin } from "@/services/authService";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { setLoggedIn } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) return;
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      return;
    }
    setLoggedIn(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (userId) {
      if (await getIsAdmin(userId)) {
        router.replace("/admin");
        return;
      }
    }

    router.replace(search.get("next") || "/account");
  }
  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${search.get("next") || "/account"}` },
    });
  }
  return <main className="mx-auto max-w-[1180px] px-4 py-10 md:px-5"><div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-sm">
    <h1 className="text-2xl font-black">Masuk ke Adi Cetak</h1><p className="mt-2 text-sm text-slate-500">Masuk untuk melanjutkan transaksi dengan aman.</p>
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-xs font-bold">Email<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-2 h-12 w-full rounded-lg border px-3 font-normal outline-none focus:border-red-400"/></label>
      <label className="block text-xs font-bold">Password<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-2 h-12 w-full rounded-lg border px-3 font-normal outline-none focus:border-red-400"/></label>
      {error && <p className="text-xs font-bold text-red-500">{error}</p>}
      <button className="h-12 w-full rounded-lg bg-red-500 font-bold text-white">Masuk</button>
    </form>
    <button type="button" onClick={loginWithGoogle} className="mt-3 h-12 w-full rounded-lg border font-bold">Daftar atau Masuk dengan Google</button>
    <Link href={`/register${search.get("next") ? `?redirect=${encodeURIComponent(search.get("next") || "")}` : ""}`} className="mt-4 block text-center text-xs font-bold text-red-500">Belum punya akun? Daftar</Link>
  </div></main>;
}

export default function LoginPage() { return <Suspense><LoginForm /></Suspense>; }
