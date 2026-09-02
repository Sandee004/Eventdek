import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  CalendarPlus,
  Download,
  ExternalLink,
  Loader2,
  MapPin,
  QrCode,
  Ticket,
} from "lucide-react";
import { API_BASE_URL } from "../lib/constants";
import { QrBlock } from "../components/QrBlock";

interface RegistrationPass {
  id: string;
  event_id: string;
  event_title: string;
  event_banner_url?: string | null;
  event_venue_name: string;
  event_address?: string | null;
  event_start_time: string;
  event_end_time: string;
  event_source_url?: string | null;
  category?: string;
  state_id?: string;
  qr_code_token?: string;
  reference?: string;
  registration_status?: string;
  created_at?: string;
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

// function clockTime(iso: string) {
//   return new Date(iso).toLocaleTimeString("en-US", {
//     hour: "numeric",
//     minute: "2-digit",
//   });
// }

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
}

export function MyDek() {
  const [registrations, setRegistrations] = useState<RegistrationPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [selectedPass, setSelectedPass] = useState<RegistrationPass | null>(
    null,
  );
  console.log(error);

  const fetchRegistrations = useCallback(async () => {
    const token = localStorage.getItem("eventdek_token");
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch live snapshot registrations from backend
      const res = await fetch(`${API_BASE_URL}/events/my-dek`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setRegistrations(data);
      } else {
        // Fallback: Read client-stored RSVP cache if backend route isn't ready
        const localRsvps = JSON.parse(
          localStorage.getItem("eventdek_rsvps") || "[]",
        );
        setRegistrations(localRsvps);
      }
    } catch {
      const localRsvps = JSON.parse(
        localStorage.getItem("eventdek_rsvps") || "[]",
      );
      setRegistrations(localRsvps);
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            My Dek
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Your confirmed access passes and ticket vouchers.
          </p>
        </div>

        {/* Tab Controls */}
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

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-20 text-xs font-mono text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-going" /> Loading your
          passes...
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredPasses.length === 0 && (
        <div className="card-frame my-12 rounded-2xl border border-border bg-card p-10 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-border bg-surface-2 text-going">
            <Ticket className="size-6" />
          </span>
          <h2 className="mt-4 text-lg font-bold">No {tab} passes found</h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {tab === "upcoming"
              ? "Swipe right on an event in the deck to claim a free pass or purchase a ticket."
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

      {/* Passes List */}
      {!loading && filteredPasses.length > 0 && (
        <ul className="mt-6 space-y-4">
          {filteredPasses.map((pass) => {
            const passToken = pass.qr_code_token || pass.reference || pass.id;
            return (
              <li
                key={pass.id}
                className="card-frame overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-border/80"
              >
                <div className="grid gap-4 p-5 sm:grid-cols-[auto_minmax(0,1fr)] items-start">
                  {/* QR Code Block */}
                  <div
                    onClick={() => setSelectedPass(pass)}
                    className="cursor-pointer group relative grid size-28 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 p-2"
                    title="Click to expand pass QR"
                  >
                    <QrBlock value={passToken} size={96} />
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-bold text-going flex items-center gap-1">
                        <QrCode className="size-3" /> View
                      </span>
                    </div>
                  </div>

                  {/* Pass Metadata */}
                  <div className="min-w-0 flex flex-col justify-between h-full space-y-2">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="label-caps font-bold text-going flex items-center gap-1">
                          <CalendarClock className="size-3" />
                          {relativeDay(pass.event_start_time)} ·{" "}
                          {fullDate(pass.event_start_time)}
                        </span>
                        <span className="rounded-full bg-going/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-going">
                          {pass.registration_status || "Confirmed"}
                        </span>
                      </div>

                      <h2 className="mt-1 truncate text-lg font-bold">
                        {pass.event_title}
                      </h2>

                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground truncate">
                        <MapPin className="size-3.5 shrink-0 text-going" />
                        <span className="truncate">
                          {pass.event_venue_name}
                        </span>
                        {pass.event_address && (
                          <span className="truncate">
                            ({pass.event_address})
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {pass.category && (
                        <span className="rounded border border-border bg-surface-2 px-2 py-0.5 text-[11px] font-semibold capitalize">
                          {pass.category}
                        </span>
                      )}
                      <span className="rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                        Ref: {passToken.slice(0, 10)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="grid grid-cols-2 divide-x divide-border border-t border-border bg-surface-2/40 sm:grid-cols-3">
                  <a
                    href={googleCalendarUrl(pass)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                  >
                    <CalendarPlus className="size-3.5 text-going" /> Calendar
                  </a>

                  <button
                    type="button"
                    onClick={() => downloadIcs(pass)}
                    className="flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                  >
                    <Download className="size-3.5 text-going" /> .ics File
                  </button>

                  {pass.event_source_url ? (
                    <a
                      href={pass.event_source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors border-t sm:border-t-0 border-border"
                    >
                      Event Link <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <div className="col-span-2 sm:col-span-1" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Expanded QR Modal */}
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
                size={180}
              />
            </div>

            <p className="font-mono text-xs font-bold text-muted-foreground">
              {selectedPass.qr_code_token ||
                selectedPass.reference ||
                selectedPass.id}
            </p>
            <p className="text-xs text-muted-foreground">
              Present this code at the venue gate for check-in.
            </p>

            <button
              type="button"
              onClick={() => setSelectedPass(null)}
              className="tactile w-full rounded-xl bg-going py-2.5 text-xs font-bold text-going-foreground"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
