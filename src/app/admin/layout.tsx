"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { getIsAdmin } from "../../lib/supabase/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Package, Tags, FolderTree, Star, Image, BadgePercent, TicketCheck, Users, Banknote, ReceiptText, Settings, LogOut, Store, Menu, X } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const nav = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Pesanan", href: "/admin/orders", icon: ShoppingBag },
    { label: "Semua Produk", href: "/admin/products", icon: Package },
    { label: "Tambah Produk Baru", href: "/admin/products/new", icon: Package },
    { label: "Kategori", href: "/admin/categories", icon: FolderTree },
    { label: "Tags", href: "/admin/tags", icon: Tags },
    { label: "Reviews", href: "/admin/reviews", icon: Star },
    { label: "Banner Promosi", href: "/admin/settings#banner", icon: Image },
    { label: "Diskon", href: "/admin/discounts", icon: BadgePercent },
    { label: "Flash Sale", href: "/admin/flash-sale", icon: ReceiptText },
    { label: "Voucher", href: "/admin/settings#vouchers", icon: TicketCheck },
    { label: "Pelanggan", href: "/admin/customers", icon: Users },
    { label: "Penghasilan", href: "/admin/revenue", icon: Banknote },
    { label: "Rekening Bank", href: "/admin/settings", icon: Settings },
  ];

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login?next=/admin");
        return;
      }

      if (!(await getIsAdmin(data.session.user.id))) {
        router.replace("/");
        return;
      }

      setAllowed(true);
    });
  }, [router]);

  if (!allowed) {
    return <main className="grid min-h-[50vh] place-items-center text-sm text-slate-500">Memverifikasi akses admin...</main>;
  }

  return (
    <div className="min-h-[calc(100vh-68px)] bg-[#f7f8fa]">
      <header className="fixed left-0 right-0 top-0 z-[60] hidden h-[68px] items-center justify-between border-b bg-white px-6 md:flex">
        <div className="flex items-center gap-4"><div className="text-xl font-black text-[var(--brand-primary)]">ADI<span className="ml-1 text-slate-800">CETAK</span></div><span className="border-l pl-4 font-bold text-slate-700">Admin</span></div>
        <div className="flex items-center gap-3"><Link href="/" className="flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold"><Store size={15}/> Toko</Link><div className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-sm font-black text-blue-700">A</div><Settings size={18}/></div>
      </header>
      <button onClick={() => setMenuOpen(true)} className="fixed left-4 top-3 z-50 md:hidden" aria-label="Buka menu admin"><Menu/></button>
      <aside className={`fixed bottom-0 left-0 top-[68px] z-[55] w-[220px] border-r bg-white p-4 transition md:block ${menuOpen ? "block" : "hidden"}`}>
        <button onClick={() => setMenuOpen(false)} className="absolute right-3 top-3 md:hidden"><X size={18}/></button>
        <p className="mb-2 px-3 text-[11px] font-bold text-slate-400">Umum</p>
        <nav className="space-y-1">
          {nav.slice(0, 12).map((item) => { const Icon = item.icon; const active = pathname === item.href || (item.href.includes("#") && pathname === item.href.split("#")[0]); return <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)} className={`flex h-9 items-center gap-2 rounded-lg px-3 text-xs ${active ? "bg-blue-50 font-bold text-[var(--brand-primary)]" : "text-slate-500 hover:bg-slate-50"}`}><Icon size={15}/>{item.label}</Link>; })}
        </nav>
        <p className="mt-4 mb-2 px-3 text-[11px] font-bold text-slate-400">Keuangan</p>
        <nav className="space-y-1">{nav.slice(12).map((item) => { const Icon = item.icon; return <Link key={item.label} href={item.href} className="flex h-9 items-center gap-2 rounded-lg px-3 text-xs text-slate-500 hover:bg-slate-50"><Icon size={15}/>{item.label}</Link>; })}</nav>
      </aside>
      <main className="md:ml-[220px] md:mt-[68px]">{children}</main>
    </div>
  );
}
