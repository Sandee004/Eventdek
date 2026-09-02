import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CalendarPlus,
  Check,
  CreditCard,
  Download,
  Loader2,
  Share2,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { DekSheet } from "./Sheet";
import { QrBlock } from "./QrBlock";
import { API_BASE_URL } from "../lib/constants";

export interface ExtraQuestion {
  id: string;
  label: string;
  placeholder?: string;
  type?: string;
  options?: string[];
  required?: boolean;
}

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
  custom_fields_schema?: ExtraQuestion[];
}

interface RsvpRecord {
  eventId: string;
  createdAt: number;
  amount: number;
  answers: Record<string, string>;
  reference: string;
}

function makeReference() {
  return "DEK-" + Math.random().toString(36).slice(2, 8).toUpperCase();
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

function naira(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

function googleCalendarUrl(e: EventItem) {
  const start = new Date(e.start_time)
    .toISOString()
    .replace(/-|:|\.\d\d\d/g, "");
  const end = new Date(e.end_time || +new Date(e.start_time) + 3 * 3600 * 1000)
    .toISOString()
    .replace(/-|:|\.\d\d\d/g, "");
  const details = encodeURIComponent(
    `${e.description}\n\nVenue: ${e.venue_name}`,
  );
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    e.title,
  )}&dates=${start}/${end}&details=${details}&location=${encodeURIComponent(
    e.venue_name,
  )}`;
}

function downloadIcs(e: EventItem) {
  const start = new Date(e.start_time)
    .toISOString()
    .replace(/-|:|\.\d\d\d/g, "");
  const end = new Date(e.end_time || +new Date(e.start_time) + 3 * 3600 * 1000)
    .toISOString()
    .replace(/-|:|\.\d\d\d/g, "");
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${e.title}`,
    `DESCRIPTION:${e.description}`,
    `LOCATION:${e.venue_name}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${e.id}.ics`;
  a.click();
}

type Step = "questions" | "payment" | "processing" | "done";

const PAYMENT_METHODS = [
  {
    id: "card",
    name: "Card",
    note: "Visa, Mastercard, Verve",
    icon: CreditCard,
  },
  {
    id: "transfer",
    name: "Bank Transfer",
    note: "One-time account number",
    icon: Building2,
  },
  { id: "ussd", name: "USSD", note: "*737# and friends", icon: Smartphone },
];

