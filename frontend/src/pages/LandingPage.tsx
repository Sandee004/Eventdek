import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Layers,
  Radio,
  QrCode,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AmbientBackground } from "../components/AmbientBg";

export default function LandingPage() {
  const navigate = useNavigate();
  const [mockSwipeDirection, setMockSwipeDirection] = useState<
    "left" | "right" | null
  >(null);

  return (
    <div>
      <AmbientBackground />
      <div className="min-h-screen text-foreground selection:bg-going selection:text-going-foreground">
        <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-surface-2 border border-border text-going">
                <Layers className="size-5" />
              </span>
              <span className="font-display text-xl font-bold tracking-tight">
                EventDek<span className="text-going">.</span>
              </span>
              <span className="hidden items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11px] font-mono text-muted-foreground sm:inline-flex">
                <span className="size-1.5 rounded-full bg-going animate-pulse" />
                NG 36 STATES + FCT
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/login")}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
              >
                Sign In
              </button>

              <button
                onClick={() => navigate("/register")}
                className="tactile flex items-center gap-2 rounded-lg bg-going px-4 py-2 text-xs font-bold text-going-foreground hover:opacity-90"
              >
                Sign up <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        </header>

        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-border">
          <div className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-going/5 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-10 h-72 w-72 rounded-full bg-destructive/5 blur-3xl" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3.5 py-1 text-xs text-muted-foreground">
                  <Radio className="size-3 text-going animate-pulse" />
                  <span>One swipe. Instant wallet pass. Direct checkout.</span>
                </div>

                <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
                  Swipe right to <br />
                  <span className="text-going underline decoration-border decoration-wavy underline-offset-8">
                    claim your pass
                  </span>
                  .
                </h1>

                <p className="max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Discover tech summits, developer meetups, creator mixers, and
                  festivals across Lagos, Abuja, Port Harcourt, and beyond.
                  Swipe right to snapshot your ticket pass offline and jump
                  straight to registration checkout.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <button
                    onClick={() => navigate("/register")}
                    className="tactile flex items-center justify-center gap-2.5 rounded-xl bg-going px-7 py-4 text-sm font-bold text-going-foreground shadow-xl hover:opacity-95"
                  >
                    Start Exploring Events <ArrowRight className="size-4" />
                  </button>
                  <a
                    href="#how-it-works"
                    className="tactile flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 py-4 text-sm font-semibold text-foreground hover:bg-surface-2 transition-colors"
                  >
                    See How It Works
                  </a>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-border/60">
                  <div className="flex -space-x-2 overflow-hidden">
                    <img
                      className="inline-block size-8 rounded-full ring-2 ring-background object-cover"
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      alt="Attendee"
                    />
                    <img
                      className="inline-block size-8 rounded-full ring-2 ring-background object-cover"
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                      alt="Attendee"
                    />
                    <img
                      className="inline-block size-8 rounded-full ring-2 ring-background object-cover"
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
                      alt="Attendee"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Joined by{" "}
                    <strong className="font-semibold text-foreground">
                      3,800+
                    </strong>{" "}
                    builders, founders, and creators across Nigeria.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-sm">
                  <div className="absolute -inset-1.5 translate-y-3 rounded-2xl bg-surface-2/60 border border-border/60 scale-[0.94] -z-10" />
                  <div className="absolute -inset-1 translate-y-1.5 rounded-2xl bg-surface-2 border border-border scale-[0.97] -z-10" />

                  <motion.div
                    animate={{
                      x:
                        mockSwipeDirection === "right"
                          ? 80
                          : mockSwipeDirection === "left"
                            ? -80
                            : 0,
                      rotate:
                        mockSwipeDirection === "right"
                          ? 6
                          : mockSwipeDirection === "left"
                            ? -6
                            : 0,
                      opacity: mockSwipeDirection ? 0.7 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="card-frame relative rounded-2xl overflow-hidden bg-surface"
                  >
                    <AnimatePresence>
                      {mockSwipeDirection === "right" && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute top-4 right-4 z-20 rounded-md border-2 border-going bg-going/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-going backdrop-blur-sm"
                        >
                          SAVE PASS
                        </motion.div>
                      )}
                      {mockSwipeDirection === "left" && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute top-4 left-4 z-20 rounded-md border-2 border-pass bg-pass/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-pass backdrop-blur-sm"
                        >
                          PASS
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="relative h-48 w-full overflow-hidden bg-surface-2">
                      <img
                        src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80"
                        alt="Lagos Tech Mixer"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-black/30" />

                      <span className="absolute top-3 left-3 rounded-full bg-going px-2.5 py-0.5 text-[10px] font-black uppercase text-going-foreground tracking-wider">
                        FREE RSVP
                      </span>

                      <span className="absolute bottom-3 right-3 rounded-md border border-border bg-surface/90 px-2 py-0.5 text-[11px] font-mono text-foreground backdrop-blur-sm">
                        Landmark, VI
                      </span>
                    </div>

                    <div className="perforate" />

                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="label-caps text-going font-bold">
                          TECH & PRODUCT
                        </span>
                        <span className="numeric text-[11px]">
                          TOMORROW • 4:00 PM
                        </span>
                      </div>

                      <h2 className="font-display text-xl font-bold leading-tight">
                        Lagos Founders & Builders Mixer 2026
                      </h2>

                      <p className="text-xs text-muted-foreground line-clamp-2">
                        An intimate evening connecting startup engineers,
                        product leaders, and angel investors over drinks and
                        live demos.
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-border/80 text-xs">
                        <span className="text-muted-foreground">
                          Host:{" "}
                          <strong className="text-foreground">
                            Lagos Innovates
                          </strong>
                        </span>
                        <span className="font-mono text-xs text-going font-semibold">
                          184 Saved Pass
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-surface-2/40 border-t border-border flex items-center justify-between gap-3">
                      <button
                        onMouseEnter={() => setMockSwipeDirection("left")}
                        onMouseLeave={() => setMockSwipeDirection(null)}
                        onClick={() => navigate("/register")}
                        className="tactile flex size-11 items-center justify-center rounded-full border border-border bg-surface text-pass hover:bg-pass/10"
                        title="Pass"
                      >
                        <X className="size-5" />
                      </button>

                      <span className="text-[11px] font-mono text-muted-foreground uppercase">
                        Hover to preview gesture
                      </span>

                      <button
                        onMouseEnter={() => setMockSwipeDirection("right")}
                        onMouseLeave={() => setMockSwipeDirection(null)}
                        onClick={() => navigate("/register")}
                        className="tactile flex size-11 items-center justify-center rounded-full bg-going text-going-foreground hover:scale-105 shadow-md"
                        title="Save & Register"
                      >
                        <CheckCircle2 className="size-5" />
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 border-b border-border bg-surface-2/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
              <div>
                <span className="label-caps text-going">Hyper-Local Pools</span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold mt-1">
                  Active hubs across Nigeria
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-0 font-mono">
                Switch regions anytime in 1 click
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                {
                  city: "Lagos State",
                  area: "VI, Lekki, Yaba, Ikeja",
                  count: "128 upcoming cards",
                  image:
                    "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600&auto=format&fit=crop&q=80",
                },
                {
                  city: "FCT Abuja",
                  area: "Wuse 2, Garki, Maitama",
                  count: "46 upcoming cards",
                  image:
                    "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&auto=format&fit=crop&q=80",
                },
                {
                  city: "Rivers (PH)",
                  area: "GRA Phase 2, Old GRA",
                  count: "24 upcoming cards",
                  image:
                    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
                },
                {
                  city: "Oyo (Ibadan)",
                  area: "Bodija, Ring Road",
                  count: "19 upcoming cards",
                  image:
                    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
                },
              ].map((region, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate("/register")}
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-surface p-4 transition-all hover:border-going"
                >
                  <div className="h-28 w-full overflow-hidden rounded-lg mb-3">
                    <img
                      src={region.image}
                      alt={region.city}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="font-display font-bold text-sm group-hover:text-going transition-colors">
                    {region.city}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {region.area}
                  </p>
                  <span className="mt-2 block font-mono text-[10px] text-going font-medium">
                    {region.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="label-caps text-going">The Discovery Loop</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold mt-2">
                Designed for zero cognitive load
              </h2>
              <p className="text-sm text-muted-foreground mt-3">
                No endless directories, lost flyers, or missing event tickets.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="card-frame rounded-2xl p-6 space-y-4">
                <div className="grid size-12 place-items-center rounded-xl bg-surface-2 text-going border border-border font-mono text-base font-bold">
                  01
                </div>
                <h3 className="font-display text-lg font-bold">
                  Choose your hub
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Select your state to instantly explore curated events,
                  meetups, and hackathons active near you.
                </p>
              </div>

              <div className="card-frame rounded-2xl p-6 space-y-4 border-going/30">
                <div className="grid size-12 place-items-center rounded-xl bg-going text-going-foreground font-mono text-base font-bold">
                  02
                </div>
                <h3 className="font-display text-lg font-bold">
                  Swipe with intention
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Swipe left to dismiss forever. Swipe right to snapshot your
                  pass and jump directly to the host checkout page.
                </p>
              </div>

              <div className="card-frame rounded-2xl p-6 space-y-4">
                <div className="grid size-12 place-items-center rounded-xl bg-surface-2 text-going border border-border font-mono text-base font-bold">
                  03
                </div>
                <h3 className="font-display text-lg font-bold">
                  Offline passbook & sync
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your passes, venue details, scannable QR tokens, and .ics
                  calendars remain accessible even when venue mobile network is
                  congested.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 border-b border-border bg-surface-2/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div className="space-y-6">
                <span className="label-caps text-going">Built for Speed</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
                  Never lose track of an ecosystem event again.
                </h2>

                <div className="space-y-4 pt-2">
                  {[
                    {
                      icon: ExternalLink,
                      title: "1-Swipe Outbound Checkout",
                      desc: "Swipe right to snapshot the event to your wallet while auto-launching the official registration checkout.",
                    },
                    {
                      icon: Calendar,
                      title: "Zero-Click Calendar Sync",
                      desc: "One-tap Google Calendar links and client-side .ics downloads are generated instantly for every saved pass.",
                    },
                    {
                      icon: QrCode,
                      title: "Offline Passbook QR Codes",
                      desc: "Present scannable admission tokens and venue addresses even with zero cell service or Wi-Fi.",
                    },
                  ].map((perk, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface border border-border text-going">
                        <perk.icon className="size-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold font-display">
                          {perk.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {perk.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-frame rounded-2xl p-6 sm:p-8 bg-surface space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <span className="label-caps text-muted-foreground">
                      Sample MyDek Ticket
                    </span>
                    <p className="font-display text-lg font-bold">
                      Unwind Lagos: Design Systems Summit
                    </p>
                  </div>
                  <span className="rounded-full bg-going/20 border border-going/40 px-2.5 py-1 text-[10px] font-mono text-going font-bold">
                    SAVED PASS
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">
                      DATE & VENUE
                    </span>
                    <span className="text-foreground">
                      Saturday, 22 Aug • The Zone, Gbagada
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">
                      ATTENDEE
                    </span>
                    <span className="text-foreground">Chidera Okonkwo</span>
                  </div>
                </div>

                <div className="perforate" />

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <div className="size-16 rounded-lg bg-foreground p-1 text-background grid place-items-center">
                      <QrCode className="size-14" />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-muted-foreground block">
                        DEK-PASS #8921-NG
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        Offline Gate Check-in
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/register")}
                    className="tactile rounded-lg bg-surface-2 border border-border px-3 py-2 text-xs font-semibold hover:border-going"
                  >
                    View Pass
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="py-16">
          <div className="mx-auto max-w-4xl px-4 text-center space-y-6">
            <span className="label-caps text-going">Ready to explore?</span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight">
              Ditch the flyers. <br />
              Start discovering Nigeria.
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Find upcoming tech events, creative mixers, and ecosystem
              gatherings across 36 states and the FCT in seconds.
            </p>

            <div className="pt-2">
              <button
                onClick={() => navigate("/register")}
                className="tactile inline-flex items-center justify-center gap-2 rounded-xl bg-going px-8 py-4 text-sm font-bold text-going-foreground shadow-2xl hover:opacity-95"
              >
                Explore events now <ArrowRight className="size-4" />
              </button>
            </div>

            <div className="pt-12 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-foreground">
                  EventDek
                </span>
                <span>— Open Source Nigerian Event Engine</span>
              </div>
              <p className="font-mono text-[11px]">
                Built for builders, creators, and founders across Nigeria.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
