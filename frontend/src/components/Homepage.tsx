// import { useCallback, useEffect, useState } from "react";
// import {
//   motion,
//   useMotionValue,
//   useTransform,
//   type PanInfo,
// } from "framer-motion";
// import {
//   Globe2,
//   Info,
//   RotateCcw,
//   Sparkles,
//   Undo2,
//   X,
//   Check,
//   Loader2,
// } from "lucide-react";
// import EventCard from "./EventCard";
// import DetailsSheet from "./DetailsSheet";
// import RsvpFlow from "./RsvpFlow";
// import { API_BASE_URL, NG_STATES } from "../lib/constants";
// import { AppHeader } from "./AppHeader";
// import { AmbientBackground } from "./AmbientBg";

// const SWIPE_THRESHOLD = 110;

// export interface EventItem {
//   id: string;
//   title: string;
//   description: string;
//   banner_url?: string | null;
//   venue_name: string;
//   address?: string | null;
//   state_id: string;
//   start_time: string;
//   end_time: string;
//   category: "tech" | "hackathon" | "product" | "lifestyle";
//   is_free: boolean;
//   price_ngn: number;
//   currency?: string;
//   source_platform: string;
//   source_url?: string | null;
//   requires_custom_fields?: boolean;
//   custom_fields_schema?: any[];
// }

// export default function Home() {
//   const [deck, setDeck] = useState<EventItem[]>([]);
//   const [isLoadingEvents, setIsLoadingEvents] = useState(true);
//   const [fetchError, setFetchError] = useState<string | null>(null);

//   const storedUser = localStorage.getItem("eventdek_user");
//   const userState = storedUser ? JSON.parse(storedUser)?.state_id : "lagos";
//   const [stateId, setStateId] = useState<string>(userState || "lagos");

//   const [lastAction, setLastAction] = useState<{
//     event: EventItem;
//     type: "pass" | "rsvp";
//   } | null>(null);
//   const [details, setDetails] = useState<EventItem | null>(null);
//   const [checkout, setCheckout] = useState<EventItem | null>(null);

//   // Fetch directly from FastAPI
//   const fetchDeckEvents = useCallback(async () => {
//     const token = localStorage.getItem("eventdek_token");
//     if (!token) return;

//     setIsLoadingEvents(true);
//     setFetchError(null);

//     try {
//       const res = await fetch(
//         `${API_BASE_URL}/events/deck?state_id=${encodeURIComponent(stateId)}&limit=15`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         },
//       );

//       if (!res.ok) {
//         throw new Error("Failed to load events from the server.");
//       }

//       const data: EventItem[] = await res.json();
//       setDeck(data);
//     } catch (err: any) {
//       setFetchError(err.message || "Failed to load deck.");
//     } finally {
//       setIsLoadingEvents(false);
//     }
//   }, [stateId]);

//   useEffect(() => {
//     fetchDeckEvents();
//   }, [fetchDeckEvents]);

//   const sendSwipeToBackend = async (
//     eventId: string,
//     direction: "left" | "right",
//   ) => {
//     const token = localStorage.getItem("eventdek_token");
//     if (!token) return;

//     try {
//       await fetch(`${API_BASE_URL}/events/swipe`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           event_id: eventId,
//           direction,
//         }),
//       });
//     } catch (err) {
//       console.error("Failed to record swipe:", err);
//     }
//   };

//   const top = deck[0];
//   const next = deck[1];

//   const x = useMotionValue(0);
//   const rotate = useTransform(x, [-260, 0, 260], [-14, 0, 14]);
//   const passOpacity = useTransform(x, [-110, -25, 0], [1, 0, 0]);
//   const rsvpOpacity = useTransform(x, [0, 25, 110], [0, 0, 1]);

//   const popTopCard = () => {
//     setDeck((prev) => prev.slice(1));
//     x.set(0);
//   };

//   const handlePass = (event: EventItem) => {
//     setLastAction({ event, type: "pass" });
//     popTopCard();
//     sendSwipeToBackend(event.id, "left");
//   };

//   const handleRsvp = (event: EventItem) => {
//     // If event has questions or is paid, open the modal first to collect answers/payment
//     if (
//       !event.is_free ||
//       (event.custom_fields_schema && event.custom_fields_schema.length > 0)
//     ) {
//       setCheckout(event);
//       x.set(0);
//       return;
//     }

