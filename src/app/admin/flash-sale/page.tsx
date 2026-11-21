import Link from "next/link";

export default function AdminFlashSalePage() {
  return <main className="p-5 md:p-8"><h1 className="text-2xl font-black">Flash Sale</h1><div className="mt-5 rounded-xl border bg-white p-6"><p className="text-sm text-slate-500">Aktifkan diskon produk melalui halaman diskon atau pengelolaan produk.</p><Link href="/admin/discounts" className="mt-4 inline-block rounded-lg bg-[var(--brand-primary)] px-4 py-3 text-xs font-bold text-white">Kelola Diskon</Link></div></main>;
}
