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
import { QuestionsStep } from "./QuestionsStep";
import { QrBlock } from "./QrBlock";
import { downloadIcs, googleCalendarUrl } from "../../lib/calender";
import { clockTime, fullDate, naira, relativeDay } from "../../lib/format";
import { makeReference, useEventDek } from "../../lib/store";
import type { EventItem, Rsvp } from "../../lib/types";

type Step = "questions" | "tiers" | "payment" | "processing" | "done";

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
  { id: "applepay", name: "Apple Pay", note: "One tap", icon: Smartphone },
];

export function RsvpFlow({
  event,
  open,
  onClose,
  onCancelled,
}: {
  event: EventItem | null;
  open: boolean;
  onClose: () => void;
  /** Called when the user backs out before confirming, so the deck can rewind. */
  onCancelled: () => void;
}) {
  const { addRsvp, savedAnswers, saveAnswers, profile } = useEventDek();
  const paid = event?.pricing.kind === "paid";
  const questions = event?.questions ?? [];

  const firstStep: Step = useMemo(() => {
    const unanswered = questions.some((q) => q.required && !savedAnswers[q.id]);
    if (unanswered) return "questions";
    return paid ? "tiers" : "processing";
  }, [questions, savedAnswers, paid]);

  const [step, setStep] = useState<Step>(firstStep);
  const [answers, setAnswers] = useState<Record<string, string>>(savedAnswers);
  const [tierId, setTierId] = useState<string>("");
  const [method, setMethod] = useState("card");
  const [ticket, setTicket] = useState<Rsvp | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!open || !event) return;
    setStep(firstStep);
    setAnswers(savedAnswers);
    setTierId(
      event.pricing.kind === "paid" ? (event.pricing.tiers[0]?.id ?? "") : "",
    );
    setTicket(null);
    setConfirmed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event?.id]);

  const tier =
    event?.pricing.kind === "paid"
      ? event.pricing.tiers.find((t) => t.id === tierId)
      : undefined;
  const fee = tier ? Math.round(tier.price * 0.015) : 0;
  const total = tier ? tier.price + fee : 0;

  function commit(amount: number, methodId?: string) {
    if (!event) return;
    const rsvp: Rsvp = {
      eventId: event.id,
      createdAt: Date.now(),
      tierId: tier?.id,
      amount,
      method: methodId,
      answers,
      reference: makeReference(),
    };
    if (Object.keys(answers).length) saveAnswers(answers);
    addRsvp(rsvp);
    setTicket(rsvp);
    setConfirmed(true);
    setStep("done");
  }

  // Free events confirm instantly, no button press required.
  useEffect(() => {
    if (step !== "processing" || !event) return;
    const t = setTimeout(() => commit(0), paid ? 1400 : 550);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, event?.id]);

  function close() {
    if (!confirmed) onCancelled();
    onClose();
  }

  if (!event) return null;

  const missingRequired = questions.some(
    (q) => q.required && !answers[q.id]?.trim(),
  );

  const share = async () => {
    const text = `I'm going to ${event.title} — ${fullDate(event.start)} at ${event.venue}`;
    try {
      if (navigator.share) await navigator.share({ title: event.title, text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
      }
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const eyebrow =
    step === "done"
      ? "You're on the list"
      : paid
        ? "Secure checkout · Paystack"
        : "Instant RSVP";

  return (
    <DekSheet
      open={open}
      onClose={close}
      eyebrow={eyebrow}
      title={event.title}
      footer={
        step === "questions" ? (
          <button
            disabled={missingRequired}
            onClick={() => {
              saveAnswers(answers);
              setStep(paid ? "tiers" : "processing");
            }}
            className="tactile flex w-full items-center justify-center gap-2 rounded-md bg-going py-3 text-sm font-bold text-going-foreground disabled:opacity-40"
          >
            Continue <ArrowRight className="size-4" />
          </button>
        ) : step === "tiers" ? (
          <button
            onClick={() => setStep("payment")}
            className="tactile flex w-full items-center justify-between gap-2 rounded-md bg-going px-4 py-3 text-sm font-bold text-going-foreground"
          >
            <span>Pay {naira(total)}</span>
            <ArrowRight className="size-4" />
          </button>
        ) : step === "payment" ? (
          <button
            onClick={() => {
              setStep("processing");
              setTimeout(() => commit(total, method), 0);
            }}
            className="tactile w-full rounded-md bg-going py-3 text-sm font-bold text-going-foreground"
          >
            Confirm payment · {naira(total)}
          </button>
        ) : step === "done" ? (
          <button
            onClick={close}
            className="tactile w-full rounded-md border border-border bg-surface-2 py-3 text-sm font-bold hover:bg-accent"
          >
            Back to the deck
          </button>
        ) : null
      }
    >
      {step === "questions" && (
        <QuestionsStep
          questions={questions}
          answers={answers}
          organizer={event.host.name}
          onChange={(id, value) => setAnswers((a) => ({ ...a, [id]: value }))}
        />
      )}

      {step === "tiers" && event.pricing.kind === "paid" && (
        <div className="space-y-4">
          <div className="space-y-2">
            {event.pricing.tiers.map((t) => {
              const active = t.id === tierId;
              return (
                <button
                  key={t.id}
                  onClick={() => setTierId(t.id)}
                  className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border p-3 text-left ${
                    active
                      ? "border-going bg-going/10"
                      : "border-border bg-surface hover:bg-accent"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{t.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {t.note}
                      {t.seatsLeft ? ` · ${t.seatsLeft} left` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold tabular-nums">
                    {naira(t.price)}
                  </span>
                </button>
              );
            })}
          </div>
          <dl className="rounded-md border border-border bg-surface-2 p-3 text-sm">
            <div className="flex justify-between py-1">
              <dt className="text-muted-foreground">Ticket</dt>
              <dd className="tabular-nums">{naira(tier?.price ?? 0)}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-muted-foreground">Processing (1.5%)</dt>
              <dd className="tabular-nums">{naira(fee)}</dd>
            </div>
            <div className="mt-1 flex justify-between border-t border-border pt-2 font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{naira(total)}</dd>
            </div>
          </dl>
        </div>
      )}

      {step === "payment" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Paying {naira(total)} as {profile?.email ?? "guest@eventdek.ng"}
          </p>
          <div className="grid gap-2">
            {PAYMENT_METHODS.map((m) => {
              const active = m.id === method;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex items-center gap-3 rounded-md border p-3 text-left ${
                    active
                      ? "border-going bg-going/10"
                      : "border-border bg-surface hover:bg-accent"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
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

      {step === "processing" && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Loader2 className="size-7 animate-spin text-going" />
          <p className="text-sm font-semibold">
            {paid ? "Confirming payment…" : "Registering you…"}
          </p>
          <p className="text-sm text-muted-foreground">
            Using your saved EventDek profile. Nothing else to fill in.
          </p>
        </div>
      )}

      {step === "done" && ticket && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-md border border-going/40 bg-going/10 p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-going text-going-foreground">
              <Check className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold">
                {paid ? "Payment confirmed" : "RSVP confirmed"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Ref {ticket.reference} · {relativeDay(event.start)},{" "}
                {clockTime(event.start)}
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
                {event.venue}
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
              onClick={() => downloadIcs(event)}
              className="tactile flex items-center justify-center gap-2 rounded-md border border-border bg-surface py-2.5 text-sm font-semibold hover:bg-accent"
            >
              <Download className="size-4" /> Apple / Outlook .ics
            </button>
            <button
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
