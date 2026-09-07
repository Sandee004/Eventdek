// import { useCallback, useEffect, useMemo, useState } from "react";
// import { Link } from "react-router-dom";
// import {
//   CalendarClock,
//   CalendarPlus,
//   Download,
//   Loader2,
//   MapPin,
//   QrCode,
//   Ticket,
// } from "lucide-react";
// import { API_BASE_URL } from "../lib/constants";
// import { QrBlock } from "../components/QrBlock";
// import { AppHeader } from "./AppHeader";
// import { AmbientBackground } from "./AmbientBg";

// interface RegistrationPass {
//   id: string;
//   event_id: string;
//   event_title: string;
//   event_banner_url?: string | null;
//   event_venue_name: string;
//   event_address?: string | null;
//   event_start_time: string;
//   event_end_time: string;
//   event_source_url?: string | null;
//   category?: string;
//   state_id?: string;
//   qr_code_token?: string;
//   reference?: string;
//   registration_status?: string;
//   created_at?: string;
// }

// function relativeDay(iso: string) {
//   const d = new Date(iso);
//   const today = new Date();
//   const diffDays = Math.round((+d - +today) / (1000 * 60 * 60 * 24));
//   if (diffDays === 0) return "Today";
//   if (diffDays === 1) return "Tomorrow";
//   if (diffDays > 1 && diffDays <= 6)
//     return d.toLocaleDateString("en-US", { weekday: "short" });
//   return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
// }

// function fullDate(iso: string) {
//   return new Date(iso).toLocaleDateString("en-US", {
//     weekday: "short",
//     month: "short",
//     day: "numeric",
//   });
// }

// // function clockTime(iso: string) {
// //   return new Date(iso).toLocaleTimeString("en-US", {
// //     hour: "numeric",
// //     minute: "2-digit",
// //   });
// // }

// function googleCalendarUrl(pass: RegistrationPass) {
//   const start = new Date(pass.event_start_time)
//     .toISOString()
//     .replace(/-|:|\.\d\d\d/g, "");
//   const end = new Date(
//     pass.event_end_time || +new Date(pass.event_start_time) + 3 * 3600 * 1000,
//   )
//     .toISOString()
//     .replace(/-|:|\.\d\d\d/g, "");
//   const details = encodeURIComponent(
//     `Event pass for ${pass.event_title}\n\nVenue: ${pass.event_venue_name}`,
//   );
//   return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
//     pass.event_title,
//   )}&dates=${start}/${end}&details=${details}&location=${encodeURIComponent(
//     pass.event_venue_name,
//   )}`;
// }

// function downloadIcs(pass: RegistrationPass) {
//   const start = new Date(pass.event_start_time)
//     .toISOString()
//     .replace(/-|:|\.\d\d\d/g, "");
//   const end = new Date(
//     pass.event_end_time || +new Date(pass.event_start_time) + 3 * 3600 * 1000,
//   )
//     .toISOString()
//     .replace(/-|:|\.\d\d\d/g, "");

//   const content = [
//     "BEGIN:VCALENDAR",
//     "VERSION:2.0",
//     "BEGIN:VEVENT",
//     `SUMMARY:${pass.event_title}`,
//     `LOCATION:${pass.event_venue_name}`,
//     `DTSTART:${start}`,
//     `DTEND:${end}`,
//     "END:VEVENT",
//     "END:VCALENDAR",
//   ].join("\r\n");

//   const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = `${pass.event_id || "event"}-pass.ics`;
//   a.click();
// }

// export function MyDek() {
//   const [registrations, setRegistrations] = useState<RegistrationPass[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
//   const [selectedPass, setSelectedPass] = useState<RegistrationPass | null>(
//     null,
//   );
//   console.log(error);

