import { CalendarClock, MapPin, ExternalLink, Tag } from "lucide-react";
import { DekSheet } from "./Sheet";
import { NG_STATES } from "../lib/constants";

// Self-contained EventItem matching your backend schema
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

function formatState(id: string) {
  return (
    NG_STATES.find((s) => s.id.toLowerCase() === id.toLowerCase())?.name || id
  );
}

export default function DetailsSheet({
  event,
  open,
  onClose,
  onPass,
  onRsvp,
}: {
  event: EventItem | null;
  open: boolean;
  onClose: () => void;
  onPass: () => void;
  onRsvp: () => void;
}) {
  if (!event) return null;

  return (
    <DekSheet
      open={open}
      onClose={onClose}
      eyebrow={`${event.category.toUpperCase()} · ${formatState(event.state_id)}`}
      title={event.title}
      footer={
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onPass}
            className="tactile rounded-md border border-border bg-surface py-2.5 text-sm font-semibold text-pass hover:bg-pass/10"
          >
            Pass event
          </button>
          <button
            onClick={onRsvp}
            className="tactile rounded-md bg-going py-2.5 text-sm font-bold text-going-foreground"
          >
            {event.is_free
              ? "RSVP (Free)"
              : `Get Ticket · ₦${event.price_ngn.toLocaleString()}`}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Banner with Badge */}
        <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-2">
          <img
            src={
              event.banner_url ||
              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80"
            }
            alt={event.title}
            className="size-full object-cover"
          />
          <div className="absolute top-2 right-2">
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

        {/* Source & Platform info */}
        <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
          <div>
            <p className="label-caps text-muted-foreground">Source</p>
            <p className="font-semibold capitalize">
              {event.source_platform || "EventDek native"}
            </p>
          </div>
          {event.source_url && (
            <a
              href={event.source_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-going hover:underline"
            >
              Original Link <ExternalLink className="size-3" />
            </a>
          )}
        </div>

        {/* Schedule & Location */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarClock className="size-4 shrink-0 text-going" />
            <span>
              {relativeDay(event.start_time)} · {fullDate(event.start_time)} ·{" "}
              {clockTime(event.start_time)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4 shrink-0 text-going" />
            <span>
              {event.venue_name} {event.address ? `(${event.address})` : ""}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Tag className="size-4 shrink-0 text-going" />
            <span className="capitalize">{event.category} Event</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="label-caps text-muted-foreground">About the Event</h3>
          <p className="mt-1 text-sm text-foreground leading-relaxed whitespace-pre-line">
            {event.description}
          </p>
        </div>
      </div>
    </DekSheet>
  );
}
