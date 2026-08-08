import { requireSession } from "@/lib/session";
import { supabase, hasDb } from "@/lib/supabase";
import SettingsForm from "@/components/SettingsForm";

export const metadata = { title: "Settings" };

interface SettingRow {
  key: string;
  value: unknown;
}

const DEFAULTS = {
  paymentMethods: [
    {
      id: "easypaisa",
      label: "EasyPaisa",
      mobileAccount: "0310 3368161",
      accountTitle: "NAYAB COLLECTION",
      note: "Pay the total amount via EasyPaisa app, then upload your payment screenshot below.",
    },
    {
      id: "jazzcash",
      label: "JazzCash",
      mobileAccount: "0309 8599816",
      accountTitle: "NAYAB COLLECTION",
      note: "Pay the total amount via JazzCash app, then upload your payment screenshot below.",
    },
  ],
  supportPhone: "0309 8599816",
  adminEmail: "",
  brandGroups: [
    { id: "bin-naem", label: "Bin Naem", brands: ["Bin Naem"] },
    { id: "bin-saeed", label: "Bin Saeed", brands: ["Bin Saeed"] },
    { id: "other", label: "Other", brands: [] },
  ],
  spotlightProductSlug: "",
};

export default async function SettingsPage() {
  await requireSession();

  const settings = { ...DEFAULTS };
  let products: { id: string; name: string; slug: string }[] = [];
  if (hasDb && supabase) {
    const { data } = await supabase.from("settings").select("key,value");
    const rows = (data ?? []) as SettingRow[];
    for (const row of rows) {
      if (row.key === "paymentMethods" && Array.isArray(row.value))
        settings.paymentMethods = row.value as typeof DEFAULTS.paymentMethods;
      if (row.key === "supportPhone" && typeof row.value === "string")
        settings.supportPhone = row.value;
      if (row.key === "adminEmail" && typeof row.value === "string")
        settings.adminEmail = row.value;
      if (row.key === "brandGroups" && Array.isArray(row.value))
        settings.brandGroups = row.value as typeof DEFAULTS.brandGroups;
      if (row.key === "spotlightProductSlug" && typeof row.value === "string")
        settings.spotlightProductSlug = row.value;
    }
    const prodRes = await supabase
      .from("products")
      .select("id,name,slug")
      .order("name", { ascending: true });
    products = (prodRes.data ?? []) as typeof products;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      <p className="text-sm text-slate-500 mt-1">
        Payment accounts, delivery and contact details — save karte hi store
        pe live
      </p>
      <SettingsForm
        key={JSON.stringify(settings)}
        initial={settings}
        products={products}
      />
    </div>
  );
}
