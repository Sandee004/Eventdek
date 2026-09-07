import { Clock, Info, MapPin, Globe, Share2 } from "lucide-react";
import { shareEvent } from "../lib/share";

export interface EventItem {
  id: string;
  title: string;
  description: string;
  banner_url?: string | null;
  venue_name: string;
  address?: string | null;
  state_id: string;
  start_time: string;
  end_time: string;
  category: string;
  is_free: boolean;
  price_ngn: number;
  currency?: string;
  source_platform: string;
  source_url?: string | null;
  requires_custom_fields?: boolean;
  custom_fields_schema?: any[];
}

function relativeDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const diffDays = Math.round((+d - +today) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1 && diffDays <= 6)
    return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fullDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function clockTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function countdown(iso: string) {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return "Started";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `in ${hours}h`;
  const days = Math.floor(hours / 24);
  return `in ${days}d`;
}

export default function EventCard({
  event,
  onExpand,
  interactive = true,
}: {
  event: EventItem;
  onExpand?: () => void;
  interactive?: boolean;
}) {
  return (
    <article className="card-frame relative flex h-full flex-col rounded-xl overflow-hidden border border-border bg-card shadow-md">
      {/* Banner & Floating Badges */}
      <div className="relative aspect-[16/11] w-full shrink-0 overflow-hidden bg-surface-2">
        <img
          src={
            event.banner_url ||
            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80"
          }
          alt={event.title}
          draggable={false}
          className="size-full object-cover select-none pointer-events-none"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-background via-background/60 to-transparent p-3 pb-4">
          <span className="label-caps rounded border border-going/50 bg-going/15 px-2 py-1 text-going backdrop-blur capitalize font-bold text-xs">
            {event.category}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${
              event.is_free
                ? "bg-going text-going-foreground"
                : "bg-surface text-foreground border border-border"
            }`}
          >
            {event.is_free ? "FREE" : `₦${event.price_ngn.toLocaleString()}`}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex min-h-0 flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-semibold text-going">
              <Clock className="size-3.5" />
              {relativeDay(event.start_time)}
            </span>
            <span className="numeric">{countdown(event.start_time)}</span>
          </div>

          <h2 className="display mt-1 text-lg font-bold leading-tight line-clamp-2">
            {event.title}
          </h2>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Card Footer Details */}
        <div className="mt-3 space-y-2 border-t border-border pt-3 text-xs">
          <div className="flex items-center justify-between gap-2 text-muted-foreground">
            <span className="flex items-center gap-1.5 min-w-0">
              <Globe className="size-3.5 shrink-0 text-going" />
              <span className="font-semibold text-foreground truncate capitalize">
                {event.source_platform || "Native Event"}
              </span>
            </span>
            <span className="font-mono text-[11px] uppercase">
              {event.state_id}
            </span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1 truncate">
              <MapPin className="size-3.5 shrink-0 text-going" />
              <span className="truncate">{event.venue_name}</span>
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="numeric text-[11px] text-muted-foreground">
              {fullDate(event.start_time)} · {clockTime(event.start_time)}
            </span>

            {interactive && (
              <div className="flex items-center gap-1.5">
                {/* Share Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    shareEvent(event);
                  }}
                  className="tactile flex size-7 items-center justify-center rounded-md bg-surface-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title="Share event link"
                >
                  <Share2 className="size-3" />
                </button>

                {/* Info / Expand Button */}
                {onExpand && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onExpand();
                    }}
                    className="tactile flex items-center gap-1 rounded-md bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-accent transition-colors"
                  >
                    <Info className="size-3" /> Info
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
