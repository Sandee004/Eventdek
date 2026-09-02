import { Link, useLocation, useNavigate } from "react-router-dom";
import { Ticket, Layers, LogOut, LogIn, ArrowLeft } from "lucide-react";
import { API_BASE_URL } from "../lib/constants";

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const isPassesPage = location.pathname === "/registered-events";

  // Read auth token & user
  const token = localStorage.getItem("eventdek_token");
  const storedUser = localStorage.getItem("eventdek_user");
  const profile = storedUser ? JSON.parse(storedUser) : null;

  // Read saved RSVP count
  const storedRsvps = localStorage.getItem("eventdek_rsvps");
  const rsvps = storedRsvps ? JSON.parse(storedRsvps) : [];

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
      navigate("/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
        {/* Brand / Logo */}
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-going text-going-foreground">
            <Layers className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="display block truncate text-base font-bold leading-none">
              EventDek
            </span>
            <span className="label-caps block text-muted-foreground">
              Nigeria · discovery deck
            </span>
          </span>
        </Link>

        {/* Action Controls */}
        <nav className="flex shrink-0 items-center gap-2">
          {profile ? (
            <>
              {/* Context-aware button: Returns to Deck if on tickets page, opens passes if on Deck */}
              {isPassesPage ? (
                <Link
                  to="/homepage"
                  className="tactile flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-2 transition-colors"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Back to Deck</span>
                </Link>
              ) : (
                <Link
                  to="/registered-events"
                  className="tactile relative flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface-2"
                >
                  <Ticket className="size-4 text-going" />
                  <span className="hidden sm:inline">My Dek</span>
                  {rsvps.length > 0 && (
                    <span className="grid size-5 place-items-center rounded-full bg-going text-[11px] font-bold text-going-foreground">
                      {rsvps.length}
                    </span>
                  )}
                </Link>
              )}

              {/* User Avatar Initial */}
              <span
                className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-sm font-bold"
                title={profile.name}
              >
                {profile.name?.slice(0, 1).toUpperCase() || "U"}
              </span>

              {/* Sign Out */}
              <button
                type="button"
                onClick={handleLogout}
                className="tactile grid size-9 shrink-0 place-items-center rounded-md border border-border bg-surface text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                title="Sign Out"
              >
                <LogOut className="size-4" />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="tactile flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground hover:bg-accent transition-colors"
            >
              <LogIn className="size-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