//   const fetchRegistrations = useCallback(async () => {
//     const token = localStorage.getItem("eventdek_token");
//     if (!token) {
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     try {
//       // 1. Fetch live snapshot registrations from backend
//       const res = await fetch(`${API_BASE_URL}/events/my-dek`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (res.ok) {
//         const data = await res.json();
//         setRegistrations(data);
//       } else {
//         // Fallback: Read client-stored RSVP cache if backend route isn't ready
//         const localRsvps = JSON.parse(
//           localStorage.getItem("eventdek_rsvps") || "[]",
//         );
//         setRegistrations(localRsvps);
//       }
//     } catch {
//       const localRsvps = JSON.parse(
//         localStorage.getItem("eventdek_rsvps") || "[]",
//       );
//       setRegistrations(localRsvps);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchRegistrations();
//   }, [fetchRegistrations]);

//   const filteredPasses = useMemo(() => {
//     const now = Date.now();
//     return registrations
//       .filter((p) => {
//         const eventDate = new Date(p.event_start_time).getTime();
//         return tab === "upcoming" ? eventDate >= now : eventDate < now;
//       })
//       .sort((a, b) => {
//         const tA = new Date(a.event_start_time).getTime();
//         const tB = new Date(b.event_start_time).getTime();
//         return tab === "upcoming" ? tA - tB : tB - tA;
//       });
//   }, [registrations, tab]);

//   return (
//     <div className="relative min-h-screen w-full overflow-x-hidden">
//       <AmbientBackground />

//       <AppHeader />

//       <main className="relative z-10 mx-auto max-w-5xl px-4 pt-6 pb-16 sm:px-6 sm:pt-8">
//         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
//           <div>
//             <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
//               Events Registered
//             </h1>
//             <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
//               Your confirmed access passes and ticket vouchers.
//             </p>
//           </div>

//           <div className="inline-flex rounded-xl border border-border bg-surface-2/60 p-1 self-start sm:self-auto backdrop-blur-sm">
//             {(["upcoming", "past"] as const).map((t) => (
//               <button
//                 key={t}
//                 type="button"
//                 onClick={() => setTab(t)}
//                 className={`rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition-all ${
//                   tab === t
//                     ? "bg-going text-going-foreground font-bold shadow-sm"
//                     : "text-muted-foreground hover:text-foreground"
//                 }`}
//               >
//                 {t} (
//                 {
//                   registrations.filter((p) => {
//                     const time = new Date(p.event_start_time).getTime();
//                     return t === "upcoming"
//                       ? time >= Date.now()
//                       : time < Date.now();
//                   }).length
//                 }
//                 )
//               </button>
//             ))}
//           </div>
//         </div>

//         {loading && (
//           <div className="flex items-center justify-center gap-2 py-24 text-xs font-mono text-muted-foreground">
//             <Loader2 className="size-4 animate-spin text-going" /> Loading your
//             passes...
//           </div>
//         )}

//         {/* Empty State */}
//         {!loading && filteredPasses.length === 0 && (
//           <div className="card-frame my-12 rounded-2xl border border-border bg-card/90 p-10 sm:p-12 text-center shadow-xl backdrop-blur-sm">
//             <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-border bg-surface-2 text-going">
//               <Ticket className="size-6" />
//             </span>
//             <h2 className="mt-4 font-display text-lg font-bold">
//               No {tab} passes found
//             </h2>
//             <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
//               {tab === "upcoming"
//                 ? "Swipe right on an event in the deck to claim a free pass or purchase a ticket."
//                 : "Past events you attended will be archived here."}
//             </p>
//             {tab === "upcoming" && (
//               <Link
//                 to="/"
//                 className="tactile mt-6 inline-flex items-center gap-2 rounded-xl bg-going px-5 py-2.5 text-xs font-bold text-going-foreground shadow-md"
//               >
//                 Explore Deck
//               </Link>
//             )}
//           </div>
//         )}

//         {/* Responsive Passes Grid */}
//         {!loading && filteredPasses.length > 0 && (
//           <ul className="mt-6 grid gap-4 sm:grid-cols-2">
//             {filteredPasses.map((pass) => {
//               const passToken = pass.qr_code_token || pass.reference || pass.id;
//               return (
//                 <li
//                   key={pass.id}
//                   className="card-frame flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card/90 shadow-sm backdrop-blur-sm transition-all hover:border-border/90"
//                 >
//                   <div className="grid gap-4 p-5 sm:grid-cols-[auto_minmax(0,1fr)] items-start">
//                     {/* QR Code Container */}
//                     <div
//                       onClick={() => setSelectedPass(pass)}
//                       className="cursor-pointer group relative grid size-26 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 p-2"
//                       title="Click to expand pass QR"
//                     >
//                       <QrBlock value={passToken} size={88} />
//                       <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity">
//                         <span className="text-[10px] font-bold text-going flex items-center gap-1">
//                           <QrCode className="size-3" /> View
//                         </span>
//                       </div>
//                     </div>

//                     {/* Pass Metadata */}
//                     <div className="min-w-0 space-y-1.5">
//                       <div className="flex items-center justify-between gap-2">
//                         <span className="label-caps font-bold text-going text-[10px] flex items-center gap-1 truncate">
//                           <CalendarClock className="size-3 shrink-0" />
//                           {relativeDay(pass.event_start_time)} ·{" "}
//                           {fullDate(pass.event_start_time)}
//                         </span>
//                         <span className="rounded-full bg-going/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-going shrink-0">
//                           {pass.registration_status || "Confirmed"}
//                         </span>
//                       </div>

//                       <h2 className="truncate font-display text-base font-bold leading-snug">
//                         {pass.event_title}
//                       </h2>

//                       <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
//                         <MapPin className="size-3.5 shrink-0 text-going" />
//                         <span className="truncate">
//                           {pass.event_venue_name}
//                         </span>
//                         {pass.event_address && (
//                           <span className="truncate">
//                             ({pass.event_address})
//                           </span>
//                         )}
//                       </p>

//                       <div className="flex flex-wrap items-center gap-2 pt-1">
//                         {pass.category && (
//                           <span className="rounded border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-semibold capitalize">
//                             {pass.category}
//                           </span>
//                         )}
//                         <span className="rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
//                           Ref: {passToken.slice(0, 10)}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Card Action Footer */}
//                   <div className="grid grid-cols-2 divide-x divide-border border-t border-border bg-surface-2/40 text-xs">
//                     <a
//                       href={googleCalendarUrl(pass)}
//                       target="_blank"
//                       rel="noreferrer"
//                       className="flex items-center justify-center gap-1.5 py-2.5 font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
//                     >
//                       <CalendarPlus className="size-3.5 text-going" /> Calendar
//                     </a>

//                     <button
//                       type="button"
//                       onClick={() => downloadIcs(pass)}
//                       className="flex items-center justify-center gap-1.5 py-2.5 font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
//                     >
//                       <Download className="size-3.5 text-going" /> .ics File
//                     </button>
//                   </div>
//                 </li>
//               );
//             })}
//           </ul>
//         )}

//         {/* Expanded QR Modal */}
//         {selectedPass && (
//           <div
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
//             onClick={() => setSelectedPass(null)}
//           >
//             <div
//               className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 text-center"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <span className="label-caps text-going">Digital Pass Token</span>
//               <h3 className="font-display font-bold text-lg">
//                 {selectedPass.event_title}
//               </h3>

//               <div className="flex justify-center py-2">
//                 <QrBlock
//                   value={`${window.location.origin}/verify-pass/${selectedPass.qr_code_token || selectedPass.reference || selectedPass.id}`}
//                   size={160}
//                 />
//               </div>

//               <p className="font-mono text-xs font-bold text-muted-foreground">
//                 {selectedPass.qr_code_token ||
//                   selectedPass.reference ||
//                   selectedPass.id}
//               </p>
//               <p className="text-xs text-muted-foreground">
//                 Present this code at the venue gate for check-in.
//               </p>

//               <button
//                 type="button"
//                 onClick={() => setSelectedPass(null)}
//                 className="tactile w-full rounded-xl bg-going py-2.5 text-xs font-bold text-going-foreground"
//               >
//                 Close Pass
//               </button>
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  CalendarPlus,
  Download,
  Loader2,
  MapPin,
  QrCode,
  ShieldCheck,
  Ticket,
  WifiOff,
} from "lucide-react";
import { API_BASE_URL } from "../lib/constants";
import { QrBlock } from "../components/QrBlock";
import {
  type RegistrationPass,
  getCachedPasses,
  savePassesToCache,
  getLastPassSyncTime,
} from "../lib/offlinepasses";
import { AmbientBackground } from "../components/AmbientBg";
import { AppHeader } from "../components/AppHeader";

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

