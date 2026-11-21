import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { StoreProvider } from "./store";
import { Footer, Header } from "./components";

export const metadata: Metadata = {
  title: "Adi Cetak - Digital Printing & Advertising",
  description: "Cetak banner, stiker, brosur, merchandise, dan kebutuhan advertising terbaik.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full bg-[#f7f8fa]">
        <StoreProvider>
          <Suspense fallback={null}><Header /></Suspense>
          {children}
          <Suspense fallback={null}><Footer /></Suspense>
        </StoreProvider>
      </body>
    </html>
  );
}
