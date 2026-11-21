"use client";

export default function Modal({ open, children, onClose }: { open:boolean; children:React.ReactNode; onClose:()=>void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4" onClick={onClose}><div onClick={(event)=>event.stopPropagation()}>{children}</div></div>;
}
