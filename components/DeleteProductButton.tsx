"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteProductButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 4000);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to delete product.");
        setBusy(false);
      }
    } catch {
      alert("Failed to delete product.");
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className={`text-sm px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
        confirming
          ? "bg-red-600 text-white font-medium"
          : "text-red-600 hover:bg-red-50"
      }`}
    >
      {confirming ? "Confirm?" : "Delete"}
    </button>
  );
}
