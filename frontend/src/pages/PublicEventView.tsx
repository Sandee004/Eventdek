import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CalendarClock,
  MapPin,
  ExternalLink,
  Globe,
  Share2,
  ArrowLeft,
  Loader2,
  Ticket,
  CheckCircle2,
} from "lucide-react";
import { AmbientBackground } from "../components/AmbientBg";
import { API_BASE_URL } from "../lib/constants";
import { shareEvent } from "../lib/share";
import type { EventItem } from "../components/EventCard";

export function PublicEventView() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvent() {
      try {
        const res = await fetch(`${API_BASE_URL}/events/${id}`);
        if (!res.ok) throw new Error("Event not found");
        const data = await res.json();
        setEvent(data);
      } catch (err: any) {
        setError(err.message || "Failed to load event.");
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
        <AmbientBackground />
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-card/60 px-4 py-2 font-mono text-xs text-muted-foreground backdrop-blur-md">
          <Loader2 className="size-4 animate-spin text-going" /> Loading
          event...
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4">
        <AmbientBackground />
        <div className="relative z-10 mx-auto max-w-md text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-border bg-surface-2 text-going shadow-inner">
            <Ticket className="size-6" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">
            Event Not Found
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            This event may have ended, expired, or been unlisted from the deck.
          </p>
          <Link
            to="/homepage"
            className="tactile mt-6 inline-flex items-center gap-2 rounded-xl bg-going px-5 py-2.5 text-xs font-bold text-going-foreground shadow-md transition-opacity hover:opacity-90"
          >
            <ArrowLeft className="size-4" /> Return to Deck
          </Link>
        </div>
      </div>
    );
  }

  const startDate = new Date(event.start_time);
  const formattedDate = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* 1. Animated Canvas Layer */}
      <AmbientBackground />

      {/* 2. Top Navigation Bar */}
      <header className="sticky top-3 z-40 w-full px-4 sm:px-6 pointer-events-none">
        <div className="pointer-events-auto mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-card/75 px-4 py-2.5 backdrop-blur-xl shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
          <Link
            to="/homepage"
            className="group flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5 text-going" />
            <span>Back to Deck</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => shareEvent(event)}
              className="tactile flex items-center gap-1.5 rounded-xl border border-white/10 bg-surface-2/60 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-2 transition-colors"
            >
              <Share2 className="size-3.5 text-going" /> Share
            </button>

            {event.source_url && (
              <a
                href={event.source_url}
                target="_blank"
                rel="noreferrer"
                className="tactile flex items-center gap-1.5 rounded-xl bg-going px-3.5 py-1.5 text-xs font-bold text-going-foreground shadow-sm hover:opacity-90 transition-opacity"
              >
                <span>Tickets</span>
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* 3. Main Full-Screen Layout */}
      <main className="relative z-10 mx-auto max-w-4xl px-4 pt-6 pb-20 sm:px-6 sm:pt-10">
        {/* Banner Hero Image */}
        <div className="relative aspect-[21/9] sm:aspect-[16/7] w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
          <img
            src={
              event.banner_url ||
              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=80"
            }
            alt={event.title}
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />

          <div className="absolute top-4 right-4 sm:top-5 sm:right-5">
            <span
              className={`rounded-full px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider backdrop-blur-md shadow-lg ${
                event.is_free
                  ? "bg-going text-going-foreground"
                  : "bg-background/90 text-foreground border border-white/20"
              }`}
            >
              {event.is_free
                ? "FREE ENTRY"
                : `₦${event.price_ngn.toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* Event Header Details */}
        <div className="mt-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-going/40 bg-going/15 px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase text-going">
              {event.category}
            </span>
            <span className="rounded-md border border-white/10 bg-surface-2/60 px-2 py-0.5 text-[11px] font-mono uppercase text-muted-foreground">
              {event.state_id}
            </span>
            <span className="text-xs text-muted-foreground capitalize flex items-center gap-1 ml-1">
              <Globe className="size-3 text-going" />
              {event.source_platform || "EventDek Verified"}
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            {event.title}
          </h1>
        </div>

        {/* Two-Column Information Workspace */}
        <div className="mt-10 grid gap-10 lg:grid-cols-12 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <h2 className="label-caps font-mono text-[11px] font-bold uppercase tracking-wider text-going">
                About The Event
              </h2>
              <div className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-line space-y-4">
                {event.description}
              </div>
            </div>

            {/* Event Highlights & Features */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="label-caps font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Access Perks
              </h3>
              <ul className="mt-3 grid gap-2.5 text-xs text-foreground">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-going shrink-0" />
                  <span>
                    Direct organizer ticketing and verified event gate admission
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-going shrink-0" />
                  <span>
                    Add instantly to your Google Calendar or download .ics
                    schedule pass
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-going shrink-0" />
                  <span>Synchronized venue location details</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Floating Metadata Dock */}
          <aside className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-card/80 p-5 shadow-xl backdrop-blur-xl space-y-5">
              {/* Date & Time */}
              <div className="flex items-start gap-3.5">
                <div className="grid size-10 place-items-center rounded-xl border border-going/30 bg-going/10 text-going shrink-0">
                  <CalendarClock className="size-5" />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase font-bold text-muted-foreground">
                    Date & Time
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {formattedDate}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formattedTime}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3.5 border-t border-white/10 pt-4">
                <div className="grid size-10 place-items-center rounded-xl border border-white/10 bg-surface-2 text-going shrink-0">
                  <MapPin className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase font-bold text-muted-foreground">
                    Venue
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5 truncate">
                    {event.venue_name}
                  </p>
                  {event.address && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {event.address}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {event.source_url && (
                <div className="border-t border-white/10 pt-4">
                  <a
                    href={event.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="tactile flex w-full items-center justify-center gap-2 rounded-xl bg-going py-3 text-xs font-bold text-going-foreground shadow-lg hover:opacity-90 active:scale-[0.99] transition-all"
                  >
                    <span>
                      Register on {event.source_platform || "Organizer Site"}
                    </span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Quick Helper Note */}
            <p className="text-center text-[11px] text-muted-foreground leading-normal px-2">
              Discovered via EventDek. Ticketing and entry policies are managed
              by the host.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}
