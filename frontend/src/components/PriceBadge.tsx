import { Gift, Trophy, Wallet } from "lucide-react";
import type { EventItem } from "../../lib/types";
import { compactNaira, naira } from "../../lib/format";

export function PriceBadge({ event }: { event: EventItem }) {
  if (event.pricing.kind === "free") {
    return (
      <span className="numeric flex items-center gap-1.5 rounded-md border border-going/40 bg-going/15 px-2.5 py-1 text-sm font-bold text-going">
        <Gift className="size-3.5" /> Free
      </span>
    );
  }
  if (event.pricing.kind === "hackathon") {
    return (
      <span className="numeric flex items-center gap-1.5 rounded-md border border-highlight/50 bg-highlight/15 px-2.5 py-1 text-sm font-bold text-highlight">
        <Trophy className="size-3.5" />
        {compactNaira(event.pricing.prizePool)} pool
      </span>
    );
  }
  return (
    <span className="numeric flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-sm font-bold">
      <Wallet className="size-3.5" />
      {naira(event.pricing.from)}
    </span>
  );
}
