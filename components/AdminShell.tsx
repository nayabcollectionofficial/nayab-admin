"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div
        className={`fixed inset-0 z-30 bg-slate-900/50 md:hidden transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 min-w-0">
        <header className="md:hidden sticky top-0 z-20 flex items-center gap-3 bg-white/95 backdrop-blur border-b border-slate-200 px-4 h-14">
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-semibold text-slate-900 tracking-wide">
            Nayab Admin
          </span>
        </header>
        <main className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
