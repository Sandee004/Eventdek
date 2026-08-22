import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CategoryId, Profile, Rsvp } from "./types";
import { getProfileApi, logoutApi } from "./api";

const KEY = "eventdek.v1";

type Persisted = {
  profile: Profile | null;
  token: string | null;
  passed: string[];
  rsvps: Rsvp[];
  savedAnswers: Record<string, string>;
  stateId: string;
  categories: CategoryId[];
};

const initial: Persisted = {
  profile: null,
  token: null,
  passed: [],
  rsvps: [],
  savedAnswers: {},
  stateId: "lagos",
  categories: [],
};

type Store = Persisted & {
  hydrated: boolean;
  setProfile: (profile: Profile) => void;
  login: (profile: Profile, token: string) => void;
  logout: () => void;
  setStateId: (stateId: string) => void;
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
      if (raw) {
        const parsed = JSON.parse(raw) as Persisted;
        setState({ ...initial, ...parsed });

        // If stored token exists, attempt background sync of user profile
        if (parsed.token) {
          getProfileApi(parsed.token)
            .then((syncedProfile) => {
              setState((prev) => ({
                ...prev,
                profile: syncedProfile,
                stateId: syncedProfile.stateId,
              }));
            })
            .catch(() => {
              // Token invalid or server down; clear token if unauthorized
            });
        }
      }
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

  const logout = useCallback(() => {
    if (state.token) {
      logoutApi(state.token).catch(() => {});
    }
    patch((p) => ({
      ...p,
      profile: null,
      token: null,
    }));
  }, [state.token, patch]);

  const value = useMemo<Store>(
    () => ({
      ...state,
      hydrated,
      setProfile: (profile) =>
        patch((p) => ({ ...p, profile, stateId: profile.stateId })),
      login: (profile, token) =>
        patch((p) => ({
          ...p,
          profile,
          token,
          stateId: profile.stateId,
        })),
      logout,
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
    [state, hydrated, patch, logout],
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
