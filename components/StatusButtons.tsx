"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FLOW: { status: string; label: string }[] = [
  { status: "pending", label: "Pending" },
  { status: "confirmed", label: "Confirmed" },
  { status: "dispatched", label: "Dispatched" },
  { status: "delivered", label: "Delivered" },
];

const NEXT_LABEL: Record<string, string> = {
  pending: "Confirm Order",
  confirmed: "Mark Dispatched",
  dispatched: "Mark Delivered",
  delivered: "Delivered ✓",
  cancelled: "Cancelled",
};

export default function StatusButtons({
  orderRef,
  current,
}: {
  orderRef: string;
  current: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const currentIdx = FLOW.findIndex((f) => f.status === current);
  const nextStatus = currentIdx >= 0 && currentIdx < FLOW.length - 1 ? FLOW[currentIdx + 1].status : null;

  async function update(status: string) {
    setBusy(status);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderRef)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to update status.");
      } else {
        router.refresh();
      }
    } catch {
      alert("Failed to update status.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
        {FLOW.map((f, i) => {
          const done = i <= currentIdx;
          const isCurrent = f.status === current;
          return (
            <div key={f.status} className="flex items-center">
              <div
                className={`flex items-center gap-1.5 text-xs ${
                  done ? "text-slate-900" : "text-slate-400"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isCurrent
                      ? "bg-slate-900 ring-4 ring-slate-200"
                      : done
                        ? "bg-emerald-500"
                        : "bg-slate-200"
                  }`}
                />
                {f.label}
              </div>
              {i < FLOW.length - 1 && (
                <span
                  className={`hidden sm:block w-6 h-px mx-2 ${i < currentIdx ? "bg-emerald-400" : "bg-slate-200"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {nextStatus && (
        <button
          onClick={() => update(nextStatus)}
          disabled={busy !== null}
          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
        >
          {busy === nextStatus ? "Updating…" : NEXT_LABEL[current] ?? "Update"}
        </button>
      )}

      {current !== "cancelled" && current !== "delivered" && (
        <button
          onClick={() => update("cancelled")}
          disabled={busy !== null}
          className="text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {busy === "cancelled" ? "Updating…" : "Cancel Order"}
        </button>
      )}
    </div>
  );
}