//     // Free event without extra questions: instant 1-swipe RSVP
//     setLastAction({ event, type: "rsvp" });
//     popTopCard();
//     sendSwipeToBackend(event.id, "right");
//   };

//   const handleDragEnd = (
//     _event: MouseEvent | TouchEvent | PointerEvent,
//     info: PanInfo,
//   ) => {
//     if (!top) return;
//     if (info.offset.x > SWIPE_THRESHOLD) {
//       handleRsvp(top);
//     } else if (info.offset.x < -SWIPE_THRESHOLD) {
//       handlePass(top);
//     } else {
//       x.set(0);
//     }
//   };

//   const handleUndo = () => {
//     if (!lastAction) return;
//     setDeck((prev) => [lastAction.event, ...prev]);
//     setLastAction(null);
//   };

//   const stateName = (id: string) =>
//     NG_STATES.find((s) => s.id === id)?.name || id;

//   return (
//     <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
//       {/* 1. Canvas Background Layer */}
//       <AmbientBackground />

//       {/* 2. Top Navigation Dock */}
//       <AppHeader />

//       {/* 3. Main Deck Workspace */}
//       <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pt-4 pb-8 sm:pb-12">
//         {/* Status & Error Pill Area (Absolute or fixed height to prevent layout shift) */}
//         <div className="mb-3 flex h-6 items-center justify-center">
//           {isLoadingEvents && (
//             <div className="flex items-center gap-2 rounded-full border border-border/60 bg-surface-2/60 px-3 py-1 font-mono text-[11px] text-muted-foreground backdrop-blur-sm">
//               <Loader2 className="size-3 animate-spin text-going" /> Loading
//               deck...
//             </div>
//           )}

//           {fetchError && !isLoadingEvents && (
//             <div className="rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-[11px] font-medium text-destructive backdrop-blur-sm">
//               {fetchError}
//             </div>
//           )}
//         </div>

//         {/* Card Aspect Container */}
//         <div className="relative aspect-[16/23] w-full max-w-[340px] sm:max-w-[390px]">
//           {!top && !isLoadingEvents && (
//             <div className="card-frame flex h-full flex-col items-center justify-center rounded-2xl border border-border bg-card/95 p-8 text-center shadow-2xl backdrop-blur-md">
//               <span className="grid size-14 place-items-center rounded-2xl border border-border bg-surface-2">
//                 <Sparkles className="size-6 text-going" />
//               </span>
//               <h2 className="mt-4 font-display text-xl font-bold tracking-tight">
//                 End of the deck
//               </h2>
//               <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
//                 You've viewed all upcoming events in{" "}
//                 <strong className="text-foreground">
//                   {stateName(stateId)}
//                 </strong>
//                 .
//               </p>

//               <div className="mt-6 flex flex-wrap justify-center gap-2">
//                 {stateId !== "virtual" && (
//                   <button
//                     type="button"
//                     onClick={() => setStateId("virtual")}
//                     className="tactile flex items-center gap-1.5 rounded-xl bg-going px-4 py-2.5 text-xs font-bold text-going-foreground shadow-md"
//                   >
//                     <Globe2 className="size-3.5" /> Virtual Events
//                   </button>
//                 )}
//                 <button
//                   type="button"
//                   onClick={fetchDeckEvents}
//                   className="tactile flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-surface-2"
//                 >
//                   <RotateCcw className="size-3.5" /> Refresh Deck
//                 </button>
//               </div>
//             </div>
//           )}

//           {next && (
//             <div className="pointer-events-none absolute inset-0 translate-y-2 scale-[0.96] opacity-60">
//               <EventCard event={next} interactive={false} />
//             </div>
//           )}

//           {top && (
//             <motion.div
//               key={top.id}
//               style={{ x, rotate }}
//               drag="x"
//               dragConstraints={{ left: 0, right: 0 }}
//               onDragEnd={handleDragEnd}
//               className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none select-none shadow-2xl"
//             >
//               <EventCard event={top} onExpand={() => setDetails(top)} />

