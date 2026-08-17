import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CategoryId, Profile, Rsvp, StateId } from "./types";

const KEY = "eventdek.v1";

type Persisted = {
  profile: Profile | null;
  passed: string[];
  rsvps: Rsvp[];
  savedAnswers: Record<string, string>;
  stateId: StateId;
  categories: CategoryId[];
};

const initial: Persisted = {
  profile: null,
  passed: [],
  rsvps: [],
  savedAnswers: {},
  stateId: "lagos",
  categories: [],
};

type Store = Persisted & {
  hydrated: boolean;
  setProfile: (profile: Profile) => void;
  setStateId: (stateId: StateId) => void;
  toggleCategory: (id: CategoryId) => void;
  clearCategories: () => void;
  pass: (eventId: string) => void;
  undoPass: (eventId: string) => void;
  addRsvp: (rsvp: Rsvp) => void;
  cancelRsvp: (eventId: string) => void;
  saveAnswers: (answers: Record<string, string>) => void;
  resetPasses: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function EventDekProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...initial, ...(JSON.parse(raw) as Persisted) });
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable */
    }
  }, [state, hydrated]);

  const patch = useCallback(
    (fn: (prev: Persisted) => Persisted) => setState((prev) => fn(prev)),
    [],
  );

  const value = useMemo<Store>(
    () => ({
      ...state,
      hydrated,
      setProfile: (profile) =>
        patch((p) => ({ ...p, profile, stateId: profile.stateId })),
      setStateId: (stateId) => patch((p) => ({ ...p, stateId })),
      toggleCategory: (id) =>
        patch((p) => ({
          ...p,
          categories: p.categories.includes(id)
            ? p.categories.filter((c) => c !== id)
            : [...p.categories, id],
        })),
      clearCategories: () => patch((p) => ({ ...p, categories: [] })),
      pass: (eventId) =>
        patch((p) => ({
          ...p,
          passed: p.passed.includes(eventId)
            ? p.passed
            : [...p.passed, eventId],
        })),
      undoPass: (eventId) =>
        patch((p) => ({
          ...p,
          passed: p.passed.filter((id) => id !== eventId),
        })),
      addRsvp: (rsvp) =>
        patch((p) => ({
          ...p,
          rsvps: [rsvp, ...p.rsvps.filter((r) => r.eventId !== rsvp.eventId)],
        })),
      cancelRsvp: (eventId) =>
        patch((p) => ({
          ...p,
          rsvps: p.rsvps.filter((r) => r.eventId !== eventId),
        })),
      saveAnswers: (answers) =>
        patch((p) => ({
          ...p,
          savedAnswers: { ...p.savedAnswers, ...answers },
        })),
      resetPasses: () => patch((p) => ({ ...p, passed: [] })),
    }),
    [state, hydrated, patch],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useEventDek() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useEventDek must be used inside EventDekProvider");
  return ctx;
}

export const makeReference = () =>
  "DEK-" + Math.random().toString(36).slice(2, 8).toUpperCase();
