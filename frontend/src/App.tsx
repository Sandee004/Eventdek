import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/sonner";

import LandingPage from "./components/LandingPage";
import Login from "./components/Login";
import Onboarding from "./components/Onboarding";
import Home from "./components/Homepage";
import { MyDek } from "./components/RegisteredEvents";
import Profile from "./components/Profile";

// export function filterDeck(
//   events,
//   opts: { stateId: string; categories; seen: string[] },
// ) {
//   const seen = new Set(opts.seen);
//   return events
//     .filter(
//       (e) =>
//         !seen.has(e.id) &&
//         e.stateId === opts.stateId &&
//         (opts.categories.length === 0 || opts.categories.includes(e.category)),
//     )
//     .sort((a, b) => +new Date(a.start) - +new Date(b.start));
// }

// const EventDekContext = createContext<AppState | null>(null);

// export function EventDekProvider({ children }: { children: ReactNode }) {
//   const [profile, setProfile] = useState<Profile | null>(null);
//   const [token, setToken] = useState<string | null>(null);
//   const [hydrated, setHydrated] = useState(false);
//   const [stateId, setStateId] = useState<string>("lagos");
//   const [categories, setCategories] = useState<CategoryId[]>([]);
//   const [passed, setPassed] = useState<string[]>([]);
//   const [rsvps, setRsvps] = useState<Rsvp[]>([]);
//   const [dbEvents, setDbEvents] = useState<EventItem[]>([]);
//   const [allEventsMap, setAllEventsMap] = useState<Record<string, EventItem>>(
//     {},
//   );
//   const [isLoadingEvents, setIsLoadingEvents] = useState(false);
//   const [eventError, setEventError] = useState<string | null>(null);

//   useEffect(() => {
//     const raw = localStorage.getItem("eventdek.v1");
//     if (raw) {
//       try {
//         const saved = JSON.parse(raw);
//         if (saved.token) {
//           setToken(saved.token);
//           const API_BASE_URL = import.meta.env.VITE_API_URL || "";
//           fetch(`${API_BASE_URL}/auth/me`, {
//             headers: { Authorization: `Bearer ${saved.token}` },
//           })
//             .then((r) => (r.ok ? r.json() : null))
//             .then((b) => {
//               if (b) {
//                 const p: Profile = {
//                   id: b.id,
//                   name: b.name,
//                   email: b.email,
//                   phone: b.phone,
//                   stateId: b.state_id || "lagos",
//                   cityArea: b.city_area || "",
//                   role: b.role || "",
//                   handle: b.handle || "",
//                   calendarSync: b.calendar_sync,
//                 };
//                 setProfile(p);
//                 if (p.stateId) setStateId(p.stateId);
//               }
//             })
//             .catch(() => {});
//         }
//         if (saved.passed) setPassed(saved.passed);
//         if (saved.rsvps) setRsvps(saved.rsvps);
//       } catch {}
//     }
//     setHydrated(true);
//   }, []);

//   useEffect(() => {
//     if (hydrated) {
//       localStorage.setItem(
//         "eventdek.v1",
//         JSON.stringify({ token, passed, rsvps }),
//       );
//     }
//   }, [token, passed, rsvps, hydrated]);

//   const pass = (id: string) => {
//     if (token) {
//       const API_BASE_URL = import.meta.env.VITE_API_URL || "";
//       fetch(`${API_BASE_URL}/events/swipe`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ event_id: id, direction: "pass" }),
//       }).catch(() => {});
//     }
//     setPassed((prev) => (prev.includes(id) ? prev : [...prev, id]));
//   };

//   const undoPass = (id: string) =>
//     setPassed((prev) => prev.filter((x) => x !== id));