//               {/* Swipe Direction Tags */}
//               <motion.div
//                 style={{ opacity: passOpacity }}
//                 className="pointer-events-none absolute top-5 right-5 z-20 rounded-lg border-2 border-pass bg-pass/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-pass backdrop-blur-md"
//               >
//                 PASS
//               </motion.div>

//               <motion.div
//                 style={{ opacity: rsvpOpacity }}
//                 className="pointer-events-none absolute top-5 left-5 z-20 rounded-lg border-2 border-going bg-going/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-going backdrop-blur-md"
//               >
//                 GOING
//               </motion.div>
//             </motion.div>
//           )}
//         </div>

//         {/* Swipe Action Controls */}
//         {top && (
//           <div className="mt-5 flex w-full max-w-[340px] items-center justify-between sm:max-w-[390px] px-2">
//             {/* Pass Action */}
//             <button
//               type="button"
//               onClick={() => handlePass(top)}
//               className="tactile grid size-13 place-items-center rounded-2xl border border-border/80 bg-surface text-pass shadow-md hover:border-pass/30 hover:bg-pass/10 transition-colors"
//               title="Pass (Swipe Left)"
//             >
//               <X className="size-6 stroke-[2.5]" />
//             </button>

//             {/* Center Actions (Undo + Details) */}
//             <div className="flex items-center gap-2">
//               {lastAction && (
//                 <button
//                   type="button"
//                   onClick={handleUndo}
//                   className="tactile flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors shadow-sm"
//                 >
//                   <Undo2 className="size-3.5" /> Undo
//                 </button>
//               )}

//               <button
//                 type="button"
//                 onClick={() => setDetails(top)}
//                 className="tactile grid size-10 place-items-center rounded-xl border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
//                 title="View Details"
//               >
//                 <Info className="size-4" />
//               </button>
//             </div>

//             {/* RSVP Action */}
//             <button
//               type="button"
//               onClick={() => handleRsvp(top)}
//               className="tactile grid size-13 place-items-center rounded-2xl bg-going text-going-foreground shadow-lg hover:scale-105 active:scale-95 transition-all"
//               title="RSVP (Swipe Right)"
//             >
//               <Check className="size-6 stroke-[3]" />
//             </button>
//           </div>
//         )}

//         {/* Details Sheet Modal */}
//         <DetailsSheet
//           event={details}
//           open={Boolean(details)}
//           onClose={() => setDetails(null)}
//           onPass={() => {
//             if (details) handlePass(details);
//             setDetails(null);
//           }}
//           onRsvp={() => {
//             if (details) handleRsvp(details);
//             setDetails(null);
//           }}
//         />

