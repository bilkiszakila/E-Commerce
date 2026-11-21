"use client";

export default function Toast({ children }: { children:React.ReactNode }) {
  return <div className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 rounded-xl bg-white p-4 shadow-xl">{children}</div>;
}