export default function RsvpFlow({
  event,
  open,
  onClose,
  onSuccess,
}: {
  event: EventItem | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: (eventId: string) => void;
}) {
  const storedUser = localStorage.getItem("eventdek_user");
  const profile = storedUser ? JSON.parse(storedUser) : null;
  const token = localStorage.getItem("eventdek_token");

  const questions: ExtraQuestion[] = useMemo(
    () => event?.custom_fields_schema ?? [],
    [event?.custom_fields_schema],
  );

  const isPaid = event ? !event.is_free : false;

  const firstStep: Step = useMemo(() => {
    if (questions.length > 0) return "questions";
    if (isPaid) return "payment";
    return "processing";
  }, [questions.length, isPaid]);

  const [step, setStep] = useState<Step>(firstStep);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [method, setMethod] = useState("card");
  const [ticket, setTicket] = useState<RsvpRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !event) return;
    setStep(firstStep);
    setAnswers({});
    setTicket(null);
    setIsSubmitting(false);
  }, [open, event?.id, firstStep]);

  const fee = isPaid ? Math.round(Number(event?.price_ngn || 0) * 0.015) : 0;
  const total = isPaid ? Number(event?.price_ngn || 0) + fee : 0;

  // Complete RSVP and hit backend
  const commitRegistration = async () => {
    if (!event || !token) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/events/swipe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_id: event.id,
          direction: "right",
          custom_answers: answers,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Registration failed.");
      }

      const rsvp: RsvpRecord = {
        eventId: event.id,
        createdAt: Date.now(),
        amount: total,
        answers,
        reference: makeReference(),
      };

      // Save to local device tickets
      const existingRsvps = JSON.parse(
        localStorage.getItem("eventdek_rsvps") || "[]",
      );
      localStorage.setItem(
        "eventdek_rsvps",
        JSON.stringify([rsvp, ...existingRsvps]),
      );

      setTicket(rsvp);
      setStep("done");
      if (onSuccess) onSuccess(event.id);
    } catch (err: any) {
      toast.error(err.message || "Failed to complete RSVP.");
      setStep(questions.length ? "questions" : "payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-confirm free events with no questions
  useEffect(() => {
    if (step === "processing" && event && !isSubmitting && !ticket) {
      const timer = setTimeout(() => {
        commitRegistration();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step, event?.id]);

  if (!event) return null;

  const missingRequired = questions.some(
    (q) => q.required && !answers[q.id]?.trim(),
  );

  const share = async () => {
    const text = `I'm going to ${event.title} — ${fullDate(event.start_time)} at ${event.venue_name}`;
    try {
      if (navigator.share) await navigator.share({ title: event.title, text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
      }
    } catch {
      // dismissed
    }
  };

  const eyebrow =
    step === "done"
      ? "You're on the list"
      : isPaid
        ? "Secure checkout · Paystack"
        : questions.length > 0
          ? "Organizer Questions"
          : "Instant RSVP";

  return (
    <DekSheet
      open={open}
      onClose={onClose}
      eyebrow={eyebrow}
      title={event.title}
      footer={
        step === "questions" ? (
          <button
            disabled={missingRequired}
            onClick={() => {
              if (isPaid) {
                setStep("payment");
              } else {
                setStep("processing");
                commitRegistration();
              }
            }}
            className="tactile flex w-full items-center justify-center gap-2 rounded-md bg-going py-3 text-sm font-bold text-going-foreground disabled:opacity-40"
          >
            Continue {isPaid ? `to Payment (${naira(total)})` : ""}{" "}
            <ArrowRight className="size-4" />
          </button>
        ) : step === "payment" ? (
          <button
            disabled={isSubmitting}
            onClick={() => {
              setStep("processing");
              commitRegistration();
            }}
            className="tactile w-full rounded-md bg-going py-3 text-sm font-bold text-going-foreground"
          >
            Confirm payment · {naira(total)}
          </button>
        ) : step === "done" ? (
          <button
            onClick={onClose}
            className="tactile w-full rounded-md border border-border bg-surface-2 py-3 text-sm font-bold hover:bg-accent"
          >
            Back to the deck
          </button>
        ) : null
      }
    >
      {/* 1. Custom Questions Form */}
      {step === "questions" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            The organizer needs a few quick details for your pass:
          </p>
          <div className="space-y-3">
            {questions.map((q) => (
              <label key={q.id} className="block">
                <span className="label-caps text-muted-foreground text-xs">
                  {q.label} {q.required && "*"}
                </span>
                {q.type === "select" && q.options ? (
                  <select
                    className="mt-1.5 w-full rounded-lg border border-input bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none"
                    value={answers[q.id] || ""}
                    onChange={(e) =>
                      setAnswers({ ...answers, [q.id]: e.target.value })
                    }
                  >
                    <option value="">Select an option</option>
                    {q.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="mt-1.5 w-full rounded-lg border border-input bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    placeholder={q.placeholder || "Your answer"}
                    value={answers[q.id] || ""}
                    onChange={(e) =>
                      setAnswers({ ...answers, [q.id]: e.target.value })
                    }
                  />
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 2. Payment Method */}
      {step === "payment" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Paying {naira(total)} as {profile?.email || "attendee"}
          </p>
          <div className="grid gap-2">
            {PAYMENT_METHODS.map((m) => {
              const active = m.id === method;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`flex items-center gap-3 rounded-md border p-3 text-left ${
                    active
                      ? "border-going bg-going/10"
                      : "border-border bg-surface hover:bg-accent"
                  }`}
                >
                  <Icon className="size-4 shrink-0 text-going" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {m.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {m.note}
                    </span>
                  </span>
                  {active && (
                    <Check className="ml-auto size-4 shrink-0 text-going" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Processing State */}
      {step === "processing" && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Loader2 className="size-7 animate-spin text-going" />
          <p className="text-sm font-semibold">
            {isPaid ? "Confirming payment…" : "Registering you…"}
          </p>
          <p className="text-sm text-muted-foreground">
            Using your EventDek profile.
          </p>
        </div>
      )}

      {/* 4. Ticket Confirmation State */}
      {step === "done" && ticket && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-md border border-going/40 bg-going/10 p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-going text-going-foreground">
              <Check className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold">
                {isPaid ? "Payment confirmed" : "RSVP confirmed"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Ref {ticket.reference} · {relativeDay(event.start_time)},{" "}
                {clockTime(event.start_time)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-md border border-border bg-surface-2 p-3">
            <QrBlock value={ticket.reference} size={104} />
            <div className="min-w-0 text-sm">
              <p className="label-caps text-muted-foreground">Check-in code</p>
              <p className="mt-1 font-bold tracking-wider">
                {ticket.reference}
              </p>
              <p className="mt-1 truncate text-muted-foreground">
                {event.venue_name}
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <a
              href={googleCalendarUrl(event)}
              target="_blank"
              rel="noreferrer"
              className="tactile flex items-center justify-center gap-2 rounded-md border border-border bg-surface py-2.5 text-sm font-semibold hover:bg-accent"
            >
              <CalendarPlus className="size-4" /> Google Calendar
            </a>
            <button
              type="button"
              onClick={() => downloadIcs(event)}
              className="tactile flex items-center justify-center gap-2 rounded-md border border-border bg-surface py-2.5 text-sm font-semibold hover:bg-accent"
            >
              <Download className="size-4" /> Apple / Outlook .ics
            </button>
            <button
              type="button"
              onClick={share}
              className="tactile flex items-center justify-center gap-2 rounded-md border border-border bg-surface py-2.5 text-sm font-semibold hover:bg-accent sm:col-span-2"
            >
              <Share2 className="size-4" /> Share with your people
            </button>
          </div>
        </div>
      )}
    </DekSheet>
  );
}
