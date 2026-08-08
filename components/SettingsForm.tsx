"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface PaymentMethod {
  id: string;
  label: string;
  mobileAccount: string;
  accountTitle: string;
  note: string;
}

interface BrandGroup {
  id: string;
  label: string;
  brands: string[];
}

interface SettingsData {
  paymentMethods: PaymentMethod[];
  delivery: { fee: number; freeThreshold: number };
  supportPhone: string;
  adminEmail: string;
  brandGroups: BrandGroup[];
  spotlightProductSlug: string;
}

const inputCls =
  "w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900";

const labelCls =
  "block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1.5";

export default function SettingsForm({
  initial,
  products,
}: {
  initial: SettingsData;
  products: { id: string; name: string; slug: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<SettingsData>(initial);
  const [groupTexts, setGroupTexts] = useState<string[]>(
    () => initial.brandGroups.map((g) => g.brands.join(", "))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(t);
  }, [saved]);

  function setGroupText(index: number, text: string) {
    setGroupTexts((prev) => prev.map((t, i) => (i === index ? text : t)));
  }

  function setMethod(id: string, field: keyof PaymentMethod, value: string) {
    setForm((f) => ({
      ...f,
      paymentMethods: f.paymentMethods.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    }));
  }

  function setGroup(index: number, patch: Partial<BrandGroup>) {
    setForm((f) => ({
      ...f,
      brandGroups: f.brandGroups.map((g, i) => (i === index ? { ...g, ...patch } : g)),
    }));
  }

  function addGroup() {
    setForm((f) => ({
      ...f,
      brandGroups: [
        ...f.brandGroups,
        { id: `group-${Date.now()}`, label: "New Filter", brands: [] },
      ],
    }));
    setGroupTexts((prev) => [...prev, ""]);
  }

  function removeGroup(index: number) {
    setForm((f) => ({
      ...f,
      brandGroups: f.brandGroups.filter((_, i) => i !== index),
    }));
    setGroupTexts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const brandGroups = form.brandGroups.map((g, i) => ({
      ...g,
      brands: (groupTexts[i] ?? "")
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean),
    }));
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethods: form.paymentMethods,
          delivery: form.delivery,
          supportPhone: form.supportPhone,
          adminEmail: form.adminEmail,
          brandGroups,
          spotlightProductSlug: form.spotlightProductSlug,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save settings.");
        setSaving(false);
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-3xl space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-medium text-slate-900">Payment Accounts</h2>
        <p className="text-xs text-slate-400 mt-1">
          Ye numbers checkout page pe dikhte hain — customers isi me pay karte
          hain
        </p>
        <div className="mt-5 space-y-6">
          {form.paymentMethods.map((m) => (
            <div key={m.id} className="border border-slate-200 rounded-lg p-5">
              <p className="text-sm font-medium text-slate-700 capitalize">
                {m.label}
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Label</label>
                  <input
                    value={m.label}
                    onChange={(e) => setMethod(m.id, "label", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Account Number</label>
                  <input
                    value={m.mobileAccount}
                    onChange={(e) =>
                      setMethod(m.id, "mobileAccount", e.target.value)
                    }
                    placeholder="0300 1234567"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Account Title</label>
                  <input
                    value={m.accountTitle}
                    onChange={(e) =>
                      setMethod(m.id, "accountTitle", e.target.value)
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Note (checkout pe dikhega)</label>
                  <input
                    value={m.note}
                    onChange={(e) => setMethod(m.id, "note", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-medium text-slate-900">Delivery</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div>
            <label className={labelCls}>Delivery Fee (Rs.)</label>
            <input
              type="number"
              min="0"
              value={form.delivery.fee}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  delivery: { ...f.delivery, fee: Number(e.target.value) },
                }))
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Free Delivery Above (Rs.)</label>
            <input
              type="number"
              min="1"
              value={form.delivery.freeThreshold}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  delivery: {
                    ...f.delivery,
                    freeThreshold: Number(e.target.value),
                  },
                }))
              }
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-medium text-slate-900">Contact & Notifications</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div>
            <label className={labelCls}>Support Phone (footer/contact)</label>
            <input
              value={form.supportPhone}
              onChange={(e) =>
                setForm((f) => ({ ...f, supportPhone: e.target.value }))
              }
              placeholder="0300 1234567"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Order Notification Email</label>
            <input
              type="email"
              value={form.adminEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, adminEmail: e.target.value }))
              }
              placeholder="aap@example.com — khaali rakhne pe email nahi aayegi"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-medium text-slate-900">Homepage Spotlight</h2>
        <p className="text-xs text-slate-400 mt-1">
          Homepage ke top pe jo suit dikhta hai — choose karo kaunsa product
          ho. &quot;Auto&quot; pe featured product dikhta hai.
        </p>
        <div className="mt-4 max-w-md">
          <label className={labelCls}>Spotlight Product</label>
          <select
            value={form.spotlightProductSlug ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                spotlightProductSlug: e.target.value,
              }))
            }
            className={inputCls}
          >
            <option value="">Auto — Featured product</option>
            {products.map((p) => (
              <option key={p.id} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            Product delete ho jaye to homepage auto featured pe wapas chala
            jata hai — kabhi blank nahi hota
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-medium text-slate-900">Brand Filters (Shop)</h2>
        <p className="text-xs text-slate-400 mt-1">
          Customer ko sirf yeh labels dikhte hain — real brand names kahin nahi
          dikhte. Khali brands wala group automatic baqi sab brands ke liye
          hota hai (e.g. &quot;Other&quot;). Kaunsi brands kis filter ke andar, aap
          decide karo — add / remove / edit anytime.
        </p>
        <div className="mt-5 space-y-4">
          {form.brandGroups.map((g, index) => (
            <div key={g.id} className="border border-slate-200 rounded-lg p-5">
              <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr_auto] gap-4 items-start">
                <div>
                  <label className={labelCls}>Filter Label (public)</label>
                  <input
                    value={g.label}
                    onChange={(e) => setGroup(index, { label: e.target.value })}
                    placeholder="e.g. Other"                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    Brands Is Filter Ke Andar (comma se alag)
                  </label>
                  <input
                    value={groupTexts[index] ?? ""}
                    onChange={(e) => setGroupText(index, e.target.value)}
                    placeholder="Khaali = baqi sab brands yahan aayenge (catch-all)"
                    className={inputCls}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Two ya zyada companies: shuru se type karo, saath me comma
                    (,) do — agar shuru me koi purana naam tha to phle wala
                    hata do
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeGroup(index)}
                  className="mt-6 text-xs text-red-600 hover:text-red-700 underline underline-offset-4"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addGroup}
            className="text-sm text-slate-700 border border-dashed border-slate-300 rounded-lg px-4 py-2.5 hover:border-slate-500 transition-colors"
          >
            + Add Filter
          </button>
        </div>
      </div>

      {error && (
        <p className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-6 py-2.5 transition-colors"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
        {saved && (
          <span className="text-sm text-emerald-600 font-medium">
            Saved ✓ — store pe turant live
          </span>
        )}
      </div>
    </form>
  );
}
