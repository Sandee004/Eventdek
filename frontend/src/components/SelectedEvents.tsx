// src/pages/MyDekPage.tsx
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CalendarPlus,
  Download,
  MapPin,
  Navigation,
  Ticket,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "../components/AppHeader";
import { QrBlock } from "../components/QrBlock";

import { EVENTS, categoryName, stateName } from "../../lib/data";
import { clockTime, fullDate, naira, relativeDay } from "../../lib/format";
import { downloadIcs, googleCalendarUrl, mapsUrl } from "../../lib/calender";
import { useEventDek } from "../../lib/store";

export function MyDekPage() {
  const { rsvps, cancelRsvp, hydrated, allEventsMap } = useEventDek();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const passes = useMemo(
    () =>
      rsvps
        .map((r) => ({
          rsvp: r,
          event: allEventsMap[r.eventId] || EVENTS.find((e) => e.id === r.eventId)!,
        }))
        .filter((p) => p.event)
        .filter((p) =>
          tab === "upcoming"
            ? new Date(p.event.start).getTime() >= Date.now()
            : new Date(p.event.start).getTime() < Date.now(),
        )
        .sort((a, b) => +new Date(a.event.start) - +new Date(b.event.start)),
    [rsvps, tab, allEventsMap],
  );

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold">My Dek</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rsvps.length} registration{rsvps.length === 1 ? "" : "s"} saved to
          this device.
        </p>

        {/* Tab switch */}
        <div className="mt-4 inline-flex rounded-md border border-border bg-surface p-1">
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
                tab === t
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {hydrated && passes.length === 0 && (
          <div className="card-frame mt-6 rounded-xl p-8 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full border border-border bg-surface-2">
              <Ticket className="size-5 text-muted-foreground" />
            </span>
            <h2 className="mt-4 text-lg font-bold">No {tab} passes</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Swipe right on something in the deck and it lands here instantly.
            </p>
            <Link
              to="/"
              className="tactile mt-4 inline-flex rounded-md bg-going px-4 py-2.5 text-sm font-bold text-going-foreground"
            >
              Back to the deck
            </Link>
          </div>
        )}

        {/* Passes List */}
        <ul className="mt-6 space-y-4">
          {passes.map(({ rsvp, event }) => (
            <li
              key={rsvp.eventId}
              className="card-frame overflow-hidden rounded-xl"
            >
              <div className="grid gap-4 p-4 sm:grid-cols-[auto_minmax(0,1fr)]">
                <div className="flex items-center gap-4">
                  <QrBlock value={rsvp.reference} size={110} />
                  <div className="text-sm sm:hidden">
                    <p className="label-caps text-muted-foreground">Ref</p>
                    <p className="font-bold tracking-wider">{rsvp.reference}</p>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="label-caps text-going">
                    {relativeDay(event.start)} · {fullDate(event.start)} ·{" "}
                    {clockTime(event.start)}
                  </p>
                  <h2 className="mt-1 truncate text-lg font-bold">
                    {event.title}
                  </h2>
                  <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span className="min-w-0">{event.venue}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded border border-border bg-surface-2 px-2 py-1 font-semibold">
                      {categoryName(event.category)}
                    </span>
                    <span className="rounded border border-border bg-surface-2 px-2 py-1 font-semibold">
                      {stateName(event.stateId)}
                    </span>
                    <span className="rounded border border-border bg-surface-2 px-2 py-1 font-semibold">
                      {rsvp.amount > 0
                        ? `${naira(rsvp.amount)} paid${
                            event.pricing.kind === "paid"
                              ? " · " +
                                (event.pricing.tiers.find(
                                  (t) => t.id === rsvp.tierId,
                                )?.name ?? "Ticket")
                              : ""
                          }`
                        : "Free RSVP"}
                    </span>
                    <span className="hidden rounded border border-border bg-surface-2 px-2 py-1 font-semibold sm:inline">
                      Ref {rsvp.reference}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
                <a
                  href={mapsUrl(event)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 bg-surface py-3 text-sm font-semibold hover:bg-accent"
                >
                  <Navigation className="size-4" /> Directions
                </a>
                <a
                  href={googleCalendarUrl(event)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 bg-surface py-3 text-sm font-semibold hover:bg-accent"
                >
                  <CalendarPlus className="size-4" /> Calendar
                </a>
                <button
                  onClick={() => downloadIcs(event)}
                  className="flex items-center justify-center gap-2 bg-surface py-3 text-sm font-semibold hover:bg-accent"
                >
                  <Download className="size-4" /> .ics
                </button>
                <button
                  onClick={() => {
                    cancelRsvp(rsvp.eventId);
                    toast.success(`Cancelled ${event.title}`);
                  }}
                  className="flex items-center justify-center gap-2 bg-surface py-3 text-sm font-semibold text-pass hover:bg-pass/10"
                >
                  <Trash2 className="size-4" /> Cancel
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
