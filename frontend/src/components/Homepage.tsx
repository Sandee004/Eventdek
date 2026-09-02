import { useCallback, useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
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
import EventCard from "./EventCard";
import DetailsSheet from "./DetailsSheet";
import RsvpFlow from "./RsvpFlow";
import { API_BASE_URL, NG_STATES } from "../lib/constants";
import { AppHeader } from "./AppHeader";

const SWIPE_THRESHOLD = 110;

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
  category: "tech" | "hackathon" | "product" | "lifestyle";
  is_free: boolean;
  price_ngn: number;
  currency?: string;
  source_platform: string;
  source_url?: string | null;
  requires_custom_fields?: boolean;
  custom_fields_schema?: any[];
}

export default function Home() {
  const [deck, setDeck] = useState<EventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const storedUser = localStorage.getItem("eventdek_user");
  const userState = storedUser ? JSON.parse(storedUser)?.state_id : "lagos";
  const [stateId, setStateId] = useState<string>(userState || "lagos");

  const [lastAction, setLastAction] = useState<{
    event: EventItem;
    type: "pass" | "rsvp";
  } | null>(null);
  const [details, setDetails] = useState<EventItem | null>(null);
  const [checkout, setCheckout] = useState<EventItem | null>(null);

  // Fetch directly from FastAPI
  const fetchDeckEvents = useCallback(async () => {
    const token = localStorage.getItem("eventdek_token");
    if (!token) return;

    setIsLoadingEvents(true);
    setFetchError(null);

    try {
      const res = await fetch(
        `${API_BASE_URL}/events/deck?state_id=${encodeURIComponent(stateId)}&limit=15`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        throw new Error("Failed to load events from the server.");
      }

      const data: EventItem[] = await res.json();
      setDeck(data);
    } catch (err: any) {
      setFetchError(err.message || "Failed to load deck.");
    } finally {
      setIsLoadingEvents(false);
    }
  }, [stateId]);

  useEffect(() => {
    fetchDeckEvents();
  }, [fetchDeckEvents]);

  const sendSwipeToBackend = async (
    eventId: string,
    direction: "left" | "right",
  ) => {
    const token = localStorage.getItem("eventdek_token");
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/events/swipe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_id: eventId,
          direction,
        }),
      });
    } catch (err) {
      console.error("Failed to record swipe:", err);
    }
  };

  const top = deck[0];
  const next = deck[1];

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 0, 260], [-14, 0, 14]);
  const passOpacity = useTransform(x, [-110, -25, 0], [1, 0, 0]);
  const rsvpOpacity = useTransform(x, [0, 25, 110], [0, 0, 1]);

  const popTopCard = () => {
    setDeck((prev) => prev.slice(1));
    x.set(0);
  };

  const handlePass = (event: EventItem) => {
    setLastAction({ event, type: "pass" });
    popTopCard();
    sendSwipeToBackend(event.id, "left");
  };

  const handleRsvp = (event: EventItem) => {
    // If event has questions or is paid, open the modal first to collect answers/payment
    if (
      !event.is_free ||
      (event.custom_fields_schema && event.custom_fields_schema.length > 0)
    ) {
      setCheckout(event);
      x.set(0);
      return;
    }

    // Free event without extra questions: instant 1-swipe RSVP
    setLastAction({ event, type: "rsvp" });
    popTopCard();
    sendSwipeToBackend(event.id, "right");
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (!top) return;
    if (info.offset.x > SWIPE_THRESHOLD) {
      handleRsvp(top);
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      handlePass(top);
    } else {
      x.set(0);
    }
  };

  const handleUndo = () => {
    if (!lastAction) return;
    setDeck((prev) => [lastAction.event, ...prev]);
    setLastAction(null);
  };

  const stateName = (id: string) =>
    NG_STATES.find((s) => s.id === id)?.name || id;

  return (
    <>
      <AppHeader />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 pt-4 pb-12">
        {isLoadingEvents && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 font-mono">
            <Loader2 className="size-3.5 animate-spin text-going" /> Loading
            events...
          </div>
        )}

        {fetchError && (
          <div className="mb-4 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
            {fetchError}
          </div>
        )}

        <div className="relative aspect-[16/23] w-full max-w-sm sm:max-w-md">
          {!top && !isLoadingEvents && (
            <div className="card-frame flex h-full flex-col items-center justify-center rounded-2xl p-8 text-center bg-card border border-border">
              <span className="grid size-14 place-items-center rounded-2xl border border-border bg-surface-2">
                <Sparkles className="size-6 text-going" />
              </span>
              <h2 className="mt-4 text-xl font-bold">End of the deck</h2>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground leading-relaxed">
                You've viewed all upcoming events in{" "}
                <strong className="text-foreground">
                  {stateName(stateId)}
                </strong>
                .
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {stateId !== "virtual" && (
                  <button
                    onClick={() => setStateId("virtual")}
                    className="tactile flex items-center gap-1.5 rounded-lg bg-going px-4 py-2.5 text-xs font-bold text-going-foreground shadow-md"
                  >
                    <Globe2 className="size-3.5" /> Check Virtual Events
                  </button>
                )}
                <button
                  onClick={fetchDeckEvents}
                  className="tactile flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-surface-2"
                >
                  <RotateCcw className="size-3.5" /> Refresh Deck
                </button>
              </div>
            </div>
          )}

          {next && (
            <div className="absolute inset-0 translate-y-2 scale-[0.96] opacity-60 pointer-events-none">
              <EventCard event={next} interactive={false} />
            </div>
          )}

          {top && (
            <motion.div
              key={top.id}
              style={{ x, rotate }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none select-none"
            >
              <EventCard event={top} onExpand={() => setDetails(top)} />

              <motion.div
                style={{ opacity: passOpacity }}
                className="pointer-events-none absolute top-6 right-6 z-20 rounded-md border-2 border-pass bg-pass/20 px-4 py-1.5 text-sm font-black uppercase tracking-wider text-pass backdrop-blur-sm"
              >
                PASS
              </motion.div>

              <motion.div
                style={{ opacity: rsvpOpacity }}
                className="pointer-events-none absolute top-6 left-6 z-20 rounded-md border-2 border-going bg-going/20 px-4 py-1.5 text-sm font-black uppercase tracking-wider text-going backdrop-blur-sm"
              >
                GOING (RSVP)
              </motion.div>
            </motion.div>
          )}
        </div>

        {top && (
          <div className="mt-6 flex items-center justify-center gap-4 w-full max-w-sm">
            <button
              onClick={() => handlePass(top)}
              className="tactile grid size-12 shrink-0 place-items-center rounded-full border border-border bg-surface text-pass hover:bg-pass/10 transition-colors shadow-md"
              title="Pass (Swipe Left)"
            >
              <X className="size-6" />
            </button>

            {lastAction && (
              <button
                onClick={handleUndo}
                className="tactile flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors shadow-sm"
              >
                <Undo2 className="size-3.5" /> Undo
              </button>
            )}

            <button
              onClick={() => setDetails(top)}
              className="tactile grid size-10 shrink-0 place-items-center rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
              title="Details"
            >
              <Info className="size-4" />
            </button>

            <button
              onClick={() => handleRsvp(top)}
              className="tactile grid size-12 shrink-0 place-items-center rounded-full bg-going text-going-foreground hover:scale-105 transition-transform shadow-xl"
              title="RSVP (Swipe Right)"
            >
              <Check className="size-6" />
            </button>
          </div>
        )}

        <DetailsSheet
          event={details}
          open={Boolean(details)}
          onClose={() => setDetails(null)}
          onPass={() => {
            if (details) handlePass(details);
            setDetails(null);
          }}
          onRsvp={() => {
            if (details) handleRsvp(details);
            setDetails(null);
          }}
        />

        {checkout && (
          <RsvpFlow
            event={checkout}
            open={Boolean(checkout)}
            onClose={() => setCheckout(null)}
          />
        )}
      </div>
    </>
  );
}
