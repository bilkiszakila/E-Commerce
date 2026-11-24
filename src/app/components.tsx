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
  const { cartCount, loggedIn, isAdmin } = useStore();
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [hasSession, setHasSession] = useState<boolean>(false);
  const [dbIsAdmin, setDbIsAdmin] = useState<boolean>(false);

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
            <button className="flex items-center gap-1">
              Bahasa Indonesia <ChevronDown size={12} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white text-slate-950">
        <div className="mx-auto flex h-17 max-w-[1180px] items-center gap-4 px-4">
          <button
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

          <div className="hidden h-11 flex-1 items-center rounded-xl border border-slate-200 bg-white focus-within:border-[#1D4ED8] md:flex">
            <Search className="ml-4 text-slate-400" size={18} />
            <input
              className="h-full min-w-0 flex-1 px-3 text-sm text-slate-800 outline-none"
              placeholder="Cari banner, stiker, brosur, kaos..."
            />
            <button className="mr-1 h-9 rounded-lg bg-[#1D4ED8] px-5 text-sm font-bold text-white transition hover:bg-blue-800">
              Cari
            </button>
          </div>

          <button
            onClick={() => setSearchOpen(true)}
            className="ml-auto md:hidden"
            aria-label="Cari"
          >
            <Search />
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

              {/* Dropdown Panel saat di-hover (pt-2 sebagai jembatan hover agar menu tidak menutup saat kursor turun) */}
              <div className="invisible absolute right-0 top-full z-50 w-60 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                  {/* Info Singkat Profil */}
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
                <button onClick={() => setOpen(false)}>
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

            {/* Menu Akun di Mobile */}
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

      {searchOpen && (
        <div className="absolute inset-x-0 top-17 border-b bg-white p-3 md:hidden">
          <div className="flex rounded-xl border border-slate-200">
            <input
              autoFocus
              className="h-11 flex-1 px-3 text-sm outline-none"
              placeholder="Cari produk..."
            />
            <button className="px-4 text-[#1D4ED8]">
              <Search size={18} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return (
    <footer className="mt-12 border-t bg-slate-950 py-10 text-slate-300">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-5 text-sm md:grid-cols-4">
        <div>
          <Link href="/" className="mb-3 block" aria-label="ADI CETAK - Beranda">
            <Image
              src={brandLogo}
              alt="ADI CETAK"
              width={146}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
          <p className="text-slate-400">Harga Bersahabat, Kualitas Mantap.</p>
        </div>
        <div>
          <b className="mb-3 block text-white">Belanja</b>
          <p>Semua Produk</p>
          <p>Promo</p>
          <p>Produk Baru</p>
        </div>
        <div>
          <b className="mb-3 block text-white">Bantuan</b>
          <p>Cara Pemesanan</p>
          <p>Pembayaran</p>
          <p>Lacak Pesanan</p>
        </div>
        <div>
          <b className="mb-3 block text-white">Hubungi Kami</b>
          <p>WhatsApp: 0812-8888-9999</p>
          <p>Senin–Sabtu, 08.00–17.00</p>
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