import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CategoryId, EventItem, Profile, Rsvp } from "./types";
import { fetchDeckApi, getProfileApi, logoutApi, swipeEventApi } from "./api";
import { EVENTS } from "./data";

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
  dbEvents: EventItem[];
  isLoadingEvents: boolean;
  eventError: string | null;
  allEventsMap: Record<string, EventItem>;
  fetchDeckEvents: (overrideStateId?: string) => Promise<void>;
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
  const [dbEvents, setDbEvents] = useState<EventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  // Maintain a cache map of all known events (DB events + fallback static events)
  const [knownDbEventsMap, setKnownDbEventsMap] = useState<Record<string, EventItem>>({});

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

  const fetchDeckEvents = useCallback(
    async (overrideStateId?: string) => {
      if (!state.token) return;
      setIsLoadingEvents(true);
      setEventError(null);
      try {
        const targetState = overrideStateId || state.stateId;
        const categoryFilter = state.categories.length === 1 ? state.categories[0] : undefined;
        const fetched = await fetchDeckApi(state.token, targetState, categoryFilter);
        
        setDbEvents(fetched);
        setKnownDbEventsMap((prev) => {
          const updated = { ...prev };
          for (const ev of fetched) {
            updated[ev.id] = ev;
          }
          return updated;
        });
      } catch (err) {
        console.error("Error fetching deck events:", err);
        setEventError(err instanceof Error ? err.message : "Failed to load events.");
      } finally {
        setIsLoadingEvents(false);
      }
    },
    [state.token, state.stateId, state.categories],
  );

  // Automatically load events from DB when token, stateId, or categories change
  useEffect(() => {
    if (state.token) {
      fetchDeckEvents();
    }
  }, [state.token, state.stateId, state.categories, fetchDeckEvents]);

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

  const pass = useCallback(
    (eventId: string) => {
      if (state.token) {
        swipeEventApi(state.token, eventId, "pass").catch(() => {});
      }
      patch((p) => ({
        ...p,
        passed: p.passed.includes(eventId) ? p.passed : [...p.passed, eventId],
      }));
    },
    [state.token, patch],
  );

  const addRsvp = useCallback(
    (rsvp: Rsvp) => {
      if (state.token) {
        swipeEventApi(state.token, rsvp.eventId, "rsvp").catch(() => {});
      }
      patch((p) => ({
        ...p,
        rsvps: [rsvp, ...p.rsvps.filter((r) => r.eventId !== rsvp.eventId)],
      }));
    },
    [state.token, patch],
  );

  const allEventsMap = useMemo(() => {
    const map: Record<string, EventItem> = {};
    // First seed static fallback events
    for (const e of EVENTS) {
      map[e.id] = e;
    }
    // Override / include loaded DB events
    for (const id in knownDbEventsMap) {
      map[id] = knownDbEventsMap[id];
    }
    for (const e of dbEvents) {
      map[e.id] = e;
    }
    return map;
  }, [dbEvents, knownDbEventsMap]);

  const value = useMemo<Store>(
    () => ({
      ...state,
      hydrated,
      dbEvents,
      isLoadingEvents,
      eventError,
      allEventsMap,
      fetchDeckEvents,
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
      pass,
      undoPass: (eventId) =>
        patch((p) => ({
          ...p,
          passed: p.passed.filter((id) => id !== eventId),
        })),
      addRsvp,
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
    [
      state,
      hydrated,
      dbEvents,
      isLoadingEvents,
      eventError,
      allEventsMap,
      fetchDeckEvents,
      patch,
      logout,
      pass,
      addRsvp,
    ],
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

