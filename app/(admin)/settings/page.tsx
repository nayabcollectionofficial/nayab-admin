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
  delivery: { fee: 300, freeThreshold: 15000 },
  supportPhone: "0309 8599816",
  adminEmail: "",
  brandGroups: [
    { id: "bin-naem", label: "Bin Naem", brands: ["Bin Naem"] },
    { id: "bin-saeed", label: "Bin Saeed", brands: ["Bin Saeed"] },
    { id: "other", label: "Other", brands: [] },
  ],
};

export default async function SettingsPage() {
  await requireSession();

  const settings = { ...DEFAULTS };
  if (hasDb && supabase) {
    const { data } = await supabase.from("settings").select("key,value");
    const rows = (data ?? []) as SettingRow[];
    for (const row of rows) {
      if (row.key === "paymentMethods" && Array.isArray(row.value))
        settings.paymentMethods = row.value as typeof DEFAULTS.paymentMethods;
      if (row.key === "delivery" && row.value)
        settings.delivery = { ...settings.delivery, ...(row.value as object) } as typeof DEFAULTS.delivery;
      if (row.key === "supportPhone" && typeof row.value === "string")
        settings.supportPhone = row.value;
      if (row.key === "adminEmail" && typeof row.value === "string")
        settings.adminEmail = row.value;
      if (row.key === "brandGroups" && Array.isArray(row.value))
        settings.brandGroups = row.value as typeof DEFAULTS.brandGroups;
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      <p className="text-sm text-slate-500 mt-1">
        Payment accounts, delivery and contact details — save karte hi store
        pe live
      </p>
      <SettingsForm initial={settings} />
    </div>
  );
}
