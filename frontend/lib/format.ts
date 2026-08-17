import type { EventItem } from "./types";

export const naira = (amount: number) =>
  "₦" + amount.toLocaleString("en-NG", { maximumFractionDigits: 0 });

export const compactNaira = (amount: number) =>
  amount >= 1_000_000
    ? "₦" + (amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1) + "M"
    : naira(amount);

const DAY = 86_400_000;

export function relativeDay(iso: string, now = new Date()) {
  const date = new Date(iso);
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const diff = Math.round(
    (new Date(date).setHours(0, 0, 0, 0) - startOfToday) / DAY,
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return "Past";
  if (diff < 7)
    return `This ${date.toLocaleDateString("en-NG", { weekday: "long" })}`;
  if (diff < 14)
    return `Next ${date.toLocaleDateString("en-NG", { weekday: "long" })}`;
  return `In ${Math.round(diff / 7)} weeks`;
}

export function fullDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function clockTime(iso: string) {
  return new Date(iso)
    .toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })
    .toUpperCase();
}

export function countdown(iso: string, now = Date.now()) {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return "Happening now";
  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h to go`;
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours}h ${mins}m to go`;
}

export function priceLabel(event: EventItem) {
  if (event.pricing.kind === "free") return "Free";
  if (event.pricing.kind === "hackathon")
    return `${compactNaira(event.pricing.prizePool)} pool`;
  return `From ${naira(event.pricing.from)}`;
}
