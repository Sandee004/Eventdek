import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  Sparkles,
  Ticket,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { API_BASE_URL, NG_STATES } from "../lib/constants";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    state_id: "lagos",
    role: "",
    handle: "",
    calendar_sync: false,
  });

  const fieldStyle =
    "mt-1.5 w-full rounded-lg border border-input bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground transition-all focus:border-ring focus:ring-1 focus:ring-ring";

  // Step 1 Validation & Error Feedback
  const handleNextStep = () => {
    const nameParts = form.name.trim().split(/\s+/).filter(Boolean);

    if (nameParts.length < 2 || !nameParts.every((part) => part.length >= 2)) {
      setError(
        "Please enter both your first and last name (at least 2 characters each).",
      );
      return;
    }
    if (!/.+@.+\..+/.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (form.phone.trim().length !== 11) {
      setError(
        "Please enter a valid 11-digit phone number (e.g. 08012345678).",
      );
      return;
    }

    setError(null);
    setStep(2);
  };

  // Step 2 Submission & Validation
  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!form.state_id.trim()) {
      setError("Please select your primary state.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim(),
          state_id: form.state_id,
          role: form.role.trim() || null,
          handle: form.handle.trim() || null,
          calendar_sync: form.calendar_sync,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to create account.");
      }

      localStorage.setItem("eventdek_token", data.access_token);
      localStorage.setItem("eventdek_user", JSON.stringify(data.user));

      navigate("/homepage");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center overflow-hidden px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, color-mix(in oklab, var(--color-foreground) 10%, transparent) 1px, transparent 1px),
            linear-gradient(to bottom, color-mix(in oklab, var(--color-foreground) 10%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse 65% 55% at 50% 50%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 65% 55% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-going/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 size-96 rounded-full bg-pass/5 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card-frame relative w-full max-w-lg rounded-2xl p-6 sm:p-8 bg-card/95 backdrop-blur-sm border border-border shadow-2xl"
      >
        <div className="absolute top-3 right-3 flex gap-1">
          <span className="size-1.5 rounded-full bg-going/60" />
          <span className="size-1.5 rounded-full bg-border" />
          <span className="size-1.5 rounded-full bg-border" />
        </div>

        <div className="mb-6 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="label-caps text-muted-foreground font-semibold">
              Step {step} of 2 —{" "}
              {step === 1 ? "Your Profile" : "Event Preferences"}
            </span>
            <span className="numeric font-bold text-going text-xs">
              {step === 1 ? "50%" : "100%"}
            </span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <motion.div
              className="h-full bg-going rounded-full"
              initial={{ width: "50%" }}
              animate={{ width: step === 1 ? "50%" : "100%" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3.5 pb-2">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 border border-border text-going">
            {step === 1 ? (
              <Ticket className="size-5" />
            ) : (
              <Sparkles className="size-5" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {step === 1
                ? "Set up your event details"
                : "Choose your location"}
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {step === 1
                ? "Enter your details once. We'll automatically use them to register you for events."
                : "Select where you are to find upcoming meetups, hangouts, and events near you."}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs font-medium text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleComplete} className="mt-6">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 14 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <label className="block">
                  <div className="flex items-center justify-between">
                    <span className="label-caps text-muted-foreground">
                      Full Name *
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      First & last name
                    </span>
                  </div>
                  <input
                    type="text"
                    className={fieldStyle}
                    value={form.name}
                    onChange={(e) => {
                      setError(null);
                      setForm({ ...form, name: e.target.value });
                    }}
                    placeholder="e.g. Chidera Okonkwo"
                  />
                </label>

                <label className="block">
                  <span className="label-caps text-muted-foreground">
                    Email Address *
                  </span>
                  <input
                    type="email"
                    className={fieldStyle}
                    value={form.email}
                    onChange={(e) => {
                      setError(null);
                      setForm({ ...form, email: e.target.value });
                    }}
                    placeholder="you@domain.com"
                  />
                </label>

                <label className="block">
                  <div className="flex items-center justify-between">
                    <span className="label-caps text-muted-foreground">
                      Create Password *
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Min 8 chars
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`${fieldStyle} pr-10`}
                      value={form.password}
                      onChange={(e) => {
                        setError(null);
                        setForm({ ...form, password: e.target.value });
                      }}
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="tactile absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </label>

                <label className="block">
                  <span className="label-caps text-muted-foreground">
                    Phone *
                  </span>
                  <input
                    type="tel"
                    inputMode="tel"
                    className={fieldStyle}
                    value={form.phone}
                    onChange={(e) => {
                      setError(null);
                      setForm({ ...form, phone: e.target.value });
                    }}
                    placeholder="08012345678"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="tactile mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-going py-3 text-sm font-bold text-going-foreground shadow-lg hover:opacity-90 active:scale-[0.99] transition-all"
                >
                  Continue <ArrowRight className="size-4" />
                </button>

                <div className="mt-4 text-center text-xs text-muted-foreground pt-2 border-t border-border">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="font-bold text-going hover:underline"
                  >
                    Sign In
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <label className="block">
                  <span className="label-caps text-muted-foreground flex items-center gap-1">
                    <MapPin className="size-3 text-going" /> Primary State *
                  </span>
                  <select
                    className={`${fieldStyle} h-10`}
                    value={form.state_id}
                    onChange={(e) => {
                      setError(null);
                      setForm({ ...form, state_id: e.target.value });
                    }}
                  >
                    {NG_STATES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <label className="block">
                    <span className="label-caps text-muted-foreground">
                      Role or Profession
                    </span>
                    <input
                      type="text"
                      className={fieldStyle}
                      value={form.role}
                      onChange={(e) =>
                        setForm({ ...form, role: e.target.value })
                      }
                      placeholder="e.g. Software Dev, Designer"
                    />
                  </label>

                  <label className="block">
                    <span className="label-caps text-muted-foreground">
                      X (Twitter) or GitHub
                    </span>
                    <input
                      type="text"
                      className={fieldStyle}
                      value={form.handle}
                      onChange={(e) =>
                        setForm({ ...form, handle: e.target.value })
                      }
                      placeholder="@yourhandle"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, calendar_sync: !form.calendar_sync })
                  }
                  className="mt-2 grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface-2/60 p-3.5 text-left transition-colors hover:border-border/90"
                >
                  <span className="flex items-start gap-3 min-w-0">
                    <CalendarCheck2 className="size-5 shrink-0 text-going mt-0.5" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        Add registered events to calendar
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5 leading-normal">
                        Events you register for will be added to your calendar
                        so you won't miss it.
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

                <div className="mt-6 flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep(1);
                    }}
                    className="tactile flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm font-semibold text-foreground hover:bg-surface"
                  >
                    <ArrowLeft className="size-4" /> Back
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="tactile flex flex-1 items-center justify-center gap-2 rounded-xl bg-going py-3 text-sm font-bold text-going-foreground shadow-lg hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Setting
                        up...
                      </>
                    ) : (
                      <>
                        Explore Events <CheckCircle2 className="size-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  );
}
