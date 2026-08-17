import { CalendarClock, MapPin, Mic, Users } from "lucide-react";
import { DekSheet } from "./Sheet";
import { PriceBadge } from "./PriceBadge";
import { categoryName, stateName } from "../../lib/data";
import { clockTime, fullDate, relativeDay } from "../../lib/format";
import type { EventItem } from "../../lib/types";

export function DetailsSheet({
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
      eyebrow={`${categoryName(event.category)} · ${stateName(event.stateId)}`}
      title={event.title}
      footer={
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              onClose();
              onPass();
            }}
            className="tactile rounded-md border border-pass/50 bg-pass/10 py-3 text-sm font-bold text-pass"
          >
            Pass
          </button>
          <button
            onClick={() => {
              onClose();
              onRsvp();
            }}
            className="tactile rounded-md bg-going py-3 text-sm font-bold text-going-foreground"
          >
            {event.pricing.kind === "paid" ? "Get tickets" : "RSVP now"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <PriceBadge event={event} />
          <span className="flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-sm font-semibold">
            <Users className="size-3.5" />
            {event.attendees.toLocaleString()} /{" "}
            {event.capacity.toLocaleString()}
          </span>
        </div>

        <div className="grid gap-3 rounded-md border border-border bg-surface-2 p-3 text-sm">
          <div className="flex items-start gap-2">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-going" />
            <span>
              <span className="block font-semibold">
                {relativeDay(event.start)} · {fullDate(event.start)}
              </span>
              <span className="text-muted-foreground">
                {clockTime(event.start)} – {event.endTime}
              </span>
            </span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-going" />
            <span className="min-w-0">
              <span className="block font-semibold">{event.area}</span>
              <span className="text-muted-foreground">{event.venue}</span>
            </span>
          </div>
        </div>

        <section>
          <h3 className="label-caps text-muted-foreground">About</h3>
          <p className="mt-2 text-sm leading-relaxed">{event.description}</p>
        </section>

        <section>
          <h3 className="label-caps text-muted-foreground">Run of show</h3>
          <ol className="mt-2 space-y-0">
            {event.agenda.map((row) => (
              <li
                key={row.time + row.item}
                className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 border-b border-border py-2.5 text-sm last:border-b-0"
              >
                <span className="font-semibold tabular-nums text-muted-foreground">
                  {row.time}
                </span>
                <span>{row.item}</span>
              </li>
            ))}
          </ol>
        </section>

        {event.speakers && (
          <section>
            <h3 className="label-caps text-muted-foreground">Speakers</h3>
            <ul className="mt-2 grid gap-2">
              {event.speakers.map((s) => (
                <li
                  key={s.name}
                  className="flex items-center gap-3 rounded-md border border-border p-2.5"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-sm font-bold text-background">
                    <Mic className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {s.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {s.role}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </DekSheet>
  );
}
