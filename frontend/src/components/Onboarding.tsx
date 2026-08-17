import { useState } from "react";
import { ArrowRight, Layers } from "lucide-react";
import { motion } from "motion/react";
import { NG_STATES } from "../../lib/data";
import { useEventDek } from "../../lib/store";
import type { StateId } from "../../lib/types";

export function Onboarding() {
  const { setProfile } = useEventDek();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    stateId: "lagos" as StateId,
    role: "",
    handle: "",
    calendarSync: true,
  });

  const ready =
    form.name.trim().length > 1 &&
    /.+@.+\..+/.test(form.email) &&
    form.phone.trim().length >= 10;

  const field =
    "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-ring";

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-frame rounded-xl p-5"
      >
        <span className="grid size-10 place-items-center rounded-md bg-foreground text-background">
          <Layers className="size-5" />
        </span>
        <h1 className="mt-4 text-2xl font-bold">
          Set up once. Never fill a form again.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          EventDek uses this to register you the moment you swipe right — free
          events are instant, paid ones skip straight to payment.
        </p>

        <form
          className="mt-5 space-y-3.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (ready) setProfile(form);
          }}
        >
          <label className="block">
            <span className="label-caps text-muted-foreground">
              Full name *
            </span>
            <input
              className={field}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Chidera Okonkwo"
            />
          </label>
          <label className="block">
            <span className="label-caps text-muted-foreground">Email *</span>
            <input
              className={field}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@domain.com"
            />
          </label>
          <label className="block">
            <span className="label-caps text-muted-foreground">
              Phone (SMS / WhatsApp) *
            </span>
            <input
              className={field}
              inputMode="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+234 801 234 5678"
            />
          </label>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <label className="block">
              <span className="label-caps text-muted-foreground">
                Primary state
              </span>
              <select
                className={field}
                value={form.stateId}
                onChange={(e) =>
                  setForm({ ...form, stateId: e.target.value as StateId })
                }
              >
                {NG_STATES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label-caps text-muted-foreground">Role</span>
              <input
                className={field}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Backend engineer"
              />
            </label>
          </div>
          <label className="block">
            <span className="label-caps text-muted-foreground">
              X / GitHub handle
            </span>
            <input
              className={field}
              value={form.handle}
              onChange={(e) => setForm({ ...form, handle: e.target.value })}
              placeholder="@yourhandle"
            />
          </label>

          <button
            type="button"
            onClick={() =>
              setForm({ ...form, calendarSync: !form.calendarSync })
            }
            className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-border bg-surface-2 p-3 text-left"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold">
                Auto-add RSVPs to my calendar
              </span>
              <span className="block text-xs text-muted-foreground">
                We'll offer Google and .ics links on every confirmation.
              </span>
            </span>
            <span
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                form.calendarSync ? "bg-going" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-background transition-all ${
                  form.calendarSync ? "left-[1.4rem]" : "left-0.5"
                }`}
              />
            </span>
          </button>

          <button
            type="submit"
            disabled={!ready}
            className="tactile flex w-full items-center justify-center gap-2 rounded-md bg-going py-3 text-sm font-bold text-going-foreground disabled:opacity-40"
          >
            Enter the deck <ArrowRight className="size-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
