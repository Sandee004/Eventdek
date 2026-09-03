import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Ticket, Layers, LogOut, LogIn, Compass, User } from "lucide-react";
import { API_BASE_URL } from "../lib/constants";
import { supabase } from "../lib/supabase";

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const isDeck = location.pathname === "/homepage";
  const isPasses = location.pathname === "/registered-events";
  const isProfile = location.pathname === "/profile";

  const token = localStorage.getItem("eventdek_token");
  const storedUser = localStorage.getItem("eventdek_user");
  const profile = storedUser ? JSON.parse(storedUser) : null;

  const [passCount, setPassCount] = useState<number>(() => {
    const cached = JSON.parse(localStorage.getItem("eventdek_rsvps") || "[]");
    return cached.length;
  });

  // Realtime Database Channel for live badge count updates
  useEffect(() => {
    if (!profile?.id) return;

    // 1. Initial live count directly from DB
    const fetchInitialCount = async () => {
      const { count, error } = await supabase
        .from("registrations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id);

      if (!error && count !== null) {
        setPassCount(count);
      }
    };

    fetchInitialCount();

    // 2. Open Realtime subscription channel on the registrations table
    const channel = supabase
      .channel(`realtime-passes-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "registrations",
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          setPassCount((prev) => prev + 1);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "registrations",
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          setPassCount((prev) => Math.max(0, prev - 1));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("eventdek_token");
      localStorage.removeItem("eventdek_user");
      localStorage.removeItem("eventdek_rsvps");
      navigate("/login");
    }
  };

  return (
    <header className="sticky top-2 z-40 w-full px-3 sm:top-3 sm:px-6 pointer-events-none">
      <div className="pointer-events-auto mx-auto flex max-w-4xl items-center justify-between gap-2 rounded-2xl border border-white/10 bg-card/85 p-1.5 sm:px-4 sm:py-2.5 backdrop-blur-xl shadow-lg">
        <Link
          to="/homepage"
          className="flex items-center gap-2 pl-1 transition-transform active:scale-95"
        >
          <div className="relative grid size-7 sm:size-8 place-items-center rounded-xl border border-going/30 bg-going/15 text-going">
            <Layers className="size-3.5 sm:size-4" />
            <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-going animate-pulse" />
          </div>
          <span className="font-display text-sm sm:text-base font-bold tracking-tight text-foreground">
            EventDek<span className="text-going">.</span>
          </span>
        </Link>

        {profile && (
          <nav className="flex items-center gap-0.5 rounded-xl border border-border/80 bg-surface-2/60 p-0.5 sm:gap-1 sm:p-1">
            <Link
              to="/homepage"
              aria-label="Deck"
              className={`tactile flex items-center gap-1.5 rounded-lg p-2 sm:px-3 sm:py-1.5 text-xs font-semibold transition-all ${
                isDeck
                  ? "bg-going text-going-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
              }`}
            >
              <Compass className="size-4 sm:size-3.5 shrink-0" />
              <span className="hidden sm:inline">Deck</span>
            </Link>

            <Link
              to="/registered-events"
              aria-label="Passes"
              className={`tactile relative flex items-center gap-1.5 rounded-lg p-2 sm:px-3 sm:py-1.5 text-xs font-semibold transition-all ${
                isPasses
                  ? "bg-going text-going-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
              }`}
            >
              <Ticket className="size-4 sm:size-3.5 shrink-0" />
              <span className="hidden sm:inline">Passes</span>
              {passCount > 0 && (
                <span
                  className={`grid size-4 place-items-center rounded-full text-[9px] font-mono font-black transition-transform ${
                    isPasses
                      ? "bg-going-foreground text-going"
                      : "bg-going text-going-foreground scale-105"
                  }`}
                >
                  {passCount}
                </span>
              )}
            </Link>

            <Link
              to="/profile"
              aria-label="Profile"
              className={`tactile flex items-center gap-1.5 rounded-lg p-2 sm:px-3 sm:py-1.5 text-xs font-semibold transition-all ${
                isProfile
                  ? "bg-going text-going-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
              }`}
            >
              <User className="size-4 sm:size-3.5 shrink-0" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-1 sm:gap-2 pr-1">
          {profile ? (
            <>
              <Link
                to="/profile"
                className="tactile hidden md:flex items-center gap-2 rounded-xl border border-border/70 bg-surface-2/40 py-1 pl-2 pr-2.5 hover:border-going/50 transition-colors"
                title="View Profile"
              >
                <span className="grid size-6 place-items-center rounded-lg bg-surface font-mono text-[11px] font-bold text-going border border-border">
                  {profile.name?.slice(0, 1).toUpperCase() || "U"}
                </span>
                <span className="max-w-[70px] truncate text-xs font-medium text-muted-foreground">
                  {profile.name?.split(" ")[0]}
                </span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="tactile grid size-8 place-items-center rounded-xl border border-border/80 bg-surface text-muted-foreground hover:border-pass/40 hover:bg-pass/10 hover:text-pass transition-colors shadow-sm"
                title="Sign Out"
              >
                <LogOut className="size-3.5" />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="tactile flex items-center gap-1 rounded-xl bg-going px-3 py-1.5 text-xs font-bold text-going-foreground shadow-md"
            >
              <LogIn className="size-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