//   const addRsvp = (rsvp: Rsvp) => {
//     if (token) {
//       const API_BASE_URL = import.meta.env.VITE_API_URL || "";
//       fetch(`${API_BASE_URL}/events/swipe`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ event_id: rsvp.eventId, direction: "rsvp" }),
//       }).catch(() => {});
//     }
//     setRsvps((prev) => [
//       rsvp,
//       ...prev.filter((r) => r.eventId !== rsvp.eventId),
//     ]);
//   };

//   const cancelRsvp = (id: string) =>
//     setRsvps((prev) => prev.filter((r) => r.eventId !== id));

//   const toggleCategory = (id: CategoryId) => {
//     setCategories((prev) =>
//       prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
//     );
//   };

//   const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({});
//   const saveAnswers = (answers: Record<string, string>) =>
//     setSavedAnswers((prev) => ({ ...prev, ...answers }));

//   return (
//     <EventDekContext.Provider
//       value={{
//         profile,
//         token,
//         hydrated,
//         stateId,
//         categories,
//         passed,
//         rsvps,
//         savedAnswers,
//         dbEvents,
//         allEventsMap,
//         isLoadingEvents,
//         eventError,

//         setStateId,
//         toggleCategory,
//         clearCategories: () => setCategories([]),
//         pass,
//         undoPass,
//         addRsvp,
//         cancelRsvp,
//         resetPasses: () => setPassed([]),
//         saveAnswers,
//         setDbEvents,
//         setAllEventsMap,
//         setIsLoadingEvents,
//         setEventError,
//       }}
//     >
//       {children}
//     </EventDekContext.Provider>
//   );
// }

// export function useEventDek() {
//   const ctx = useContext(EventDekContext);
//   if (!ctx) throw new Error("useEventDek must be used within EventDekProvider");
//   return ctx;
// }

// // ==================== PAGE ROUTE VIEWS ====================

// function HomePage() {
//   const { profile, hydrated } = useEventDek();
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (hydrated && profile) navigate("/deck");
//   }, [hydrated, profile, navigate]);

//   if (!hydrated) return <div className="min-h-dvh bg-background" />;
//   return <LandingComponent />;
// }

// function LoginPage() {
//   const { profile, hydrated } = useEventDek();
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (hydrated && profile) navigate("/deck");
//   }, [hydrated, profile, navigate]);

//   if (!hydrated)
//     return (
//       <div className="min-h-dvh bg-background">
//         <AppHeader />
//       </div>
//     );
//   return (
//     <div className="min-h-dvh bg-background">
//       <AppHeader />
//       <main>
//         <Login />
//       </main>
//     </div>
//   );
// }

// function RegisterPage() {
//   const { profile, hydrated } = useEventDek();
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (hydrated && profile) navigate("/deck");
//   }, [hydrated, profile, navigate]);

//   if (!hydrated)
//     return (
//       <div className="min-h-dvh bg-background">
//         <AppHeader />
//       </div>
//     );
//   return (
//     <div className="min-h-dvh bg-background">
//       <AppHeader />
//       <main>
//         <Onboarding />
//       </main>
//     </div>
//   );
// }

// function DeckPage() {
//   const { profile, hydrated, stateId, categories, passed, rsvps, dbEvents } =
//     useEventDek();
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (hydrated && !profile) navigate("/");
//   }, [hydrated, profile, navigate]);

//   const remaining = filterDeck(dbEvents, {
//     stateId,
//     categories,
//     seen: [...passed, ...rsvps.map((r) => r.eventId)],
//   }).length;

//   if (!hydrated || !profile)
//     return (
//       <div className="min-h-dvh bg-background">
//         <AppHeader />
//       </div>
//     );

//   return (
//     <div className="min-h-dvh bg-background">
//       <AppHeader />
//       <main>
//         <FilterBar remaining={remaining} />
//         <Deck />
//       </main>
//     </div>
//   );
// }

// ==================== MAIN ROUTER APP ====================

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/homepage" element={<Home />} />
          <Route path="/registered-events" element={<MyDek />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        <Toaster position="top-center" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
