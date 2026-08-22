import { useState } from "react";
import { ArrowRight, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEventDek } from "../../lib/store";
import { loginApi } from "../../lib/api";

interface LoginProps {
  onSwitchToRegister?: () => void;
}

export function Login({ onSwitchToRegister }: LoginProps) {
  const { login } = useEventDek();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = /.+.@.+\..+/.test(email) && password.length >= 6;

  const fieldStyle =
    "mt-1.5 w-full rounded-lg border border-input bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground transition-all focus:border-ring focus:ring-1 focus:ring-ring";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await loginApi({ email, password });
      login(
        {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          phone: res.user.phone,
          stateId: res.user.stateId,
          cityArea: res.user.cityArea || "",
          role: res.user.role || "",
          handle: res.user.handle || "",
          calendarSync: res.user.calendarSync,
        },
        res.access_token,
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred during login.");
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
        className="card-frame relative w-full max-w-md rounded-2xl p-6 sm:p-8 bg-card/95 backdrop-blur-sm border border-border shadow-2xl"
      >
        <div className="flex items-center gap-3.5 pb-2">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 border border-border text-going">
            <KeyRound className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Welcome Back</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sign in to access your event passes and custom dek.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="label-caps text-muted-foreground">
              Email Address *
            </span>
            <input
              type="email"
              required
              className={fieldStyle}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
            />
          </label>

          <label className="block">
            <div className="flex items-center justify-between">
              <span className="label-caps text-muted-foreground">
                Password *
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className={`${fieldStyle} pr-10`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((prev) => !prev)}
                className="tactile absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={!isValid || loading}
            className="tactile mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-going py-3 text-sm font-bold text-going-foreground shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Signing In...
              </>
            ) : (
              <>
                Sign In <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        {onSwitchToRegister && (
          <div className="mt-6 text-center text-xs text-muted-foreground border-t border-border pt-4">
            Don't have an event pass yet?{" "}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-bold text-going hover:underline"
            >
              Sign Up / Claim Pass
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
