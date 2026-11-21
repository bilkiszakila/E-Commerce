"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/app/store";
import { ClipboardList, Heart, LogOut, MapPin, Navigation, Settings, Upload, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getIsAdmin } from "@/services/authService";

export default function AccountPage() {
  const { loggedIn, setLoggedIn } = useStore();
  const [profile, setProfile] = useState({ full_name: "", name: "", email: "", phone: "", address: {} as Record<string, string | number>, avatar_url: "" });
  const [profileAddress, setProfileAddress] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [profileMessage, setProfileMessage] = useState("");
  const [accountIsAdmin, setAccountIsAdmin] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: profileData } = await supabase
        .from("profiles")
        .select("name,full_name,email,phone,address,avatar_url,is_admin")
        .eq("id", data.session.user.id)
        .maybeSingle();
      if (profileData) {
        setProfile({
          full_name: profileData.full_name || profileData.name || "",
          name: profileData.name || profileData.full_name || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
          address: (profileData.address as Record<string, string>) || {},
          avatar_url: profileData.avatar_url || "",
        });
        setProfileAddress((profileData.address as Record<string, string>)?.address || "");
      }
      setAccountIsAdmin(await getIsAdmin(data.session.user.id));
    });
  }, []);
  async function logout() {
    await supabase.auth.signOut();
    setLoggedIn(false);
  }
  async function useCurrentLocation() {
    if (!navigator.geolocation) { setProfileMessage("Browser tidak mendukung lokasi."); return; }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=id`);
        const data = await response.json();
        const address = data.address || {};
        const completeAddress = [address.road, address.house_number, address.neighbourhood, address.suburb].filter(Boolean).join(", ");
        setProfileAddress(completeAddress || profileAddress);
        setProfile((old) => ({ ...old, address: {
          province: address.state || address.region || "",
          city: address.city || address.county || address.town || "",
          district: address.subdistrict || address.village || address.suburb || "",
          postcode: String(address.postcode || "").replace(/\D/g, "").slice(0, 5),
          address: completeAddress,
          lat,
          lng,
          google_maps_url: `https://maps.google.com/?q=${lat},${lng}`,
        } }));
      } catch {
        setProfileMessage("Lokasi ditemukan tetapi alamat belum dapat diambil.");
      } finally {
        setLocationLoading(false);
      }
    }, () => {
      setLocationLoading(false);
      setProfileMessage("Izin lokasi ditolak atau lokasi tidak tersedia.");
    }, { enableHighAccuracy: true, timeout: 10000 });
  }

  async function saveProfile() {
    setProfileMessage("");
    if (profile.full_name.trim().length < 3) { setProfileMessage("Nama lengkap minimal 3 karakter."); return; }
    if (!/^(\+62|08)\d{8,12}$/.test(profile.phone)) { setProfileMessage("Nomor WhatsApp tidak valid."); return; }
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return;

    let avatarUrl = profile.avatar_url;
    if (avatarFile) {
      const extension = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/avatar.${extension}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
      if (uploadError) { setProfileMessage(uploadError.message); return; }
      avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    }

    const address = { ...profile.address, address: profileAddress };
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      name: profile.full_name,
      phone: profile.phone,
      address,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    }).eq("id", userId);
    if (error) { setProfileMessage(error.message); return; }
    setProfile((old) => ({ ...old, avatar_url: avatarUrl }));
    setProfileMessage("Profil berhasil disimpan.");
  }
  if (!loggedIn) return <main className="mx-auto max-w-lg px-4 py-12 text-center"><div className="rounded-xl bg-white p-8"><UserRound className="mx-auto text-slate-400" size={42}/><h1 className="mt-4 text-xl font-black">Belum Masuk</h1><p className="mt-2 text-sm text-slate-500">Masuk untuk melihat profil dan pesanan Anda.</p><Link href="/login" className="mt-5 block rounded-lg bg-red-500 py-3 text-sm font-bold text-white">Masuk / Daftar</Link></div></main>;
  return <main className="mx-auto max-w-[1180px] px-4 py-6 md:px-5"><h1 className="mb-5 text-xl font-black">Akun Saya</h1><div className="grid gap-5 md:grid-cols-[260px_1fr]">
    <aside className="h-fit rounded-xl bg-white p-4"><div className="flex items-center gap-3 border-b pb-4">{profile.avatar_url ? <img src={profile.avatar_url} alt="Foto profil" className="h-12 w-12 rounded-full object-cover"/> : <div className="grid h-12 w-12 place-items-center rounded-full bg-red-100 font-black text-red-500">{profile.full_name?.[0]||"U"}</div>}<div><b className="block text-sm">{profile.full_name||"Pengguna"}</b><span className="text-xs text-slate-400">{profile.phone||""}</span></div></div>
    <nav className="mt-3 space-y-1">{accountIsAdmin && <Link href="/admin" className="flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-3 text-sm font-bold text-white"><Settings size={17}/> Dashboard Admin</Link>}<Link href="/account/orders" className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm"><ClipboardList size={17}/> Pesanan Saya</Link><Link href="/account" className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-3 text-sm font-bold text-red-500"><MapPin size={17}/> Data & Alamat</Link><Link href="/wishlist" className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm"><Heart size={17}/> Favorit</Link><button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-sm text-slate-500"><LogOut size={17}/> Keluar</button></nav></aside>
    {(!profile.phone || !profileAddress) && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm"><b>Lengkapi data diri Anda</b><p className="mt-1 text-xs text-slate-600">Nomor WhatsApp dan alamat diperlukan sebelum checkout.</p></div>}
    <section className="rounded-xl bg-white p-5"><h2 className="font-black">Profil & Alamat</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-bold">Foto Profil<div className="mt-2 flex items-center gap-3"><div className="h-16 w-16 overflow-hidden rounded-full bg-slate-100">{profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover"/> : null}</div><label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs font-normal"><Upload size={14}/> Pilih Foto<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e)=>setAvatarFile(e.target.files?.[0]||null)} className="hidden"/></label></div></label>
      <div/>
      <label className="text-xs font-bold">Nama Lengkap<input value={profile.full_name} onChange={(e)=>setProfile({...profile,full_name:e.target.value})} className="mt-2 h-11 w-full rounded-lg border px-3 font-normal"/></label>
      <label className="text-xs font-bold">Nomor WhatsApp<input value={profile.phone} onChange={(e)=>setProfile({...profile,phone:e.target.value})} className="mt-2 h-11 w-full rounded-lg border px-3 font-normal"/></label>
      <label className="sm:col-span-2 text-xs font-bold">Alamat Lengkap<textarea value={profileAddress} onChange={(e)=>setProfileAddress(e.target.value)} className="mt-2 h-24 w-full rounded-lg border p-3 font-normal" placeholder="Nama jalan, nomor rumah, RT/RW, patokan"/></label>
    </div><button type="button" onClick={useCurrentLocation} disabled={locationLoading} className="mt-3 flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-bold disabled:opacity-60"><Navigation size={15}/>{locationLoading?"Mencari lokasi...":"Gunakan Lokasi Saat Ini"}</button>{profileMessage&&<p className="mt-3 text-xs font-bold text-red-500">{profileMessage}</p>}<button onClick={saveProfile} className="mt-4 rounded-lg bg-red-500 px-5 py-3 text-sm font-bold text-white">Simpan Perubahan</button></section>
  </div></main>;
}
