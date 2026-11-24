"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/app/store";
import {
  ChevronLeft,
  CreditCard,
  KeyRound,
  LogOut,
  MapPin,
  MessageSquareText,
  Navigation,
  Package,
  Settings,
  Truck,
  UserRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getIsAdmin } from "@/services/authService";

export default function AccountPage() {
  const { loggedIn, setLoggedIn } = useStore();
  const [profile, setProfile] = useState({
    full_name: "",
    name: "",
    email: "",
    phone: "",
    gender: "Laki-laki",
    birth_date: "",
    address: {} as Record<string, string | number>,
    avatar_url: "",
  });
  const [profileAddress, setProfileAddress] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [profileMessage, setProfileMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [accountIsAdmin, setAccountIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mobileScreen, setMobileScreen] = useState<"hub" | "detail">("hub");
  const [orderCounts, setOrderCounts] = useState({
    unpaid: 0,
    processing: 0,
    shipped: 0,
    review: 0,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const addressInputRef = useRef<HTMLTextAreaElement | null>(null);

  const avatarPreview = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    return profile.avatar_url;
  }, [avatarFile, profile.avatar_url]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const userId = data.session.user.id;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("name,full_name,email,phone,address,avatar_url,is_admin")
        .eq("id", userId)
        .maybeSingle();

      if (profileData) {
        const addrObj = (profileData.address as Record<string, string>) || {};
        setProfile({
          full_name: profileData.full_name || profileData.name || "",
          name: profileData.name || profileData.full_name || "",
          email: profileData.email || data.session.user.email || "",
          phone: profileData.phone || "",
          gender: addrObj.gender || "Laki-laki",
          birth_date: addrObj.birth_date || "",
          address: addrObj,
          avatar_url: profileData.avatar_url || "",
        });
        setProfileAddress(addrObj.address || "");
      }

      setAccountIsAdmin(await getIsAdmin(userId));

      // Ambil ringkasan jumlah status pesanan user
      const { data: ordersData } = await supabase
        .from("orders")
        .select("status")
        .eq("user_id", userId);

      if (ordersData) {
        const counts = { unpaid: 0, processing: 0, shipped: 0, review: 0 };
        for (const o of ordersData) {
          const st = String(o.status || "").toLowerCase();
          if (st.includes("unpaid") || st.includes("belum") || st.includes("pending")) counts.unpaid++;
          else if (st.includes("process") || st.includes("proses") || st.includes("paid") || st.includes("produksi")) counts.processing++;
          else if (st.includes("ship") || st.includes("kirim")) counts.shipped++;
          else if (st.includes("complete") || st.includes("selesai")) counts.review++;
        }
        setOrderCounts(counts);
      }
    });
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setLoggedIn(false);
  }

  async function handleResetPassword() {
    if (!profile.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      setProfileMessage(error.message);
    } else {
      setProfileMessage(`Link ubah kata sandi telah dikirim ke ${profile.email}.`);
    }
  }

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      setProfileMessage("Browser tidak mendukung lokasi.");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=id`
          );
          const data = await response.json();
          const address = data.address || {};
          const completeAddress = [
            address.road,
            address.house_number,
            address.neighbourhood,
            address.suburb,
            address.village,
            address.county || address.city,
            address.state,
            address.postcode,
          ]
            .filter(Boolean)
            .join(", ");
          setProfileAddress(completeAddress || profileAddress);
          setProfile((old) => ({
            ...old,
            address: {
              ...old.address,
              province: address.state || address.region || "",
              city: address.city || address.county || address.town || "",
              district: address.subdistrict || address.village || address.suburb || "",
              postcode: String(address.postcode || "").replace(/\D/g, "").slice(0, 5),
              address: completeAddress,
              lat,
              lng,
              google_maps_url: `https://maps.google.com/?q=${lat},${lng}`,
            },
          }));
        } catch {
          setProfileMessage("Lokasi ditemukan tetapi alamat belum dapat diambil.");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        setProfileMessage("Izin lokasi ditolak atau lokasi tidak tersedia.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function saveProfile() {
    setProfileMessage("");
    if (profile.full_name.trim().length < 3) {
      setProfileMessage("Nama lengkap minimal 3 karakter.");
      return;
    }
    if (!/^(\+62|08)\d{8,12}$/.test(profile.phone.replace(/[\s-]/g, ""))) {
      setProfileMessage("Nomor WhatsApp tidak valid (gunakan awalan 08 atau +62).");
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return;

    setSaving(true);
    let avatarUrl = profile.avatar_url;
    if (avatarFile) {
      const extension = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/avatar.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true });
      if (uploadError) {
        setSaving(false);
        setProfileMessage(uploadError.message);
        return;
      }
      avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    }

    const address = {
      ...profile.address,
      address: profileAddress,
      gender: profile.gender,
      birth_date: profile.birth_date,
    };

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        name: profile.full_name,
        phone: profile.phone,
        address,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    setSaving(false);
    if (error) {
      setProfileMessage(error.message);
      return;
    }

    setAvatarFile(null);
    setProfile((old) => ({ ...old, avatar_url: avatarUrl, address }));
    setIsEditing(false);
    setProfileMessage("Profil berhasil disimpan.");
  }

  if (!loggedIn) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12 pb-28 text-center">
        <div className="rounded-2xl border border-[#C6CEDC]/60 bg-white p-8 shadow-sm">
          <UserRound className="mx-auto text-slate-400" size={42} />
          <h1 className="mt-4 text-xl font-black text-[#172338]">Belum Masuk</h1>
          <p className="mt-2 text-sm text-slate-500">
            Masuk untuk melihat profil dan pesanan Anda.
          </p>
          <Link
            href="/login"
            className="mt-5 block rounded-xl bg-[#1842D2] py-3 text-sm font-bold text-white"
          >
            Masuk / Daftar
          </Link>
        </div>
      </main>
    );
  }

  const displayName = profile.full_name || "Pengguna";

  return (
    <main className="mx-auto min-h-[80dvh] max-w-[1180px] px-4 py-6 pb-28 md:px-5 md:py-10 md:pb-14">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          if (file) {
            setAvatarFile(file);
            setIsEditing(true);
          }
        }}
        className="hidden"
      />

      {/* ==================== TAMPILAN MOBILE (< md) ==================== */}
      <div className="md:hidden">
        {mobileScreen === "hub" ? (
          /* LAYAR 1: AKUN SAYA (HUB) */
          <div className="flex min-h-[75dvh] flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-extrabold text-[#172338]">Akun Saya</h1>
                {accountIsAdmin && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#172338] px-3 py-1.5 text-xs font-bold text-white"
                  >
                    <Settings size={14} /> Admin
                  </Link>
                )}
              </div>

              {/* Member Card Landscape Biru */}
              <div className="relative overflow-hidden rounded-2xl bg-[#1842D2] p-4 text-white shadow-sm">
                {/* Watermark tangan jempol */}
                <img
                  src="/images/login-img.png"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-6 right-8 h-32 w-auto opacity-15 mix-blend-screen"
                />
                {/* Ribbon Kuning "Baru" */}
                <span className="absolute -left-7 top-2.5 -rotate-45 bg-[#FF7401] px-7 py-0.5 text-[9px] font-extrabold tracking-wide text-white shadow-xs">
                  Baru
                </span>

                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt={displayName}
                        className="h-12 w-12 shrink-0 rounded-full border-2 border-white/80 object-cover"
                      />
                    ) : (
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-white/80 bg-white/15 text-base font-extrabold text-white">
                        {displayName[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold leading-tight">
                        {displayName}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-blue-100">
                        {profile.email}
                      </p>
                      <p className="text-[11px] text-blue-100">
                        {profile.phone || "Nomor belum diatur"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setMobileScreen("detail");
                    }}
                    className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white hover:bg-white/15"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Card Pesanan Saya */}
              <section className="rounded-2xl bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold text-[#172338]">Pesanan Saya</h2>
                  <Link
                    href="/account/orders"
                    className="text-xs font-bold text-[#1842D2]"
                  >
                    Semua
                  </Link>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  <Link
                    href="/account/orders?status=unpaid"
                    className="group flex flex-col items-center gap-1.5"
                  >
                    <div className="relative grid h-9 w-9 place-items-center rounded-xl text-[#172338] group-hover:bg-[#F1F4FD]">
                      <CreditCard size={20} strokeWidth={1.9} />
                      {orderCounts.unpaid > 0 && (
                        <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#FF7401] px-1 text-[10px] font-extrabold text-white">
                          {orderCounts.unpaid}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-[#172338]">
                      Belum Bayar
                    </span>
                  </Link>

                  <Link
                    href="/account/orders?status=processing"
                    className="group flex flex-col items-center gap-1.5"
                  >
                    <div className="relative grid h-9 w-9 place-items-center rounded-xl text-[#172338] group-hover:bg-[#F1F4FD]">
                      <Package size={20} strokeWidth={1.9} />
                      {orderCounts.processing > 0 && (
                        <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#FF7401] px-1 text-[10px] font-extrabold text-white">
                          {orderCounts.processing}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-[#172338]">
                      Diproses
                    </span>
                  </Link>

                  <Link
                    href="/account/orders?status=shipped"
                    className="group flex flex-col items-center gap-1.5"
                  >
                    <div className="relative grid h-9 w-9 place-items-center rounded-xl text-[#172338] group-hover:bg-[#F1F4FD]">
                      <Truck size={20} strokeWidth={1.9} />
                      {orderCounts.shipped > 0 && (
                        <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#FF7401] px-1 text-[10px] font-extrabold text-white">
                          {orderCounts.shipped}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-[#172338]">
                      Dikirim
                    </span>
                  </Link>

                  <Link
                    href="/account/orders?status=completed"
                    className="group flex flex-col items-center gap-1.5"
                  >
                    <div className="relative grid h-9 w-9 place-items-center rounded-xl text-[#172338] group-hover:bg-[#F1F4FD]">
                      <MessageSquareText size={20} strokeWidth={1.9} />
                      {orderCounts.review > 0 && (
                        <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#FF7401] px-1 text-[10px] font-extrabold text-white">
                          {orderCounts.review}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-[#172338]">
                      Penilaian
                    </span>
                  </Link>
                </div>
              </section>

              {/* Pintasan Alamat & Pengaturan Akun */}
              <div className="space-y-4 px-1 pt-1">
                <div>
                  <p className="text-[11px] font-medium text-slate-400">Alamat</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setMobileScreen("detail");
                      setTimeout(() => addressInputRef.current?.focus(), 100);
                    }}
                    className="mt-1.5 flex w-full items-center justify-between text-left text-xs font-bold text-[#172338]"
                  >
                    <span>Ubah Alamat</span>
                    <MapPin size={15} className="text-slate-400" />
                  </button>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-slate-400">
                    Pengaturan Akun
                  </p>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="mt-1.5 flex w-full items-center justify-between text-left text-xs font-bold text-[#172338]"
                  >
                    <span>Ubah Kata Sandi</span>
                    <KeyRound size={15} className="text-slate-400" />
                  </button>
                </div>

                {profileMessage && (
                  <p className="rounded-xl bg-[#F1F4FD] px-3 py-2 text-xs font-semibold text-[#1842D2]">
                    {profileMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Tombol Keluar Mobile */}
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={logout}
                className="rounded-xl bg-[#F1F4FD] px-7 py-2.5 text-xs font-bold text-[#1842D2] hover:bg-blue-100"
              >
                Keluar
              </button>
            </div>
          </div>
        ) : (
          /* LAYAR 2: INFORMASI AKUN (DETAIL & EDIT MOBILE) */
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileScreen("hub");
                  setProfileMessage("");
                }}
                aria-label="Kembali ke Akun Saya"
                className="grid h-8 w-8 place-items-center rounded-lg text-[#172338] hover:bg-white"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h1 className="text-base font-extrabold text-[#172338]">
                  Informasi Akun
                </h1>
                <p className="text-[11px] text-slate-400">
                  Kelola informasi akun Anda
                </p>
              </div>
            </div>

            <section className="rounded-2xl bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-[#172338]">
                  Informasi Pribadi
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditing((prev) => !prev)}
                  className="text-xs font-bold text-[#1842D2]"
                >
                  {isEditing ? "Batal" : "Ubah"}
                </button>
              </div>

              {/* Foto Profil */}
              <div className="mt-4">
                <p className="text-[11px] font-medium text-slate-400">Foto Profil</p>
                <div className="mt-2 flex items-center gap-3.5">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={displayName}
                      className="h-14 w-14 rounded-full border border-[#C6CEDC] object-cover"
                    />
                  ) : (
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-[#F1F4FD] text-base font-extrabold text-[#1842D2]">
                      {displayName[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-[#1842D2]"
                  >
                    Ubah Foto Profil
                  </button>
                </div>
              </div>

              {/* Form Fields Mobile */}
              <div className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400">
                    Nama
                  </label>
                  <input
                    value={profile.full_name}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setProfile({ ...profile, full_name: e.target.value })
                    }
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#C6CEDC] bg-white px-3.5 text-xs font-bold text-[#1842D2] outline-none focus:border-[#1842D2] disabled:border-transparent disabled:bg-transparent disabled:px-0 disabled:text-[#172338]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400">
                    Email
                  </label>
                  <p className="mt-1 text-xs font-semibold text-[#172338]">
                    {profile.email}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400">
                    Nomor Telepon
                  </label>
                  <input
                    value={profile.phone}
                    disabled={!isEditing}
                    placeholder="0857-1234-5678"
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#C6CEDC] bg-white px-3.5 text-xs font-semibold text-[#172338] outline-none focus:border-[#1842D2] disabled:border-transparent disabled:bg-transparent disabled:px-0"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400">
                    Jenis Kelamin
                  </label>
                  <div className="mt-2 flex items-center gap-5 text-xs font-semibold text-[#172338]">
                    {["Laki-laki", "Perempuan"].map((g) => (
                      <label key={g} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="gender-mobile"
                          checked={profile.gender === g}
                          disabled={!isEditing}
                          onChange={() => setProfile({ ...profile, gender: g })}
                          className="accent-[#1842D2]"
                        />
                        <span>{g}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={profile.birth_date}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setProfile({ ...profile, birth_date: e.target.value })
                    }
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#C6CEDC] bg-white px-3.5 text-xs font-semibold text-[#172338] outline-none focus:border-[#1842D2] disabled:border-transparent disabled:bg-transparent disabled:px-0"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-medium text-slate-400">
                      Alamat
                    </label>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={useCurrentLocation}
                        disabled={locationLoading}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1842D2] disabled:opacity-60"
                      >
                        <Navigation size={12} />
                        {locationLoading ? "Mencari..." : "Gunakan GPS"}
                      </button>
                    )}
                  </div>
                  <textarea
                    ref={addressInputRef}
                    value={profileAddress}
                    disabled={!isEditing}
                    rows={3}
                    placeholder="Nama jalan, desa/kelurahan, kecamatan, kabupaten, kode pos"
                    onChange={(e) => setProfileAddress(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#C6CEDC] bg-white p-3 text-xs font-semibold leading-relaxed text-[#172338] outline-none focus:border-[#1842D2] disabled:resize-none disabled:border-transparent disabled:bg-transparent disabled:p-0"
                  />
                </div>
              </div>

              {profileMessage && (
                <p className="mt-3 rounded-xl bg-[#F1F4FD] px-3 py-2 text-xs font-bold text-[#1842D2]">
                  {profileMessage}
                </p>
              )}

              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="mt-5 w-full rounded-xl bg-[#1842D2] py-3 text-xs font-bold text-white shadow-xs hover:bg-blue-800 disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </section>
          </div>
        )}
      </div>

      {/* ==================== TAMPILAN DESKTOP (md+) ==================== */}
      <div className="hidden md:grid md:grid-cols-[240px_1fr] md:gap-8">
        {/* Sidebar Kiri */}
        <aside className="flex min-h-[620px] flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-6">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={displayName}
                  className="h-11 w-11 rounded-full object-cover"
                />
              ) : (
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[#F1F4FD] text-sm font-extrabold text-[#1842D2]">
                  {displayName[0]?.toUpperCase() || "U"}
                </div>
              )}
              <span className="truncate text-sm font-bold text-[#172338]">
                {displayName}
              </span>
            </div>

            <nav className="space-y-1.5">
              {accountIsAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2.5 rounded-xl bg-[#172338] px-4 py-3 text-xs font-bold text-white"
                >
                  <Settings size={15} /> Dashboard Admin
                </Link>
              )}
              <Link
                href="/account"
                className="flex items-center gap-2.5 rounded-xl bg-[#F1F4FD] px-4 py-3 text-xs font-extrabold text-[#1842D2]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#1842D2]" />
                Akun Saya
              </Link>
              <Link
                href="/account/orders"
                className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-bold text-[#172338] hover:bg-white"
              >
                Pesanan Saya
              </Link>
            </nav>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F1F4FD] py-3 text-xs font-bold text-[#1842D2] hover:bg-blue-100"
          >
            <LogOut size={14} /> Keluar
          </button>
        </aside>

        {/* Area Utama Desktop */}
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-[#172338]">
                Informasi Akun
              </h1>
              <p className="mt-0.5 text-xs text-slate-400">
                Kelola informasi akun Anda
              </p>
            </div>
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="rounded-xl bg-[#1842D2] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-800 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>

          {(!profile.phone || !profileAddress) && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-[#172338]">
              <b>Lengkapi data diri Anda:</b> Nomor WhatsApp dan alamat diperlukan sebelum melakukan checkout.
            </div>
          )}

          {profileMessage && (
            <div className="mt-4 rounded-xl bg-[#F1F4FD] px-4 py-3 text-xs font-bold text-[#1842D2]">
              {profileMessage}
            </div>
          )}

          <div className="mt-6 grid grid-cols-[1fr_300px] items-start gap-6">
            {/* Kartu Tengah: Form Informasi Pribadi */}
            <section className="rounded-2xl bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-[#172338]">
                  Informasi Pribadi
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditing((prev) => !prev)}
                  className="text-xs font-bold text-[#1842D2] hover:underline"
                >
                  {isEditing ? "Selesai Edit" : "Ubah"}
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400">
                    Nama
                  </label>
                  <input
                    value={profile.full_name}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setProfile({ ...profile, full_name: e.target.value })
                    }
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#C6CEDC] bg-white px-4 text-xs font-bold text-[#1842D2] outline-none focus:border-[#1842D2] disabled:border-[#C6CEDC]/60 disabled:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400">
                    Email
                  </label>
                  <p className="mt-1.5 px-1 text-xs font-semibold text-[#172338]">
                    {profile.email}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400">
                    Nomor Telepon
                  </label>
                  <input
                    value={profile.phone}
                    disabled={!isEditing}
                    placeholder="0857-1234-5678"
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#C6CEDC] bg-white px-4 text-xs font-semibold text-[#172338] outline-none focus:border-[#1842D2] disabled:border-transparent disabled:px-1"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400">
                    Jenis Kelamin
                  </label>
                  <div className="mt-2 flex items-center gap-6 px-1 text-xs font-semibold text-[#172338]">
                    {["Laki-laki", "Perempuan"].map((g) => (
                      <label key={g} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="gender-desktop"
                          checked={profile.gender === g}
                          disabled={!isEditing}
                          onChange={() => setProfile({ ...profile, gender: g })}
                          className="accent-[#1842D2]"
                        />
                        <span>{g}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={profile.birth_date}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setProfile({ ...profile, birth_date: e.target.value })
                    }
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#C6CEDC] bg-white px-4 text-xs font-semibold text-[#172338] outline-none focus:border-[#1842D2] disabled:border-transparent disabled:px-1"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-medium text-slate-400">
                      Alamat
                    </label>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={useCurrentLocation}
                        disabled={locationLoading}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1842D2] hover:underline disabled:opacity-60"
                      >
                        <Navigation size={12} />
                        {locationLoading ? "Mencari lokasi..." : "Gunakan Lokasi Saat Ini"}
                      </button>
                    )}
                  </div>
                  <textarea
                    value={profileAddress}
                    disabled={!isEditing}
                    rows={3}
                    placeholder="Nama jalan, desa/kelurahan, kecamatan, kabupaten, kode pos"
                    onChange={(e) => setProfileAddress(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#C6CEDC] bg-white p-3.5 text-xs font-semibold leading-relaxed text-[#172338] outline-none focus:border-[#1842D2] disabled:resize-none disabled:border-transparent disabled:px-1 disabled:py-1"
                  />
                </div>
              </div>
            </section>

            {/* Kartu Kanan: Preview Member Card Biru */}
            <aside className="relative flex min-h-[460px] flex-col justify-between overflow-hidden rounded-3xl bg-[#1842D2] p-6 text-center text-white shadow-md">
              {/* Watermark Tangan Jempol */}
              <img
                src="/images/login-img.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-6 mx-auto w-64 opacity-15 mix-blend-screen"
              />

              {/* Ribbon Kuning "Baru" */}
              <span className="absolute -left-9 top-5 -rotate-45 bg-[#FF7401] px-10 py-1 text-[11px] font-extrabold tracking-wide text-white shadow-xs">
                Baru
              </span>

              <div className="relative z-10 mt-3 flex flex-col items-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={displayName}
                    className="h-36 w-36 rounded-full border-4 border-white/90 object-cover shadow-sm"
                  />
                ) : (
                  <div className="grid h-36 w-36 place-items-center rounded-full border-4 border-white/90 bg-white/15 text-4xl font-extrabold text-white">
                    {displayName[0]?.toUpperCase() || "U"}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 text-xs font-semibold text-white/90 underline-offset-4 hover:text-white hover:underline"
                >
                  Ubah Foto Profil
                </button>

                <h3 className="mt-6 text-base font-extrabold uppercase tracking-wide">
                  {displayName}
                </h3>
                <p className="mt-1 text-xs text-blue-100">{profile.email}</p>
                <p className="mt-0.5 text-xs text-blue-100">
                  {profile.phone || "Nomor belum diatur"}
                </p>
              </div>

              <p className="relative z-10 mt-8 text-left text-[11px] leading-relaxed text-blue-100">
                {profileAddress || "Alamat lengkap belum diisi"}
              </p>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}