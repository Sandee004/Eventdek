import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "motion/react";
import {
  Globe2,
  Info,
  RotateCcw,
  Sparkles,
  Undo2,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { EventCard } from "./EventCard";
import { DetailsSheet } from "./DetailsSheet";
import { RsvpFlow } from "./RsvpFlow";
import { EVENTS, filterDeck, stateName } from "../../lib/data";
import { useEventDek } from "../../lib/store";
import type { EventItem } from "../../lib/types";

const SWIPE_THRESHOLD = 110;

export function Deck() {
  const {
    stateId,
    setStateId,
    categories,
    clearCategories,
    passed,
    pass,
    undoPass,
    rsvps,
    cancelRsvp,
    resetPasses,
    dbEvents,
    isLoadingEvents,
  } = useEventDek();

  const [lastAction, setLastAction] = useState<{
    eventId: string;
    type: "pass" | "rsvp";
  } | null>(null);
  const [details, setDetails] = useState<EventItem | null>(null);
  const [checkout, setCheckout] = useState<EventItem | null>(null);

  const pool = useMemo(() => {
    return dbEvents.length > 0 ? dbEvents : EVENTS;
  }, [dbEvents]);

  const deck = useMemo(
    () =>
      filterDeck(pool, {
        stateId,
        categories,
        seen: [...passed, ...rsvps.map((r) => r.eventId)],
      }),
    [pool, passed, rsvps, stateId, categories],
  );

  const top = deck[0];
  const next = deck[1];

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 0, 260], [-14, 0, 14]);
  const passOpacity = useTransform(x, [-110, -25, 0], [1, 0, 0]);
  const goingOpacity = useTransform(x, [0, 25, 110], [0, 0, 1]);
  const glow = useTransform(
    x,
    [-200, -30, 0, 30, 200],
    [
      "0 0 0 1px var(--color-pass), 0 0 42px -4px color-mix(in oklab, var(--color-pass) 70%, transparent)",
      "0 0 0 1px color-mix(in oklab, var(--color-pass) 35%, transparent), 0 0 0 0 transparent",
      "0 0 0 1px var(--color-border), 0 24px 60px -28px oklch(0 0 0 / 80%)",
      "0 0 0 1px color-mix(in oklab, var(--color-going) 35%, transparent), 0 0 0 0 transparent",
      "0 0 0 1px var(--color-going), 0 0 42px -4px color-mix(in oklab, var(--color-going) 70%, transparent)",
    ],
  );

  const [exitX, setExitX] = useState(0);

  const doPass = useCallback(
    (event: EventItem) => {
      setExitX(-520);
      pass(event.id);
      setLastAction({ eventId: event.id, type: "pass" });
      x.set(0);
    },
    [pass, x],
  );

  const doRsvp = useCallback(
    (event: EventItem) => {
      setExitX(520);
      setCheckout(event);
      setLastAction({ eventId: event.id, type: "rsvp" });
      x.set(0);
    },
    [x],
  );

  const undo = useCallback(() => {
    if (!lastAction) return;
    if (lastAction.type === "pass") undoPass(lastAction.eventId);
    else cancelRsvp(lastAction.eventId);
    setLastAction(null);
  }, [lastAction, undoPass, cancelRsvp]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (details || checkout) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
        return;
      if (!top) return;
      if (e.key === "ArrowLeft") doPass(top);
      else if (e.key === "ArrowRight") doRsvp(top);
      else if (e.key.toLowerCase() === "z") undo();
      else if (e.key === " ") {
        e.preventDefault();
        setDetails(top);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [top, doPass, doRsvp, undo, details, checkout]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (!top) return;
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    if (offset < -SWIPE_THRESHOLD || velocity < -700) doPass(top);
    else if (offset > SWIPE_THRESHOLD || velocity > 700) doRsvp(top);
    else x.set(0);
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-10 pt-5">
      <div className="relative h-[540px] sm:h-[580px]">
        {isLoadingEvents && !top && (
          <div className="card-frame flex h-full flex-col items-center justify-center gap-3 rounded-xl px-6 text-center">
            <Loader2 className="size-8 animate-spin text-going" />
            <p className="text-sm font-medium text-muted-foreground">
              Fetching events from database…
            </p>
          </div>
        )}

        {!isLoadingEvents && !top && (
          <EmptyState
            onNationwide={() => setStateId("virtual")}
            onReset={() => {
              resetPasses();
              clearCategories();
            }}
            onClearFilters={clearCategories}
            hasFilters={categories.length > 0}
            regionLabel={stateName(stateId)}
          />
        )}

        {next && (
          <div className="pointer-events-none absolute inset-0 scale-[0.955] opacity-60 blur-[0.3px]">
            <EventCard event={next} interactive={false} />
          </div>
        )}

        <AnimatePresence initial={false}>
          {top && (
            <motion.div
              key={top.id}
              className="absolute inset-0 cursor-grab rounded-xl active:cursor-grabbing"
              style={{ x, rotate, boxShadow: glow }}
              drag="x"
              dragElastic={0.5}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={onDragEnd}
              initial={{ scale: 0.96, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ x: exitX, opacity: 0, transition: { duration: 0.22 } }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <motion.span
                style={{ opacity: passOpacity }}
                className="label-caps pointer-events-none absolute right-5 top-5 z-10 -rotate-12 rounded border-2 border-pass px-3 py-1.5 text-base text-pass"
              >
                Pass
              </motion.span>
              <motion.span
                style={{ opacity: goingOpacity }}
                className="label-caps pointer-events-none absolute left-5 top-5 z-10 rotate-12 rounded border-2 border-going px-3 py-1.5 text-base text-going"
              >
                Going
              </motion.span>
              <EventCard event={top} onExpand={() => setDetails(top)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex justify-center">
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface/80 p-2 shadow-[0_20px_50px_-20px_oklch(0_0_0/85%)] backdrop-blur-xl">
          <button
            onClick={undo}
            disabled={!lastAction}
            aria-label="Undo last swipe (Z)"
            className="tactile grid size-11 place-items-center rounded-full border border-border bg-surface-2 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <Undo2 className="size-5" />
          </button>
          <button
            onClick={() => top && doPass(top)}
            disabled={!top}
            aria-label="Pass on this event"
            className="tactile grid size-14 place-items-center rounded-full border border-pass/60 bg-pass/12 text-pass hover:bg-pass hover:text-pass-foreground disabled:opacity-30"
          >
            <X className="size-6" />
          </button>
          <button
            onClick={() => top && setDetails(top)}
            disabled={!top}
            aria-label="More info"
            className="tactile grid size-11 place-items-center rounded-full border border-border bg-surface-2 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <Info className="size-5" />
          </button>
          <button
            onClick={() => top && doRsvp(top)}
            disabled={!top}
            aria-label="RSVP to this event"
            className="tactile grid size-14 place-items-center rounded-full bg-going text-going-foreground shadow-[0_0_28px_-6px_var(--color-going)] hover:brightness-110 disabled:opacity-30 disabled:shadow-none"
          >
            <Check className="size-6" />
          </button>
        </div>
      </div>

      <p className="numeric mt-4 hidden text-center text-xs text-muted-foreground sm:block">
        <kbd className="rounded border border-border bg-surface px-1.5 py-0.5">
          ←
        </kbd>{" "}
        pass ·{" "}
        <kbd className="rounded border border-border bg-surface px-1.5 py-0.5">
          →
        </kbd>{" "}
        RSVP ·{" "}
        <kbd className="rounded border border-border bg-surface px-1.5 py-0.5">
          Space
        </kbd>{" "}
        details ·{" "}
        <kbd className="rounded border border-border bg-surface px-1.5 py-0.5">
          Z
        </kbd>{" "}
        undo
      </p>

      <DetailsSheet
        event={details}
        open={!!details}
        onClose={() => setDetails(null)}
        onPass={() => details && doPass(details)}
        onRsvp={() => details && doRsvp(details)}
      />
      <RsvpFlow
        event={checkout}
        open={!!checkout}
        onClose={() => setCheckout(null)}
        onCancelled={() => setLastAction(null)}
      />
    </div>
  );
}

function EmptyState({
  onNationwide,
  onReset,
  onClearFilters,
  hasFilters,
  regionLabel,
}: {
  onNationwide: () => void;
  onReset: () => void;
  onClearFilters: () => void;
  hasFilters: boolean;
  regionLabel: string;
}) {
  return (
    <div className="card-frame flex h-full flex-col items-center justify-center gap-4 rounded-xl px-6 text-center">
      <span className="grid size-14 place-items-center rounded-full border border-border bg-surface-2">
        <Sparkles className="size-6 text-highlight" />
      </span>
      <div>
        <h2 className="text-xl font-bold">Deck cleared for {regionLabel}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You've seen everything we have here. Widen the net or bring back the
          ones you passed on.
        </p>
      </div>
      <div className="grid w-full gap-2">
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="tactile rounded-md border border-border bg-surface py-2.5 text-sm font-semibold hover:bg-accent"
          >
            Drop category filters
          </button>
        )}
        <button
          onClick={onNationwide}
          className="tactile flex items-center justify-center gap-2 rounded-md bg-foreground py-2.5 text-sm font-bold text-background"
        >
          <Globe2 className="size-4" /> Show virtual & nationwide
        </button>
        <button
          onClick={onReset}
          className="tactile flex items-center justify-center gap-2 rounded-md border border-border bg-surface py-2.5 text-sm font-semibold hover:bg-accent"
        >
          <RotateCcw className="size-4" /> Reset passed events
        </button>
      </div>
    </div>
  );
}
