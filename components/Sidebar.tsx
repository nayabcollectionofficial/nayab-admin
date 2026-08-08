"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const nav = [
  { label: "Dashboard", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Orders", href: "/orders" },
  { label: "Settings", href: "/settings" },
];

function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={busy}
      className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors disabled:opacity-50"
    >
      {busy ? "Signing out…" : "Logout"}
    </button>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const storeUrl = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col">
      <div className="px-5 py-5 border-b border-slate-200">
        <p className="font-semibold text-slate-900 tracking-wide">Nayab Admin</p>
        <p className="text-xs text-slate-400 mt-0.5">Store Management</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2.5 text-sm rounded-lg transition-colors ${
                active
                  ? "bg-slate-900 text-white font-medium"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-slate-200 space-y-1">
          <a
            href={storeUrl}
            target="_blank"
            rel="noreferrer"
            className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors"
          >
            View Store ↗
          </a>
          <LogoutButton />
        </div>
      </nav>
    </aside>
  );
}
