"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  LayoutDashboard,
  Heart,
  ShoppingBag,
  UserRound,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Beranda", href: "/", icon: House },
  { label: "Kategori", href: "/category", icon: LayoutDashboard },
  { label: "Favorit", href: "/wishlist", icon: Heart },
  { label: "Keranjang", href: "/cart", icon: ShoppingBag },
  { label: "Akun", href: "/account", icon: UserRound },
];

function BottomNavContent() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav
      aria-label="Navigasi Mobile"
      className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur-md md:hidden"
    >
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const isActive =
          href === "/"
            ? pathname === "/"
            : pathname === href || pathname?.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`relative grid place-items-center gap-1 rounded-xl py-1 text-[10px] transition ${
              isActive
                ? "font-bold text-[#1842D2]"
                : "font-medium text-slate-500 hover:text-slate-800"
            }`}
          >
            {isActive && (
              <span className="absolute -top-2 h-1 w-6 rounded-full bg-[#1842D2]" />
            )}
            <Icon
              size={20}
              strokeWidth={isActive ? 2.4 : 1.9}
              className={isActive ? "text-[#1842D2]" : "text-slate-500"}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function BottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavContent />
    </Suspense>
  );
}