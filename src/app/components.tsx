"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "./store";
import { categories, products } from "./data";
import { supabase } from "@/lib/supabase/client";

const brandLogo = "/images/brand-logo.svg";

export function ProductCard({
  product,
  className = "",
}: {
  product: (typeof products)[number];
  className?: string;
}) {
  const effectivePrice = product.discountActive
    ? Math.round(product.price * (1 - (product.discountPercent || 0) / 100))
    : product.price;
  return (
    <Link
      href={`/product/${product.id}`}
      className={`product-card relative overflow-hidden rounded-xl border border-slate-200 bg-white p-2 transition ${className}`}
    >
      {product.badge && (
        <span className="absolute left-4 top-4 z-10 rounded bg-orange-500 px-2 py-1 text-[9px] font-bold text-white">
          {product.badge}
        </span>
      )}
      <button
        className="absolute right-4 top-4 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-slate-500 shadow"
        aria-label="Favorit"
      >
        <Heart size={14} />
      </button>
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-slate-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div>
        <p className="mt-1 line-clamp-2 min-h-10 text-xs font-semibold leading-5 text-slate-800">
          {product.name}
        </p>
        <p className="mt-2 text-base font-black text-red-500">
          {formatRupiah(effectivePrice)}
        </p>
        {(product.oldPrice || product.discountActive) && (
          <p className="text-[11px] text-slate-400">
            <span className="mr-1 line-through">
              {formatRupiah(product.oldPrice || product.price)}
            </span>
            <span className="text-orange-500">
              -
              {product.discountActive
                ? product.discountPercent || 0
                : Math.round(
                    (1 - product.price / (product.oldPrice || product.price)) *
                      100,
                  )}
              %
            </span>
          </p>
        )}
        <p className="mt-2 text-[10px] text-slate-500">
          ★ {product.rating} · {product.sold}+ terjual
        </p>
      </div>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { cartCount, loggedIn, isAdmin } = useStore();
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [hasSession, setHasSession] = useState<boolean>(false);
  const [dbIsAdmin, setDbIsAdmin] = useState<boolean>(false);

  // Tutup drawer & search bar mobile otomatis saat pindah halaman
  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    let active = true;

    async function syncUser() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!active) return;

      if (!user) {
        setHasSession(false);
        setDbIsAdmin(false);
        setUserName("");
        setUserEmail("");
        return;
      }

      setHasSession(true);
      setUserEmail(user.email || "");
      const fallbackName =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        user.email?.split("@")[0] ||
        "";
      setUserName(fallbackName);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,name,role")
        .eq("id", user.id)
        .maybeSingle();

      if (active && profile) {
        const dbName = profile.full_name || profile.name;
        if (dbName) setUserName(dbName);
        if (profile.role === "admin") setDbIsAdmin(true);
      }
    }

    syncUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      syncUser();
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [pathname]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchOpen(false);
    if (!q) {
      router.push("/category");
      return;
    }
    router.push(`/category?q=${encodeURIComponent(q)}`);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setHasSession(false);
    setDbIsAdmin(false);
    setUserName("");
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  if (pathname.startsWith("/admin")) return null;

  const isAuthenticated = hasSession || loggedIn;
  const userIsAdmin = isAdmin || dbIsAdmin;
  const displayFirstName = userName.trim().split(/\s+/)[0] || "Pelanggan";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white">
      <div className="hidden border-b border-slate-100 bg-white text-xs md:block">
        <div className="mx-auto flex h-9 max-w-[1180px] items-center justify-between px-5 text-slate-500">
          <div className="flex items-center gap-5">
            <span>Pesan mudah, cetak rapi.</span>
            <span className="flex items-center gap-1">
              <MapPin size={13} className="text-[#1D4ED8]" /> Kirim ke seluruh
              Indonesia
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/promo" className="hover:text-[#1D4ED8]">
              Promo
            </Link>
            <Link href="/account/orders" className="hover:text-[#1D4ED8]">
              Lacak Pesanan
            </Link>
            {userIsAdmin && (
              <Link href="/admin" className="font-bold text-[#1D4ED8]">
                Admin Dashboard
              </Link>
            )}
            <button type="button" className="flex items-center gap-1">
              Bahasa Indonesia <ChevronDown size={12} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white text-slate-950">
        <div className="mx-auto flex h-17 max-w-[1180px] items-center gap-4 px-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="md:hidden"
            aria-label="Buka menu"
          >
            <Menu />
          </button>
          <Link href="/" className="shrink-0" aria-label="ADI CETAK - Beranda">
            <Image
              src={brandLogo}
              alt="ADI CETAK"
              width={146}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Form Pencarian Desktop */}
          <form
            onSubmit={handleSearch}
            className="hidden h-11 flex-1 items-center rounded-full border border-slate-200 bg-white focus-within:border-[#1D4ED8] md:flex"
          >
            <Search className="ml-4 text-slate-400" size={18} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-full min-w-0 flex-1 px-3 text-sm text-slate-800 outline-none"
              placeholder="Cari banner, stiker, brosur, kaos..."
            />
            <button
              type="submit"
              className="mr-1 h-9 rounded-full bg-[#1D4ED8] px-5 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Cari
            </button>
          </form>

          {/* Tombol Buka/Tutup Pencarian Mobile */}
          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            className="ml-auto rounded-full p-2 text-slate-700 hover:bg-slate-100 md:hidden"
            aria-label={searchOpen ? "Tutup pencarian" : "Cari"}
          >
            {searchOpen ? <X size={22} /> : <Search size={22} />}
          </button>

          <Link
            href="/wishlist"
            className="hidden text-slate-400 transition hover:text-[#1D4ED8] md:block"
            aria-label="Favorit"
          >
            <Heart size={22} />
          </Link>

          <Link
            href="/cart"
            className="relative ml-1 rounded-full bg-[#1D4ED8] p-2.5 text-white transition hover:bg-blue-800"
            aria-label="Keranjang"
          >
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-bold">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Menu Akun Desktop dengan Hover Dropdown */}
          {!isAuthenticated ? (
            <Link
              href="/login"
              className="hidden items-center gap-2.5 rounded-2xl bg-slate-50 px-3 py-2 transition hover:bg-blue-50/70 md:flex"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100/70 text-[#1D4ED8]">
                <UserRound size={19} />
              </div>
              <span className="text-xs leading-tight text-slate-600">
                Masuk / Daftar
                <br />
                <b className="text-slate-900">Akun Saya</b>
              </span>
            </Link>
          ) : (
            <div className="group relative hidden md:block">
              <Link
                href="/account"
                className="flex items-center gap-2.5 rounded-2xl bg-slate-50 px-3 py-2 transition group-hover:bg-blue-50/70"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100/70 text-[#1D4ED8]">
                  <UserRound size={19} />
                </div>
                <span className="text-xs leading-tight text-slate-600">
                  Halo, {displayFirstName}
                  <br />
                  <b className="inline-flex items-center gap-1 text-slate-900">
                    <span>Akun Saya</span>
                    <ChevronDown
                      size={13}
                      className="text-slate-400 transition-transform duration-200 group-hover:rotate-180 group-hover:text-[#1D4ED8]"
                    />
                  </b>
                </span>
              </Link>

              <div className="invisible absolute right-0 top-full z-50 w-60 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <p className="truncate text-xs font-black text-slate-900">
                      {userName || displayFirstName}
                    </p>
                    {userEmail && (
                      <p className="truncate text-[11px] text-slate-400">
                        {userEmail}
                      </p>
                    )}
                  </div>

                  <div className="py-1">
                    <Link
                      href="/account"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-[#1D4ED8]"
                    >
                      <UserRound size={15} className="text-[#1D4ED8]" />
                      <span>Akun Saya</span>
                    </Link>

                    <Link
                      href="/account/orders"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-[#1D4ED8]"
                    >
                      <Package size={15} className="text-[#1D4ED8]" />
                      <span>Pesanan Saya</span>
                    </Link>

                    {userIsAdmin && (
                      <Link
                        href="/admin"
                        className="mt-0.5 flex items-center gap-2.5 rounded-xl bg-blue-50/70 px-3 py-2 text-xs font-bold text-[#1D4ED8] transition hover:bg-blue-100"
                      >
                        <LayoutDashboard size={15} />
                        <span>Dashboard Admin</span>
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut size={15} />
                      <span>Keluar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drawer Menu Mobile */}
      {open && (
        <div
          className="fixed inset-0 z-70 bg-black/40"
          onClick={() => setOpen(false)}
        >
          <aside
            className="flex h-full w-[82%] max-w-sm flex-col justify-between bg-white p-5 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="mb-6 flex items-center justify-between">
                <b className="text-lg">Semua Kategori</b>
                <button type="button" onClick={() => setOpen(false)}>
                  <X />
                </button>
              </div>
              {categories.map(([name]) => (
                <Link
                  onClick={() => setOpen(false)}
                  href={`/category?name=${encodeURIComponent(name)}`}
                  key={name}
                  className="block border-b py-3 text-sm"
                >
                  {name}
                </Link>
              ))}
            </div>

            <div className="space-y-2 border-t pt-4">
              {!isAuthenticated ? (
                <Link
                  onClick={() => setOpen(false)}
                  href="/login"
                  className="flex items-center gap-2.5 rounded-xl bg-blue-50 p-3 text-sm font-bold text-[#1D4ED8]"
                >
                  <UserRound size={18} />
                  <span>Masuk / Daftar</span>
                </Link>
              ) : (
                <>
                  <Link
                    onClick={() => setOpen(false)}
                    href="/account"
                    className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-800"
                  >
                    <UserRound size={16} className="text-[#1D4ED8]" />
                    <span>Akun Saya ({displayFirstName})</span>
                  </Link>
                  <Link
                    onClick={() => setOpen(false)}
                    href="/account/orders"
                    className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-800"
                  >
                    <Package size={16} className="text-[#1D4ED8]" />
                    <span>Pesanan Saya</span>
                  </Link>
                  {userIsAdmin && (
                    <Link
                      onClick={() => setOpen(false)}
                      href="/admin"
                      className="flex items-center gap-2.5 rounded-xl bg-blue-50 p-3 text-xs font-bold text-[#1D4ED8]"
                    >
                      <LayoutDashboard size={16} />
                      <span>Dashboard Admin</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl p-3 text-left text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    <span>Keluar</span>
                  </button>
                </>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Bar Pencarian Mobile (Bisa Enter, Submit, & Ditutup) */}
      {searchOpen && (
        <div className="absolute inset-x-0 top-17 z-50 border-b border-slate-200 bg-white p-3 shadow-lg md:hidden">
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-white p-1 focus-within:border-[#1D4ED8]"
          >
            <input
              type="search"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSearchOpen(false);
              }}
              className="h-10 min-w-0 flex-1 px-4 text-sm text-slate-800 outline-none"
              placeholder="Cari produk cetak..."
            />
            <button
              type="submit"
              className="flex h-10 items-center justify-center rounded-full bg-[#1D4ED8] px-4 text-xs font-bold text-white"
              aria-label="Cari produk"
            >
              <Search size={16} />
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              aria-label="Tutup pencarian"
            >
              <X size={18} />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}

const FOOTER_CATEGORIES = [
  "Digital Printing",
  "Sticker",
  "Name Card & Invitation",
  "Display Promotion",
  "Large Format",
  "Garment & Textile",
  "Stationary",
  "Merchandise",
  "Packaging",
  "Home Decor & Photo",
];

const FOOTER_ABOUT = [
  { label: "Sahabat UMKM", href: "/sahabat-umkm" },
  { label: "Cara Pemesanan", href: "/cara-pemesanan" },
  { label: "FAQ", href: "/faq" },
  { label: "Tentang Perusahaan", href: "/tentang-kami" },
  { label: "Blog", href: "/blog" },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="relative mt-16 overflow-hidden bg-[#1D4ED8] text-white">
      {/* Watermark Elemen Visual Latar Belakang */}
      <img
        src="/images/footer-img.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-[-140px] md:inset-0 md:rotate-0 mx-auto h-full w-auto max-w-none object-contain select-none"
      />

      <div className="relative z-10 mx-auto max-w-[1180px] px-4 pt-14 pb-9 md:px-5">
        {/* Grid 4 Kolom Utama */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_0.9fr_1fr] lg:gap-8">
          {/* Kolom 1: Brand, Tagline & Alamat */}
          <div>
            <Link href="/" className="inline-block" aria-label="A DI CETAK AJA - Beranda">
              <Image
                src={brandLogo}
                alt="A DI CETAK AJA"
                width={156}
                height={36}
                className="h-9 w-auto brightness-0 invert"
              />
            </Link>

            <p className="mt-4 max-w-[240px] text-[18px] leading-[1.35] font-medium text-white">
              Harga Bersahabat,
              <br />
              Kualitas Mantap!
            </p>

            <p className="mt-4 max-w-[230px] text-[13px] leading-[1.6] text-blue-100/90">
              Pasirastana, Kec. Purabaya,
              <br />
              Kab. Sukabumi, Jawa Barat,
              <br />
              POS 43187
            </p>
          </div>

          {/* Kolom 2: Kategori Produk */}
          <div>
            <h3 className="text-[14px] font-bold tracking-wide text-white">
              Kategori Produk
            </h3>
            <ul className="mt-4 space-y-2.5 text-[13px]">
              {FOOTER_CATEGORIES.map((category, idx) => (
                <li key={category}>
                  <Link
                    href={`/category?name=${encodeURIComponent(category)}`}
                    className={
                      idx === 0
                        ? "font-semibold text-white transition hover:text-blue-100"
                        : "text-blue-100/85 transition hover:text-white"
                    }
                  >
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom 3: Tentang Kami */}
          <div>
            <h3 className="text-[14px] font-bold tracking-wide text-white">
              Tentang Kami
            </h3>
            <ul className="mt-4 space-y-2.5 text-[13px]">
              {FOOTER_ABOUT.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-blue-100/85 transition hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom 4: Hubungi Kami */}
          <div>
            <h3 className="text-[14px] font-bold tracking-wide text-white">
              Hubungi Kami
            </h3>

            <div className="mt-4 space-y-3 text-[13px]">
              {/* WhatsApp */}
              <a
                href="https://wa.me/6285721314868"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-white transition hover:text-blue-100"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#25D366] text-white shadow-xs">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7 8.5 7 9.71C7 10.93 7.89 12.1 8 12.27C8.14 12.44 9.76 14.94 12.25 16C12.84 16.27 13.3 16.42 13.66 16.53C14.25 16.72 14.79 16.69 15.22 16.63C15.7 16.56 16.68 16.03 16.89 15.45C17.1 14.87 17.1 14.38 17.04 14.27C16.97 14.17 16.81 14.11 16.56 14C16.31 13.86 15.09 13.26 14.87 13.18C14.64 13.1 14.5 13.06 14.31 13.3C14.15 13.55 13.67 14.11 13.53 14.27C13.38 14.44 13.24 14.46 13 14.34C12.74 14.21 11.94 13.95 11 13.11C10.26 12.45 9.77 11.64 9.62 11.39C9.5 11.15 9.61 11 9.73 10.89C9.84 10.78 10 10.6 10.1 10.45C10.23 10.31 10.27 10.2 10.35 10.04C10.43 9.87 10.39 9.73 10.33 9.61C10.27 9.5 9.77 8.26 9.56 7.77C9.36 7.29 9.16 7.35 9 7.34C8.86 7.34 8.7 7.33 8.53 7.33Z" />
                  </svg>
                </span>
                <span>0857-2131-4868</span>
              </a>

              {/* Gmail / Email */}
              <a
                href="mailto:admin@adicetak.site"
                className="flex items-center gap-2.5 text-white transition hover:text-blue-100"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white shadow-xs">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5">
                    <path
                      fill="#EA4335"
                      d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4.2-8 5-8-5V6l8 5 8-5v2.2z"
                    />
                  </svg>
                </span>
                <span>admin@adicetak.site</span>
              </a>
            </div>

            {/* Ikuti Kami di */}
            <div className="mt-5 flex items-center gap-2.5 text-[13px] text-white">
              <span>Ikuti kami di</span>
              <div className="flex items-center gap-2">
                {/* Facebook */}
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook A DI CETAK AJA"
                  className="grid h-6 w-6 place-items-center rounded-full bg-white text-[#1D4ED8] transition hover:scale-105"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram A DI CETAK AJA"
                  className="grid h-6 w-6 place-items-center rounded-md bg-white text-[#1D4ED8] transition hover:scale-105"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    className="h-3.5 w-3.5"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </a>

                {/* Threads */}
                <a
                  href="https://threads.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Threads A DI CETAK AJA"
                  className="grid h-6 w-6 place-items-center rounded-md bg-white text-[#1D4ED8] transition hover:scale-105"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M19 12a7 7 0 1 0-2.5 5.36" />
                    <path d="M15.5 12a3.5 3.5 0 1 1-3.5-3.5c2 0 3.5 1.3 3.5 3.5v1.2a1.8 1.8 0 0 0 3.6 0V12" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Garis Pembatas & Copyright */}
        <div className="mt-12 border-t border-white/30 pt-7 text-center text-[12px] text-blue-100/90">
          Copyright © 2026 A DI CETAK AJA.{" "}
          <strong className="font-bold text-white">All right reserved</strong>
        </div>
      </div>
    </footer>
  );
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}