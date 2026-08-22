import { Link, NavLink } from "react-router-dom";
import { Ticket, Layers, LogOut } from "lucide-react";
import { useEventDek } from "../../lib/store";

export function AppHeader() {
  const { rsvps, profile, logout } = useEventDek();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
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
        <nav className="flex shrink-0 items-center gap-2">
          <NavLink
            to="/my-dek"
            className={({ isActive }) =>
              `tactile relative flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? "!border-going !bg-going !text-going-foreground"
                  : "border-border bg-surface hover:bg-accent"
              }`
            }
          >
            <Ticket className="size-4" />
            <span className="hidden sm:inline">My Dek</span>
            {rsvps.length > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-going text-[11px] font-bold text-going-foreground">
                {rsvps.length}
              </span>
            )}
          </NavLink>
          <span
            className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-sm font-bold"
            title={profile?.name ?? "Guest"}
          >
            {(profile?.name ?? "G").slice(0, 1).toUpperCase()}
          </span>
          {profile && (
            <button
              onClick={logout}
              className="tactile grid size-9 shrink-0 place-items-center rounded-md border border-border bg-surface text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
              title="Sign Out"
            >
              <LogOut className="size-4" />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
