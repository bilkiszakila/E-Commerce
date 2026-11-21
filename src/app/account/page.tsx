"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "../store";
import { ClipboardList, Heart, LogOut, MapPin, UserRound } from "lucide-react";
import { supabase } from "../../lib/supabase/client";
import { useEffect } from "react";

export default function AccountPage() {
  const { loggedIn, setLoggedIn } = useStore();
  const [profile, setProfile] = useState(() => {
    if (typeof window === "undefined") return {name:"",phone:""};
    try { return JSON.parse(localStorage.getItem("adicetak-profile")||"{}"); } catch { return {name:"",phone:""}; }
  });
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: profileData } = await supabase
        .from("profiles")
        .select("name,phone")
        .eq("id", data.session.user.id)
        .maybeSingle();
      if (profileData) setProfile(profileData);
    });
  }, []);
  async function logout() {
    await supabase.auth.signOut();
    setLoggedIn(false);
  }
  if (!loggedIn) return <main className="mx-auto max-w-lg px-4 py-12 text-center"><div className="rounded-xl bg-white p-8"><UserRound className="mx-auto text-slate-400" size={42}/><h1 className="mt-4 text-xl font-black">Belum Masuk</h1><p className="mt-2 text-sm text-slate-500">Masuk untuk melihat profil dan pesanan Anda.</p><Link href="/login" className="mt-5 block rounded-lg bg-red-500 py-3 text-sm font-bold text-white">Masuk / Daftar</Link></div></main>;
  return <main className="mx-auto max-w-[1180px] px-4 py-6 md:px-5"><h1 className="mb-5 text-xl font-black">Akun Saya</h1><div className="grid gap-5 md:grid-cols-[260px_1fr]">
    <aside className="h-fit rounded-xl bg-white p-4"><div className="flex items-center gap-3 border-b pb-4"><div className="grid h-12 w-12 place-items-center rounded-full bg-red-100 font-black text-red-500">{profile.name?.[0]||"U"}</div><div><b className="block text-sm">{profile.name||"Pengguna"}</b><span className="text-xs text-slate-400">{profile.phone||""}</span></div></div>
    <nav className="mt-3 space-y-1"><Link href="/account/orders" className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm"><ClipboardList size={17}/> Pesanan Saya</Link><Link href="/account" className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-3 text-sm font-bold text-red-500"><MapPin size={17}/> Data & Alamat</Link><Link href="/wishlist" className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm"><Heart size={17}/> Favorit</Link><button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-sm text-slate-500"><LogOut size={17}/> Keluar</button></nav></aside>
    <section className="rounded-xl bg-white p-5"><h2 className="font-black">Profil & Alamat</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold">Nama Lengkap<input defaultValue={profile.name} className="mt-2 h-11 w-full rounded-lg border px-3 font-normal"/></label><label className="text-xs font-bold">Nomor WhatsApp<input defaultValue={profile.phone} className="mt-2 h-11 w-full rounded-lg border px-3 font-normal"/></label><label className="sm:col-span-2 text-xs font-bold">Alamat Lengkap<textarea className="mt-2 h-24 w-full rounded-lg border p-3 font-normal" placeholder="Masukkan alamat lengkap dan patokan"/></label></div><button className="mt-4 rounded-lg bg-red-500 px-5 py-3 text-sm font-bold text-white">Simpan Perubahan</button></section>
  </div></main>;
}
