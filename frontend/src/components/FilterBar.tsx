import { useMemo, useState } from "react";
import { Check, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { CATEGORIES, NG_STATES, stateName } from "../../lib/data";
import { useEventDek } from "../../lib/store";

export function FilterBar({ remaining }: { remaining: number }) {
  const { stateId, setStateId, categories, toggleCategory, clearCategories } =
    useEventDek();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useMemo(
    () =>
      NG_STATES.filter((s) =>
        s.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [query],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 pt-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="tactile flex min-w-0 items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-left hover:bg-accent"
        >
          <MapPin className="size-4 shrink-0 text-going" />
          <span className="min-w-0">
            <span className="label-caps block text-muted-foreground">
              Region
            </span>
            <span className="block truncate text-sm font-semibold">
              {stateName(stateId)}
            </span>
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <span className="numeric hidden rounded-md border border-border bg-surface px-3 py-2 text-sm font-semibold sm:block">
            {remaining} in deck
          </span>
          <button
            onClick={() =>
              categories.length ? clearCategories() : setOpen(true)
            }
            className="tactile grid size-10 place-items-center rounded-md border border-border bg-surface hover:bg-accent"
            aria-label="Filters"
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-md border border-border bg-surface p-2">
              <div className="flex items-center gap-2 border-b border-border px-2 pb-2">
                <Search className="size-4 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search states…"
                  className="w-full bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <ul className="max-h-56 overflow-y-auto pt-2">
                {results.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => {
                        setStateId(s.id);
                        setOpen(false);
                        setQuery("");
                      }}
                      className="flex w-full items-center justify-between rounded px-2 py-2 text-sm hover:bg-accent"
                    >
                      <span className="font-medium">{s.name}</span>
                      {s.id === stateId ? (
                        <Check className="size-4 text-going" />
                      ) : (
                        <span className="label-caps text-muted-foreground">
                          {s.short}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
                {results.length === 0 && (
                  <li className="px-2 py-3 text-sm text-muted-foreground">
                    No state matches “{query}”.
                  </li>
                )}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="scrollbar-none -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {CATEGORIES.map((c) => {
          const active = categories.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggleCategory(c.id)}
              aria-pressed={active}
              className={`tactile shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
                active
                  ? "border-going bg-going text-going-foreground"
                  : "border-border bg-surface text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
