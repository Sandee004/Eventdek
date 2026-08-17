import { BadgeCheck, Clock, Info, MapPin, Users } from "lucide-react";
import { categoryName } from "../../lib/data";
import { clockTime, countdown, fullDate, relativeDay } from "../../lib/format";
import type { EventItem } from "../../lib/types";
import { PriceBadge } from "./PriceBadge";

export function EventCard({
  event,
  onExpand,
  interactive = true,
}: {
  event: EventItem;
  onExpand?: () => void;
  interactive?: boolean;
}) {
  return (
    <article className="card-frame relative flex h-full flex-col rounded-xl">
      <div className="relative aspect-[16/11] w-full shrink-0 overflow-hidden rounded-t-xl bg-surface-2">
        <img
          src={event.image}
          alt={event.title}
          width={1024}
          height={1280}
          draggable={false}
          className="size-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-background via-background/60 to-transparent p-3 pb-4">
          <span className="label-caps rounded border border-going/50 bg-going/15 px-2 py-1 text-going backdrop-blur">
            {categoryName(event.category)}
          </span>
          <span className="numeric flex items-center gap-1.5 rounded border border-border bg-background/50 px-2 py-1 text-xs font-medium text-foreground backdrop-blur">
            <Clock className="size-3" />
            {countdown(event.start)}
          </span>
        </div>
      </div>

      <div className="perforate flex min-h-0 flex-1 flex-col gap-3 p-4 pt-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <p className="numeric text-[11px] font-medium uppercase tracking-widest text-going">
              {relativeDay(event.start)} · {fullDate(event.start)} ·{" "}
              {clockTime(event.start)}
            </p>
            <h3 className="display mt-1.5 text-xl font-extrabold leading-[1.05] sm:text-2xl">
              {event.title}
            </h3>
          </div>
          <div className="shrink-0 pt-1">
            <PriceBadge event={event} />
          </div>
        </div>

        <p className="line-clamp-2 shrink-0 text-sm text-muted-foreground">
          {event.tagline}
        </p>

        <dl className="grid shrink-0 gap-2 border-t border-border pt-3 text-sm">
          <div className="flex min-w-0 items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0">
              <span className="block font-semibold">{event.area}</span>
              <span className="block truncate text-muted-foreground">
                {event.venue}
              </span>
            </span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background">
                {event.host.name.slice(0, 1)}
              </span>
              <span className="truncate font-medium">{event.host.name}</span>
              {event.host.verified && (
                <BadgeCheck className="size-4 shrink-0 text-going" />
              )}
            </span>
            <span className="numeric flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="size-4" />
              {event.attendees.toLocaleString()} going
            </span>
          </div>
        </dl>

        {interactive && onExpand && (
          <button
            onClick={onExpand}
            className="tactile mt-auto flex items-center justify-center gap-2 rounded-md border border-border bg-surface-2 py-2.5 text-sm font-semibold hover:bg-accent"
          >
            <Info className="size-4" />
            Agenda, speakers & details
          </button>
        )}
      </div>
    </article>
  );
}