function googleCalendarUrl(pass: RegistrationPass) {
  const start = new Date(pass.event_start_time)
    .toISOString()
    .replace(/-|:|\.\d\d\d/g, "");
  const end = new Date(
    pass.event_end_time || +new Date(pass.event_start_time) + 3 * 3600 * 1000,
  )
    .toISOString()
    .replace(/-|:|\.\d\d\d/g, "");
  const details = encodeURIComponent(
    `Event pass for ${pass.event_title}\n\nVenue: ${pass.event_venue_name}`,
  );
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    pass.event_title,
  )}&dates=${start}/${end}&details=${details}&location=${encodeURIComponent(
    pass.event_venue_name,
  )}`;
}

// Client-side .ics download requires zero internet access
function downloadIcs(pass: RegistrationPass) {
  const start = new Date(pass.event_start_time)
    .toISOString()
    .replace(/-|:|\.\d\d\d/g, "");
  const end = new Date(
    pass.event_end_time || +new Date(pass.event_start_time) + 3 * 3600 * 1000,
  )
    .toISOString()
    .replace(/-|:|\.\d\d\d/g, "");

  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${pass.event_title}`,
    `LOCATION:${pass.event_venue_name}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${pass.event_id || "event"}-pass.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function MyDek() {
  const [registrations, setRegistrations] = useState<RegistrationPass[]>(() =>
    getCachedPasses(),
  );
  const [loading, setLoading] = useState(() => getCachedPasses().length === 0);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [selectedPass, setSelectedPass] = useState<RegistrationPass | null>(
    null,
  );
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastSync, setLastSync] = useState<string | null>(() =>
    getLastPassSyncTime(),
  );

  // Network connection state listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchRegistrations = useCallback(async () => {
    const token = localStorage.getItem("eventdek_token");
    if (!token) {
      setLoading(false);
      return;
    }

    if (!navigator.onLine) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/events/my-dek`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data: RegistrationPass[] = await res.json();
        setRegistrations(data);
        savePassesToCache(data);
        setLastSync(new Date().toISOString());
      }
    } catch {
      // Network drop or timeout: keep current cache
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const filteredPasses = useMemo(() => {
    const now = Date.now();
    return registrations
      .filter((p) => {
        const eventDate = new Date(p.event_start_time).getTime();
        return tab === "upcoming" ? eventDate >= now : eventDate < now;
      })
      .sort((a, b) => {
        const tA = new Date(a.event_start_time).getTime();
        const tB = new Date(b.event_start_time).getTime();
        return tab === "upcoming" ? tA - tB : tB - tA;
      });
  }, [registrations, tab]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden px-4 py-8 sm:px-8">
      {/* Blueprint Grid Ambient Background */}
      <AmbientBackground />

      <AppHeader />
      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-6 pb-16 sm:px-6 sm:pt-8">
        {/* Offline Status Warning Bar */}
        {isOffline && (
          <aside
            aria-label="Offline Mode Notification"
            className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-500 backdrop-blur"
          >
            <div className="flex items-center gap-2 font-medium">
              <WifiOff className="size-4 shrink-0" />
              <span>
                Offline Mode: Presenting device-cached passes. Gate scanners can
                still scan your QR tokens.
              </span>
            </div>
            {lastSync && (
              <span className="hidden font-mono text-[11px] opacity-80 sm:inline">
                Synced{" "}
                {new Date(lastSync).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </aside>
        )}

        {/* Header with Stats & Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 label-caps text-going font-bold">
              <ShieldCheck className="size-3.5" /> Verified Passbook
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-1">
              My Passes Wallet
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Confirmed RSVPs and QR check-in badges stored offline for this
              device.
            </p>
          </div>

          <div className="inline-flex rounded-lg border border-border bg-surface-2 p-1 self-start sm:self-auto">
            {(["upcoming", "past"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  tab === t
                    ? "bg-going text-going-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t} (
                {
                  registrations.filter((p) => {
                    const time = new Date(p.event_start_time).getTime();
                    return t === "upcoming"
                      ? time >= Date.now()
                      : time < Date.now();
                  }).length
                }
                )
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-24 text-xs font-mono text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-going" /> Loading your
            passes...
          </div>
        )}

        {!loading && filteredPasses.length === 0 && (
          <div className="card-frame my-12 rounded-2xl border border-border bg-card/85 p-12 text-center shadow-xl backdrop-blur-sm">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-border bg-surface-2 text-going">
              <Ticket className="size-6" />
            </span>
            <h2 className="mt-4 text-lg font-bold">No {tab} passes found</h2>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {tab === "upcoming"
                ? "Swipe right on an event in the deck to claim an instant pass or purchase a ticket."
                : "Past events you attended will be archived here."}
            </p>
            {tab === "upcoming" && (
              <Link
                to="/"
                className="tactile mt-6 inline-flex items-center gap-2 rounded-xl bg-going px-5 py-2.5 text-xs font-bold text-going-foreground shadow-md"
              >
                Explore Deck
              </Link>
            )}
          </div>
        )}

        {/* Responsive Pass Grid */}
        {!loading && filteredPasses.length > 0 && (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {filteredPasses.map((pass) => {
              const passToken = pass.qr_code_token || pass.reference || pass.id;
              return (
                <li
                  key={pass.id}
                  className="card-frame flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card/90 shadow-md backdrop-blur-sm transition-all hover:border-border/90"
                >
                  <div className="grid gap-3.5 p-4 sm:grid-cols-[auto_minmax(0,1fr)] items-start">
                    {/* Clickable QR Badge */}
                    <div
                      onClick={() => setSelectedPass(pass)}
                      className="cursor-pointer group relative grid size-24 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 p-1.5"
                      title="Click to view full pass"
                    >
                      <QrBlock value={passToken} size={84} />
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold text-going flex items-center gap-1">
                          <QrCode className="size-3" /> Expand
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="label-caps font-bold text-going text-[10px] flex items-center gap-1 truncate">
                          <CalendarClock className="size-3 shrink-0" />
                          {relativeDay(pass.event_start_time)} ·{" "}
                          {fullDate(pass.event_start_time)}
                        </span>
                        <span className="rounded-full bg-going/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-going shrink-0">
                          {pass.registration_status || "Confirmed"}
                        </span>
                      </div>

                      <h2 className="truncate text-sm sm:text-base font-bold leading-snug">
                        {pass.event_title}
                      </h2>

                      <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                        <MapPin className="size-3 shrink-0 text-going" />
                        <span className="truncate">
                          {pass.event_venue_name}
                        </span>
                      </p>

                      <p className="font-mono text-[10px] text-muted-foreground pt-1">
                        Ref: {passToken.slice(0, 10)}
                      </p>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="grid grid-cols-2 divide-x divide-border border-t border-border bg-surface-2/40 text-xs">
                    <a
                      href={googleCalendarUrl(pass)}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center justify-center gap-1.5 py-2.5 font-semibold transition-colors ${
                        isOffline
                          ? "opacity-40 pointer-events-none text-muted-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                      }`}
                    >
                      <CalendarPlus className="size-3.5 text-going" /> Calendar
                    </a>

                    <button
                      type="button"
                      onClick={() => downloadIcs(pass)}
                      className="flex items-center justify-center gap-1.5 py-2.5 font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                    >
                      <Download className="size-3.5 text-going" /> .ics
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Fullscreen Expanded Pass Modal (Always Works Offline) */}
      {selectedPass && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPass(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="label-caps text-going">Digital Pass Token</span>
            <h3 className="font-display font-bold text-lg">
              {selectedPass.event_title}
            </h3>

            <div className="flex justify-center py-2">
              <QrBlock
                value={
                  selectedPass.qr_code_token ||
                  selectedPass.reference ||
                  selectedPass.id
                }
                size={160}
              />
            </div>

            <p className="font-mono text-xs font-bold text-muted-foreground">
              {selectedPass.qr_code_token ||
                selectedPass.reference ||
                selectedPass.id}
            </p>
            <p className="text-xs text-muted-foreground">
              Present this QR pass code at the gate scanner for admission.
            </p>

            <button
              type="button"
              onClick={() => setSelectedPass(null)}
              className="tactile w-full rounded-xl bg-going py-2.5 text-xs font-bold text-going-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
