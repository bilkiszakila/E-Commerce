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
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
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
      options: {
        redirectTo: `${window.location.origin}${search.get("next") || "/account"}`,
      },
    });
  }
  return (
    <main
      style={{ backgroundImage: "url('/images/login-img.png')" }}
      className="relative mx-auto flex min-h-screen items-center justify-center bg-red-500 bg-cover bg-center bg-no-repeat px-4 py-10"
    >
      <div className="px-4 md:px-5 ">
        {/* Text Mobile */}
        <div className="flex flex-col py-10 text-white">
          <h1 className="text-center text-3xl font-bold">Mau Cetak?</h1>
          <h2 className="text-center text-xl">Ingat A DI Cetak Aja!</h2>
          <p className="text-center text-xs">Harga Bersahabat, Kualiatas Mantap 👍</p>
        </div>
        
        {/* Form Login */}
        <div className="max-w-md rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl text-center text-red-500 font-black ">Login</h1>
          <p className="mt-2 text-sm text-slate-500">
            Masuk untuk melanjutkan transaksi dengan aman.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-xs font-bold">
              Email
              <input
                type="email"
                placeholder="Masukkan Email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-red-400"
              />
            </label>
            <label className="block text-xs font-bold">
              Password
              <input
                type="password"
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-red-400"
              />
            </label>
            {error && <p className="text-xs font-bold text-orange-500">{error}</p>}
            <button className="h-12 w-full rounded-lg bg-red-500 font-bold text-white">
              Masuk
            </button>
          </form>
          <button
            type="button"
            onClick={loginWithGoogle}
            className="mt-3 h-12 w-full rounded-lg border border-red-500 font-bold flex gap-2 justify-center items-center text-red-500">
            <img src="/images/google.svg" alt="Google" className="h-5 w-5 shrink-0" />
            <span>Masuk dengan Google</span> 
          </button>
          <Link
            href={`/register${search.get("next") ? `?redirect=${encodeURIComponent(search.get("next") || "")}` : ""}`}
            className="mt-4 block text-center text-xs font-bold"
          >
            Belum punya akun? <span className="text-red-500">Daftar</span> 
          </Link>
        </div>

        <div>
          <p className="text-center text-xs text-white/70 mt-10">
            Layanan Percetakan Terbaik di Sukabumi <br />
            Copyright © 2026 A DI CETAK AJA. All right reserved
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
