import { Suspense } from "react";
import { Footer, Header } from "@/app/components";
import BottomNav from "@/components/layout/BottomNav";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}><Header /></Suspense>
      {children}
      <Suspense fallback={null}><Footer /></Suspense>
      <BottomNav />
    </>
  );
}
