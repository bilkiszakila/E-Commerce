import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "./store";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Adi Cetak - Digital Printing & Advertising",
  description: "Cetak banner, stiker, brosur, merchandise, dan kebutuhan advertising terbaik.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full`}>
      <body className={`${plusJakartaSans.className} font-sans min-h-full bg-[#f7f8fa] antialiased`}>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