//         {/* Checkout / Registration Modal */}
//         {checkout && (
//           <RsvpFlow
//             event={checkout}
//             open={Boolean(checkout)}
//             onClose={() => setCheckout(null)}
//             onSuccess={(eventId) => {
//               setDeck((prev) => prev.filter((e) => e.id !== eventId));
//               setCheckout(null);
//             }}
//           />
//         )}
//       </main>
//     </div>
//   );
// }

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
import { AmbientBackground } from "./AmbientBg";

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

      if (!res.ok) throw new Error("Failed to load events from the server.");
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
        body: JSON.stringify({ event_id: eventId, direction }),
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
    if (
      !event.is_free ||
      (event.custom_fields_schema && event.custom_fields_schema.length > 0)
    ) {
      setCheckout(event);
      x.set(0);
      return;
    }
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
    NG_STATES.find((s) => s.id.toLowerCase() === id.toLowerCase())?.name || id;

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <AmbientBackground />
      <AppHeader />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pt-4 pb-8 sm:pb-12">
        <div className="mb-3 flex w-full max-w-[340px] items-center justify-between gap-2 sm:max-w-[390px]">
          {/* <div className="relative flex items-center group">
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-card/80 py-1.5 pl-3 pr-2.5 shadow-sm backdrop-blur-md transition-all group-hover:border-going/40">
              <span className="size-1.5 rounded-full bg-going animate-pulse" />
              <span className="font-mono text-[10px] uppercase text-muted-foreground tracking-wider">
                Region:
              </span>

              <select
                value={stateId}
                onChange={(e) => setStateId(e.target.value)}
                className="cursor-pointer appearance-none bg-transparent pr-4 font-sans text-xs font-bold text-foreground outline-none transition-colors hover:text-going focus:outline-none"
              >
                {NG_STATES.map((s) => (
                  <option
                    key={s.id}
                    value={s.id}
                    className="bg-card text-foreground"
                  >
                    {s.name}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-2.5 size-3 text-muted-foreground transition-transform group-hover:text-foreground" />
            </div>
          </div> */}

          <div className="flex items-center">
            {isLoadingEvents && (
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-card/60 px-2.5 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur-md">
                <Loader2 className="size-3.5 animate-spin text-going" /> Loading
                events...
              </span>
            )}
            {fetchError && !isLoadingEvents && (
              <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-[10px] font-medium text-destructive backdrop-blur-sm">
                Error
              </span>
            )}
          </div>
        </div>

        <div className="relative aspect-[16/23] w-full max-w-[340px] sm:max-w-[390px]">
          {!top && !isLoadingEvents && (
            <div className="card-frame flex h-full flex-col items-center justify-center rounded-2xl border border-border bg-card/95 p-8 text-center shadow-2xl backdrop-blur-md">
              <span className="grid size-14 place-items-center rounded-2xl border border-border bg-surface-2">
                <Sparkles className="size-6 text-going" />
              </span>
              <h2 className="mt-4 font-display text-xl font-bold tracking-tight">
                End of the deck
              </h2>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                You've viewed all upcoming events in{" "}
                <strong className="text-foreground">
                  {stateName(stateId)}
                </strong>
                .
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {stateId !== "virtual" && (
                  <button
                    type="button"
                    onClick={() => setStateId("virtual")}
                    className="tactile flex items-center gap-1.5 rounded-xl bg-going px-4 py-2.5 text-xs font-bold text-going-foreground shadow-md"
                  >
                    <Globe2 className="size-3.5" /> Virtual Events
                  </button>
                )}
                <button
                  type="button"
                  onClick={fetchDeckEvents}
                  className="tactile flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-surface-2"
                >
                  <RotateCcw className="size-3.5" /> Refresh Deck
                </button>
              </div>
            </div>
          )}

          {next && (
            <div className="pointer-events-none absolute inset-0 translate-y-2 scale-[0.96] opacity-60">
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
              className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none select-none shadow-2xl"
            >
              <EventCard event={top} onExpand={() => setDetails(top)} />

              <motion.div
                style={{ opacity: passOpacity }}
                className="pointer-events-none absolute top-5 right-5 z-20 rounded-lg border-2 border-pass bg-pass/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-pass backdrop-blur-md"
              >
                PASS
              </motion.div>

              <motion.div
                style={{ opacity: rsvpOpacity }}
                className="pointer-events-none absolute top-5 left-5 z-20 rounded-lg border-2 border-going bg-going/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-going backdrop-blur-md"
              >
                GOING
              </motion.div>
            </motion.div>
          )}
        </div>

        {top && (
          <div className="mt-5 flex w-full max-w-[340px] items-center justify-between sm:max-w-[390px] px-2">
            <button
              type="button"
              onClick={() => handlePass(top)}
              className="tactile grid size-13 place-items-center rounded-2xl border border-border/80 bg-surface text-pass shadow-md hover:border-pass/30 hover:bg-pass/10 transition-colors"
              title="Pass (Swipe Left)"
            >
              <X className="size-6 stroke-[2.5]" />
            </button>

            <div className="flex items-center gap-2">
              {lastAction && (
                <button
                  type="button"
                  onClick={handleUndo}
                  className="tactile flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors shadow-sm"
                >
                  <Undo2 className="size-3.5" /> Undo
                </button>
              )}

              <button
                type="button"
                onClick={() => setDetails(top)}
                className="tactile grid size-10 place-items-center rounded-xl border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                title="View Details"
              >
                <Info className="size-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleRsvp(top)}
              className="tactile grid size-13 place-items-center rounded-2xl bg-going text-going-foreground shadow-lg hover:scale-105 active:scale-95 transition-all"
              title="RSVP (Swipe Right)"
            >
              <Check className="size-6 stroke-[3]" />
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
            onSuccess={(eventId) => {
              setDeck((prev) => prev.filter((e) => e.id !== eventId));
              setCheckout(null);
            }}
          />
        )}
      </main>
    </div>
  );
}
