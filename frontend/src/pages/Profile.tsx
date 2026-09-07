import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck2,
  CheckCircle2,
  PlusCircle,
  Save,
  ShieldCheck,
  Sparkles,
  Ticket,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { NG_STATES } from "../lib/constants";
import { AmbientBackground } from "../components/AmbientBg";
import { AppHeader } from "../components/AppHeader";

export default function Profile() {
  // Read current session directly
  const storedUser = localStorage.getItem("eventdek_user");
  const initialUser = storedUser
    ? JSON.parse(storedUser)
    : {
        id: "",
        name: "Attendee",
        email: "user@eventdek.ng",
        phone: "08012345678",
        state_id: "lagos",
        city_area: "Yaba / VI",
        role: "Software Engineer",
        handle: "@attendee",
        calendar_sync: true,
      };

  const storedRsvps = JSON.parse(
    localStorage.getItem("eventdek_rsvps") || "[]",
  );

  const [form, setForm] = useState(initialUser);
  const [isSaving, setIsSaving] = useState(false);
  const [joinedWaitlist, setJoinedWaitlist] = useState(false);

  const fieldStyle =
    "mt-1.5 w-full rounded-lg border border-input bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground transition-all focus:border-ring focus:ring-1 focus:ring-ring";

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      localStorage.setItem("eventdek_user", JSON.stringify(form));
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to save profile changes.");
    } finally {
      setTimeout(() => setIsSaving(false), 400);
    }
  };

  const handleJoinOrganizerWaitlist = () => {
    setJoinedWaitlist(true);
    toast.success("You're on the Host Studio early access waitlist!");
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* 1. Canvas Layer */}
      <AmbientBackground />

      {/* 2. Floating Header Dock */}
      <AppHeader />

      {/* 3. Main Profile Content Area */}
      <main className="relative z-10 mx-auto max-w-5xl px-4 pt-6 pb-16 sm:px-6 sm:pt-8 space-y-6">
        {/* Header Banner & Identity Card */}
        <div className="card-frame overflow-hidden rounded-2xl border border-border bg-card/90 shadow-xl backdrop-blur-sm">
          {/* Subtle Decorative Gradient Top Strip */}
          <div className="h-20 sm:h-24 w-full bg-gradient-to-r from-going/20 via-surface-2 to-going/10 border-b border-border relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#CEFF1A_1px,transparent_1px)] [background-size:16px_16px]" />
          </div>

          {/* Profile Details Header */}
          <div className="px-5 pb-5 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 sm:-mt-12">
            <div className="flex items-end gap-3.5">
              <div className="grid size-18 sm:size-20 place-items-center rounded-2xl border-2 border-border bg-surface-2 text-2xl font-bold font-display shadow-xl text-going shrink-0">
                {form.name?.slice(0, 1).toUpperCase() || "U"}
              </div>
              <div className="mb-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-lg sm:text-xl font-bold truncate">
                    {form.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-going/15 px-2 py-0.5 text-[10px] font-bold text-going uppercase font-mono">
                    <ShieldCheck className="size-3" /> Active Pass
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {form.email} · {form.role || "Attendee"}
                </p>
              </div>
            </div>

            {/* Quick Metrics Badge */}
            <div className="flex items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
              <Link
                to="/my-dek"
                className="tactile flex items-center gap-2.5 rounded-xl border border-border bg-surface-2/60 px-3.5 py-2 hover:bg-surface-2 transition-colors"
              >
                <Ticket className="size-4 text-going" />
                <div className="text-left">
                  <p className="text-[9px] uppercase font-mono text-muted-foreground leading-none">
                    Claimed Passes
                  </p>
                  <p className="text-sm font-bold leading-tight">
                    {storedRsvps.length}
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Two-Column Responsive Layout */}
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left Column: Editable Identity Details (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="card-frame rounded-2xl border border-border bg-card/90 p-5 sm:p-6 shadow-md backdrop-blur-sm space-y-5">
              <div>
                <span className="label-caps text-going flex items-center gap-1">
                  <User className="size-3" /> Attendee Credentials
                </span>
                <h2 className="font-display text-base sm:text-lg font-bold mt-0.5">
                  1-Swipe Registration Profile
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  These details auto-populate whenever you swipe right on a free
                  event or claim a pass.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <label className="block">
                    <span className="label-caps text-muted-foreground">
                      Full Name
                    </span>
                    <input
                      type="text"
                      className={fieldStyle}
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </label>

                  <label className="block">
                    <span className="label-caps text-muted-foreground">
                      Email Address
                    </span>
                    <input
                      type="email"
                      className={fieldStyle}
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                  </label>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <label className="block">
                    <span className="label-caps text-muted-foreground">
                      Phone (SMS / WhatsApp)
                    </span>
                    <input
                      type="tel"
                      className={fieldStyle}
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                    />
                  </label>

                  <label className="block">
                    <span className="label-caps text-muted-foreground">
                      Primary State
                    </span>
                    <select
                      className={fieldStyle}
                      value={form.state_id}
                      onChange={(e) =>
                        setForm({ ...form, state_id: e.target.value })
                      }
                    >
                      {NG_STATES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <label className="block">
                    <span className="label-caps text-muted-foreground">
                      City / Area
                    </span>
                    <input
                      type="text"
                      className={fieldStyle}
                      value={form.city_area || ""}
                      onChange={(e) =>
                        setForm({ ...form, city_area: e.target.value })
                      }
                      placeholder="e.g. Yaba, Ikeja"
                    />
                  </label>

                  <label className="block">
                    <span className="label-caps text-muted-foreground">
                      Role / Domain
                    </span>
                    <input
                      type="text"
                      className={fieldStyle}
                      value={form.role || ""}
                      onChange={(e) =>
                        setForm({ ...form, role: e.target.value })
                      }
                      placeholder="e.g. Designer, Founder"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="label-caps text-muted-foreground">
                    X (Twitter) or GitHub Handle
                  </span>
                  <input
                    type="text"
                    className={fieldStyle}
                    value={form.handle || ""}
                    onChange={(e) =>
                      setForm({ ...form, handle: e.target.value })
                    }
                    placeholder="@yourhandle"
                  />
                </label>

                {/* Calendar Sync Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, calendar_sync: !form.calendar_sync })
                  }
                  className="mt-1 grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface-2/50 p-3 text-left transition-colors hover:border-border/90"
                >
                  <span className="flex items-start gap-2.5 min-w-0">
                    <CalendarCheck2 className="size-4.5 shrink-0 text-going mt-0.5" />
                    <span className="min-w-0">
                      <span className="block text-xs sm:text-sm font-semibold">
                        Auto-generate calendar sync on swipe
                      </span>
                      <span className="block text-[11px] text-muted-foreground mt-0.5 leading-normal">
                        Prepares Google Calendar and .ics downloads on every
                        right swipe.
                      </span>
                    </span>
                  </span>

                  <span
                    className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
                      form.calendar_sync
                        ? "bg-going border-going"
                        : "bg-surface-2 border-muted-foreground/40"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 size-4.5 rounded-full transition-all shadow-sm ${
                        form.calendar_sync
                          ? "left-[1.35rem] bg-going-foreground"
                          : "left-0.5 bg-muted-foreground"
                      }`}
                    />
                  </span>
                </button>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="tactile flex items-center gap-2 rounded-xl bg-going px-5 py-2.5 text-xs font-bold text-going-foreground shadow-lg hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    <Save className="size-3.5" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Host Studio & Device Security (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Host Studio Preview Card */}
            <div className="card-frame relative overflow-hidden rounded-2xl border-2 border-going/40 bg-gradient-to-b from-going/10 via-card/90 to-card p-5 sm:p-6 shadow-xl backdrop-blur-sm">
              <div className="absolute top-3.5 right-3.5">
                <span className="rounded-full bg-going px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-going-foreground font-mono">
                  Coming Soon
                </span>
              </div>

              <div className="size-10 rounded-xl bg-going/20 border border-going/40 grid place-items-center text-going mb-3.5">
                <PlusCircle className="size-5" />
              </div>

              <h3 className="font-display text-lg font-bold tracking-tight">
                EventDek Host Studio
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Host meetups, conferences, or parties? You'll soon be able to
                publish your events directly to the EventDek deck across
                Nigeria.
              </p>

              <ul className="mt-4 space-y-2 text-xs font-medium">
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="size-3.5 text-going shrink-0" />
                  <span>Reach attendees across 36 states</span>
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="size-3.5 text-going shrink-0" />
                  <span>Free & Paid tickets via Paystack checkout</span>
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="size-3.5 text-going shrink-0" />
                  <span>In-app camera QR check-in scanner</span>
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="size-3.5 text-going shrink-0" />
                  <span>Swipe CTR analytics & attendee exports</span>
                </li>
              </ul>

              <div className="mt-5 pt-3.5 border-t border-border/80">
                {joinedWaitlist ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-going bg-going/10 border border-going/30 rounded-xl p-2.5">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>You're on the early access host queue!</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleJoinOrganizerWaitlist}
                    className="tactile w-full flex items-center justify-center gap-2 rounded-xl border border-going bg-going/15 py-2.5 text-xs font-bold text-going hover:bg-going hover:text-going-foreground transition-all shadow-md"
                  >
                    <Sparkles className="size-3.5" /> Request Early Host Access
                  </button>
                )}
              </div>
            </div>

            {/* Session & Sign Out Card */}
            <div className="card-frame rounded-2xl border border-border bg-card/90 p-4 sm:p-5 shadow-sm text-xs space-y-2.5">
              <span className="label-caps text-muted-foreground font-semibold">
                Device Session & Security
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Your device holds an active auth session token. Claimed passes
                stay linked to this profile.
              </p>
              <div className="pt-1 flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">
                  Build: v1.0-mvp
                </span>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("eventdek_token");
                    localStorage.removeItem("eventdek_user");
                    window.location.href = "/login";
                  }}
                  className="font-bold text-pass hover:underline"
                >
                  Log Out Device
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
