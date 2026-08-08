export function formatPrice(amount: number): string {
  return "Rs. " + amount.toLocaleString("en-PK");
}

const TZ = "Asia/Karachi";

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PK", { timeZone: TZ });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-PK", { timeZone: TZ }) +
    " " +
    d.toLocaleTimeString([], { timeZone: TZ, hour: "2-digit", minute: "2-digit" })
  );
}
